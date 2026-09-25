"use client"

import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"

interface Props {
  defaultBpm?: number
  timeSignature?: string
}

interface TimeSigInfo {
  clicksPerMeasure: number
  groupSize: number
  isCompound: boolean
}

function parseTimeSignature(ts: string): TimeSigInfo {
  const [numStr, denStr] = ts.split('/')
  const numerator   = parseInt(numStr, 10) || 4
  const denominator = parseInt(denStr, 10) || 4

  const isCompound = denominator === 8 && numerator > 3 && numerator % 3 === 0

  return {
    clicksPerMeasure: numerator,
    groupSize: isCompound ? 3 : 1,
    isCompound,
  }
}

type Accent = "Forte" | "Mezzoforte" | "Debole"

function accentForClick(clickIndex: number, groupSize: number): Accent {
  if (groupSize === 1) {
    return clickIndex === 0 ? "Forte" : "Debole"
  }
  const positionInGroup = clickIndex % groupSize
  if (positionInGroup !== 0) { return "Debole" }

  const groupIndex = clickIndex / groupSize
  return groupIndex === 0 ? "Forte" : "Mezzoforte"
}

export function Metronome({ defaultBpm = 73, timeSignature = "4/4" }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(defaultBpm)

  const { clicksPerMeasure, groupSize } = useMemo(() => parseTimeSignature(timeSignature), [timeSignature])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextClickTimeRef = useRef(0)
  const timerIdRef = useRef<number | null>(null)
  const beatCountRef = useRef(0)
  const bpmRef = useRef(bpm)

  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close()
    }
  }, [])

  const playClick = useCallback((accent: Accent) => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current

    const tone = accent === "Forte"
      ? { freq: 1500, gain: 1.52 }
      : accent === "Mezzoforte"
        ? { freq: 1200, gain: 1.37 }
        : { freq: 800, gain: 0.99 }

    const osc = ctx.createOscillator()
    const envelope = ctx.createGain()

    osc.frequency.setValueAtTime(tone.freq, ctx.currentTime)
    envelope.gain.setValueAtTime(tone.gain, ctx.currentTime)
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc.connect(envelope)
    envelope.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.05)
  }, [])

  const scheduler = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current

    while (nextClickTimeRef.current < ctx.currentTime + 0.1) {
      playClick(accentForClick(beatCountRef.current, groupSize))

      beatCountRef.current = (beatCountRef.current + 1) % clicksPerMeasure

      const secondsPerBeat = 60.0 / bpmRef.current / groupSize
      nextClickTimeRef.current += secondsPerBeat
    }
    timerIdRef.current = window.setTimeout(scheduler, 25)
  }, [playClick, clicksPerMeasure, groupSize])

  useEffect(() => {
    if (isPlaying) {
      beatCountRef.current = 0
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      audioCtxRef.current = ctx

      playClick("Forte")
      beatCountRef.current = (beatCountRef.current + 1) % clicksPerMeasure

      const secondsPerBeat = 60.0 / bpmRef.current / groupSize
      nextClickTimeRef.current = ctx.currentTime + secondsPerBeat

      scheduler()
    } else {
      if (timerIdRef.current) clearTimeout(timerIdRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current)
    }
  }, [isPlaying, scheduler, playClick, clicksPerMeasure, groupSize])

  const { t } = useLanguage()

  return (
    <div className="metronome-container">
      <span className="metronome-title">🎵 {t.metronome.metronome}</span>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`metronome-btn ${isPlaying ? "stop" : "play"}`}
      >
        {isPlaying ? t.metronome.stop : t.metronome.play}
      </button>

      <div className="metronome-tempo">
        <label htmlFor="bpm-slider">BPM:</label>
        <input
          id="bpm-slider"
          type="range"
          min="40"
          max="200"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
        <span className="metronome-bpm-value">{bpm}</span>
      </div>
    </div>
  )
}