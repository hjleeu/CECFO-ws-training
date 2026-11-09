"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import "@/styles/player.css"
import { SongPlayer, type PlayerSong } from "@/components/ui/SongPlayer"
import { usePlayerQueue } from "@/hooks/usePlayerQueue"
import { useLanguage } from "@/lib/i18n/LanguageProvider"

export default function PlayerPage() {
    const { t } = useLanguage()
    const { queue, remove, clear } = usePlayerQueue()
    const [catalog, setCatalog] = useState<PlayerSong[]>([])
    const [index, setIndex] = useState(0)
    const [autoPlay, setAutoPlay] = useState(false)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        fetch("/api/songs")
            .then((res) => res.json())
            .then((all: PlayerSong[]) => setCatalog(all))
            .catch(() => setCatalog([]))
            .finally(() => setLoaded(true))
    }, [])

    // queue order wins; slugs of deleted songs or songs without audio are skipped
    const songs = useMemo(() => {
        const bySlug = new Map(catalog.map((s) => [s.slug, s]))
        return queue
            .map((slug) => bySlug.get(slug))
            .filter((s): s is PlayerSong => Boolean(s && s.audioUrl))
    }, [catalog, queue])

    const current = Math.min(index, Math.max(songs.length - 1, 0))
    const song = songs[current]

    const pick = (i: number) => {
        setIndex(i)
        setAutoPlay(true)
    }

    const removeAt = (i: number) => {
        remove(songs[i].slug)
        if (i < current) setIndex(current - 1)
    }

    return (
        <main className="player-page">
            <h1>{t.player.title}</h1>
            {song ? (
                <div className="player-layout">
                    <SongPlayer
                        key={song.slug}
                        song={song}
                        autoPlay={autoPlay}
                        hasPrev={current > 0}
                        hasNext={current < songs.length - 1}
                        onPrev={() => pick(current - 1)}
                        onNext={() => pick(current + 1)}
                    />
                    <div className="player-queue-wrap">
                        <div className="player-queue-head">
                            <h2>{t.player.queue}</h2>
                            <button type="button" className="player-queue-clear" onClick={clear}>
                                {t.player.clear}
                            </button>
                        </div>
                        <ul className="player-queue">
                            {songs.map((s, i) => (
                                <li key={s.slug} className="player-queue-row">
                                    <button
                                        type="button"
                                        className={i === current ? "player-queue-item active" : "player-queue-item"}
                                        onClick={() => pick(i)}
                                    >
                                        <span className="player-queue-title">{s.title}</span>
                                        <span className="player-queue-artist">{s.artist}</span>
                                        {s.lrcUrl ? <span className="player-queue-tag">{t.player.withLyrics}</span> : null}
                                    </button>
                                    <button
                                        type="button"
                                        className="player-queue-remove"
                                        aria-label={t.player.removeFromQueue}
                                        onClick={() => removeAt(i)}
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <p className="lyrics-empty">{loaded ? t.player.emptyQueue : ''}</p>
            )}
        </main>
    )
}