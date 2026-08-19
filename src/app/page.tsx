"use client"

import Link from "next/link";
import { SongCard } from "@/components/sheet/SongCard";
import "@/styles/homepage.css";
import { FavoriteSongs } from "@/components/sheet/FavoriteSongs";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";


export default function HomePage() {
  const { t } = useLanguage()
  const [songs, setSongs] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/songs")
      .then(r => r.json())
      .then(setSongs)
  }, [])

  const updatedSongs = [...songs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 7)

  return (
    <main className="homepage">
      <section className="home-section">
        <FavoriteSongs songs={songs} />
      </section>
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">✨ {t.song.latest}</h2>
          <Link href="/songs" className="home-section-link">
            {t.song.all} →
          </Link>
        </div>

        <div className="home-song-grid">
          {updatedSongs.map(song => (
            <SongCard key={song.slug} song={song} compact />
          ))}
        </div>
      </section>

    </main>
  );
}