import type { Note, Note as NoteProps, ShowOptions } from "../../types/MusicNotation"

interface Props {
    note: NoteProps
    showOptions: ShowOptions
}

export function Note({ note, showOptions }: Props) {
    return (
        <div className="notation">
            {showOptions.jianpu && <span className="note">{note.note}</span>}
            {showOptions.pinyin && <span className="pinyin">{note.pinyin}</span>}
            {showOptions.lyrics && <span className="lyric">{note.char}</span>}
        </div>
    )
}