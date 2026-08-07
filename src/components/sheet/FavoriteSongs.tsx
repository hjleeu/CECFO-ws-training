"use client";

import { useFavorites } from "@/hooks/useFavourite";
import { SongCard } from "./SongCard";

interface Props {
  songs: {
    slug: string;
    title: string;
    artist: string | null;
    album: string | null;
    key: string;
    bpm: number;
    timeSignature: string;
  }[];
}

export function FavoriteSongs({ songs }: Props) {
  const { favorites } = useFavorites();

  const favoriteSongs = songs.filter(song =>
    favorites.includes(song.slug)
  );

  return (
    <>
      <div className="home-section-header">
        <h2 className="home-section-title">❤️ 我的收藏</h2>
      </div>

      <div className="home-song-grid">
        {favoriteSongs.length === 0 && (
            <span>点击爱心添加到收藏。</span>
        )}
        {favoriteSongs.length !== 0 && favoriteSongs.map(song => (
          <SongCard
            key={song.slug}
            song={song}
            compact
          />
        ))}
      </div>
    </>
  );
}