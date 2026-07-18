import type { Measure as MeasureProps, ShowOptions } from "../../types/MusicNotation";
import { Note } from "./Note";

interface Props {
    measure: MeasureProps
    showOptions: ShowOptions
}

export function Measure({ measure, showOptions }: Props) {
    return (
        <div className="measure">
            <div className="measure-notes">
                {measure.notes.map((n, i) => (
                    <div key={i} className="note-column">
                        <span className="chord">
                            {showOptions.chords && n.chord ? n.chord : ''}
                        </span>
                        <Note note={n} showOptions={showOptions}></Note>
                    </div>
                ))}
                <span className="barline">|</span>
            </div>
        </div>
    )
}