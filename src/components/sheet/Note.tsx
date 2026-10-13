import { parseJianpu } from "@/lib/jianpu"
import type { Note as NoteProps, ShowOptions } from "../../types/MusicNotation"

interface Props {
  note: NoteProps
  showOptions: ShowOptions
  extraBeams?: number
  reservedDurationHeightPx?: number
  reserveUpper?: boolean
}

const ACCIDENTAL_SYMBOL: Record<string, string> = {
  '#': '♯',
  'b': '♭',
  '=': '♮',
}

export function Note({ note, showOptions, extraBeams = 0, reservedDurationHeightPx, reserveUpper }: Props) {
  const raw = note.note
  const isRest = raw === '-'

  if (raw === '\\') {
    return <div className="notation notation-ghost" aria-hidden="true"></div>
  }

  const { accidental, base, octave, fermata } = parseJianpu(raw)

  const dotAbove = octave.startsWith("'")
  const dotBelow = octave.startsWith(",")
  const dotCount = octave.length

  const upper = note.upper ? parseJianpu(note.upper) : undefined
  const upperOctave = upper?.octave ?? ''
  const stacked = Boolean(note.upper) || Boolean(reserveUpper)

  return (
    <div className="notation">
      {showOptions.jianpu && (
        <div className={stacked ? "note-wrapper note-wrapper-stacked" : "note-wrapper"}>
          <span className="fermata">{fermata ? '𝄐' : ''}</span>

          {stacked && (
            <div
              className="note-upper"
              style={upper ? undefined : { visibility: "hidden" }}
              aria-hidden={upper ? undefined : true}
            >
              <div className="dots-above">
                {upperOctave.startsWith("'") && Array.from({ length: Math.min(3, upperOctave.length) }).map((_, i) => (
                  <span key={i} className="octave-dot">·</span>
                ))}
              </div>
              <div className="note-digit-row note-digit-row-upper">
                {upper?.accidental && <span className="accidental">{ACCIDENTAL_SYMBOL[upper.accidental]}</span>}
                <span className="note">{upper ? upper.base : '0'}</span>
              </div>
              <div className="dots-below">
                {upperOctave.startsWith(",") && Array.from({ length: Math.min(3, upperOctave.length) }).map((_, i) => (
                  <span key={i} className="octave-dot">·</span>
                ))}
              </div>
            </div>
          )}

          <div className="dots-above">
            {dotAbove && Array.from({ length: Math.min(3, dotCount) }).map((_, i) => (
              <span key={i} className="octave-dot">·</span>
            ))}
          </div>

          <div className="note-digit-row">
            {accidental && <span className="accidental">{ACCIDENTAL_SYMBOL[accidental]}</span>}
            <span className="note">{isRest ? '-' : base}</span>
            {note.dotted && <span className="augmentation-dot">•</span>}
          </div>

          <div
            className="note-duration"
            style={reservedDurationHeightPx !== undefined ? { minHeight: `${reservedDurationHeightPx}px` } : undefined}
          >
            {Array.from({ length: extraBeams }).map((_, i) => (
                <span key={i} className="duration-bar" />
              ))}
          </div>

          <div className="dots-below">
            {dotBelow && Array.from({ length: Math.min(3, dotCount) }).map((_, i) => (
              <span key={i} className="octave-dot">·</span>
            ))}
          </div>
        </div>
      )}

      {showOptions.lyrics && note?.lyrics?.some(l => l.char) && (
        <div className="lyrics">
          {note.lyrics.map((lyric, i) => (
            <div key={i} className="lyric-row">
              {showOptions.pinyin && (
                <span className="pinyin">{lyric.pinyin}</span>
              )}
              <span className="lyric">
                {lyric.char}
                {lyric.punct && <span className="lyric-punct">{lyric.punct}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}