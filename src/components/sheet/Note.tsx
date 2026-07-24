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
    const { base, octave, duration } = parseJianpu(raw)

    const dotAbove = octave.startsWith("'")
    const dotBelow = octave.startsWith(",")
    const dotCount = octave.length // 1 or 2

    const barsToDraw = extraBeams !== undefined ? extraBeams : duration

    return (
        <div className="notation">
            {showOptions.jianpu && (
                <div className="note-wrapper">
                    <div className="dots-above">
                        {dotAbove && Array.from({ length: Math.min(2, dotCount) }).map((_, i) => (
                            <span key={i} className="octave-dot">·</span>
                        ))}
                    </div>

                    <span className="note">{isRest ? '-' : base}</span>

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
            {showOptions.pinyin && (
                <span className="pinyin">{isRest ? '' : note.pinyin}</span>
            )}
            {showOptions.lyrics && (
                <span className="lyric">{isRest ? '' : note.char}</span>
            )}
        </div>
    )
}