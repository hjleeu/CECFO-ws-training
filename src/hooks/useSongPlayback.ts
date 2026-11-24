"use client"

import { centsOff, detectPitch, median, openMic, speakerLeaks, TOLERANCE_CENTS } from "@/lib/pitch"
import { buildClicks, buildPlayback, countIn, PlaySound, scheduleClick, scheduleSound } from "@/lib/playback"
import { Song } from "@/types/MusicNotation"
import { RefObject, useCallback, useEffect, useRef, useState } from "react"

const LEAD_IN_SECS = 0.15
const SKIP_SECS = 0.15
const MIN_FRAMES = 3
const MIN_CLARITY = 0.8
const REACTION_SECS = 0.2 // Supposed delay.
const RESULT_CLASSES = ["note-ok", "note-off", "note-silent"]

export interface PracticeScore { ok: number; total: number; silent: number }
export type PracticeError = "mic" | "headphones"

interface NoteWindow {
    s: PlaySound
    from: number
    to: number
    cents: number[]
}

export function useSongPlayback(song: Song, semitones: number, sheetRef: RefObject<HTMLElement | null>, meterRef: RefObject<HTMLElement | null>) {
    const [playing, setPlaying] = useState(false)
    const [practicing, setPracticing] = useState(false)
    const [score, setScore] = useState<PracticeScore | null>(null)
    const [error, setError] = useState<PracticeError | null>(null)

    const songRef = useRef(song)
    const semitonesRef = useRef(semitones)
    useEffect(() => {
        semitonesRef.current = semitones
    }, [semitones])

    const ctxRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const rafRef = useRef<number | null>(null)
    const litRef = useRef<Element | null>(null)
    const rowRef = useRef(-1)
    const runRef = useRef(0)

    useEffect(() => {
        songRef.current = song
    }, [song])

    const stop = useCallback(() => {
        runRef.current++
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current)
        }
        rafRef.current = null
        litRef.current?.classList.remove("note-playing")
        litRef.current = null
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        ctxRef.current?.close()
        ctxRef.current = null
        setPlaying(false)
        setPracticing(false)
    }, [])

    const start = useCallback(async (practice: boolean) => {
        const run = ++runRef.current
        setError(null)
        setScore(null)
        sheetRef.current?.querySelectorAll(".note-ok, .note-off, .note-silent").forEach(el => el.classList.remove(...RESULT_CLASSES))

        const plan = buildPlayback(songRef.current, semitonesRef.current)
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioContextClass()
        ctxRef.current = ctx
        setPlaying(true)
        setPracticing(practice)

        const begin = (analyser: AnalyserNode | null) => {
            const spu = plan.secPerUnit
            const ci = analyser ? countIn(songRef.current, spu) : { clicks: 0, beatSecs: 0 }
            const t0 = ctx.currentTime + LEAD_IN_SECS + ci.clicks * ci.beatSecs
            for (let i = 0; i < ci.clicks; i++) {
                scheduleClick(ctx, t0 - (ci.clicks - i) * ci.beatSecs, i === 0)
            }
            plan.sounds.forEach(s => scheduleSound(ctx, s, t0, spu))

            buildClicks(plan, songRef.current).forEach(c => scheduleClick(ctx, t0 + c.time * spu, c.accent))

            const columns = new Map<string, Element>()
            sheetRef.current?.querySelectorAll("[data-note]").forEach(el => columns.set(el.getAttribute("data-note") ?? '', el))

            const shift = analyser ? (ctx.outputLatency || 0) + REACTION_SECS : 0

            const lyricNote = (s: PlaySound) => songRef.current.measures[s.measure].notes[s.note].lyrics.some(l => l.char)
            const useLyrics = plan.sounds.some(lyricNote)
            const windows: NoteWindow[] = analyser ? plan.sounds.filter(s => s.midis.length > 0 && (!useLyrics || lyricNote(s))).map(s => ({
                s,
                from: s.start * spu + shift + Math.min(SKIP_SECS, 0.4 * s.dur * spu),
                to: (s.start + s.dur) * spu + shift,
                cents: []
            })) : []

            const buf = analyser ? new Float32Array(analyser.fftSize) : null
            const endSec = plan.total * spu + shift + 0.1
            let okCount = 0
            let silentCount = 0
            const judge = (w: NoteWindow) => {
                const verdict = w.cents.length < MIN_FRAMES ? "silent" : Math.abs(median(w.cents)) <= TOLERANCE_CENTS ? "ok" : "off"
                if (verdict === "ok") { okCount++ }
                if (verdict === "silent") { silentCount++ }
                
                const el = columns.get(`${w.s.measure}-${w.s.note}`)
                el?.classList.remove(...RESULT_CLASSES)
                el?.classList.add(`note-${verdict}`)
            }
            let shown = -1
            let wi = 0
            let frame = 0
            rowRef.current = -1

            const tick = () => {
                const sec = ctx.currentTime - t0
                const t = sec / spu

                let next = shown
                while (next + 1 < plan.cues.length && plan.cues[next + 1].start <= t) { next++ }

                if (next !== shown) {
                    shown = next
                    const cue = plan.cues[shown]
                    const el = columns.get(`${cue.measure}-${cue.note}`)
                    if (el) {
                        litRef.current?.classList.remove("note-playing")
                        el.classList.add("note-playing")
                        litRef.current = el

                        const row = (el.closest(".measure-wrapper") as HTMLElement | null)?.offsetTop ?? -1
                        if (row !== rowRef.current) {
                            rowRef.current = row
                            el.scrollIntoView({ block: "center", behavior: "smooth" })
                        }
                    }
                }

                if (analyser && buf) {
                    while (wi < windows.length && sec >= windows[wi].to) {
                        judge(windows[wi])
                        wi++
                    }

                    frame++
                    if (frame % 2 === 0) {
                        analyser.getFloatTimeDomainData(buf)
                        const p = detectPitch(buf, ctx.sampleRate)
                        const w = windows[wi]
                        const active = w !== undefined && p.clarity >= MIN_CLARITY && sec >= w.from && sec < w.to
                        const near = active ? w.s.midis.map(m => centsOff(p.hz, m)).reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a)) : 0
                        if (active) { w.cents.push(near) }

                        const meter = meterRef.current
                        if (meter) {
                            const inTune = Math.abs(near) <= TOLERANCE_CENTS
                            meter.dataset.state = !active ? "idle" : inTune ? "ok" : "off"
                            meter.textContent = !active ? "..." : inTune ? `在调上 ${Math.round(near)}` : `走调 ${near > 0 ? "↑" : "↓"} ${Math.round(near)}`
                        }
                    }
                }

                if (sec < endSec) {
                    rafRef.current = requestAnimationFrame(tick)
                } else {
                    if (analyser) { setScore({ ok: okCount, total: windows.length, silent: silentCount }) }
                    stop()
                }
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        let analyser: AnalyserNode | null = null
        let failed: PracticeError | null = null
        if (practice) {
            try {
                const mic = await openMic(ctx)
                if (runRef.current === run) {
                    streamRef.current = mic.stream
                    analyser = mic.analyser
                    failed = (await speakerLeaks(ctx, mic.analyser)) ? "headphones" : null
                } else {
                    mic.stream.getTracks().forEach(t => t.stop())
                }
            } catch {
                failed = "mic"
            }
        }

        if (runRef.current === run) {
            if (failed) {
                setError(failed)
                stop()
            } else { begin(analyser) }
        }
    }, [sheetRef, meterRef, stop])

    useEffect(() => stop, [song.slug, stop])

    const toggle = useCallback(() => {
        if (playing) {
            stop()
        } else { void start(false) }
    }, [playing, start, stop])

    const togglePractice = useCallback(() => {
        if (playing) {
            stop()
        } else { void start(true) }
    }, [playing, start, stop])

    return { playing, practicing, score, error, toggle, togglePractice }
}