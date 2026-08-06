import Link from "next/link"
import "@/styles/songs.css"

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
}

export function SongCard({ song }: Props) {
  return (
    <Link href={`/songs/${song.slug}`} className="song-card">
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