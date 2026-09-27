import { DrawTool } from "@/types/Drawing"
import "@/styles/drawing.css"

interface Props {
    tool: DrawTool | null
    onToolChange: (t: DrawTool | null) => void
    color: string
    onColorChange: (c: string) => void
    width: number
    onWidthChange: (w: number) => void
    onUndo: () => void
    canUndo: boolean
}

const TOOLS: { id: DrawTool; label: string }[] = [
    { id: "pen", label: '✎' },
    { id: "highlighter", label: '🖊' },
    { id: "eraser", label: '⌫' },
    { id: "select", label: '⛶' },
]

const COLORS = ["#1a1a1a", "#e11d48", "#2563eb", "#16a34a", "#f59e0b"]

export function DrawToolbar({ tool, onToolChange, color, onColorChange, width, onWidthChange, onUndo, canUndo }: Props) {
    return (
        <div className="draw-toolbar">
            {TOOLS.map(t => (
                <button
                    key={t.id}
                    className={t.id === tool ? "active" : ''}
                    onClick={() => onToolChange(t.id === tool ? null : t.id)}
                >
                    {t.label}
                </button>
            ))}
            <button onClick={onUndo} disabled={!canUndo} title="Undo">↶</button>
            <div className="draw-toolbar-colors">
                {COLORS.map(c => (
                    <button
                        key={c}
                        className="color-swatch"
                        style={{ background: c, outline: c === color ? "2px solid #333" : "none" }}
                        onClick={() => onColorChange(c)}
                    />
                ))}
            </div>
            <div className="draw-tool-width">
                <input
                    type="range" min={3} max={15} value={width}
                    onChange={e => onWidthChange(Number(e.target.value))}
                />
            </div>
        </div>
    )
}