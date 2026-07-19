import type { Section as SectionProps, ShowOptions } from "../../types/MusicNotation";
import { Row } from "./Row";
import "../../styles/sheet.css"
import "../../app/global.css"

interface Props {
    section: SectionProps
    showOptions: ShowOptions
}

export function Section({ section, showOptions }: Props) {
    return (
        <div className="section">
            <span className="section-label">{section.label}</span>
            {section.rows.map((r, i) => (
                <Row key={i} row={r} showOptions={showOptions}></Row>
            ))}
        </div>
    )
}