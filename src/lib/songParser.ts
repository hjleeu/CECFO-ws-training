import { Song, Measure, Note } from "@/types/MusicNotation"

/**
 * Formats a Note object into its notation string (e.g., "1", "3//", "5.", "[C]1")
 */
function formatNoteNotation(note: Note): string {
  let result = ''

  // Chord label: [C]
  if (note.chord) {
    result += `[${note.chord}]`
  }

  // Jianpu value or dash extender
  result += note.note ?? ''

  // Dotted note
  if (note.dotted && !result.includes('.')) {
    result += '.'
  }

  return result
}

/**
 * Converts a structured Song object back into raw text format.
 * Automatically handles multi-line lyrics (verses) per notation block.
 */
export function songToRaw(song: Song): string {
  if (!song.measures || song.measures.length === 0) return ''

  let rawText = ''
  let currentLineMeasures: Measure[] = []

  // Helper function to render a buffered row of measures into notation + lyric lines
  const flushRow = (): string => {
    if (currentLineMeasures.length === 0) return ''

    // 1. Build the Notation Line
    const notationLine = currentLineMeasures
      .map(m => m.notes.map(formatNoteNotation).join(' '))
      .join(' | ') + ' |'

    // 2. Find maximum number of lyric lines (verses) in this measure row
    const maxLyricLines = Math.max(
      0,
      ...currentLineMeasures.flatMap(m =>
        m.notes.map(n => n.lyrics?.length || 0)
      )
    )

    // 3. Build each Lyric Line (Verse)
    const lyricLines: string[] = []
    for (let lineIdx = 0; lineIdx < maxLyricLines; lineIdx++) {
      const lineStr = currentLineMeasures
        .map(m =>
          m.notes
            .map(n => {
              const entry = n.lyrics?.[lineIdx]
              const char = n.note !== '-' ? (entry?.char || '') : '-'
              const punct = entry?.punct ?? ''
              return `${char}${punct}`
            })
            .join(' ')
        )
        .join(' | ')

      lyricLines.push(lineStr)
    }

    // Clear buffer
    currentLineMeasures = []

    const lyricsOutput = lyricLines.length > 0 ? lyricLines.join('\n') + '\n' : ''
    return `${notationLine}\n${lyricsOutput}\n`
  }

  for (let i = 0; i < song.measures.length; i++) {
    const measure = song.measures[i]

    // If a section label appears (e.g., "[Verse 1]"), flush current measures first
    if (measure.sectionLabel) {
      rawText += flushRow()
      rawText += `[${measure.sectionLabel}]\n`
    }

    currentLineMeasures.push(measure)

    // Break lines every 4 measures for readability
    if (currentLineMeasures.length === 4) {
      rawText += flushRow()
    }
  }

  // Flush remaining measures
  rawText += flushRow()

  return rawText.trim()
}