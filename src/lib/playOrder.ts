/**
 * @fileoverview Turn a song into a list of measures in play order. Measures can be repeated.
 */

import { NavigationMark, Song } from "@/types/MusicNotation"

const SIGN_OFFSET = 1
const DEFAULT_PASSES = 2

interface Volta {
    number: number
    start: number
    end: number
    last: number
}

const JUMPS: Partial<Record<NavigationMark, { to: "segno" | "start"; kind: "plain" | "fine" | "coda" }>> = {
    ds: { to: "segno", kind: "plain" },
    dsFine: { to: "segno", kind: "fine" },
    dsCoda: { to: "segno", kind: "coda" },
    dc: { to: "start", kind: "plain" },
    dcFine: { to: "start", kind: "fine" },
    dcCoda: { to: "start", kind: "coda" }
}

function buildVoltas(song: Song): Volta[] {
    const raw = song.brackets
        .filter(b => b.kind === "ending" && b.number !== undefined)
        .map(b => ({ number: b.number as number, start: b.startMeasure, end: b.endMeasure }))
        .sort((a, b) => a.start - b.start)

    const out: Volta[] = []
    let chain: typeof raw = []
    const flush = () => {
        const last = Math.max(...chain.map(v => v.number))
        chain.forEach(v => out.push({ ...v, last }))
        chain = []
    }
    raw.forEach(v => {
        if (chain.length > 0 && v.start !== chain[chain.length - 1].end + 1) {
            flush()
        }
        chain.push(v)
    })
    if (chain.length > 0) { flush() }

    return out
}

export function playOrder(song: Song): number[] {
    const ms = song.measures
    const n = ms.length
    const voltas = buildVoltas(song)
    const order: number[] = []
    const limit = n * 8 + 32

    const sectionStart = (i: number) => {
        let j = 1
        while (j > 0 && !ms[j].sectionLabel) { j-- }
        return j
    }
    const signTarget = (mark: NavigationMark, fallback: number) => {
        const idx = ms.findIndex(m => m.navigationMark?.includes(mark))
        return idx >= 0 ? Math.min(idx +  SIGN_OFFSET, n - 1) : fallback
    }

    let i = 0
    let pass = -1
    let repeatStart = -1
    let jumped = false
    let jumpKind = ''
    let justJumped = false
    const usedChorusJump = new Set<number>()

    while (i < n && order.length < limit) {
        const m = ms[i]
        if (m.barline === "repeatStart" && !justJumped) {
            repeatStart = i + 1
            pass = 1
        }

        justJumped = false

        const v = voltas.find(x => i >= x.start && i <= x.end)
        if (v && v.number !== (jumped ? v.last : pass)) {
            i = v.end + 1
            continue
        }
        order.push(i)

        const marks = m.navigationMark ?? []

        if (m.barline === "repeatEnd" && !jumped) {
            const blockStart = repeatStart >= 0 ? repeatStart : sectionStart(i)
            const chain = voltas.find(x => x.start >= blockStart && x.start <= i + 1)
            const passes = chain ? Math.max(DEFAULT_PASSES, chain.last) : DEFAULT_PASSES
            if (pass < passes) {
                pass++
                i = blockStart
                justJumped = true
                continue
            }
        }
        if (m.barline === "repeatEnd"  || (v && v.end === i && v.number === v.last)) {
            pass = 1
            repeatStart = -1
        }
        const jump = marks.map(k => JUMPS[k]).find(j => j !== undefined)
        if (!jumped && jump) {
            jumped = true
            jumpKind = jump.kind
            i = jump.to === "segno" ? signTarget("segno", 0) : 0
            justJumped = true
            continue
        }

        if (jumped && jumpKind === "fine" && marks.includes("fine")) { break }
        if (jumped && jumpKind === "coda" && marks.includes("toCoda")) {
            const coda = signTarget("coda", -1)
            if (coda >= 0) {
                i = coda
                justJumped = true
                continue
            }
        }
        if (marks.includes("toChorus") && !usedChorusJump.has(i)) {
            const chorus = ms.findIndex(x => x.sectionLabel && /chorus/i.test(x.sectionLabel))
            if (chorus >= 0 && chorus !== i + 1) {
                usedChorusJump.add(i)
                i = chorus
                justJumped = true
                continue
            }
        }
        i++
    }
    return order
}