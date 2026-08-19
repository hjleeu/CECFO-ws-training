"use client"

import { SongCard } from "@/components/sheet/SongCard"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { useEffect, useState } from "react"

export default function SongsPage() {
  const { t } = useLanguage()

  const [songs, setSongs] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/songs")
      .then(r => r.json())
      .then(setSongs)
  }, [])

  return (
    <main className="songs-page">
      <h1 className="songs-title">{t.song.library}</h1>

      <div className="songs-grid">
        {songs.map(song => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </main>
  )
}