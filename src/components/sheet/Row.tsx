import type { Row as RowProps } from "../../types/MusicNotation";
import { Measure } from "./Measure";

export function Row({ measures }: RowProps) {
    return (
        <div className="row">
            {measures.map((m, i) => (
                <Measure key={i} {...m}></Measure>
            ))}
        </div>
    )
}