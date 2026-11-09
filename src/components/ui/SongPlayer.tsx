"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, SkipBack, SkipForward } from "lucide-react"
import { LyricsView } from "@/components/ui/LyricsView"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { parseLrc, type LrcLine } from "@/lib/lrc"

export interface PlayerSong {
    slug: string
    title: string
    artist: string | null
    coverUrl: string | null
    audioUrl: string | null
    lrcUrl: string | null
}

interface SongPlayerProps {
    song: PlayerSong
    autoPlay: boolean
    hasPrev: boolean
    hasNext: boolean
    onPrev: () => void
    onNext: () => void
}

// stored media URLs must keep their leading "/"
function withSlash(url: string): string {
    return url.startsWith("/") ? url : `/${url}`
}

function formatTime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

// Render it with key={song.slug}: a new song remounts it, so audio, time and
// lyrics reset without extra effects.
export function SongPlayer({ song, autoPlay, hasPrev, hasNext, onPrev, onNext }: SongPlayerProps) {
    const { t } = useLanguage()
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [time, setTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [lines, setLines] = useState<LrcLine[]>([])
    const safeDuration = Number.isFinite(duration) ? duration : 0

    // lyrics: fetched once per song (the component remounts on song change)
    useEffect(() => {
        let alive = true
        if (song.lrcUrl) {
            fetch(withSlash(song.lrcUrl))
                .then((res) => (res.ok ? res.text() : ""))
                .then((text) => {
                    if (alive) setLines(parseLrc(text))
                })
                .catch(() => { })
        }
        return () => {
            alive = false
        }
    }, [song.lrcUrl])

    // timeupdate fires ~4x/s; while playing, follow the clock every frame so the
    // lyric highlight is not late. Only commit changes > 50ms.
    useEffect(() => {
        let raf = 0
        const tick = () => {
            const now = audioRef.current?.currentTime ?? 0
            setTime((prev) => (Math.abs(prev - now) > 0.05 ? now : prev))
            raf = requestAnimationFrame(tick)
        }
        if (playing) raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [playing])

    // Lock-screen / notification controls (Media Session API). Callbacks go
    // through a ref so the effect only re-runs when the song or the prev/next
    // availability changes, not on every render.
    const nav = useRef({ onPrev, onNext })
    useEffect(() => {
        nav.current = { onPrev, onNext }
    })

    useEffect(() => {
        const session = "mediaSession" in navigator ? navigator.mediaSession : null
        if (session) {
            session.metadata = new MediaMetadata({
                title: song.title,
                artist: song.artist ?? "",
                artwork: song.coverUrl ? [{ src: withSlash(song.coverUrl) }] : [],
            })
            session.setActionHandler("play", () => void audioRef.current?.play())
            session.setActionHandler("pause", () => audioRef.current?.pause())
            session.setActionHandler("previoustrack", hasPrev ? () => nav.current.onPrev() : null)
            session.setActionHandler("nexttrack", hasNext ? () => nav.current.onNext() : null)
            session.setActionHandler("seekto", (d) => {
                if (audioRef.current && d.seekTime != null) audioRef.current.currentTime = d.seekTime
            })
        }
        return () => {
            if (session) {
                session.metadata = null
                    ; (["play", "pause", "previoustrack", "nexttrack", "seekto"] as const).forEach((a) =>
                        session.setActionHandler(a, null)
                    )
            }
        }
    }, [song.slug, song.title, song.artist, song.coverUrl, hasPrev, hasNext])

    const seek = (to: number) => {
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = to
            setTime(to)
        }
    }

    const toggle = () => {
        const audio = audioRef.current
        if (audio) {
            if (audio.paused) {
                audio.play().catch(() => setPlaying(false))
            } else {
                audio.pause()
            }
        }
    }

    const handleEnded = () => {
        setPlaying(false)
        if (hasNext) onNext()
    }

    return (
        <section className="song-player">
            <div className="song-player-head">
                <div className="song-player-cover">
                    {song.coverUrl ? <img src={withSlash(song.coverUrl)} alt="" /> : <span>♪</span>}
                </div>
                <div className="song-player-meta">
                    <h2>{song.title}</h2>
                    <p>{song.artist}</p>
                </div>
            </div>

            <LyricsView lines={lines} time={time} onSeek={seek} />

            <div className="song-player-bar">
                <input
                    type="range"
                    min={0}
                    max={safeDuration}
                    step={0.1}
                    value={Math.min(time, safeDuration)}
                    disabled={safeDuration === 0}
                    aria-label={t.player.seek}
                    onChange={(e) => seek(Number(e.target.value))}
                />
                <div className="song-player-times">
                    <span>{formatTime(time)}</span>
                    <span>{formatTime(safeDuration)}</span>
                </div>
                <div className="song-player-buttons">
                    <button type="button" onClick={onPrev} disabled={!hasPrev} aria-label={t.player.prev}>
                        <SkipBack size={20} />
                    </button>
                    <button
                        type="button"
                        className="song-player-play"
                        onClick={toggle}
                        aria-label={playing ? t.player.pause : t.player.play}
                    >
                        {playing ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button type="button" onClick={onNext} disabled={!hasNext} aria-label={t.player.next}>
                        <SkipForward size={20} />
                    </button>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={withSlash(song.audioUrl ?? '')}
                autoPlay={autoPlay}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={handleEnded}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            />
        </section>
    )
}