"use client"

import { computeBeamGroups, parseJianpu, BAR_STEP_PX, BAR_GAP_PX } from "@/lib/jianpu"
import type { Measure as MeasureProps, ShowOptions, BarlineType, NavigationMark } from "../../types/MusicNotation"
import { Note } from "./Note"
import { useRef, useLayoutEffect } from "react"

function SegnoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className="nav-symbol"
      aria-label="segno"
    >
      <line
        x1="8"
        y1="18"
        x2="15"
        y2="3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="
          M 13.5 3.5
          C 10.8 3.0, 8.0 4.0, 7.2 6.3
          C 6.3 8.8, 8.5 10.2, 10.9 10.8
          C 13.4 11.4, 16.2 12.3, 16.8 14.4
          C 17.4 16.7, 14.9 18.5, 12.3 18.5
          C 10.0 18.5, 8.1 17.5, 8 16.0
        "
        transform="rotate(-25 12 11) translate(12 11) scale(0.65 1) translate(-12 -11)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="17"
        cy="7"
        r="1.7"
        fill="currentColor"
      />
      <circle
        cx="6"
        cy="14"
        r="1.7"
        fill="currentColor"
      />
    </svg>
  )
}

function CodaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" className="nav-symbol" aria-label="coda">
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.6" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function Barline({ type }: { type: BarlineType }) {
  const thin = <span className="barline-stroke" />
  const thick = <span className="barline-stroke thick" />
  const dots = (
    <span className="repeat-dots">
      <span />
      <span />
    </span>
  )

  switch (type) {
    case "double":
      return <span className="barline barline-double">{thin}{thin}</span>
    case "final":
      return <span className="barline barline-final">{thin}{thick}</span>
    case "repeatStart":
      return <span className="barline barline-repeat-start">{thick}{thin}{dots}</span>
    case "repeatEnd":
      return <span className="barline barline-repeat-end">{dots}{thin}{thick}</span>
    default:
      return <span className="barline barline-normal">{thin}</span>
  }
}

function NavMark({ mark }: { mark: NavigationMark }) {
  switch (mark) {
    case "segno":
      return <span className="nav-mark"><SegnoIcon /></span>
    case "coda":
      return <span className="nav-mark"><CodaIcon /></span>
    case "toCoda":
      return <span className="nav-mark">To <CodaIcon /></span>
    case "fine":
      return <span className="nav-mark">Fine</span>
    case "ds":
      return <span className="nav-mark">D.S.</span>
    case "dsFine":
      return <span className="nav-mark">D.S. al Fine</span>
    case "dsCoda":
      return <span className="nav-mark">D.S. al <CodaIcon /></span>
    case "dc":
      return <span className="nav-mark">D.C.</span>
    case "dcFine":
      return <span className="nav-mark">D.C. al Fine</span>
    case "dcCoda":
      return <span className="nav-mark">D.C. al <CodaIcon /></span>
  }
}

interface Props {
  measure: MeasureProps
  measureIndex: number
  showOptions: ShowOptions
  registerNoteRef: (measureIndex: number, noteIndex: number, el: HTMLDivElement | null) => void
  rowDurationHeightPx?: number
}

interface ExtraRunSpec {
  level: number
  startNote: number
  endNote: number
}

export function Measure({ measure, measureIndex, showOptions, registerNoteRef, rowDurationHeightPx }: Props) {
  const notesContainerRef = useRef<HTMLDivElement>(null)
  const groupRefs = useRef<(HTMLDivElement | null)[]>([])
  const beamBarsRefs = useRef<(HTMLDivElement | null)[]>([])
  const extraRunRefs = useRef<Map<string, HTMLDivElement>>(new Map())

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
        {showOptions.jianpu && (
          <span className="barline-group">
            <Barline type={measure.barline ?? "normal"} />
            {measure.navigationMark?.map(mark => (
              <NavMark key={mark} mark={mark} />
            ))}
          </span>
        )}
      </div>
    </div>
  )
}