"use client"

import type { Song as SongProps, ShowOptions } from "@/types/MusicNotation"
import { Measure } from "./Measure"
import "@/styles/sheet.css"
import { useRef, useState, useEffect, useCallback } from "react"
import { parseJianpu, BAR_STEP_PX, BAR_GAP_PX } from "@/lib/jianpu"

interface Props {
  song: SongProps
  showOptions: ShowOptions
}

interface BracketRect {
  x1: number
  y1: number
  x2: number
  y2: number
  rowLeft: number
  rowRight: number
  number?: number
  level: number
  wrapped: boolean
  kind?: "tuplet" | "ending"
  endingStyle?: "closed" | "open"
}

export function Song({ song, showOptions }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const noteRefsMap   = useRef<Map<string, HTMLDivElement>>(new Map())
  const measureRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const [bracketRects, setBracketRects] = useState<BracketRect[]>([])
  const [rowDurationHeights, setRowDurationHeights] = useState<Map<number, number>>(new Map())

  const registerMeasureRef = useCallback(
    (measureIndex: number, el: HTMLDivElement | null) => {
      if (el) measureRefs.current.set(measureIndex, el)
      else measureRefs.current.delete(measureIndex)
    },
    []
  )

  const registerNoteRef = useCallback((measureIndex: number, noteIndex: number, el: HTMLDivElement | null) => {
    const key = `${measureIndex}-${noteIndex}`
    if (el) noteRefsMap.current.set(key, el)
    else noteRefsMap.current.delete(key)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) { return }

    const updateLayout = () => {
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect()

        const entries = Array.from(measureRefs.current.entries()).sort(([a], [b]) => a - b)

        if (entries.length > 0) {
          const rows: number[][] = []
          let currentRow: number[] = []
          let currentTop: number | null = null

          for (const [index, el] of entries) {
            const top = el.getBoundingClientRect().top
            if (currentTop === null || Math.abs(top - currentTop) < 5) {
              currentRow.push(index)
              currentTop = currentTop ?? top
            } else {
              rows.push(currentRow)
              currentRow = [index]
              currentTop = top
            }
          }
          if (currentRow.length) { rows.push(currentRow) }

          const heights = new Map<number, number>()
          for (const row of rows) {
            let maxDur = 0
            for (const idx of row) {
              const m = song.measures[idx]
              for (const n of m.notes) {
                const d = parseJianpu(n.note).duration
                if (d > maxDur) { maxDur = d }
              }
            }
            const px = maxDur * BAR_STEP_PX + BAR_GAP_PX
            for (const idx of row) { heights.set(idx, px) }
          }
          setRowDurationHeights(heights)
        }

        if (song.brackets?.length) {
          const rects: BracketRect[] = song.brackets
            .map((b): BracketRect | null => {
              const startEl = noteRefsMap.current.get(`${b.startMeasure}-${b.startNote}`)
              const endEl = noteRefsMap.current.get(`${b.endMeasure}-${b.endNote}`)
              if (!startEl || !endEl) return null

              const startRect = startEl.getBoundingClientRect()
              const endRect = endEl.getBoundingClientRect()

              const startMeasure = measureRefs.current.get(b.startMeasure)
              const endMeasure = measureRefs.current.get(b.endMeasure)
              if (!startMeasure || !endMeasure) return null

              const startMeasureRect = startMeasure.getBoundingClientRect()
              const endMeasureRect = endMeasure.getBoundingClientRect()

              const y1 = startRect.top - containerRect.top
              const y2 = endRect.top - containerRect.top

              const wrapped = Math.abs(startMeasureRect.top - endMeasureRect.top) > 37

              const rowLeft = endMeasureRect.left - containerRect.left
              const rowRight = startMeasureRect.right - containerRect.left

              const isEnding = b.kind === "ending"
              const x1 = isEnding
                ? startMeasureRect.left - containerRect.left
                : startRect.left - containerRect.left + startRect.width / 2

              const x2 = isEnding
                ? endMeasureRect.right - containerRect.left
                : endRect.left - containerRect.left + endRect.width / 2

              return {
                x1,
                y1,
                x2,
                y2,
                rowLeft,
                rowRight,
                number: b.number,
                level: b.level,
                wrapped,
                kind: b.kind,
                endingStyle: b.endingStyle
              }
            })
            .filter((r): r is BracketRect => r !== null)

          setBracketRects(rects)
        } else {
          setBracketRects([])
        }
      })
    }

    updateLayout()
    const ro = new ResizeObserver(updateLayout)
    ro.observe(container)

    return () => { ro.disconnect() }
  }, [song.brackets, song.measures, showOptions])

  return (
    <div className="song">
      <div className="song-header">
        <h2 className="song-title">{song.title}</h2>
        <span className="song-meta">{song.artist}·{song.album} | 1= {song.key} {song.timeSignature} | ♩ = {song.bpm}</span>
        <span className="song-meta"></span>
      </div>

      <div className="measures-container" ref={containerRef} style={{ position: "relative" }}>
        {bracketRects.length > 0 && (
          <svg
            style={{
              position: "absolute",
              top: "-0.37rem",
              left: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            {bracketRects.map((b, i) => {
              if (b.kind === "ending") {
                const dropPx = 10
                const ENDING_LIFT_PX = 20
                const isOpen = b.endingStyle === "open"

                if (!b.wrapped) { 
                  const y = b.y1 + 45 - ENDING_LIFT_PX
                  const d = isOpen
                    ? `M ${b.x1} ${y + dropPx} L ${b.x1} ${y} L ${b.x2} ${y}`
                    : `M ${b.x1} ${y + dropPx} L ${b.x1} ${y} L ${b.x2} ${y} L ${b.x2} ${y + dropPx}`

                  return (
                    <g key={i}>
                      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5"></path>
                      {b.number !== undefined && (
                        <text x={b.x1 + 4} y={y + 10} textAnchor="start" fontSize="10" fontFamily="monospace" fill="currentColor">
                          {b.number}.
                        </text>
                      )}
                    </g>
                  )
                }

                const { rowLeft, rowRight } = b
                const y1 = b.y1 + 45 - ENDING_LIFT_PX
                const y2 = b.y2 + 45 - ENDING_LIFT_PX
                const d1 = `M ${b.x1} ${y1 + dropPx} L ${b.x1} ${y1} L ${rowRight} ${y1}`
                const d2 = isOpen
                  ? `M ${rowLeft} ${y2} L ${b.x2} ${y2}`
                  : `M ${rowLeft} ${y2} L ${b.x2} ${y2} L ${b.x2} ${y2 + dropPx}`

                return (
                  <g key={i}>
                    <path d={d1} fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d={d2} fill="none" stroke="currentColor" strokeWidth="1.5" />
                    {b.number !== undefined && (
                      <text x={b.x1 + 4} y={y1 + 10} textAnchor="start" fontSize="10" fontFamily="monospace" fill="currentColor">
                        {b.number}.
                      </text>
                    )}
                  </g>
                )
              }

              if (!b.wrapped) {
                const span = Math.max(Math.abs(b.x2 - b.x1), 10)
                const arch = Math.min(Math.max(span * 0.15, 7), 25)
                const cpOffset = span * 0.2
                const y = b.y1 + 45 - (3 - b.level)

                const d = `M ${b.x1} ${y} C ${b.x1 + cpOffset} ${y - arch}, ${b.x2 - cpOffset} ${y - arch}, ${b.x2} ${y}`
                const cx = (b.x1 + b.x2) / 2

                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
                    {b.number !== undefined && (
                      <text x={cx} y={y - arch - 3} textAnchor="middle" fontSize="10" fontFamily="monospace" fill="currentColor">
                        {b.number}
                      </text>
                    )}
                  </g>
                )
              }

              const rowRight = b.rowRight
              const rowLeft = b.rowLeft
              const y1 = b.y1 + 45 - (3 - b.level)
              const y2 = b.y2 + 45 - (3 - b.level)

              const span1 = Math.max(rowRight - b.x1, 10)
              const arch1 = Math.min(Math.max(span1 * 0.15, 7), 25)
              const cpOffset1 = Math.min(30, span1 * 0.2)
              const d1 = `M ${b.x1} ${y1} C ${b.x1 + cpOffset1} ${y1 - arch1}, ${rowRight - cpOffset1} ${y1 - arch1}, ${rowRight} ${y1 - arch1}`

              const span2 = Math.max(b.x2, 10)
              const arch2 = Math.min(Math.max(span2 * 0.15, 7), 25)
              const cpOffset2 = Math.min(30, span2 * 0.2)
              const d2 = `
                M ${rowLeft} ${y2 - arch2}
                C ${rowLeft + cpOffset2} ${y2 - arch2},
                ${b.x2 - cpOffset2} ${y2 - arch2},
                ${b.x2} ${y2}
              `

              return (
                <g key={i}>
                  <path d={d1} fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d={d2} fill="none" stroke="currentColor" strokeWidth="1.5" />
                  {b.number !== undefined && (
                    <text x={rowRight - 10} y={y1 - arch1 - 3} textAnchor="middle" fontSize="10" fontFamily="monospace" fill="currentColor">
                      {b.number}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}

        {song.measures.map((measure, index) => (
          <div
            key={measure.id ?? index}
            ref={el => registerMeasureRef(index, el)}
            className="measure-wrapper"
            style={{
              flexGrow: measure.notes.length,
              flexBasis: 0,
            }}
          >
            {measure.sectionLabel && (
              <div className="measure-section-label">
                {measure.sectionLabel}
              </div>
            )}

            <Measure
              measure={measure}
              measureIndex={index}
              showOptions={showOptions}
              registerNoteRef={registerNoteRef}
              rowDurationHeightPx={rowDurationHeights.get(index)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}