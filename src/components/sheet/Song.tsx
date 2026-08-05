'use client'

import type { Song as SongProps, ShowOptions } from "@/types/MusicNotation"
import { Measure } from "./Measure"
import "@/styles/sheet.css"
import { useRef, useState, useEffect, useCallback } from "react"

interface Props {
  song: SongProps
  showOptions: ShowOptions
}

interface BracketRect {
  x1: number
  y1: number
  x2: number
  y2: number
  number?: number
  level: number
  wrapped: boolean // start/end are on different visual rows
}

export function Song({ song, showOptions }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const noteRefsMap   = useRef<Map<string, HTMLDivElement>>(new Map())
  const [bracketRects, setBracketRects] = useState<BracketRect[]>([])

  const registerNoteRef = useCallback((measureIndex: number, noteIndex: number, el: HTMLDivElement | null) => {
    const key = `${measureIndex}-${noteIndex}`
    if (el) noteRefsMap.current.set(key, el)
    else noteRefsMap.current.delete(key)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !song.brackets?.length) { setBracketRects([]); return }

    const updateRects = () => {
      requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect()

        const rects: BracketRect[] = song.brackets
          .map((b): BracketRect | null => {
            const startEl = noteRefsMap.current.get(`${b.startMeasure}-${b.startNote}`)
            const endEl = noteRefsMap.current.get(`${b.endMeasure}-${b.endNote}`)
            if (!startEl || !endEl) return null

            const startRect = startEl.getBoundingClientRect()
            const endRect = endEl.getBoundingClientRect()

            const y1 = startRect.top - containerRect.top
            const y2 = endRect.top - containerRect.top
            const wrapped = Math.abs(y1 - y2) > 5

            return {
              x1: startRect.left - containerRect.left + startRect.width * 0.5,
              y1,
              x2: endRect.left - containerRect.left + endRect.width * 0.5,
              y2,
              number: b.number,
              level: b.level,
              wrapped,
            }
          })
          .filter((r): r is BracketRect => r !== null)

        setBracketRects(rects)
      })
    }

    updateRects()
    const ro = new ResizeObserver(updateRects)
    ro.observe(container)
    window.addEventListener('resize', updateRects)
    return () => { ro.disconnect(); window.removeEventListener('resize', updateRects) }
  }, [song.brackets, song.measures, showOptions])

  return (
    <div className="song">
      <div className="song-header">
        <h2 className="song-title">{song.title}</h2>
        <span className="song-meta">{song.artist}·{song.album}</span>
        <span className="song-meta">1= {song.key} {song.timeSignature} | BPM = {song.bpm}</span>
      </div>

      <div className="measures-container" ref={containerRef} style={{ position: 'relative' }}>
        {bracketRects.length > 0 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {bracketRects.map((b, i) => {
              if (!b.wrapped) {
                const span = Math.max(Math.abs(b.x2 - b.x1), 10)
                const arch = Math.min(Math.max(span * 0.18, 10), 30)
                const cpOffset = span * 0.2
                const y = b.y1 + 37 - (3 - b.level)

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

              const rowRight = (containerRef.current?.clientWidth ?? 0)
              const y1 = b.y1 + 37 - (3 - b.level)
              const y2 = b.y2 + 37 - (3 - b.level)

              const span1 = Math.max(rowRight - b.x1, 10)
              const arch1 = Math.min(Math.max(span1 * 0.15, 10), 24)
              const cpOffset1 = Math.min(30, span1 * 0.2)
              const d1 = `M ${b.x1} ${y1} C ${b.x1 + cpOffset1} ${y1 - arch1}, ${rowRight - cpOffset1} ${y1 - arch1}, ${rowRight} ${y1 - arch1}`

              const span2 = Math.max(b.x2, 10)
              const arch2 = Math.min(Math.max(span2 * 0.15, 10), 24)
              const cpOffset2 = Math.min(30, span2 * 0.2)
              const d2 = `M 0 ${y2 - arch2} C ${cpOffset2} ${y2 - arch2}, ${b.x2 - cpOffset2} ${y2 - arch2}, ${b.x2} ${y2}`

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

        {song.measures?.map((measure, index) => (
          <div
            key={measure.id || index}
            className={`measure-wrapper${measure.sectionLabel ? ' has-section-label' : ''}`}
            style={{ flexGrow: measure.notes.length, flexBasis: 0 }}
          >
            {measure.sectionLabel && (
              <div className="measure-section-label">{measure.sectionLabel}</div>
            )}
            <div className="measure-content">
              <Measure
                measure={measure}
                measureIndex={index}
                showOptions={showOptions}
                registerNoteRef={registerNoteRef}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}