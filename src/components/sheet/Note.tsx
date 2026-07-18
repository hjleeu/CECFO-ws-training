import type { Note as NoteProps, ShowOptions } from "../../types/MusicNotation"

interface Props {
    note: NoteProps
    showOptions: ShowOptions
}

export function Note({ note, showOptions }: Props) {
    const raw = note.note
    const isRest = raw === '-'

    const underlines = raw.endsWith('//') ? 2 : raw.endsWith('/') ? 1 : 0

    const displayNote = raw.replace(/\/+$/, '')

    return (
        <div className="notation">
            {showOptions.jianpu && (
                <span
                    className={`note ${underlines === 1 ? 'note-eighth' : underlines === 2 ? 'note-sixteenth' : ''}`}
                >{isRest ? '-' : displayNote}</span>
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