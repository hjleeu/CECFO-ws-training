export const TOLERANCE_CENTS = 50
const VOICE_MIN_HZ = 70
const VOICE_MAX_HZ = 800

export function detectPitch(buf: Float32Array, sampleRate: number): { hz: number, clarity: number } {
    const minLag = Math.floor(sampleRate / VOICE_MAX_HZ)
    const maxLag = Math.min(Math.floor(sampleRate / VOICE_MIN_HZ), (buf.length >> 1) - 1)
    const w = buf.length - maxLag - 1

    let rms = 0
    for (let i = 0; i < buf.length; i++) { rms += buf[i] * buf[i] }
    rms = Math.sqrt(rms / buf.length)

    let result = { hz: 0, clarity: 0 }
    if (rms > 0.006) {
        const nsdf = new Float32Array(maxLag + 2)
        for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
            let c = 0
            let e = 0
            for (let i = 0; i < w; i++) {
                c += buf[i] * buf[i + lag]
                e += buf[i] * buf[i] + buf[i + lag] * buf[i + lag]
            }
            nsdf[lag] = e > 1e-9 ? (2 * c) / e : 0
        }

        const peaks: number[] = []
        for (let lag = minLag; lag <= maxLag; lag++) {
            if (nsdf[lag] > 0 && nsdf[lag] > nsdf[lag - 1] && nsdf[lag] >= nsdf[lag + 1]) { peaks.push(lag) }
        }
        const max = peaks.reduce((m, l) => Math.max(m, nsdf[l]), 0)
        const lag = peaks.find(l => nsdf[l] >= 0.9 * max)

        if (lag !== undefined) {
            const a = nsdf[lag - 1]
            const b = nsdf[lag]
            const c = nsdf[lag + 1]
            const denom = a - 2 * b + c
            const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0
            result = { hz: sampleRate / (lag + shift), clarity: b }
        }
    }
    return result
}

export function centsOff(hz: number, midi: number): number {
    const c = 1200 * Math.log2(hz / (440 * 2 ** ((midi - 69) / 12)))
    return ((((c % 1200) + 1200) % 1200) + 600) % 1200 - 600
}

export function median(xs: number[]): number {
    const s = [...xs].sort((a, b) => a - b)
    return s.length > 0 ? (s[s.length >> 1] + s[(s.length - 1) >> 1]) / 2 : 0
}

export async function openMic(ctx: AudioContext) {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    })
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(analyser)
    return { stream, analyser }
}

export async function speakerLeaks(ctx: AudioContext, analyser: AnalyserNode): Promise<boolean> {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 440
    gain.gain.value = 0.2
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    const buf = new Float32Array(analyser.fftSize)
    let hits = 0
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 50))
        analyser.getFloatTimeDomainData(buf)
        const p = detectPitch(buf, ctx.sampleRate)
        if (p.clarity > 0.9 && Math.abs(centsOff(p.hz, 69)) < 60) { hits++ }
    }
    if (ctx.state !== "closed") { osc.stop() }
    return hits >= 4
}