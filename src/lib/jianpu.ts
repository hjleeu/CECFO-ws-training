export interface BeamGroup {
  start: number
  end: number
  sharedBeams: number
}

export function computeBeamGroups(durations: number[]): BeamGroup[] {
  const groups: BeamGroup[] = []
  let i = 0

  while (i < durations.length) {
    if (durations[i] === 0) { i++; continue }

    const start = i
    while (i < durations.length && durations[i] > 0) i++
    const end = i - 1

    if (start === end) {
      groups.push({ start, end, sharedBeams: durations[start] })
    } else {
      const min = Math.min(...durations.slice(start, end + 1))
      groups.push({ start, end, sharedBeams: min })
    }
  }
  return groups
}

export function parseJianpu(raw: string) {
  const match = raw.match(/^([0-7]?)([',]*)(\/{0,2})$/)
  if (!match) return { base: raw, octave: '', duration: 0 }
  return {
    base: match[1],
    octave: match[2],
    duration: match[3].length
  }
}