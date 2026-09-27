"use client"

import { DrawTool, Stroke } from "@/types/Drawing"
import React, { useRef, useState } from "react"

interface Props {
    strokes: Stroke[]
    onChange: (next: Stroke[]) => void
    tool: DrawTool | null
    color: string
    width: number
}

type Point = { x: number, y: number }

function pathFor(points: Point[], rect: DOMRect) {
    return points.map(
        (p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * rect.width} ${p.y * rect.height}`
    ).join(' ')
}

function distToSegment(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x, dy = b.y - a.y
    const lengthSq = dx * dx + dy * dy
    if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function distToPolyline(p: Point, points: Point[]): number {
    if (points.length === 1) return Math.hypot(p.x - points[0].x, p.y - points[0].y)
    let min = Infinity
    for (let i = 0; i < points.length - 1; i++) {
        min = Math.min(min, distToSegment(p, points[i], points[i + 1]))
    }
    return min
}

function worldPoints(stroke: Stroke): Point[] {
    return stroke.points.map(p => ({
        x: stroke.transform.x + p.x * stroke.transform.scale,
        y: stroke.transform.y + p.y * stroke.transform.scale,
    }))
}

function pointInRect(p: Point, a: Point, b: Point): boolean {
    const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x)
    const minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y)
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
}

function unionBBox(strokesList: Stroke[]): { minX: number, maxX: number, minY: number, maxY: number } | null {
    if (strokesList.length === 0) return null
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const s of strokesList) {
        for (const p of worldPoints(s)) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
        }
    }
    return { minX, maxX, minY, maxY }
}

const TAP_THRESHOLD_PX = 12
const ERASE_THRESHOLD_PX = 14

export function DrawLayer({ strokes, onChange, tool, color, width }: Props) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [drafting, setDrafting] = useState<Point[] | null>(null)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // --- group move (drag a selection) ---
    const dragOrigin = useRef<Point | null>(null)
    const dragBase = useRef<Record<string, Stroke['transform']> | null>(null)
    const [liveTransforms, setLiveTransforms] = useState<Record<string, Stroke['transform']> | null>(null)

    // --- rectangle marquee (select tool) ---
    const [marquee, setMarquee] = useState<{ start: Point; end: Point } | null>(null)

    // --- continuous-touch eraser ---
    const erasingActive = useRef(false)
    const [erasingIds, setErasingIds] = useState<Set<string>>(new Set())

    // --- single-stroke scale handle ---
    const scaleStart = useRef<{ startDist: number; startScale: number; center: Point } | null>(null)
    const [liveScaleTransform, setLiveScaleTransform] = useState<Stroke['transform'] | null>(null)

    // --- group scale handle ---
    const groupScaleStart = useRef<{ startDist: number; center: Point; base: Record<string, Stroke['transform']> } | null>(null)

    function toRelative(e: React.PointerEvent): Point {
        const rect = svgRef.current!.getBoundingClientRect()
        return {
            x: (e.clientX - rect.left) / rect.width,
            y: (e.clientY - rect.top) / rect.height
        }
    }

    function relThreshold(px: number) {
        const rect = svgRef.current!.getBoundingClientRect()
        return px / Math.min(rect.width, rect.height)
    }

    function hitTestNearest(p: Point, candidates: Stroke[]): string | null {
        let bestId: string | null = null
        let bestDist = Infinity
        for (const s of candidates) {
            const d = distToPolyline(p, worldPoints(s))
            if (d < bestDist) { bestDist = d; bestId = s.id }
        }
        return bestDist <= relThreshold(TAP_THRESHOLD_PX) ? bestId : null
    }

    function pointIsOnSelectedStroke(p: Point): boolean {
        const t = relThreshold(TAP_THRESHOLD_PX)
        return strokes
            .filter(s => selectedIds.includes(s.id))
            .some(s => distToPolyline(p, worldPoints(s)) <= t)
    }

    function eraseAt(p: Point) {
        const t = relThreshold(ERASE_THRESHOLD_PX)
        setErasingIds(prev => {
            const next = new Set(prev)
            for (const s of strokes) {
                if (next.has(s.id)) continue
                if (distToPolyline(p, worldPoints(s)) <= t) next.add(s.id)
            }
            return next
        })
    }

    function handlePointerDown(e: React.PointerEvent) {
        e.preventDefault()
        const p = toRelative(e)

        if (tool === "pen" || tool === "highlighter") {
            setDrafting([p])
            svgRef.current?.setPointerCapture(e.pointerId)
            return
        }

        if (tool === "eraser") {
            erasingActive.current = true
            eraseAt(p)
            svgRef.current?.setPointerCapture(e.pointerId)
            return
        }

        if (tool === "select") {
            if (selectedIds.length > 0 && pointIsOnSelectedStroke(p)) {
                dragOrigin.current = p
                const base: Record<string, Stroke['transform']> = {}
                strokes.forEach(s => { if (selectedIds.includes(s.id)) base[s.id] = s.transform })
                dragBase.current = base
                setLiveTransforms(base)
            } else {
                setMarquee({ start: p, end: p })
            }
            svgRef.current?.setPointerCapture(e.pointerId)
        }
    }

    function handlePointerMove(e: React.PointerEvent) {
        const p = toRelative(e)

        if (drafting) {
            setDrafting(prev => [...prev!, p])
            return
        }

        if (erasingActive.current) {
            eraseAt(p)
            return
        }

        if (marquee) {
            setMarquee(m => m ? { ...m, end: p } : m)
            return
        }

        if (tool === "select" && dragOrigin.current && liveTransforms && dragBase.current) {
            const dx = p.x - dragOrigin.current.x
            const dy = p.y - dragOrigin.current.y
            const next: Record<string, Stroke['transform']> = {}
            for (const id of Object.keys(dragBase.current)) {
                const base = dragBase.current[id]
                next[id] = { ...base, x: base.x + dx, y: base.y + dy }
            }
            setLiveTransforms(next)
        }
    }

    function handlePointerUp(e: React.PointerEvent) {
        if (drafting && drafting.length > 1) {
            const stroke: Stroke = {
                id: crypto.randomUUID(),
                tool: tool as "pen" | "highlighter",
                color, width,
                points: drafting,
                transform: { x: 0, y: 0, scale: 1 }
            }
            onChange([...strokes, stroke])
        } else if (erasingActive.current) {
            if (erasingIds.size > 0) onChange(strokes.filter(s => !erasingIds.has(s.id)))
            erasingActive.current = false
            setErasingIds(new Set())
        } else if (marquee) {
            const rect = svgRef.current!.getBoundingClientRect()
            const dx = Math.abs(marquee.end.x - marquee.start.x) * rect.width
            const dy = Math.abs(marquee.end.y - marquee.start.y) * rect.height
            const isTap = dx < TAP_THRESHOLD_PX && dy < TAP_THRESHOLD_PX
            if (isTap) {
                const nearest = hitTestNearest(marquee.start, strokes)
                setSelectedIds(nearest ? [nearest] : [])
            } else {
                const hitIds = strokes
                    .filter(s => worldPoints(s).some(wp => pointInRect(wp, marquee.start, marquee.end)))
                    .map(s => s.id)
                setSelectedIds(hitIds)
            }
            setMarquee(null)
        } else if (liveTransforms) {
            onChange(strokes.map(s => liveTransforms[s.id] ? { ...s, transform: liveTransforms[s.id] } : s))
        }

        setDrafting(null)
        dragOrigin.current = null
        dragBase.current = null
        setLiveTransforms(null)
        if (svgRef.current?.hasPointerCapture(e.pointerId)) {
            svgRef.current?.releasePointerCapture(e.pointerId)
        }
    }

    // --- single-stroke scale ---

    function toWorldCenter(bbox: DOMRect, transform: Stroke['transform'], rect: DOMRect) {
        return {
            x: rect.left + transform.x * rect.width + (bbox.x + bbox.width / 2) * transform.scale,
            y: rect.top + transform.y * rect.height + (bbox.y + bbox.height / 2) * transform.scale,
        }
    }

    function handleScaleDown(e: React.PointerEvent, stroke: Stroke, rect: DOMRect, bbox: DOMRect) {
        e.stopPropagation()
        const localCenter = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 }
        const worldCenter = toWorldCenter(bbox, stroke.transform, rect)
        const dist = Math.hypot(e.clientX - worldCenter.x, e.clientY - worldCenter.y)
        scaleStart.current = { startDist: dist, startScale: stroke.transform.scale, center: localCenter }
        setLiveScaleTransform(stroke.transform)
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }

    function handleScaleMove(e: React.PointerEvent, rect: DOMRect, baseTransform: Stroke["transform"]) {
        if (!scaleStart.current) return
        const { startDist, startScale, center } = scaleStart.current
        const worldCenter = {
            x: rect.left + baseTransform.x * rect.width + center.x * baseTransform.scale,
            y: rect.top + baseTransform.y * rect.height + center.y * baseTransform.scale,
        }
        const dist = Math.hypot(e.clientX - worldCenter.x, e.clientY - worldCenter.y)
        const newScale = Math.max(0.2, startScale * (dist / startDist))
        setLiveScaleTransform({
            scale: newScale,
            x: baseTransform.x + (center.x / rect.width) * (startScale - newScale),
            y: baseTransform.y + (center.y / rect.height) * (startScale - newScale),
        })
    }

    // fix: stopPropagation so this doesn't also trigger the <svg>'s own
    // pointerup branch with a stale liveTransforms closure (double-commit bug)
    function handleScaleUp(e: React.PointerEvent, strokeId: string) {
        e.stopPropagation()
        scaleStart.current = null
        if (liveScaleTransform) {
            onChange(strokes.map(s => s.id === strokeId ? { ...s, transform: liveScaleTransform } : s))
        }
        setLiveScaleTransform(null)
    }

    // --- group scale (multi-select) ---

    function handleGroupScaleDown(e: React.PointerEvent, rect: DOMRect, centerRel: Point) {
        e.stopPropagation()
        const centerPx = { x: rect.left + centerRel.x * rect.width, y: rect.top + centerRel.y * rect.height }
        const dist = Math.hypot(e.clientX - centerPx.x, e.clientY - centerPx.y)
        const base: Record<string, Stroke['transform']> = {}
        strokes.forEach(s => { if (selectedIds.includes(s.id)) base[s.id] = s.transform })
        groupScaleStart.current = { startDist: dist, center: centerRel, base }
        setLiveTransforms(base)
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }

    function handleGroupScaleMove(e: React.PointerEvent, rect: DOMRect) {
        if (!groupScaleStart.current) return
        const { startDist, center, base } = groupScaleStart.current
        const centerPx = { x: rect.left + center.x * rect.width, y: rect.top + center.y * rect.height }
        const dist = Math.hypot(e.clientX - centerPx.x, e.clientY - centerPx.y)
        const factor = Math.max(0.2, dist / startDist)
        const next: Record<string, Stroke['transform']> = {}
        for (const id of Object.keys(base)) {
            const b = base[id]
            next[id] = {
                scale: b.scale * factor,
                x: center.x + (b.x - center.x) * factor,
                y: center.y + (b.y - center.y) * factor,
            }
        }
        setLiveTransforms(next)
    }

    function handleGroupScaleUp(e: React.PointerEvent) {
        e.stopPropagation()
        groupScaleStart.current = null
        if (liveTransforms) {
            onChange(strokes.map(s => liveTransforms[s.id] ? { ...s, transform: liveTransforms[s.id] } : s))
        }
        setLiveTransforms(null)
    }

    const rect = svgRef.current?.getBoundingClientRect()
    const visibleStrokes = strokes.filter(s => !erasingIds.has(s.id))

    return (
        <svg
            ref={svgRef}
            className="draw-layer"
            data-tool={tool ?? "view"}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {rect && visibleStrokes.map(s => {
                const isSelected = selectedIds.includes(s.id)
                const transform =
                    liveTransforms?.[s.id] ??
                    (isSelected && selectedIds.length === 1 && liveScaleTransform ? liveScaleTransform : s.transform)
                return (
                    <StrokeItem
                        key={s.id}
                        stroke={s}
                        rect={rect}
                        transform={transform}
                        isSelected={isSelected}
                        showScaleHandle={isSelected && selectedIds.length === 1 && tool === "select"}
                        onScaleDown={(e, bbox) => handleScaleDown(e, s, rect, bbox)}
                        onScaleMove={(e) => handleScaleMove(e, rect, s.transform)}
                        onScaleUp={(e) => handleScaleUp(e, s.id)}
                    />
                )
            })}

            {rect && selectedIds.length > 1 && tool === "select" && (() => {
                const selectedStrokes = strokes.filter(s => selectedIds.includes(s.id))
                const liveSelected = selectedStrokes.map(s =>
                    liveTransforms?.[s.id] ? { ...s, transform: liveTransforms[s.id] } : s
                )
                const box = unionBBox(liveSelected)
                if (!box) return null
                const center = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 }
                const x = box.minX * rect.width, y = box.minY * rect.height
                const w = (box.maxX - box.minX) * rect.width, h = (box.maxY - box.minY) * rect.height
                return (
                    <g>
                        <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12}
                            fill="none" stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1} />
                        <circle
                            cx={x + w + 6} cy={y + h + 6} r={7}
                            fill="#3b82f6" stroke="white" strokeWidth={1.5}
                            onPointerDown={(e) => handleGroupScaleDown(e, rect, center)}
                            onPointerMove={(e) => handleGroupScaleMove(e, rect)}
                            onPointerUp={handleGroupScaleUp}
                            onPointerCancel={handleGroupScaleUp}
                            style={{ cursor: "nwse-resize" }}
                        />
                    </g>
                )
            })()}

            {rect && drafting && (tool === "pen" || tool === "highlighter") && (
                <path d={pathFor(drafting, rect)} stroke={color} strokeWidth={width}
                    strokeOpacity={tool === "pen" ? 1 : 0.37} fill="none" strokeLinecap="round" />
            )}

            {rect && marquee && (
                <rect
                    x={Math.min(marquee.start.x, marquee.end.x) * rect.width}
                    y={Math.min(marquee.start.y, marquee.end.y) * rect.height}
                    width={Math.abs(marquee.end.x - marquee.start.x) * rect.width}
                    height={Math.abs(marquee.end.y - marquee.start.y) * rect.height}
                    fill="#3b82f6" fillOpacity={0.08} stroke="#3b82f6" strokeDasharray="5 4"
                />
            )}
        </svg>
    )
}

function StrokeItem({ stroke, rect, transform, isSelected, showScaleHandle, onScaleDown, onScaleMove, onScaleUp }: {
    stroke: Stroke
    rect: DOMRect
    transform: Stroke['transform']
    isSelected: boolean
    showScaleHandle: boolean
    onScaleDown: (e: React.PointerEvent, bbox: DOMRect) => void
    onScaleMove: (e: React.PointerEvent) => void
    onScaleUp: (e: React.PointerEvent) => void
}) {
    const pathRef = useRef<SVGPathElement>(null)
    const bbox = pathRef.current?.getBBox()
    const d = pathFor(stroke.points, rect)

    return (
        <g transform={`translate(${transform.x * rect.width} ${transform.y * rect.height}) scale(${transform.scale})`}>
            <path
                ref={pathRef}
                d={d}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeOpacity={stroke.tool === "pen" ? 1 : 0.37}
                fill="none"
                strokeLinecap="round"
                style={{ pointerEvents: "none" }}
            />
            {isSelected && bbox && (
                <rect
                    x={bbox.x - 4} y={bbox.y - 4} width={bbox.width + 8} height={bbox.height + 8}
                    fill="none" stroke="#3b82f6" strokeDasharray="4 3" strokeWidth={1 / transform.scale}
                    style={{ pointerEvents: "none" }}
                />
            )}
            {showScaleHandle && bbox && (
                <circle
                    cx={bbox.x + bbox.width} cy={bbox.y + bbox.height} r={6 / transform.scale}
                    fill="#3b82f6" stroke="white" strokeWidth={1.5 / transform.scale}
                    onPointerDown={(e) => onScaleDown(e, bbox)}
                    onPointerMove={onScaleMove}
                    onPointerUp={onScaleUp}
                    onPointerCancel={onScaleUp}
                    style={{ cursor: "nwse-resize" }}
                />
            )}
        </g>
    )
}