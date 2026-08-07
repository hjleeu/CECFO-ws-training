export const BAR_HEIGHT_PX = 1.52
export const BAR_GAP_PX    = 3.7
export const BAR_STEP_PX   = BAR_HEIGHT_PX + BAR_GAP_PX

export interface BeamGroup {
  start: number
  end: number
  sharedBeams: number
}

export interface BeamGroup {
  start: number
  end: number
  sharedBeams: number
}

export function computeBeamGroups(notes: { duration: number; dotted?: boolean }[]): BeamGroup[] {
  const groups: BeamGroup[] = []
  let i = 0
  let globalBeat = 0 // Track our exact position in the measure

  while (i < notes.length) {
    const { duration: slashes, dotted } = notes[i]

    // Calculate actual musical beat value (quarter = 1.0, eighth = 0.5, 16th = 0.25)
    let beatValue = slashes === 1 ? 0.5 : slashes >= 2 ? 0.25 : 1.0
    if (dotted) beatValue *= 1.5

    // If it has 0 beams (quarter note or longer), it stands alone
    if (slashes === 0) {
      groups.push({ start: i, end: i, sharedBeams: 0 })
      globalBeat += beatValue
      i++
      continue
    }

    const start = i
    // Find the next whole beat boundary. 
    // Example: If globalBeat is 1.5, the next boundary is 2.0.
    // (+ 0.001 guards against JavaScript floating point math errors like 1.99999)
    const nextBoundary = Math.floor(globalBeat + 0.001) + 1.0

    while (i < notes.length && notes[i].duration > 0) {
      const { duration: dur, dotted: dot } = notes[i]
      
      let val = dur === 1 ? 0.5 : dur >= 2 ? 0.25 : 1.0
      if (dot) val *= 1.5

      globalBeat += val
      i++

      // If adding this note completes the current integer beat, break the group!
      if (globalBeat >= nextBoundary - 0.001) {
        break
      }
    }

    const end = i - 1

    if (start === end) {
      groups.push({ start, end, sharedBeams: 0 })
    } else {
      const slice = notes.slice(start, end + 1).map(n => n.duration)
      const min = Math.min(...slice)
      groups.push({ start, end, sharedBeams: Math.min(min, 1) })
    }
  }

  return groups
}

export function parseJianpu(raw: string) {
  if (raw === '-') return { accidental: '', base: '-', octave: '', dotted: false, duration: 0, fermata: false }

  const match = raw.match(/^([#b=]?)([0-7]?)([',]*)(\.?)(\/{0,2})(\^?)$/)
  if (!match) return { accidental: '', base: raw, octave: '', dotted: false, duration: 0, fermata: false }

  return {
    accidental: match[1],
    base: match[2],
    octave: match[3],
    dotted: match[4] === '.',
    duration: match[5].length,
    fermata: match[6] === '^'
  }
}