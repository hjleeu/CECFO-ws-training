import type { Row as RowProps, ShowOptions } from "../../types/MusicNotation";
import { Measure } from "./Measure";

interface Props {
    row: RowProps
    showOptions: ShowOptions
}

export function Row({ row, showOptions }: Props) {
    return (
        <div className="row">
            {row.measures.map((m, i) => (
                <Measure key={i} measure={m} showOptions={showOptions}></Measure>
            ))}
        </div>
    )
}