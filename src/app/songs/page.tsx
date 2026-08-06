import { prisma } from "@/lib/prisma"
import { SongCard } from "@/components/sheet/SongCard"

export const dynamic = "force-dynamic"

export default async function SongsPage() {
  const songs = await prisma.song.findMany({
    orderBy: {
      title: "asc",
    },
  })

  return (
    <main className="songs-page">
      <h1 className="songs-title">曲库</h1>

      <div className="songs-grid">
        {songs.map(song => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </main>
  )
}