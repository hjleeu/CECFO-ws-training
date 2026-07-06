import type { Sheet as SheetProps } from "../../types/MusicNotation";
import { Row } from "./Row";

export function Sheet({ rows }: SheetProps) {
    return (
        <div className="sheet">
            {rows.map((r, i) => (
                <Row key={i} {...r}></Row>
            ))}
        </div>
    )
}