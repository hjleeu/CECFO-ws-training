import { computeBeamGroups, parseJianpu } from '@/lib/jianpu'
import type { Measure as MeasureProps, ShowOptions } from '../../types/MusicNotation'
import { Note } from './Note'
import { useEffect, useRef, useState } from 'react'

interface Props {
    measure: MeasureProps
    showOptions: ShowOptions
}

interface BracketSpan {
    startIndex: number
    endIndex: number
    number?: number
    isLeading?: boolean
    isTrailing?: boolean
}

interface BracketRect {
    x1: number
    x2: number
    containerWidth: number
    number?: number
    isLeading?: boolean
    isTrailing?: boolean
}

export function Measure({ measure, showOptions }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const noteRefs = useRef<(HTMLDivElement | null)[]>([])
    const [bracketRects, setBracketRects] = useState<BracketRect[]>([])

    const parsedNote = measure.notes.map(n => {
        const parsed = parseJianpu(n.note)
        return {
            ...parsed,
            dotted: n.dotted || parsed.dotted
        }
    })

    const beamGroups = computeBeamGroups(parsedNote)
    const beamMap = new Map<number, { shared: number, extra: number }>()

    for (const group of beamGroups) {
        for (let i = group.start; i <= group.end; i++) {
            const noteDuration = parsedNote[i].duration
            beamMap.set(i, {
                shared: group.start === group.end ? 0 : group.sharedBeams,
                extra: group.start === group.end ? noteDuration : noteDuration - group.sharedBeams
            })
        }
    }

    const segments: { notes: number[], sharedBeams: number }[] = []

    for (const group of beamGroups) {
        if (group.start === group.end) {
            segments.push({ notes: [group.start], sharedBeams: 0 })
        } else {
            segments.push({
                notes: Array.from({ length: group.end - group.start + 1 }, (_, k) => group.start + k),
                sharedBeams: group.sharedBeams,
            })
        }
    }

    const allSegmentNotes = new Set(segments.flatMap(s => s.notes))
    const finalSegments: { notes: number[], sharedBeams: number }[] = []
    let si = 0

    for (let i = 0; i < measure.notes.length; i++) {
        if (!allSegmentNotes.has(i)) {
            finalSegments.push({ notes: [i], sharedBeams: 0 })
        } else if (si < segments.length && segments[si].notes[0] === i) {
            finalSegments.push(segments[si])
            i += segments[si].notes.length - 1
            si++
        }
    }

    const bracketSpans: BracketSpan[] = []
    const spanStack: { startIndex: number, number?: number, isLeading?: boolean }[] = []

    measure.notes.forEach((n, idx) => {
        if (n.bracketStart) {
            if (n.isLeading) {
                spanStack.push({
                    startIndex: -1,
                    isLeading: true,
                    number: n.bracketNumber
                })
            } else {
                spanStack.push({ startIndex: idx, number: n.bracketNumber })
            }
        }
        if (n.bracketEnd) {
            const top = spanStack.pop()
            if (top) {
                bracketSpans.push({
                    startIndex: top.startIndex === -1 ? 0 : top.startIndex,
                    endIndex: idx,
                    number: top.number,
                    isLeading: top.isLeading
                })
            }
        }

        if (n.isTrailing && !n.bracketEnd) {
            if (spanStack.length > 0) {
                const top = spanStack[spanStack.length - 1]
                bracketSpans.push({
                    startIndex: top.startIndex,
                    endIndex: measure.notes.length - 1,
                    number: top.number,
                    isTrailing: true
                })
                spanStack.pop()
            }
        }
    })

    useEffect(() => {
        const container = containerRef.current
        if (!container || bracketSpans.length === 0) return

        const updateRects = () => {
            requestAnimationFrame(() => {
                const containerRect = container.getBoundingClientRect()
                const containerWidth = container.clientWidth

                const rects: BracketRect[] = bracketSpans.map(b => {
                    const startEl = noteRefs.current[b.startIndex]
                    const endEl = noteRefs.current[b.endIndex]

                    const x1 = startEl
                        ? startEl.getBoundingClientRect().left - containerRect.left + startEl.getBoundingClientRect().width * 0.5
                        : 0

                    const x2 = endEl
                        ? endEl.getBoundingClientRect().left - containerRect.left + endEl.getBoundingClientRect().width * 0.5
                        : containerWidth

                    return {
                        x1,
                        x2,
                        containerWidth,
                        number: b.number,
                        isLeading: b.isLeading,
                        isTrailing: b.isTrailing
                    }
                })

                setBracketRects(rects)
            })
        }

        // Initial calculation on load.
        updateRects()

        const resizeObserver = new ResizeObserver(() => {
            updateRects()
        })

        resizeObserver.observe(container)
        window.addEventListener("resize", updateRects)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", updateRects)
        }

    }, [measure.notes, showOptions])

    return (
        <div className="measure">
            <div className="measure-notes" ref={containerRef} style={{ position: "relative" }}>
                {bracketRects.length > 0 && (
                    <svg
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "visible",
                            pointerEvents: "none",
                            zIndex: 2
                        }}
                    >
                        {bracketRects.map((b, i) => {
                            const startX = b.isLeading ? 0 : b.x1
                            const endX = b.isTrailing ? b.containerWidth : b.x2
                            const cx = (startX + endX) / 2
                            const y = 37
                            const h = 15

                            const cornerRadius = 15

                            const d = (b.isLeading && b.isTrailing
                            ? `
                                M ${startX} ${y - h}
                                L ${endX} ${y - h}
                            `
                            : b.isLeading
                            ? `
                                M ${startX} ${y - h}
                                L ${endX - cornerRadius} ${y - h}
                                Q ${endX} ${y - h} ${endX} ${y - h + cornerRadius}
                                L ${endX} ${y}
                            `
                            : b.isTrailing
                            ? `
                                M ${startX} ${y}
                                L ${startX} ${y - h + cornerRadius}
                                Q ${startX} ${y - h} ${startX + cornerRadius} ${y - h}
                                L ${endX} ${y - h}
                            `
                            : `
                                M ${startX} ${y}
                                L ${startX} ${y - h + cornerRadius}
                                Q ${startX} ${y - h} ${startX + cornerRadius} ${y - h}
                                L ${endX - cornerRadius} ${y - h}
                                Q ${endX} ${y - h} ${endX} ${y - h + cornerRadius}
                                L ${endX} ${y}
                            `).trim().replace(/\s+/g, ' ')

                            return (
                                <g key={i}>
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                    ></path>
                                    {b.number !== undefined && !b.isLeading && (
                                        <text
                                            x={cx}
                                            y={y - h - 3}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fontFamily="monospace"
                                            fill="currentColor"
                                        >{b.number}</text>
                                    )}
                                </g>
                            )
                        })}
                    </svg>
                )}

                {finalSegments.map((seg, si) => {
                    const isGroup = seg.notes.length > 1 && seg.sharedBeams > 0

                    return (
                        <div key={si} className={isGroup ? "beam-group" : ''} style={{ position: "relative" }}>
                            {isGroup && (
                                <div className="beam-bars">
                                    {Array.from({ length: seg.sharedBeams }).map((_, bi) => (
                                        <div key={bi} className="beam-bar" />
                                    ))}
                                </div>
                            )}
                            <div className="beam-notes">
                                {seg.notes.map((ni, k) => {
                                    const extra = beamMap.get(ni)?.extra ?? 0
                                    return (
                                        <div key={k} className="note-column" ref={(el: HTMLDivElement | null) => {noteRefs.current[ni] = el}}>
                                            <span className="chord">
                                                {showOptions.chords && measure.notes[ni].chord
                                                    ? measure.notes[ni].chord : ''}
                                            </span>
                                            <Note
                                                note={measure.notes[ni]}
                                                showOptions={showOptions}
                                                extraBeams={extra}
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
                <span className="barline">|</span>
            </div>
        </div>
    )
}