export type DrawTool = "pen" | "highlighter" | "eraser" | "select"

export interface Stroke {
    id: string
    tool: "pen" | "highlighter"
    color: string
    width: number
    points: { x: number; y: number }[]
    transform: { x: number; y: number; scale: number }
}