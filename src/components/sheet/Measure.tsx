'use client'

import { computeBeamGroups, parseJianpu, BAR_STEP_PX, BAR_GAP_PX } from '@/lib/jianpu'
import type { Measure as MeasureProps, ShowOptions } from '../../types/MusicNotation'
import { Note } from './Note'
import { useRef, useState, useLayoutEffect } from 'react'

interface Props {
  measure: MeasureProps
  measureIndex: number
  showOptions: ShowOptions
  registerNoteRef: (measureIndex: number, noteIndex: number, el: HTMLDivElement | null) => void
  rowDurationHeightPx?: number   // set by Song.tsx after measuring the whole row
}

export function Measure({ measure, measureIndex, showOptions, registerNoteRef, rowDurationHeightPx }: Props) {
  const parsedNote = measure.notes.map(n => {
    const parsed = parseJianpu(n.note)
    return { ...parsed, dotted: n.dotted || parsed.dotted }
  })

  const measureMaxDuration = Math.max(...parsedNote.map(note => note.duration), 0)
  const localFallbackHeightPx = measureMaxDuration * BAR_STEP_PX + BAR_GAP_PX

  // use the row-wide value once Song.tsx has measured it; fall back to this
  // measure's own local value on the very first paint before that happens
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

  return (
    <div className="measure">
      <div className="measure-notes" style={{ position: 'relative' }}>
        {finalSegments.map((seg, si) => {
          const isGroup = seg.notes.length > 1 && seg.sharedBeams > 0
          const noteDurations = seg.notes.map(ni => parsedNote[ni].duration)

          return (
            <BeamSegment
              key={si}
              isGroup={isGroup}
              sharedBeams={seg.sharedBeams}
              noteDurations={noteDurations}
            >
              {seg.notes.map((ni, k) => {
                const extra = isGroup ? 0 : parsedNote[ni].duration
                return (
                  <div
                    key={k}
                    className="note-column"
                    ref={(el: HTMLDivElement | null) => registerNoteRef(measureIndex, ni, el)}
                  >
                    <span className="chord">
                      {showOptions.chords && measure.notes[ni].chord ? measure.notes[ni].chord : ''}
                    </span>
                    <Note
                      note={measure.notes[ni]}
                      showOptions={showOptions}
                      extraBeams={extra}
                      reservedDurationHeightPx={durationHeightPx}
                    />
                  </div>
                )
              })}
            </BeamSegment>
          )
        })}
        <span className="barline">|</span>
      </div>
    </div>
  )
}

interface ExtraBarRun {
  level: number
  top:   number
  left:  number
  width: number
}

function BeamSegment({
  isGroup,
  sharedBeams,
  noteDurations,
  children,
}: {
  isGroup: boolean
  sharedBeams: number
  noteDurations: number[]
  children: React.ReactNode
}) {
  const groupRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)
  const [primaryTop, setPrimaryTop] = useState<number | null>(null)
  const [extraRuns, setExtraRuns] = useState<ExtraBarRun[]>([])

  useLayoutEffect(() => {
    if (!isGroup || !groupRef.current || !notesRef.current) return

    const updatePosition = () => {
      const groupEl = groupRef.current
      const notesEl = notesRef.current
      if (!groupEl || !notesEl) return

      const noteColumns = Array.from(notesEl.querySelectorAll('.note-column')) as HTMLElement[]
      if (noteColumns.length === 0) return

      const groupRect  = groupEl.getBoundingClientRect()
      const firstDigit = noteColumns[0].querySelector('.note-digit-row')
      if (!firstDigit) return

      const baseTop = firstDigit.getBoundingClientRect().bottom - groupRect.top + 2
      setPrimaryTop(baseTop)

      const maxDuration = Math.max(...noteDurations)
      const runs: ExtraBarRun[] = []

      for (let level = sharedBeams + 1; level <= maxDuration; level++) {
        let runStart: number | null = null

        for (let i = 0; i <= noteDurations.length; i++) {
          const inRun = i < noteDurations.length && noteDurations[i] >= level

          if (inRun && runStart === null) {
            runStart = i
          } else if (!inRun && runStart !== null) {
            const runEnd = i - 1
            const startEl = noteColumns[runStart]?.querySelector('.note-digit-row')
            const endEl   = noteColumns[runEnd]?.querySelector('.note-digit-row')

            if (startEl && endEl) {
              const sRect = startEl.getBoundingClientRect()
              const eRect = endEl.getBoundingClientRect()
              runs.push({
                level,
                top:   baseTop + (level - sharedBeams - 1) * BAR_STEP_PX + BAR_GAP_PX,
                left:  sRect.left - groupRect.left,
                width: eRect.right - sRect.left,
              })
            }
            runStart = null
          }
        }
      }

      setExtraRuns(runs)
    }

    updatePosition()
    const ro = new ResizeObserver(updatePosition)
    ro.observe(groupRef.current)
    window.addEventListener('resize', updatePosition)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updatePosition)
    }
  }, [isGroup, sharedBeams, noteDurations])

  if (!isGroup) {
    return <div style={{ position: 'relative' }}>{children}</div>
  }

  return (
    <div ref={groupRef} className="beam-group" style={{ position: 'relative' }}>
      {primaryTop !== null && (
        <div className="beam-bars" style={{ top: `${primaryTop}px` }}>
          {Array.from({ length: sharedBeams }).map((_, bi) => (
            <div key={bi} className="beam-bar" />
          ))}
        </div>
      )}

      {extraRuns.map((run, i) => (
        <div
          key={i}
          className="beam-bar"
          style={{
            position: 'absolute',
            top:   `${run.top}px`,
            left:  `${run.left}px`,
            width: `${run.width}px`,
          }}
        />
      ))}

      <div className="beam-notes" ref={notesRef}>
        {children}
      </div>
    </div>
  )
}