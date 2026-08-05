'use client'

import { computeBeamGroups, parseJianpu } from '@/lib/jianpu'
import type { Measure as MeasureProps, ShowOptions } from '../../types/MusicNotation'
import { Note } from './Note'

interface Props {
  measure: MeasureProps
  measureIndex: number
  showOptions: ShowOptions
  registerNoteRef: (measureIndex: number, noteIndex: number, el: HTMLDivElement | null) => void
}

export function Measure({ measure, measureIndex, showOptions, registerNoteRef }: Props) {
  const parsedNote = measure.notes.map(n => {
    const parsed = parseJianpu(n.note)
    return { ...parsed, dotted: n.dotted || parsed.dotted }
  })

  const beamGroups = computeBeamGroups(parsedNote)
  const beamMap    = new Map<number, { shared: number, extra: number }>()

  for (const group of beamGroups) {
    for (let i = group.start; i <= group.end; i++) {
      const noteDuration = parsedNote[i].duration
      beamMap.set(i, {
        shared: group.start === group.end ? 0 : group.sharedBeams,
        extra: group.start === group.end ? noteDuration : noteDuration - group.sharedBeams,
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

  return (
    <div className="measure">
      <div className="measure-notes" style={{ position: 'relative' }}>
        {finalSegments.map((seg, si) => {
          const isGroup = seg.notes.length > 1 && seg.sharedBeams > 0
          return (
            <div key={si} className={isGroup ? 'beam-group' : ''} style={{ position: 'relative' }}>
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
                    <div
                      key={k}
                      className="note-column"
                      ref={(el: HTMLDivElement | null) => registerNoteRef(measureIndex, ni, el)}
                    >
                      <span className="chord">
                        {showOptions.chords && measure.notes[ni].chord ? measure.notes[ni].chord : ''}
                      </span>
                      <Note note={measure.notes[ni]} showOptions={showOptions} extraBeams={extra} />
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