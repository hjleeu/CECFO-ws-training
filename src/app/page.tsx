"use client"

import Link from "next/link";
import "@/styles/homepage.css";
import "@/styles/worship-sets.css";
import { FavoriteSongs } from "@/components/sheet/FavoriteSongs";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface WorshipSet {
  id: string;
  name: string;
  date: string;
  songs: {
    id: string;
    order: number;
    song: {
      slug: string;
      title: string;
    };
  }[];
}

export default function HomePage() {
  const { t } = useLanguage()
  const [songs, setSongs] = useState<any[]>([])
  const [worshipSets, setWorshipSets] = useState<WorshipSet[]>([])
  const [showArchive, setShowArchive] = useState(false)

  useEffect(() => {
    fetch("/api/songs")
      .then(r => r.json())
      .then(setSongs)

    fetch("/api/worship-sets")
      .then(r => r.json())
      .then(setWorshipSets)
  }, [])

  const todayStr = new Date().toLocaleDateString('en-CA')
  const isPast = (set: WorshipSet) => set.date.slice(0, 10) < todayStr

  const byDateThenName = (dir: 1 | -1) => (a: WorshipSet, b: WorshipSet) =>
    dir * a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)) || a.name.localeCompare(b.name)

  const activeSets = worshipSets.filter(set => !isPast(set)).sort(byDateThenName(1))
  const archivedSets = worshipSets.filter(isPast).sort(byDateThenName(-1))
  const archivedCount = archivedSets.length
  const visibleSets = showArchive ? [...activeSets, ...archivedSets] : activeSets


  return (
    <main className="homepage">
      <section className="home-section">
        <FavoriteSongs songs={songs} />
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">{t.home.worshipSets}</h2>
          <Link href="/worship">
            {t.home.all} →
          </Link>
        </div>

        {archivedCount > 0 && (
          <button className="archive-toggle" onClick={() => setShowArchive(prev => !prev)}>
            {showArchive ? '隐藏已过期歌单' : `显示已过期歌单 (${archivedCount})`}
          </button>
        )}

        <div className="sets-list">
          {visibleSets.map((worshipSet) => (
            <Link
              key={worshipSet.id}
              href={`/worship/${worshipSet.id}`}
              className={`set-card${isPast(worshipSet) ? ' archived' : ''}`}
            >
              <div className="set-card-header">
                <span>🎶 {worshipSet.name}</span>
                <span className="set-date">
                  {new Date(worshipSet.date).toLocaleDateString()}
                </span>
              </div>

              <div className="set-songs">
                {worshipSet.songs.map((item) => item.song.title).join(" · ")}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}