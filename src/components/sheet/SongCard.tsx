"use client";

import Link from "next/link"
import "@/styles/songs.css"
import { useFavorites } from "@/hooks/useFavourite";
import { Heart, HeartOff } from "lucide-react";

interface Props {
  song: {
    slug: string
    title: string
    artist: string | null
    album: string | null
    key: string
    bpm: number
    timeSignature: string
  }
  compact?: boolean // Compact view.
}

export function SongCard({ song, compact = false }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  return (
    <Link
      href={`/songs/${song.slug}`}
      className={`song-card${compact ? " song-card-compact" : ""}`}
    >
      <button
        type="button"
        className="favorite-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(song.slug);
        }}
      >
        <Heart
          size={18}
          fill={isFavorite(song.slug) ? "currentColor" : "none"}
        />
      </button>

      <div className="song-card-header">
        <div className="song-cover-placeholder">♪</div>

        <div className="song-info">
          <h2 className="song-card-title">{song.title}</h2>

          <p className="song-card-subtitle">
            {song.artist}
            {song.album && <> • {song.album}</>}
          </p>
        </div>
      </div>

      <div className="song-card-meta">
        <span>{song.key}</span>
        <span>{song.timeSignature}</span>
        <span>{song.bpm} BPM</span>
      </div>
    </Link>
  )
}