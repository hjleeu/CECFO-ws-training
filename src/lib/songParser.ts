import { Song, Section, Row, Measure, Note } from "@/types/MusicNotation"

/**
 * Formats a Note object into its notation string (e.g., "1", "3/2/", "5.", "1'", "[C]1")
 */
function formatNoteNotation(note: Note): string {
  let result = ''

  // Repeat bracket start: [1.
  if (note.bracketStart) {
    result += `[${note.bracketNumber ? note.bracketNumber + '.' : ''}`
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

  // Repeat bracket end: ]
  if (note.bracketEnd) {
    result += ']'
  }

  return result
}

/**
 * Formats a Note object into its lyric character + punctuation (e.g., "轻", "听，", "-")
 */
function formatNoteLyric(note: Note): string {
  const char = note.note != '-' ? note.char : '-'
  const punct = note.punct ?? ''
  return `${char}${punct}`
}

/**
 * Converts a structured Song object back into your exact 2-line raw text format.
 */
export function songToRaw(song: Song): string {
  if (!song.sections || song.sections.length === 0) return ''

  return song.sections
    .map((section: Section) => {
      // 1. Section Header: [verse], [chorus], etc.
      const header = `[${section.label}]`

      // 2. Process Rows into alternating Notation and Lyric lines
      const rowsText = section.rows
        .map((row: Row) => {
          // Line 1: Notation line (measures joined by '|' with trailing '|')
          const notationLine =
            row.measures
              .map((measure: Measure) =>
                measure.notes.map(formatNoteNotation).join('')
              )
              .join('|') + '|'

          // Line 2: Lyrics line (measures joined by ' | ' without trailing '|')
          const lyricLine = row.measures
            .map((measure: Measure) =>
              measure.notes.map(formatNoteLyric).join(' ')
            )
            .join(' | ')

          return `${notationLine}\n${lyricLine}`
        })
        .join('\n')

      return `${header}\n${rowsText}`
    })
    .join('\n')
}