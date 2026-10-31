"use client"

import { Pause, Play, StepBack } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import "@/styles/audio-player.css"

interface Props {
    src: string
}

const SKIP_BACK_SECS = 5

function formatTime(secs: number) {
    const total = Number.isFinite(secs) ? Math.floor(secs) : 0
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function AudioPlayer({ src }: Props) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [current, setCurrent] = useState(0)
    const [duration, setDuration] = useState(0)

    useEffect(() => {
        setPlaying(false)
        setCurrent(0)
        setDuration(0)
    }, [src])

    const toggle = () => {
        const audio = audioRef.current
        if (audio) {
            audio.paused ? audio.play().catch(() => setPlaying(false)) : audio.pause()
        }
    }

    const seek = (time: number) => {
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = time
            setCurrent(time)
        }
    }

    const progress = duration > 0 ? (current / duration) * 100 : 0

    return (
        <div className="audio-player" onContextMenu={e => e.preventDefault()}>
            <audio
                src={src}
                ref={audioRef}
                preload="metadata"
                onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
                onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
                onDurationChange={e => setDuration(e.currentTarget.duration)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
            ></audio>

            <button
                type="button"
                className="audio-player-play"
                onClick={toggle}
            >
                {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
                type="button"
                className="audio-player-skip"
                onClick={() => seek(Math.max(0, current - SKIP_BACK_SECS))}
            >
                <StepBack size={15} />
            </button>

            <span className="audio-player-time">{formatTime(current)}</span>

            <input
                type="range"
                className="audio-player-seek"
                min={0}
                max={duration || 0}
                step={0.1}
                value={current}
                onChange={e => seek(Number(e.target.value))}
                style={{ ["--progress" as string]: `${progress}%` }}
            />

            <span className="audio-player-time">{formatTime(duration)}</span>
        </div>
    )
}