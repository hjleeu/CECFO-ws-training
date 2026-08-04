import { parseJianpu } from "@/lib/jianpu"
import type { Note as NoteProps, ShowOptions } from "../../types/MusicNotation"

interface Props {
    note: NoteProps
    showOptions: ShowOptions
    extraBeams?: number
}

export function Note({ note, showOptions, extraBeams }: Props) {
    const raw = note.note
    const isRest = raw === '-'
    const { accidental, base, octave, duration, fermata } = parseJianpu(raw)

    const ACCIDENTAL_SYMBOL: Record<string, string> = {
        '#': '♯',
        'b': '♭',
        '=': '♮',
    }

    const dotAbove = octave.startsWith("'")
    const dotBelow = octave.startsWith(",")
    const dotCount = octave.length // 1 or 2

    const barsToDraw = extraBeams !== undefined ? extraBeams : duration

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
                        {accidental && (<span className="accidental">{ACCIDENTAL_SYMBOL[accidental]}</span>)}
                        <span className="note">{isRest ? '-' : base}</span>
                        {note.dotted && <span className="augmentation-dot">•</span>}
                    </div>

                    <div className="note-duration">
                        {Array.from({ length: barsToDraw }).map((_, i) => (
                            <span key={i} className="duration-bar"></span>
                        ))}
                    </div>

                    <div className="dots-below">
                        {dotBelow && Array.from({ length: Math.min(2, dotCount) }).map((_, i) => (
                            <span key={i} className="octave-dot">·</span>
                        ))}
                    </div>
                </div>
            )}
            <div className="lyrics">
                {showOptions.lyrics && note.lyrics.map((lyric, i) => (
                    <div key={i} className="lyric-row">
                        {showOptions.pinyin && (
                            <span className="pinyin">{lyric.pinyin}</span>
                        )}
                        <span className="lyric">{isRest ? '' : lyric.char}</span>
                        {lyric.punct && <span className="lyric-punct">{lyric.punct}</span>}
                    </div>
                ))}
            </div>
        </div>
    )
}