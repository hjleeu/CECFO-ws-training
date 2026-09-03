"use client"

import { SongCard } from "@/components/sheet/SongCard"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { useEffect, useMemo, useState } from "react"
import "@/styles/songs.css"

export default function SongsPage() {
  const { t } = useLanguage()
  const [songs, setSongs] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/songs")
      .then(r => r.json())
      .then(setSongs)
  }, [])

  const groupedSongs = useMemo(() => {
    const artists: Record<string, Record<string, any[]>> = {}

    for (const song of songs) {
      const artist = song.artist?.trim() || "Unknown Artist"
      const album = song.album?.trim() || "Singles"

      if (!artists[artist]) {
        artists[artist] = {}
      }

      if (!artists[artist][album]) {
        artists[artist][album] = []
      }

      artists[artist][album].push(song)
    }

    return Object.entries(artists)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([artist, albums]) => ({
        artist,
        albums: Object.entries(albums)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([album, songs]) => ({
            album,
            songs: songs.sort((a, b) =>
              a.title.localeCompare(b.title)
            ),
          })),
      }))
  }, [songs])

  return (
    <main className="songs-page">
      <h1 className="songs-title">
        {t.song.library}
      </h1>

      <div className="artists-list">
        {groupedSongs.map(({ artist, albums }) => (
          <section
            key={artist}
            className="artist-section"
          >
            <h2 className="artist-title">
              {artist}
            </h2>

            <div className="artist-albums">
              {albums.map(({ album, songs }) => (
                <div
                  key={album}
                  className="album-section"
                >
                  <h3 className="album-title">
                    {album}
                  </h3>

                  <div className="album-songs">
                    {songs.map(song => (
                      <SongCard
                        key={song.id}
                        song={song}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}