"use client"

import { SongCard } from "@/components/sheet/SongCard"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { useEffect, useMemo, useState } from "react"
import "@/styles/songs.css"

const UNKNOWN = "__unknown__"

export default function SongsPage() {
  const { t } = useLanguage()
  const [songs, setSongs] = useState<any[]>([])
  const [query, setQuery] = useState('') /* Filter query. */
  const [artistFilter, setArtistFilter] = useState('')
  const [keyFilter, setKeyFilter] = useState('')
  const [audioOnly, setAudioOnly] = useState(false)

  useEffect(() => {
    fetch("/api/songs")
      .then(r => r.json())
      .then(setSongs)
  }, [])

  const artistOptions = useMemo(() =>
    Array.from(new Set(songs.map(s => s.artist?.trim() || t.song.unknownArtist))).sort((a, b) => a.localeCompare(b)), [songs, t]
  )

  const keyOptions = useMemo(() =>
    Array.from(new Set(songs.map(s => s.key).filter(Boolean))).sort(
      (a, b) => String(a).localeCompare(String(b))
    ), [songs]
  )

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase()

    return songs.filter(song => {
      const artist = song.artist?.trim() || UNKNOWN

      const matchesQuery = q === '' || [song.title, song.artist, song.album, song.slug].some(value =>
        (value ?? '').toLowerCase().includes(q)
      )

      const matchesArtist = artistFilter === '' || artist === artistFilter
      const matchesKey = keyFilter === '' || song.key === keyFilter
      const matchesAudio = !audioOnly || !!song.audioUrl

      return matchesQuery && matchesArtist && matchesKey && matchesAudio
    })
  }, [songs, query, artistFilter, keyFilter, audioOnly, t])

  const hasActiveFilters = query !== '' || artistFilter !== '' || keyFilter !== '' || audioOnly


  const clearFilters = () => {
    setQuery('')
    setArtistFilter('')
    setKeyFilter('')
    setAudioOnly(false)
  }

  const groupedSongs = useMemo(() => {
    const artists: Record<string, Record<string, any[]>> = {}

    for (const song of filteredSongs) {
      const artist = song.artist?.trim() || t.song.unknownArtist
      const album = song.album?.trim() || t.song.singles

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
  }, [filteredSongs, t])

  return (
    <main className="songs-page">
      <h1 className="songs-title">
        {t.song.library}
      </h1>

      <div className="songs-filters">
        <input
          type="search"
          className="songs-search"
          placeholder={t.song.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className="songs-filter-select"
          value={artistFilter}
          onChange={e => setArtistFilter(e.target.value)}
        >
          <option value=''>{t.song.allArtist}</option>
          {artistOptions.map(artist => (
            <option key={artist} value={artist}>{artist}</option>
          ))}
        </select>

        <select
          className="songs-filter-select"
          value={keyFilter}
          onChange={e => setKeyFilter(e.target.value)}
        >
          <option value=''>{t.song.allKey}</option>
          {keyOptions.map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>

        <button
          type="button"
          className={`songs-filter-chip${audioOnly ? ' active' : ''}`}
          aria-pressed={audioOnly}
          onClick={() => setAudioOnly(v => !v)}
        >
          {t.song.withAudio}
        </button>

        <button
          type="button"
          className="songs-filter-clear"
          onClick={clearFilters}
        >
          {t.song.clearFilter}
        </button>
      </div>

      <p className="songs-count">
        {t.song.showingCount
          .replace("{count}", String(filteredSongs.length))
          .replace("{total}", String(songs.length))}
      </p>

      {filteredSongs.length === 0 && songs.length > 0 ? (
        <p className="songs-empty">{t.song.noMatches}</p>
      ) : (
        <div className="artists-list">
          {groupedSongs.map(({ artist, albums }) => (
            <section key={artist} className="artist-section">
              <h2 className="artist-title">{artist}</h2>

              <div className="artist-albums">
                {albums.map(({ album, songs }) => (
                  <div key={album} className="album-section">
                    <h3 className="album-title">{album}</h3>

                    <div className="album-songs">
                      {songs.map(song => (
                        <SongCard key={song.id} song={song} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}