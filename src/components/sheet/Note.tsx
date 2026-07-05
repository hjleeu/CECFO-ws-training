import type { Note as NoteProps } from "../../types/MusicNotation"

export function Note({ note, char, pinyin }: NoteProps) {
    return (
        <div className="notation">
            <span className="note">{note}</span>
            <span className="lyric">{char}</span>
            <span className="pinyin">{pinyin}</span>
        </div>
    )
}