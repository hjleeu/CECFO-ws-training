import type { ReactNode } from "react"
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

function Icon({ children }: { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    )
}

const PenIcon = () => (
    <Icon>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
)

const HighlighterIcon = () => (
    <Icon>
        <path d="m9 11-6 6v3h9l3-3" />
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </Icon>
)

const EraserIcon = () => (
    <Icon>
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
        <path d="M22 21H7" />
        <path d="m5 11 9 9" />
    </Icon>
)

const SelectIcon = () => (
    <Icon>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
    </Icon>
)

const UndoIcon = () => (
    <Icon>
        <path d="M3 7v6h6" />
        <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </Icon>
)

const TOOLS: { id: DrawTool; label: string; icon: ReactNode }[] = [
    { id: "pen", label: "Pen", icon: <PenIcon /> },
    { id: "highlighter", label: "Highlighter", icon: <HighlighterIcon /> },
    { id: "eraser", label: "Eraser", icon: <EraserIcon /> },
    { id: "select", label: "Select", icon: <SelectIcon /> },
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
                    title={t.label}
                    aria-label={t.label}
                >
                    {t.icon}
                </button>
            ))}
            <button onClick={onUndo} disabled={!canUndo} title="Undo" aria-label="Undo">
                <UndoIcon />
            </button>
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