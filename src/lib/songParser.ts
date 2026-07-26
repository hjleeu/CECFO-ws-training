import { Song, Measure, Note } from "@/types/MusicNotation"

/**
 * Formats a Note object into its notation string (e.g., "1", "3//", "5.", "1'", "[C]1")
 */
function formatNoteNotation(note: Note): string {
  let result = ''

  // Repeat bracket start: (1: or (
  if (note.bracketStart) {
    result += note.bracketNumber ? `(${note.bracketNumber}: ` : '('
  }

  // Chord label: [C]
  if (note.chord) {
    result += `[${note.chord}]`
  }

  // Jianpu value or dash extender
  result += note.note ?? ''

  // Dotted note
  if (note.dotted && !result.endsWith('.')) {
    result += '.'
  }

  // Repeat bracket end: )
  if (note.bracketEnd) {
    result += ')'
  }

  return result
}

/**
 * Formats a Note object into its lyric character + punctuation (e.g., "轻", "听，", "-")
 */
function formatNoteLyric(note: Note): string {
  const char = note.note !== '-' ? (note.char || '') : '-'
  const punct = note.punct ?? ''
  return `${char}${punct}`
}

/**
 * Converts a structured Song object back into your exact 2-line raw text format.
 */
export function songToRaw(song: Song): string {
  if (!song.measures || song.measures.length === 0) return ''

  let rawText = ''
  let currentLineMeasures: Measure[] = []

  // Helper function to render a buffered row of measures into two lines (notes + lyrics)
  const flushRow = () => {
    if (currentLineMeasures.length === 0) return ''

    const notationLine = currentLineMeasures
      .map(m => m.notes.map(formatNoteNotation).join(' '))
      .join(' | ') + ' |'

    const lyricLine = currentLineMeasures
      .map(m => m.notes.map(formatNoteLyric).join(' '))
      .join(' | ')

    // Clear the buffer
    currentLineMeasures = []
    
    return `${notationLine}\n${lyricLine}\n\n`
  }

  for (let i = 0; i < song.measures.length; i++) {
    const measure = song.measures[i]

    // If we hit a new section label (e.g., "[Chorus]"), flush whatever we have first
    if (measure.sectionLabel) {
      rawText += flushRow()
      rawText += `[${measure.sectionLabel}]\n`
    }

    currentLineMeasures.push(measure)

    // Chunk formatting: Force a line break every 4 measures so the text is readable
    if (currentLineMeasures.length === 4) {
      rawText += flushRow()
    }
  }

  // Flush any remaining measures at the end of the song
  rawText += flushRow()

  return rawText.trim()
}