import type { Sheet as SheetProps, ShowOptions } from "../../types/MusicNotation";
import { Row } from "./Row";
import "../../styles/sheet.css"
import "../../app/global.css"

interface Props {
    sheet: SheetProps
    showOptions: ShowOptions
}

export function Sheet({ sheet, showOptions }: Props) {
    return (
        <div className="sheet">
            <span className="sheet-label">{sheet.label}</span>
            {sheet.rows.map((r, i) => (
                <Row key={i} row={r} showOptions={showOptions}></Row>
            ))}
        </div>
    )
}