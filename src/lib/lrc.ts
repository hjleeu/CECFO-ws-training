export interface LrcLine {
    time: number // seconds
    text: string
}

const TIME_TAG = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g
const OFFSET_TAG = /^\[offset:\s*(-?\d+)\s*\]/im

// [mm:ss.xx]text, several tags per line allowed, [ti:]/[ar:] metadata ignored,
// [offset:ms] applied (positive = lyrics appear earlier, as in the LRC spec).
// Empty-text lines are dropped, so the previous line stays active through gaps.
export function parseLrc(raw: string): LrcLine[] {
    const source = raw.replace(/^\uFEFF/, "")
    const offsetMatch = OFFSET_TAG.exec(source)
    const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0
    const lines: LrcLine[] = []

    source.split(/\r?\n/).forEach((row) => {
        const text = row.replace(TIME_TAG, "").trim()
        Array.from(row.matchAll(TIME_TAG)).forEach((m) => {
            const fraction = m[3] ? Number(m[3]) / 10 ** m[3].length : 0
            const time = Number(m[1]) * 60 + Number(m[2]) + fraction - offset
            lines.push({ time: Math.max(0, time), text })
        })
    })

    return lines.filter((l) => l.text !== "").sort((a, b) => a.time - b.time)
}

// Index of the last line whose time <= `time`, or -1 before the first line.
export function activeLineIndex(lines: LrcLine[], time: number): number {
    let low = 0
    let high = lines.length - 1
    let found = -1
    while (low <= high) {
        const mid = (low + high) >> 1
        if (lines[mid].time <= time) {
            found = mid
            low = mid + 1
        } else {
            high = mid - 1
        }
    }
    return found
}