import { pinyin } from "pinyin-pro";
import { Jianpu } from "@/types/Jianpu";
import { BracketSpan, Measure, Note, Song } from "@/types/MusicNotation";

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

export function parse(raw: string): Song {
  const lines = raw.trim().split('\n').map(l => l.trim())

  if (!lines.length) throw new Error('Empty input')

  const measures: Measure[] = []
  const allBrackets: BracketSpan[] = []
  let currentLabel: string | undefined = undefined
  let pendingNoteLine: string | null = null
  let measureCount = 0

  for (const line of lines) {
    // Skip empty lines.
    if (!line) continue

    if (isSectionLabel(line)) {
      currentLabel = line.slice(1, -1).trim()
      continue
    }

    if (pendingNoteLine === null) {
      pendingNoteLine = line
    } else {
      const noteLine = pendingNoteLine
      const lyricLine = line
      pendingNoteLine = null

      const { measures: noteCols, brackets } = parseNotes(noteLine, measureCount)
      const lyricCols = splitMeasures(lyricLine)

      if (noteCols.length !== lyricCols.length) {
        throw new Error(`Column mismatch at "${noteLine}". Notes / lyric columns must match.`)
      }

      allBrackets.push(...brackets)

      noteCols.forEach((noteCol, j) => {
        const lyrics = parseLyrics(lyricCols[j])

        if (noteCol.length !== lyrics.length) {
          throw new Error(`Measure length mismatch. Notes count doesn't match lyrics count in measure index "${j}."`)
        }

        const noteItems: Note[] = noteCol.map((pn, k) => {
          const rawChar = lyrics[k] ?? ''
          const cleanChar = rawChar.replace(/[，,。!！?？;；]+$/g, '')
          const punctMatch= rawChar.match(/[，,。!！?？;；]+$/)
          const punct = punctMatch ? punctMatch[0] : ''

          const char = cleanChar !== '-' ? cleanChar : ''
          const py   = char ? pinyin(char, { toneType: 'symbol', type: 'array' })[0] ?? '' : ''
          return {
            note: pn.note as Jianpu | '-',
            dotted: pn.dotted,
            char,
            punct: punct || undefined,
            pinyin: py,
            chord: pn.chord
          }
        })

        const newMeasure: Measure = {
          id: `m-${measureCount}`, // UID.
          sectionLabel: currentLabel,
          notes: noteItems
        }

        if (currentLabel) {
          currentLabel = undefined // Reset for the next measure.
        }

        measures.push(newMeasure)
        measureCount++
      })
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
