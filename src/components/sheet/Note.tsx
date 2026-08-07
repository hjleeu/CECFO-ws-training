import { parseJianpu } from "@/lib/jianpu"
import type { Note as NoteProps, ShowOptions } from "../../types/MusicNotation"

interface Props {
  note: NoteProps
  showOptions: ShowOptions
  extraBeams?: number
  reservedDurationHeightPx?: number   // uniform slot height across a beam group
}

const ACCIDENTAL_SYMBOL: Record<string, string> = {
  '#': '♯',
  'b': '♭',
  '=': '♮',
}

export function Note({ note, showOptions, extraBeams = 0, reservedDurationHeightPx }: Props) {
  const raw = note.note
  const isRest = raw === '-'
  const { accidental, base, octave, fermata } = parseJianpu(raw)

  const dotAbove = octave.startsWith("'")
  const dotBelow = octave.startsWith(",")
  const dotCount = octave.length

  return (
    <div className="notation">
      {showOptions.jianpu && (
        <div className="note-wrapper">
          <span className="fermata">{fermata ? '𝄐' : ''}</span>
          <div className="dots-above">
            {dotAbove && Array.from({ length: Math.min(2, dotCount) }).map((_, i) => (
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
            {dotBelow && Array.from({ length: Math.min(2, dotCount) }).map((_, i) => (
              <span key={i} className="octave-dot">·</span>
            ))}
          </div>
        </div>
      )}

      {showOptions.lyrics && note?.lyrics && note.lyrics.length > 0 && (
        <div className="lyrics">
          {note.lyrics.map((lyric, i) => (
            <div key={i} className="lyric-row">
              {showOptions.pinyin && lyric.pinyin && (
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