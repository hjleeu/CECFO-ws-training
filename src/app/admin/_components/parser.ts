import { pinyin } from "pinyin-pro";
import { Jianpu } from "@/types/Jianpu";
import { BarlineType, BracketSpan, LyricEntry, Measure, NavigationMark, Note, Song } from "@/types/MusicNotation";

interface ParsedNote {
  note: string
  dotted?: boolean
  chord?: string
}

 interface OpenBracket {
  id: string
  number?: number
  kind?: "tuplet" | "ending"
  endingStyle?: "closed" | "open"
  startMeasure: number
  startNote: number
  level: number
}

// INTERNAL HELPER FUNCTIONS.
function toToken(raw: string): string[] {
  const result: string[] = []

  const TOKEN_REGEX = /(\|:|:\||\|\||\|\]|\||~|__BS\d+__|__BS__|__BE__|\(v\d+[:>]|\(\d+:|\(|v\)|\)|(\[[^\]]+\])?([#b=]?[0-7][',]*\.?\/{0,2}\^?|-|\\))/g
  let match
  while ((match = TOKEN_REGEX.exec(raw)) !== null) {
    result.push(match[0])
  }
  return result
}

const BARLINE_TOKEN = new Set(['|', "|:", "||", ":|", "|]"])

function tokenToBarline(token: string): BarlineType {
  switch (token) {
    case "||":
      return "double"
    case "|:":
      return "repeatStart"
    case ":|":
      return "repeatEnd"
    case "|]":
      return "final"
    default:
      return "normal" 
  }
}

function splitMeasures(line: string): string[] {
  const result: string[] = []
  let depth = 0
  let current = ''

  for (const ch of line) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === '|' && depth === 0) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result.filter(Boolean)
}

function parseNotes(
  raw: string,
  measureOffset: number,
  sharedBracketStack: OpenBracket[],
  sharedVoltaStack: OpenBracket[],
  sharedLevelRef: { current: number }
): { measures: ParsedNote[][], barlines: BarlineType[], brackets: BracketSpan[] } {
  const tokens = toToken(raw)
  const measures: ParsedNote[][] = []
  const barlines: BarlineType[] = []
  const brackets: BracketSpan[] = []
  let currentMeasure: ParsedNote[] = []

  let bracketCounter = 0
  let measureCounter = measureOffset
  let pendingChord : string | undefined
  let noteIndex = 0
  let tieStart: { measure: number, note: number } | null = null

  function pushNote(raw: string) {
    let t = raw
    let dotted = false
    if (t.includes('.')) {
      dotted = true
      t = t.replace('.', '')
    }
    currentMeasure.push({ note: t, dotted: dotted || undefined, chord: pendingChord })
    pendingChord = undefined
    noteIndex++
  }

  function closeTie() {
    if (tieStart === null) return
    brackets.push({
      id: `b-${bracketCounter++}`,
      startMeasure: tieStart.measure,
      startNote: tieStart.note,
      endMeasure: measureCounter,
      endNote: noteIndex - 1,
      number: undefined,
      level: sharedLevelRef.current
    })
    tieStart = null
  }

  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i]

    // Barline.
    if (BARLINE_TOKEN.has(t)) {
      measures.push(currentMeasure)
      barlines.push(tokenToBarline(t))
      currentMeasure = []
      measureCounter++
      noteIndex = 0
      continue
    }

    // Tie.
    if (t === '~') {
      const next = tokens[i + 1]
      if (!next) continue

      if (tieStart === null) {
        tieStart = { measure: measureCounter, note: noteIndex - 1}
      } else {
        closeTie()
        tieStart = { measure: measureCounter, note: noteIndex - 1}
      }
      continue
    }

    // Open volta brackets.
    if (/^\(v\d+[:>]/.test(t)) {
      if (noteIndex !== 0)
        throw new Error(`Volta deve iniziare a un confine di battuta (misura ${measureCounter})`)
      const style = t.includes('>') ? "open" : "closed"
      const num = parseInt(t.match(/\d+/)![0])
      sharedVoltaStack.push({
        id: `b-${bracketCounter++}`,
        number: num,
        kind: "ending",
        endingStyle: style,
        startMeasure: measureCounter,
        startNote: noteIndex,
        level: sharedLevelRef.current
      })
      continue
    }

    // Open bracket.
    if (/^__BS/.test(t) || /^\(\d+:/.test(t) || t === '(') {
      const isEnding = /^\(v\d+[:>]/.test(t)
      const numMatch = t.match(/(\d+)/)
      const num = numMatch ? parseInt(numMatch[1]) : undefined
      const style = isEnding ? (t.includes('>') ? "open" : "closed") : undefined

      sharedBracketStack.push({
        id: `b-${bracketCounter++}`,
        number: num,
        kind: isEnding ? "ending" : undefined,
        endingStyle: style,
        startMeasure: measureCounter,
        startNote: noteIndex,
        level: sharedLevelRef.current++
      })
      continue
    }

    // Close volta bracket.
    if (t === 'v)') {
      const open = sharedVoltaStack.pop()
      if (open) {
        if (i + 1 < tokens.length && !BARLINE_TOKEN.has(tokens[i + 1])) {
          throw new Error(`Volta deve terminare a un confine di battuta (misura ${measureCounter})`)
        }
        brackets.push({ ...open, endMeasure: measureCounter, endNote: noteIndex - 1 })
      }
      continue
    }

    // Close bracket.
    if (t === '__BE__' || t === ')') {
      const open = sharedBracketStack.pop()
      if (open) {
        sharedLevelRef.current--
        brackets.push({
          id: open.id,
          startMeasure: open.startMeasure,
          startNote: open.startNote,
          endMeasure: measureCounter,
          endNote: noteIndex - 1, // Last note pushed.
          number: open.number,
          level: open.level,
          kind: open.kind,
          endingStyle: open.endingStyle
        })
      }
      continue
    }

    // Chord.
    if (t.startsWith('[')) {
      const close = t.indexOf(']')
      if (close !== -1) {
        pendingChord = t.slice(1, close)
        const rest = t.slice(close + 1)
        if (!rest) {
          continue
        }
        pushNote(rest)
        if (tokens[i + 1] !== '~') closeTie()
      }
      continue
    }

    pushNote(t)

    if (tokens[i + 1] !== '~') closeTie()
  }

  measures.push(currentMeasure)
  barlines.push("normal")

  const nonEmpty = measures.map((m, i) => ({
    m, b: barlines[i]
  })).filter(z => z.m.length > 0)

  return {
    measures: nonEmpty.map(z => z.m),
    barlines: nonEmpty.map(z => z.b),
    brackets
  }
}

function parseLyrics(raw: string): string[] {
  const LYRIC_REGEX = /([^\s|，,。!！?？;；]+)([，,。!！?？;；]*)/g
  const tokens: string[] = []
  let match

  while ((match = LYRIC_REGEX.exec(raw)) !== null) {
      tokens.push(match[1] + match[2])
  }

  return tokens
}

const CHORD_PATTERN = /^[A-G][#b]?(m|maj|min|dim|aug|sus)?[0-9]?$/

function isSectionLabel(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) { return false }
  const inner = trimmed.slice(1, -1).trim()

  if (inner.includes('[') || inner.includes(']') || inner.includes('|')) { return false }

  return !CHORD_PATTERN.test(inner)
}

const VALID_NAV_MARKS = new Set<NavigationMark>([
  "segno", "coda", "toCoda", "fine", "ds", "dsCoda", "dsFine", "dc", "dcFine", "dcCoda"
])

function parseNavMarkLine(line: string): NavigationMark[] | null {
  const match = line.trim().match(/^@([a-zA-Z,]+)$/)
  if (!match) return null
  const marks = match[1].split(',').map(s => s.trim()).filter(Boolean)
  if (marks.length === 0 || !marks.every(m => VALID_NAV_MARKS.has(m as NavigationMark))) { return null }
  return marks as NavigationMark[]
}

/**
 * Check if the line is a note line or not.
 * @param line input string
 * @returns true if it is a note line
 */
function isNoteLine(line: string): boolean {
  return /^[\s0-9A-Ga-g#b=,\.'\/()~|\[\]:^+\-mMajindsuv>\\]+$/.test(line)
}

export function parse(raw: string): Song {
  const lines = raw.trim().split('\n').map(l => l.trim())

  if (!lines.length) throw new Error('Empty input')

  const measures: Measure[] = []
  const allBrackets: BracketSpan[] = []
  let currentLabel: string | undefined = undefined
  let pendingNoteLine: string | null = null
  let pendingLyricLine: string[] = []
  let measureCount = 0

  const globalBracketStack: OpenBracket[] = []
  const globalVoltaStack: OpenBracket[] = []
  const globalLevelRef = { current: 0 }

  function flush(noteLine: string, lyricLines: string[]) {
    const { measures: noteCols, barlines, brackets } = parseNotes(noteLine, measureCount, globalBracketStack, globalVoltaStack, globalLevelRef)
    const hasLyrics = lyricLines.length > 0
    const lyricColsPerRow = hasLyrics ? lyricLines.map(l => splitMeasures(l)) : []

    if (hasLyrics) {
      for (const lyricCols of lyricColsPerRow) {
        if (lyricCols.length !== noteCols.length)
          throw new Error(`Column mismatch`)
      }
    }

    noteCols.forEach((noteCol, j) => {
      const lyricRowsForMeasure = hasLyrics ? lyricColsPerRow.map(lyricCols =>
        parseLyrics(lyricCols[j])
      ) : []

      if (hasLyrics) {
        for (const lyrics of lyricRowsForMeasure) {
          if (lyrics.length !== noteCol.length)
            throw new Error(`Note/lyric count mismatch in measure ${j}`)
        }
      }

      const noteItems: Note[] = noteCol.map((pn, k) => {
        const lyrics: LyricEntry[] = hasLyrics ? lyricRowsForMeasure.map(row => {
          const raw = row[k] ?? ''

          const clean = raw.replace(/[，,。!！?？;；]+$/g, '')
          const punct = raw.match(/[，,。!！?？;；]+$/)?.[0]

          const char = (clean !== '-' && clean !== '@') ? clean : ''
          const py = char ? pinyin(char, { toneType: "symbol", type: "array" })[0] ?? '' : ''

          return {
            char,
            pinyin: py,
            punct: punct || undefined
          }
        }) : [{ char: '', pinyin: '', punct: undefined }]

        return {
          note: pn.note as Jianpu | '-',
          dotted: pn.dotted,
          lyrics,
          chord: pn.chord,
        }
      })

      measures.push({
        id: `m-${measureCount}`,
        sectionLabel: currentLabel,
        notes: noteItems,
        barline: barlines[j] ?? "normal"
      })
      if (currentLabel) currentLabel = undefined
      measureCount++
    })

    allBrackets.push(...brackets)
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines.
    if (!line) continue

    const navMarks = parseNavMarkLine(line)
    if (navMarks) {
      if (pendingNoteLine !== null) {
        flush(pendingNoteLine, pendingLyricLine)
        pendingNoteLine = null
        pendingLyricLine = []
      }
      const lastMeasure = measures[measures.length - 1]
      if (lastMeasure) {
        lastMeasure.navigationMark = [...(lastMeasure.navigationMark ?? []), ...navMarks]
      }
      continue
    }

    if (isSectionLabel(line)) {
      if (pendingNoteLine !== null) {
        flush(pendingNoteLine, pendingLyricLine)
        pendingNoteLine = null
        pendingLyricLine = []
      }
      currentLabel = line.slice(1, -1).trim()
      continue
    }

    if (isNoteLine(line)) {
      if (pendingNoteLine !== null) {
        flush(pendingNoteLine, pendingLyricLine)
        pendingNoteLine = null
        pendingLyricLine = []
      }
      pendingNoteLine = line
      pendingLyricLine = []
      continue
    }

    if (pendingNoteLine !== null) {
      pendingLyricLine.push(line)
      const nextLine = lines.slice(i + 1).find(l => l.trim())
      if (!nextLine || isNoteLine(nextLine) || isSectionLabel(nextLine)) {
        flush(pendingNoteLine, pendingLyricLine)
        pendingNoteLine = null
        pendingLyricLine = []
      }
    }
  }

  // End of input.
  if (pendingNoteLine !== null) {
    flush(pendingNoteLine, pendingLyricLine)
  }

  if (globalBracketStack.length > 0 || globalVoltaStack.length > 0) {
    throw new Error(`Unclosed bracket(s): ${[...globalBracketStack, ...globalVoltaStack].map(b => b.id).join(', ')}`)
  }

  if (measures.length === 0) {
    throw new Error('第一行应是段落label 例如 [Verse 1]')
  }

  return {
    title: '',
    slug: '',
    key: '',
    bpm: 0,
    timeSignature: '',
    measures,
    brackets: allBrackets
  }
}
