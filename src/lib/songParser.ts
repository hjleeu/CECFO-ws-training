import type { BarlineType, Song, Measure, Note, BracketSpan } from "@/types/MusicNotation"

const JIANPU_DECOMPOSE = /^([#b=]?)([0-7])([',]*)(\/{0,2})(\^?)$/

function barlineToToken(barline: BarlineType | undefined): string {
  switch (barline) {
    case "double":
      return "||"
    case "repeatStart":
      return "|:"
    case "repeatEnd":
      return ":|"
    case "final":
      return "|]"
    default:
      return "|"
  }
}

function formatNoteNotation(note: Note): string {
  let result = ''
  if (note.chord) result += `[${note.chord}]`

  let raw = note.note ?? ''

  if (raw === '-') {
    return result + '-'
  }

  const match = raw.match(JIANPU_DECOMPOSE)

  if (!match) {
    return result + raw
  }

  const [, accidental, digit, octave, slashes, fermata] = match

  // Reconstruct following the order.
  result += accidental
  result += digit
  result += octave
  if (note.dotted) result += '.'
  result += slashes
  result += fermata

  return result
}

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

    const isSimpleTie =
      b.number === undefined &&
      startsHere && endsHere &&
      b.endNote === b.startNote + 1

    if (isSimpleTie) {
      out[b.startNote] = out[b.startNote] + '~'
      continue
    }

    if (startsHere) {
      const prefix = b.kind === "ending"
      ? `(v${b.number}${b.endingStyle === "open" ? ">" : ":"}`
      : b.number !== undefined ? `(${b.number}:` : '('
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

    const notationLine =
      currentLineMeasures
        .map(({ measure, index }) => {
          const tokens = measure.notes.map(formatNoteNotation)
          const bracketed = applyBrackets(tokens, index, song.brackets ?? [])
          return bracketed.join(' ') + ' ' + barlineToToken(measure.barline)
        })
        .join(' ')

    const maxLyricLines = Math.max(
      0,
      ...currentLineMeasures.flatMap(({ measure }) =>
        measure.notes.map(n => n.lyrics?.length || 0)
      )
    )

    const lyricLines: string[] = []
    for (let lineIdx = 0; lineIdx < maxLyricLines; lineIdx++) {
      const lineStr = currentLineMeasures
        .map(({ measure }) =>
          measure.notes
            .map(n => {
              const entry = n.lyrics?.[lineIdx]
              const char  = entry?.char
              const punct = entry?.punct ?? ''
              return char ? `${char}${punct}` : '@'
            })
            .join(' ')
        )
        .join(" | ")
      lyricLines.push(lineStr)
    }

    const lastMeasure = currentLineMeasures[currentLineMeasures.length - 1]?.measure
    const navMarksOutput = lastMeasure?.navigationMark?.length ? `@${lastMeasure.navigationMark.join(',')}\n` : ''

    currentLineMeasures = []

    const lyricsOutput = lyricLines.length > 0 ? lyricLines.join('\n') + '\n' : ''
    return `${notationLine}\n${lyricsOutput}${navMarksOutput}\n`
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