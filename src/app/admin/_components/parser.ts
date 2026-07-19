import { pinyin } from "pinyin-pro";
import { Jianpu } from "@/types/Jianpu";
import { Measure, Note, Row, Section, Song } from "@/types/MusicNotation";

// INTERNAL HELPER FUNCTIONS.
function toToken(raw: string): string[] {
  const result: string[] = []

  // Match a full jianpu token.
  const NOTE_REGEX = /(\[[^\]]+\])?([0-7][',]*\/{0,2}|-)/g
  let match
  while ((match = NOTE_REGEX.exec(raw)) !== null) {
    const chord = match[1] ?? undefined
    const note = match[2]
    if (chord) {
      result.push(`${chord}${note}`)
    } else {
      result.push(note)
    }
  }
  return result
}

function parseNotes(raw: string): { note: string, chord?: string }[] {
  const tokens = toToken(raw)
  const result: { note: string, chord?: string }[] = []
  let pendingChord: string | undefined

  for (const t of tokens) {
    if (t.startsWith('[') && t.endsWith(']')) {
      pendingChord = t.slice(1, -1)
      continue
    }

    if (t.startsWith('[')) {
      const closeBracket = t.indexOf(']')
      pendingChord = t.slice(1, closeBracket)
      const note = t.slice(closeBracket + 1)
      result.push({ note, chord: pendingChord })
      pendingChord = undefined
      continue
    }

    result.push({ note: t, chord: pendingChord })
    pendingChord = undefined
  }

  return result
}

function parseLyrics(raw: string): string[] {
  return [...raw.replace(/\s+/g, '')].filter(Boolean)
}


export function parse(raw: string): Song {
  const lines = raw.trim().split('\n').map(l => l.trim())

  if (!lines.length) throw new Error('Empty input')

  // collect sections
  const sections: Section[] = []
  let currentLabel  = ''
  let currentLines: string[] = []

  for (const line of lines) {
    if (isSectionLabel(line)) {
      // save previous section if exists
      if (currentLabel && currentLines.length) {
        sections.push(parseSection(currentLabel, currentLines))
        currentLines = []
      }
      currentLabel = line.slice(1, -1).trim()
    } else {
      if (line) currentLines.push(line)
    }
  }

  // push last section
  if (currentLabel && currentLines.length) {
    sections.push(parseSection(currentLabel, currentLines))
  }

  if (!sections.length) throw new Error('第一行应是段落label 例如 [Verse 1]')

  return {
    title:    '',
    subtitle: '',
    key:      'C',
    bpm:      80,
    sections,
  }
}

const CHORD_PATTERN = /^[A-G][#b]?(m|maj|min|dim|aug|sus)?[0-9]?$/

function isSectionLabel(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return false
  const inner = trimmed.slice(1, -1).trim()
  const isChord = CHORD_PATTERN.test(inner)
  return !isChord
}

function parseSection(label: string, lines: string[]): Section {
  if (lines.length % 2 !== 0)
    throw new Error(`[${label}]: needs exactly 2 lines per row (notes, lyrics)`)

  const rows: Row[] = []

  for (let i = 0; i < lines.length; i += 2) {
    const noteLine  = lines[i]
    const lyricLine = lines[i + 1]

    const noteCols  = noteLine.split('|').map(s => s.trim()).filter(Boolean)
    const lyricCols = lyricLine.split('|').map(s => s.trim()).filter(Boolean)

    if (noteCols.length !== lyricCols.length)
      throw new Error(`[${label}] Row ${i / 2 + 1}: note / lyric columns must match`)

    const measures: Measure[] = noteCols.map((noteCol, j) => {
      const parsedNotes = parseNotes(noteCol)
      const lyrics      = parseLyrics(lyricCols[j])

      if (parsedNotes.length !== lyrics.length)
        throw new Error(`[${label}] Row ${i / 2 + 1}, measure ${j + 1}: notes count doesn't match lyrics count`)

      const noteItems: Note[] = parsedNotes.map(({ note: n, chord }, k) => {
        const char = lyrics[k] !== '-' ? lyrics[k] : ''
        const py   = char ? pinyin(char, { toneType: 'symbol', type: 'array' })[0] ?? '' : ''
        return { note: n as Jianpu | '-', char, pinyin: py, chord }
      })

      return { notes: noteItems }
    })

    rows.push({ measures })
  }

  return { label, rows }
}