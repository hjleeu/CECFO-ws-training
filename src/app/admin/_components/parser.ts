import { Jianpu } from "@/types/Jianpu";
import { Measure, Note, Row, Sheet } from "@/types/MusicNotation";

export function parse(raw: string): Sheet {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean)

  if (!lines.length) throw new Error("Empty input")

  const labelLine = lines[0]
  if (!labelLine.startsWith('[') || !labelLine.endsWith(']'))
    throw new Error("First line must be a section label like [Verse 1]")

  const label = labelLine.trim()
  const dataLines = lines.slice(1)

  if (dataLines.length % 3 !== 0)
    throw new Error("Each row needs exactly 3 lines: chords, notes, lyrics.")

  const rows: Row[] = []

  for (let i = 0; i < dataLines.length; i += 3) {
    const chordLine = dataLines[i]
    const noteLine = dataLines[i + 1]
    const lyricLine = dataLines[i + 2]

    const chordCols = chordLine.split('|').map(s => s.trim())
    const noteCols = noteLine.split('|').map(s => s .trim())
    const lyricCols = lyricLine.split('|').map(s => s.trim())

    if (chordCols.length !== noteCols.length || noteCols.length !== lyricCols.length)
      throw new Error(`Row ${i / 3 + 1}: chord / note / lyric columns must match`)

    const measures: Measure[] = chordCols.map((chordCol, j) => {
      const chords = chordCol.split(/\s+/).filter(Boolean)
      const notes = noteCols[j].split(/\s+/).filter(Boolean)
      const lyrics = lyricCols[j].split(/\s+/).filter(Boolean)

      if (notes.length !== lyrics.length)
        throw new Error(`Row ${i / 3 + 1}, measure ${j + 1}: note count doesn't match lyric count`)

      const noteItems: Note[] = notes.map((n, k) => ({
        note: n as Jianpu | '-',
        char: lyrics[k] !== '-' ? lyrics[k] : ' ',
        pinyin: ''
      }))

      return { chords, notes: noteItems }
    })

    rows.push({ measures })
  }

  return { label, rows }
}