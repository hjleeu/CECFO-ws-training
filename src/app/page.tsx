import Link from "next/link";
import { SongCard } from "@/components/sheet/SongCard";
import { prisma } from "@/lib/prisma";
import "@/styles/homepage.css";
import { FavoriteSongs } from "@/components/sheet/FavoriteSongs";

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const allSongs = await prisma.song.findMany({
    select: {
      slug: true,
      title: true,
      artist: true,
      album: true,
      key: true,
      bpm: true,
      timeSignature: true,
    },
  });

  const updatedSongs = await prisma.song.findMany({
    orderBy: { updatedAt: "desc" },
    take: 7,
    select: {
      slug: true,
      title: true,
      artist: true,
      album: true,
      key: true,
      bpm: true,
      timeSignature: true,
    },
  });

  const randomSongs = await prisma.$queryRaw<
    {
      slug: string
      title: string
      artist: string | null
      album: string | null
      key: string
      bpm: number
      timeSignature: string
    }[]
  >`
    SELECT
      slug,
      title,
      artist,
      album,
      key,
      bpm,
      "timeSignature"
    FROM "Song"
    ORDER BY RANDOM()
    LIMIT 3;
  `;

  return (
    <main className="homepage">
      <section className="home-section">
        <FavoriteSongs songs={allSongs} />
      </section>
      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">✨ 最近更新</h2>
          <Link href="/songs" className="home-section-link">
            查看全部 →
          </Link>
        </div>

        <div className="home-song-grid">
          {updatedSongs.map(song => (
            <SongCard key={song.slug} song={song} compact />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-header">
          <h2 className="home-section-title">🎲 随机歌单</h2>
        </div>

        <div className="home-song-grid home-song-grid-small">
          {randomSongs.map(song => (
            <SongCard key={song.slug} song={song} compact />
          ))}
        </div>
      </section>

    </main>
  );
}