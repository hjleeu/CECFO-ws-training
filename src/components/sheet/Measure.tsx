import type { Measure as MeasureProps, ShowOptions } from "../../types/MusicNotation";
import { Note } from "./Note";

interface Props {
    measure: MeasureProps
    showOptions: ShowOptions
}

export function Measure({ measure, showOptions }: Props) {
    return (
        <div className="measure">
            {showOptions.chords && <div className="measure-chords">
                {measure.chords.map((c, i) => (
                    <span key={i} className="chord">{c}</span>
                ))}
            </div>}
            <div className="measure-notes">
                {measure.notes.map((n, i) => (
                    <Note key={i} note={n} showOptions={showOptions}></Note>
                ))}
            </div>
        </div>
    )
}