import { prisma } from "@/lib/prisma"
import { SongCard } from "@/components/sheet/SongCard"
import { useLanguage } from "@/lib/i18n/LanguageProvider"

export const dynamic = "force-dynamic"

export default async function SongsPage() {
  const songs = await prisma.song.findMany({
    orderBy: {
      title: "asc",
    },
  })

  const { t } = useLanguage()

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