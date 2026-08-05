'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  defaultBpm?:     number
  timeSignature?:  number
}

export function Metronome({ defaultBpm = 120, timeSignature = 4 }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(defaultBpm)

  const audioCtxRef      = useRef<AudioContext | null>(null)
  const nextClickTimeRef = useRef(0)
  const timerIdRef       = useRef<number | null>(null)
  const beatCountRef     = useRef(0)
  const bpmRef           = useRef(bpm)   // ← always holds latest bpm

  // keep bpmRef in sync without retriggering the audio effect
  useEffect(() => {
    bpmRef.current = bpm
  }, [bpm])

  const playClick = useCallback((isFirstBeat: boolean) => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current

    const osc      = ctx.createOscillator()
    const envelope = ctx.createGain()

    osc.frequency.setValueAtTime(isFirstBeat ? 1200 : 800, ctx.currentTime)
    envelope.gain.setValueAtTime(isFirstBeat ? 1.5 : 1, ctx.currentTime)
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
      const isFirstBeat = (beatCountRef.current % timeSignature) === 0
      playClick(isFirstBeat)

      beatCountRef.current = (beatCountRef.current + 1) % timeSignature

      const secondsPerBeat = 60.0 / bpmRef.current   // ← read from ref, always current
      nextClickTimeRef.current += secondsPerBeat
    }
    timerIdRef.current = window.setTimeout(scheduler, 25)
  }, [playClick, timeSignature])

  // this effect ONLY runs on isPlaying/timeSignature change — never on bpm
  useEffect(() => {
    if (isPlaying) {
      beatCountRef.current = 0
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      audioCtxRef.current = ctx

      playClick(true)
      beatCountRef.current = (beatCountRef.current + 1) % timeSignature

      const secondsPerBeat = 60.0 / bpmRef.current
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
  }, [isPlaying, scheduler, playClick, timeSignature])   // ← bpm removed from deps

  return (
    <div className="metronome-container">
      <span className="metronome-title">🎵 节拍器 (Metronome)</span>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`metronome-btn ${isPlaying ? 'stop' : 'play'}`}
      >
        {isPlaying ? '停止 (Stop)' : '播放 (Play)'}
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