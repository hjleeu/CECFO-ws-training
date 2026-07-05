import type { Measure as MeasureProps } from "../../types/MusicNotation";
import { Note } from "./Note";

export function Measure({ chords, notes }: MeasureProps) {
    return (
        <div className="measure">
            <div className="measure-chords">
                {chords.map((c, i) => (
                    <span key={i} className="chord">{c}</span>
                ))}
            </div>
            <div className="measure-notes">
                {notes.map((n, i) => (
                    <Note key={i} {...n}></Note>
                ))}
            </div>
        </div>
    )
}