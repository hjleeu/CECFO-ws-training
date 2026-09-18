"use client"

import { computeBeamGroups, parseJianpu, BAR_STEP_PX, BAR_GAP_PX } from "@/lib/jianpu"
import type { Measure as MeasureProps, ShowOptions } from "../../types/MusicNotation"
import { Note } from "./Note"
import { useRef, useLayoutEffect } from "react"

interface Props {
  measure: MeasureProps
  measureIndex: number
  showOptions: ShowOptions
  registerNoteRef: (measureIndex: number, noteIndex: number, el: HTMLDivElement | null) => void
  rowDurationHeightPx?: number
}

interface ExtraRunSpec {
  level: number
  startNote: number // actual note index within measure.notes
  endNote: number   // actual note index within measure.notes
}

export function Measure({ measure, measureIndex, showOptions, registerNoteRef, rowDurationHeightPx }: Props) {
  const notesContainerRef = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<(HTMLDivElement | null)[]>([])
  const beamBarsRefs = useRef<(HTMLDivElement | null)[]>([])
  const extraRunRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  // Local note-index -> DOM element map, populated by the same ref callback
  // that registers note-columns with Song.tsx. Avoids re-querying the DOM by
  // class and matching by array position (which assumed DOM order always
  // matches seg.notes order — a real element-mismatch risk if that ever
  // drifted).
  const noteColumnRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const parsedNote = measure.notes.map(n => {
    const parsed = parseJianpu(n.note)
    return { ...parsed, dotted: n.dotted || parsed.dotted }
  })

  const measureMaxDuration = Math.max(...parsedNote.map(note => note.duration), 0)
  const localFallbackHeightPx = measureMaxDuration * BAR_STEP_PX + BAR_GAP_PX
  const durationHeightPx = rowDurationHeightPx ?? localFallbackHeightPx

  const beamGroups = computeBeamGroups(parsedNote)

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

  // Pure function of note durations. startNote/endNote here are the actual
  // note indices (seg.notes[...]) — not positions within seg.notes — so the
  // effect can look them up directly by note index, with no dependency on
  // DOM query order matching array order.
  const extraRunSpecsBySeg = finalSegments.map(seg => {
    const isGroup = seg.notes.length > 1 && seg.sharedBeams > 0
    if (!isGroup) { return [] as ExtraRunSpec[] }

    const noteDurations = seg.notes.map(ni => parsedNote[ni].duration)
    const maxDuration = Math.max(...noteDurations)
    const runs: ExtraRunSpec[] = []

    for (let level = seg.sharedBeams + 1; level <= maxDuration; level++) {
      let runStart: number | null = null
      for (let i = 0; i <= noteDurations.length; i++) {
        const inRun = i < noteDurations.length && noteDurations[i] >= level
        if (inRun && runStart === null) {
          runStart = i
        } else if (!inRun && runStart !== null) {
          runs.push({ level, startNote: seg.notes[runStart], endNote: seg.notes[i - 1] })
          runStart = null
        }
      }
    }
    return runs
  })

  useLayoutEffect(() => {
    const container = notesContainerRef.current
    if (!container) return

    const update = () => {
      finalSegments.forEach((seg, segIndex) => {
        const isGroup = seg.notes.length > 1 && seg.sharedBeams > 0
        if (!isGroup) return

        const groupEl = groupRefs.current[segIndex]
        const barEl = beamBarsRefs.current[segIndex]
        if (!groupEl || !barEl) return

        const groupRect = groupEl.getBoundingClientRect()
        const firstColumnEl = noteColumnRefs.current.get(seg.notes[0])
        const firstDigit = firstColumnEl?.querySelector(".note-digit-row")
        if (!firstDigit) return

        const baseTop = firstDigit.getBoundingClientRect().bottom - groupRect.top + 2
        barEl.style.top = `${baseTop}px`

        extraRunSpecsBySeg[segIndex].forEach((run, runIndex) => {
          const runEl = extraRunRefs.current.get(`${segIndex}-${runIndex}`)
          const startEl = noteColumnRefs.current.get(run.startNote)
          const endEl = noteColumnRefs.current.get(run.endNote)
          if (!runEl || !startEl || !endEl) return

          // A run's edge that touches the group boundary must land exactly
          // on the group's own edge (where the base/long beam ends) — not
          // on the individual note-column's edge, which can shift depending
          // on that note's own pinyin/lyric width and no longer line up.
          // Anchor to the *actual rendered* rect of the base beam (barEl),
          // not to a hardcoded inset — however CSS positions .beam-bars,
          // a run touching the group boundary will always line up with it.
          const isFirstNote = run.startNote === seg.notes[0]
          const isLastNote = run.endNote === seg.notes[seg.notes.length - 1]
          const barRect = barEl.getBoundingClientRect()

          const sRect = startEl.getBoundingClientRect()
          const eRect = endEl.getBoundingClientRect()
          const left = isFirstNote ? barRect.left - groupRect.left : sRect.left - groupRect.left
          const right = isLastNote ? barRect.right - groupRect.left : eRect.right - groupRect.left

          runEl.style.top = `${baseTop + (run.level - seg.sharedBeams - 1) * BAR_STEP_PX + BAR_GAP_PX}px`
          runEl.style.left = `${left}px`
          runEl.style.width = `${right - left}px`
        })
      })
    }

    update()
    // Single Observer for whole measure.
    const ro = new ResizeObserver(update)
    ro.observe(container)
    return () => ro.disconnect()
  }, [measure.notes, showOptions.jianpu])

  return (
    <div className="measure">
      <div className="measure-notes" ref={notesContainerRef} style={{ position: "relative" }}>
        {showOptions.jianpu && finalSegments.map((seg, si) => {
          const isGroup = seg.notes.length > 1 && seg.sharedBeams > 0
          const content = seg.notes.map((ni, k) => {
            const extra = isGroup ? 0 : parsedNote[ni].duration

            return (
              <div
                key={k}
                className="note-column"
                ref={(el: HTMLDivElement | null) => {
                  registerNoteRef(measureIndex, ni, el)
                  if (el) { noteColumnRefs.current.set(ni, el) }
                  else { noteColumnRefs.current.delete(ni) }
                }}
              >
                <span className="chord">
                  {showOptions.chords && measure.notes[ni].chord ? measure.notes[ni].chord: ''}
                </span>
                <Note
                  note={measure.notes[ni]}
                  showOptions={showOptions}
                  extraBeams={extra}
                  reservedDurationHeightPx={durationHeightPx}
                ></Note>
              </div>
            )
          })

          if (!isGroup) {
            return <div key={si} style={{ position: "relative" }}>{content}</div>
          }

          return (
            <div
              key={si}
              ref={el => { groupRefs.current[si] = el }}
              className="beam-group"
              style={{ position: "relative" }}
            >
              <div className="beam-bars" ref={el => { beamBarsRefs.current[si] = el }}>
                {Array.from({ length: seg.sharedBeams }).map((_, bi) => (
                  <div key={bi} className="beam-bar"></div>
                ))}
              </div>
              {extraRunSpecsBySeg[si].map((run, ri) => (
                <div
                  key={ri}
                  className="beam-bar"
                  ref={el => {
                    const key = `${si}-${ri}`
                    if (el) { extraRunRefs.current.set(key, el) }
                    else { extraRunRefs.current.delete(key) }
                  }}
                  style={{ position: "absolute" }}
                ></div>
              ))}
              <div className="beam-notes">
                {content}
              </div>
            </div>
          )
        })}
        {showOptions.jianpu && <span className="barline">|</span>}
      </div>
    </div>
  )
}