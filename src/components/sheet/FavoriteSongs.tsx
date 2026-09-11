"use client";

import { useFavorites } from "@/hooks/useFavourite";
import { SongCard } from "./SongCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

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

  const { t } = useLanguage()

  return (
    <>
      <div className="home-section-header">
        <h2 className="home-section-title">❤️ {t.song.favorite}</h2>
      </div>

      <div className="home-song-grid">
        {favoriteSongs.length === 0 && (
            <span>{t.song.emptyFavorite}</span>
        )}
        {favoriteSongs.length !== 0 && favoriteSongs.map(song => (
          <SongCard
            key={song.slug}
            song={song}
          />
        ))}
      </div>
    </>
  );
}