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
  const NOTE_REGEX = /(__BS\d*__|__BE__|(\[[^\]]+\])?([#b=]?[0-7][',]*\/{0,2}\^?|-))/g
  let match
  while ((match = NOTE_REGEX.exec(raw)) !== null) {
    result.push(match[0])
  }
  return result
}

function parseNotes(raw: string): ParsedNote[] {
  const expanded = raw.replace(
    /\((\d+):\s*([^)]+)\)/g,
    (_, num, inner) => `__BS${num}__ ${inner.trim()} __BE__`
  ).replace(
    /\(([^)]+)\)/g,
    (_, inner) => `__BS__ ${inner.trim()} __BE__`
  )

  const tokens = toToken(expanded)
  const result: ReturnType<typeof parseNotes> = []
  let inBracket = false
  let bracketStart = false
  let bracketNumber: number | undefined
  let pendingChord: string | undefined

  for (let t of tokens) {
    if (/^__BS/.test(t)) {
      inBracket    = true
      bracketStart = true
      const numMatch = t.match(/^__BS(\d+)__$/)
      bracketNumber = numMatch ? parseInt(numMatch[1]) : undefined
      continue
    }

    if (t === '__BE__') {
      if (result.length > 0) result[result.length - 1].bracketEnd = true
      inBracket    = false
      bracketStart = false
      bracketNumber = undefined
      continue
    }

    if (t.startsWith('[') && t.endsWith(']')) {
      pendingChord = t.slice(1, -1)
      continue
    }

    let isDotted = false
    if (t.includes('.')) {
      isDotted = true
      t = t.replace('.', '')
    }

    if (t.startsWith('[')) {
      const close = t.indexOf(']')
      pendingChord = t.slice(1, close)
      const note = t.slice(close + 1)
      result.push({
        note,
        chord:         pendingChord,
        dotted:        isDotted || undefined,
        bracketStart:  bracketStart || undefined,
        bracketNumber: bracketStart ? bracketNumber : undefined,
      })
      pendingChord  = undefined
      bracketStart  = false
      continue
    }

    result.push({
      note: t,
      chord: pendingChord,
      dotted: isDotted || undefined,
      bracketStart: bracketStart || undefined,
      bracketNumber: bracketStart ? bracketNumber : undefined
    })
    pendingChord = undefined
    bracketStart = false
  }

  return result
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
  const isChord = CHORD_PATTERN.test(inner)
  return !isChord
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

      const noteCols = noteLine.split('|').map(s => s.trim()).filter(Boolean)
      const lyricCols = lyricLine.split('|').map(s => s.trim()).filter(Boolean)

      if (noteCols.length !== lyricCols.length) {
        throw new Error(`Column mismatch at "${noteLine}". Notes / lyric columns must match.`)
      }

      noteCols.forEach((noteCol, j) => {
        const parsedNotes = parseNotes(noteCol)
        const lyrics = parseLyrics(lyricCols[j])

        if (parsedNotes.length !== lyrics.length) {
          throw new Error(`Measure length mismatch. Notes count doesn't match lyrics count in: "${noteCol}"`)
        }

        const noteItems: Note[] = parsedNotes.map(({ note: n, dotted, chord, bracketStart, bracketEnd, bracketNumber }, k) => {
          const rawChar = lyrics[k] ?? ''
          const cleanChar = rawChar.replace(/[，,。!！?？;；]+$/g, '')
          const punctMatch= rawChar.match(/[，,。!！?？;；]+$/)
          const punct = punctMatch ? punctMatch[0] : ''

          const char = cleanChar !== '-' ? cleanChar : ''
          const py   = cleanChar ? pinyin(cleanChar, { toneType: 'symbol', type: 'array' })[0] ?? '' : ''
          return {
            note: n as Jianpu | '-',
            dotted,
            char,
            punct: punct || undefined,
            pinyin: py,
            chord,
            bracketStart,
            bracketEnd,
            bracketNumber
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
