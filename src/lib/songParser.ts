import type { Song, Measure, Note, BracketSpan } from "@/types/MusicNotation"

function formatNoteNotation(note: Note): string {
  let result = ''
  if (note.chord) result += `[${note.chord}]`
  result += note.note ?? ''
  if (note.dotted && !result.includes('.')) result += '.'
  return result
}

// wraps each measure's note tokens with bracket symbols based on song.brackets
function applyBrackets(
  tokens: string[],
  measureIndex: number,
  brackets: BracketSpan[]
): string[] {
  const out = [...tokens]

  for (const b of brackets) {
    const startsHere = b.startMeasure === measureIndex
    const endsHere   = b.endMeasure   === measureIndex

    if (!startsHere && !endsHere) continue

    // tie shorthand: single-span bracket with no number and length 2 -> use ~
    // (only when it doesn't cross measures, to keep the text readable)
    const isSimpleTie =
      b.number === undefined &&
      startsHere && endsHere &&
      b.endNote === b.startNote + 1

    if (isSimpleTie) {
      out[b.startNote] = out[b.startNote] + '~'
      continue
    }

    if (startsHere) {
      const prefix = b.number !== undefined ? `(${b.number}:` : '('
      out[b.startNote] = prefix + out[b.startNote]
    }
    if (endsHere) {
      out[b.endNote] = out[b.endNote] + ')'
    }
  }

  return out
}

export function songToRaw(song: Song): string {
  if (!song.measures || song.measures.length === 0) return ''

  let rawText = ''
  let currentLineMeasures: { measure: Measure; index: number }[] = []

  const flushRow = (): string => {
    if (currentLineMeasures.length === 0) return ''

    // 1. Notation line — now bracket-aware
    const notationLine =
      currentLineMeasures
        .map(({ measure, index }) => {
          const tokens = measure.notes.map(formatNoteNotation)
          const bracketed = applyBrackets(tokens, index, song.brackets ?? [])
          return bracketed.join(' ')
        })
        .join(' | ') + ' |'

    // 2. Max lyric lines
    const maxLyricLines = Math.max(
      0,
      ...currentLineMeasures.flatMap(({ measure }) =>
        measure.notes.map(n => n.lyrics?.length || 0)
      )
    )

    // 3. Lyric lines — always emit '-' when the token would otherwise be empty,
    //    so column count matches notes on reload regardless of WHY it's empty
    const lyricLines: string[] = []
    for (let lineIdx = 0; lineIdx < maxLyricLines; lineIdx++) {
      const lineStr = currentLineMeasures
        .map(({ measure }) =>
          measure.notes
            .map(n => {
              const entry = n.lyrics?.[lineIdx]
              const char  = entry?.char
              const punct = entry?.punct ?? ''
              // '-' whenever there is no real character to show —
              // whether because the note is a rest OR the lyric is held/empty
              return char ? `${char}${punct}` : '-'
            })
            .join(' ')
        )
        .join(' | ')
      lyricLines.push(lineStr)
    }

    currentLineMeasures = []

    const lyricsOutput = lyricLines.length > 0 ? lyricLines.join('\n') + '\n' : ''
    return `${notationLine}\n${lyricsOutput}\n`
  }

  for (let i = 0; i < song.measures.length; i++) {
    const measure = song.measures[i]

    if (measure.sectionLabel) {
      rawText += flushRow()
      rawText += `[${measure.sectionLabel}]\n`
    }

    currentLineMeasures.push({ measure, index: i })

    if (currentLineMeasures.length === 4) {
      rawText += flushRow()
    }
  }

  rawText += flushRow()

  return rawText.trim()
}