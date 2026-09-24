'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { SongView } from '@/components/sheet/SongView'
import type { Song as SongType } from '@/types/MusicNotation'
import '@/styles/worship-viewer.css'

interface WorshipSetSong {
  songSlug: string
  order: number
  song: any
}

interface WorshipSet {
  id: string
  name: string
  date: string
  songs: WorshipSetSong[]
}

export default function WorshipSetViewerPage() {
  const params = useParams<{ id: string }>()

  const [set, setSet] = useState<WorshipSet | null>(null)
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/worship-sets/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setSet)
      .finally(() => setLoading(false))
  }, [params.id])

  const next = useCallback(() => {
    setIndex(i => (set ? Math.min(i + 1, set.songs.length - 1) : i))
  }, [set])

  const prev = useCallback(() => {
    setIndex(i => Math.max(i - 1, 0))
  }, [])

  // keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  // swipe navigation (touch)
  useEffect(() => {
    let startX = 0
    let startY = 0
    const handleStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    const handleEnd = (e: TouchEvent) => {
      const diffX = e.changedTouches[0].clientX - startX
      const diffY = e.changedTouches[0].clientY - startY
      if (Math.abs(diffX) < 50) { return }
      if (Math.abs(diffX) < Math.abs(diffY)) { return } 
      if (diffX < 0) { next() }
      else { prev() }
    }
    window.addEventListener('touchstart', handleStart)
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('touchstart', handleStart)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [next, prev])

  if (loading) return null
  if (!set || set.songs.length === 0) return <p>该歌单没有歌曲</p>

  const currentSong = set.songs[index].song as SongType

  return (
    <div className="worship-viewer">
      <div className="worship-viewer-header">
        <span></span>
        <span className="worship-viewer-title">🎶 {set.name}</span>
        <span className="worship-viewer-counter">{index + 1} / {set.songs.length}</span>
      </div>

      <div className="worship-viewer-nav">
        <button
          className="worship-viewer-arrow"
          onClick={prev}
          disabled={index === 0}
        >
          ‹
        </button>

        <div className="worship-viewer-content">
          <SongView song={currentSong} />
        </div>

        <button
          className="worship-viewer-arrow"
          onClick={next}
          disabled={index === set.songs.length - 1}
        >
          ›
        </button>
      </div>

      <div className="worship-viewer-dots">
        {set.songs.map((s, i) => (
          <button
            key={s.songSlug}
            className={`worship-viewer-dot${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
            title={s.song.title}
          />
        ))}
      </div>
    </div>
  )
}