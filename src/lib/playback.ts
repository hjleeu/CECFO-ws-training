import { Note, Song } from "@/types/MusicNotation"
import { beatLength, parseJianpu, tupletScale } from "./jianpu"
import { PITCH_MAP } from "./key_transpose"
import { playOrder } from "./playOrder"

const DEGREE_SEMITONES = [
    0, // 0
    0, // C
    2, // D
    4, // E
    5, // F
    7, // G
    9, // A
    11, // B
]

export interface PlaySound {
    start: number
    dur: number
    midis: number[]
    measure: number
    note: number
}

export interface PlayCue {
    start: number
    dur: number
    measure: number
    note: number
}

export interface PlayPlan {
    sounds: PlaySound[]
    cues: PlayCue[]
    total: number
    secPerUnit: number
}

function tonicMidi(key: string): number {
    const root = (key ?? '').match(/^[A-G][#b]?/)?.[0] ?? 'C'
    const pc = PITCH_MAP[root] ?? 0
    return pc <= 6 ? 60 + pc : 48 + pc
}

function pitchToMidi(raw: string, tonic: number): number[] {
    const { accidental, base, octave } = parseJianpu(raw)
    const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
    const octaves = octave.split("'").length - octave.split(",").length
    return /^[1-7]$/.test(base) ? [tonic + DEGREE_SEMITONES[Number(base)] + shift + 12 * octaves] : []
}

function midisOf(n: Note, tonic: number): number[] {
    return [...pitchToMidi(n.note, tonic), ...(n.upper ? pitchToMidi(n.upper, tonic) : [])]
}

export function buildPlayback(song: Song, semitones = 0): PlayPlan {
    const tonic = tonicMidi(song.key) + semitones
    const flat = playOrder(song).flatMap(mi => song.measures[mi].notes.map((n, ni) => ({ mi, ni, n })))
    const ties = song.brackets.filter(b => b.kind !== "ending" && b.number !== undefined)

    const indexOf = new Map(flat.map((f, i) => [`${f.mi}-${f.ni}`, i]))

    const tieStart = new Map<number, number>()
    flat.forEach((f, i) => {
        ties.filter(b => b.startMeasure === f.mi && b.startNote === f.ni).forEach(b => {
            let j = i + 1
            while (j < flat.length && flat[j].n.note === '-') { j++ }
            const a = midisOf(f.n, tonic)
            const same = j < flat.length && flat[j].mi === b.endMeasure && flat[j].ni === b.endNote
                && a.length > 0 && a.join() === midisOf(flat[j].n, tonic).join()
            if (same) { tieStart.set(j, i) }
        })
    })
    const sounds: PlaySound[] = []
    const cues: PlayCue[] = []
    const owner = new Map<number, PlaySound>()
    let last: PlaySound | undefined
    let t = 0

    flat.forEach(({ mi, ni, n}, i) => {
        if (n.note !== '\\') {
            const p = parseJianpu(n.note)
            let v = p.duration === 1 ? 0.5 : p.duration >= 2 ? 0.25 : 1

            if (n.dotted || p.dotted) { v *= 1.5 }
            v *= tupletScale(song.brackets, mi, ni)

            const tied = tieStart.get(i)
            const host = n.note === '-' ? last : tied !== undefined ? owner.get(tied) : undefined
            const sound = host ?? { start: t, dur: 0, midis: midisOf(n, tonic), measure: mi, note: ni }
            if (!host) { sounds.push(sound) }
            sound.dur += v
            owner.set(i, sound)
            last = sound

            cues.push({ start: t, dur: v, measure: mi, note: ni })
            t += v
        }
    })

    return { sounds, cues, total: t, secPerUnit: 60 / (song.bpm || 73) / beatLength(song.timeSignature || "4/4") }
}

export function scheduleSound(ctx: AudioContext, s: PlaySound, t0: number, secPerUnit: number) {
    const t = t0 + s.start * secPerUnit
    const end = t + s.dur * secPerUnit
    const level = 0.3 / s.midis.length

    s.midis.forEach(m => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.value = 440 * 2 ** ((m - 69) / 12)

        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(level, t + 0.02)
        gain.gain.linearRampToValueAtTime(level * 0.5, Math.max(t + 0.02, end - 0.08))
        gain.gain.linearRampToValueAtTime(0, end)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(end + 0.02)
    })
}

export function countIn(song: Song, secPerUnit: number) {
    const ts = song.timeSignature || "4/4"
    const beat = beatLength(ts)
    const num = parseInt(ts, 10) || 4
    return { clicks: beat === 1.5 ? num / 3 : num, beatSecs: secPerUnit * beat }
}

export function scheduleClick(ctx: AudioContext, time: number, accent: boolean) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.value = accent ? 1500 : 1000
    gain.gain.setValueAtTime(0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.06)
}

export function buildClicks(plan: PlayPlan, song: Song): { time: number; accent: boolean }[] {
    const beat = beatLength(song.timeSignature || "4/4")
    const firstCue = new Map<number, number>()
    plan.cues.forEach(c => { if (!firstCue.has(c.measure)) { firstCue.set(c.measure, c.start) } })
    const starts = [...firstCue.values()]

    return starts.flatMap((s, i) => {
        const end = i + 1 < starts.length ? starts[i + 1] : plan.total
        const n = Math.ceil((end - s) / beat - 0.001)
        return Array.from({ length: n }, (_, k) => ({ time: s + k * beat, accent: k === 0 }))
    })
}