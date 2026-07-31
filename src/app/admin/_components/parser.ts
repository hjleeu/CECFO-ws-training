import { pinyin } from "pinyin-pro";
import { Jianpu } from "@/types/Jianpu";
import { Measure, Note, Song } from "@/types/MusicNotation";

interface ParsedNote {
  note: string
  dotted?: boolean
  chord?: string
  bracketStart?: boolean
  bracketEnd?: boolean
  bracketNumber?: number
}

// INTERNAL HELPER FUNCTIONS.
function toToken(raw: string): string[] {
  const result: string[] = []

  // Match a full jianpu token.
  const NOTE_REGEX = /(__BS\d*__|__BE__|\||(\[[^\]]+\])?([#b=]?[0-7][',]*\.?\/{0,2}\^?|-))/g
  let match
  while ((match = NOTE_REGEX.exec(raw)) !== null) {
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

function parseNotes(raw: string): ParsedNote[][] {
  let processed = raw.replace(
    /\((\d+):\s*([^)]+)\)/g,
    (_, num, inner) => `__BS${num}__ ${inner.trim()} __BE__`
  ).replace(
    /\(([^)]+)\)/g,
    (_, inner) => `__BS__ ${inner.trim()} __BE__`
  )

  const tokens = toToken(processed)
  const measures: ParsedNote[][] = []
  let currentMeasure: ParsedNote[] = []

  let bracketNumber: number | undefined = undefined
  let pendingChord: string | undefined = undefined
  let nextBracketStart = false
  let nextBracketNumber: number | undefined = undefined

  for (let t of tokens) {
    if (t === '|') {
      measures.push(currentMeasure)
      currentMeasure = []
      continue
    }

    if (/^__BS/.test(t)) {
      nextBracketStart = true
      const numMatch = t.match(/^__BS(\d+)__$/)
      bracketNumber = numMatch ? parseInt(numMatch[1]): undefined
      nextBracketNumber = bracketNumber
      continue
    }

    if (t === '__BE__') {
      if (currentMeasure.length > 0) {
        currentMeasure[currentMeasure.length - 1].bracketEnd = true
      } else if (measures.length > 0 && measures[measures.length - 1].length > 0) {
        const prevMeasure = measures[measures.length - 1]
        prevMeasure[prevMeasure.length - 1].bracketEnd = true
      }
      bracketNumber = undefined
      nextBracketNumber = undefined
      continue
    }

    if (t.startsWith('[')) {
      const close = t.indexOf(']')
      if (close !== -1) {
        pendingChord = t.slice(1, close)
        t = t.slice(close + 1)
        if (!t) {
          continue
        }
      }
    }

    let isDotted = false
    if (t.includes('.')) {
      isDotted = true
      t = t.replace('.', '')
    }

    const noteItem: ParsedNote = {
      note: t,
      dotted: isDotted || undefined,
      chord: pendingChord,
      bracketStart: nextBracketStart || undefined,
      bracketNumber: nextBracketStart ? nextBracketNumber : undefined
    }

    currentMeasure.push(noteItem)
    pendingChord = undefined
    nextBracketStart = false
    nextBracketNumber = undefined
  }

  measures.push(currentMeasure)

  return measures.filter(m => m.length > 0)
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
  let currentLabel: string | undefined = undefined
  let pendingNoteLine: string | null = null

  let measureCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

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

      const noteCols = parseNotes(noteLine)
      const lyricCols = splitMeasures(lyricLine)

      if (noteCols.length !== lyricCols.length) {
        throw new Error(`Column mismatch at "${noteLine}". Notes / lyric columns must match.`)
      }

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
            chord: pn.chord,
            bracketStart: pn.bracketStart,
            bracketEnd: pn.bracketEnd,
            bracketNumber: pn.bracketNumber
          }
        })

        const newMeasure: Measure = {
          id: `m-${measureCount++}`, // UID.
          sectionLabel: undefined,
          notes: noteItems
        }

        if (currentLabel) {
          newMeasure.sectionLabel = currentLabel
          currentLabel = undefined // Reset for the next measure.
        }

        measures.push(newMeasure)
      })

      pendingNoteLine = null
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
    measures
  }
}
