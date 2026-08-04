import { pinyin } from "pinyin-pro";
import { Jianpu } from "@/types/Jianpu";
import { BracketSpan, LyricEntry, Measure, Note, Song } from "@/types/MusicNotation";

interface ParsedNote {
  note: string
  dotted?: boolean
  chord?: string
}

 interface OpenBracket {
  id: string
  number?: number
  startMeasure: number
  startNote: number
  level: number
}

interface NoteBlock {
  sectionLabel?: string
  noteLine: string
  lyricLine: string[]
}

// INTERNAL HELPER FUNCTIONS.
function toToken(raw: string): string[] {
  const result: string[] = []

  const TOKEN_REGEX = /(\||~|__BS\d+__|__BS__|__BE__|\(\d+:|\(|\)|(\[[^\]]+\])?([#b=]?[0-7][',]*\.?\/{0,2}\^?|-))/g
  let match
  while ((match = TOKEN_REGEX.exec(raw)) !== null) {
    result.push(match[0])
  }
  return result
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

function parseNotes(raw: string, measureOffset: number): { measures: ParsedNote[][], brackets: BracketSpan[] } {
  const tokens = toToken(raw)
  const measures: ParsedNote[][] = []
  const brackets: BracketSpan[] = []
  let currentMeasure: ParsedNote[] = []
  const bracketStack: OpenBracket[] = []

  let bracketCounter = 0
  let measureCounter = measureOffset
  let currentLevel = 0
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
      level: currentLevel
    })
    tieStart = null
  }

  for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i]

    // Barline.
    if (t === '|') {
      measures.push(currentMeasure)
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

    // Open bracket.
    if (/^__BS/.test(t) || /^\(\d+:/.test(t) || t === '(') {
      const numMatch = t.match(/(\d+)/)
      const num = numMatch ? parseInt(numMatch[1]) : undefined

      bracketStack.push({
        id: `b-${bracketCounter++}`,
        number: num,
        startMeasure: measureCounter,
        startNote: noteIndex,
        level: currentLevel++
      })
      continue
    }

    // Close bracket.
    if (t === '__BE__' || t === ')') {
      const open = bracketStack.pop()
      if (open) {
        currentLevel--
        brackets.push({
          id: open.id,
          startMeasure: open.startMeasure,
          startNote: open.startNote,
          endMeasure: measureCounter,
          endNote: noteIndex - 1, // Last note pushed.
          number: open.number,
          level: open.level
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

  while (bracketStack.length > 0) {
    const open = bracketStack.pop()!
    currentLevel--
    brackets.push({
      id: open.id,
      startMeasure: open.startMeasure,
      startNote: open.startNote,
      endMeasure: measureCounter,
      endNote: noteIndex - 1,
      number: open.number,
      level: open.level
    })
  }

  measures.push(currentMeasure)

  return {
    measures: measures.filter(m => m.length > 0),
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
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return false
  const inner = trimmed.slice(1, -1).trim()
  return !CHORD_PATTERN.test(inner)
}

/**
 * Check if the line is a note line or not.
 * @param line input string
 * @returns true if it is a note line
 */
function isNoteLine(line: string): boolean {
  return /[0-7\[\](~|]/.test(line) && !/^[\u4e00-\u9fff\s，。！？；]+$/.test(line)
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

  function flush(noteLine: string, lyricLines: string[]) {
    const { measures: noteCols, brackets } = parseNotes(noteLine, measureCount)
    const lyricColsPerRow = lyricLines.map(l => splitMeasures(l))

    // verify all lyric rows have same column count as notes
    for (const lyricCols of lyricColsPerRow) {
      if (lyricCols.length !== noteCols.length)
        throw new Error(`Column mismatch`)
    }

    noteCols.forEach((noteCol, j) => {
      // get lyrics for each row at this measure
      const lyricRowsForMeasure = lyricColsPerRow.map(lyricCols =>
        parseLyrics(lyricCols[j])
      )

      // verify all rows have same note count
      for (const lyrics of lyricRowsForMeasure) {
        if (lyrics.length !== noteCol.length)
          throw new Error(`Note/lyric count mismatch in measure ${j}`)
      }

      const noteItems: Note[] = noteCol.map((pn, k) => {
        const lyrics: LyricEntry[] = lyricRowsForMeasure.map(row => {
          const raw = row[k] ?? ''

          const clean = raw.replace(/[，,。!！?？;；]+$/g, '')
          const punct = raw.match(/[，,。!！?？;；]+$/)?.[0]

          const char = clean !== '-' ? clean : ''
          const py = char ? pinyin(char, { toneType: "symbol", type: "array" })[0] ?? '' : ''

          

          return {
            char,
            pinyin: py,
            punct: punct || undefined
          }
        })

        return {
          note: pn.note as Jianpu | '-',
          dotted: pn.dotted,
          lyrics,
          chord: pn.chord,
        }
      })
      console.log(noteItems[0].lyrics);

      measures.push({
        id: `m-${measureCount}`,
        sectionLabel: currentLabel,
        notes: noteItems,
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

    if (isSectionLabel(line)) {
      currentLabel = line.slice(1, -1).trim()
      continue
    }

    if (isNoteLine(line)) {
      if (pendingNoteLine !== null) {
        throw new Error(`Missing lyric line for: "${pendingNoteLine}"`)
      }
      pendingNoteLine = line
      pendingLyricLine = []
      continue
    }

    if (pendingNoteLine !== null) {
      pendingLyricLine.push(line)
      const nextLine = lines.slice(i + 1).find(l => l.trim())
      if (!nextLine || isNoteLine(nextLine) || isSectionLabel(nextLine)) {
        if (pendingLyricLine.length === 0)
          throw new Error(`Missing lyric for: "${pendingNoteLine}"`)

        flush(pendingNoteLine, pendingLyricLine)
        pendingNoteLine = null
        pendingLyricLine = []
      }
    }
  }

  // If a note line has not a lyric line.
  if (pendingNoteLine !== null) {
    throw new Error(`Missing lyric line for notes: "${pendingNoteLine}"`)
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
