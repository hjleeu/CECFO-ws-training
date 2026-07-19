import { pinyin } from "pinyin-pro";
import { Jianpu } from "@/types/Jianpu";
import { Measure, Note, Row, Section } from "@/types/MusicNotation";

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


export function parse(raw: string): Section {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean)

  if (!lines.length) throw new Error("Empty input")

  const labelLine = lines[0]
  if (!labelLine.startsWith('[') || !labelLine.endsWith(']'))
    throw new Error("第一行应是段落label 例如 [Verse 1]")

  const label = labelLine.slice(1, -1).trim()
  const dataLines = lines.slice(1)

  if (dataLines.length % 2 !== 0)
    throw new Error("Each row needs exactly 2 lines: notes, lyrics.")

  const rows: Row[] = []

  for (let i = 0; i < dataLines.length; i += 2) {
    const noteLine = dataLines[i]
    const lyricLine = dataLines[i + 1]

    const noteCols = noteLine.split('|').map(s => s.trim()).filter(Boolean)
    const lyricCols = lyricLine.split('|').map(s => s.trim()).filter(Boolean)

    if (noteCols.length !== lyricCols.length)
      throw new Error(`Row ${i / 2 + 1}: note / lyric columns must match`)

    const measures: Measure[] = noteCols.map((noteCol, j) => {
      const parsedNotes = parseNotes(noteCols[j])
      const lyrics = parseLyrics(lyricCols[j])

      if (parsedNotes.length !== lyrics.length)
        throw new Error(`Row ${i / 2 + 1}, measure ${j + 1}: notes count doesn't match lyrics count`)

      const noteItems: Note[] = parsedNotes.map(({ note: n, chord }, k) => {
        const char = lyrics[k] !== '-' ? lyrics[k] : ''
        const py = char ? pinyin(char, { toneType: "symbol", type: "array"})[0] ?? '' : ''

        return {
          note: n as Jianpu | '-',
          char,
          pinyin: py,
          chord
        }
      })

      return { notes: noteItems }
    })

    rows.push({ measures })
  }

  return { label, rows }
}