"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "favoriteSongs";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const toggleFavorite = (slug: string) => {
    setFavorites(prev => {
      const next = prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return {
    favorites,
    isFavorite: (slug: string) => favorites.includes(slug),
    toggleFavorite,
  };
}