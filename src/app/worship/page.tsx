"use client"

import { useEffect, useState } from "react"
import "@/styles/worship-sets.css"

interface SongSummary {
  slug: string
  title: string
}

interface WorshipSetSong {
  songSlug: string
  order: number
  song: SongSummary
}

interface WorshipSet {
  id: string
  name: string
  date: string
  songs: WorshipSetSong[]
}

export default function WorshipSetsAdminPage() {
  const [allSongs, setAllSongs] = useState<SongSummary[]>([])
  const [sets, setSets] = useState<WorshipSet[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])

  const loadSets = () => {
    fetch('/api/worship-sets')
      .then(r => r.json())
      .then(setSets)
  }

  useEffect(() => {
    fetch('/api/songs')
      .then(r => r.json())
      .then((data: SongSummary[]) => setAllSongs(data))
    loadSets()
  }, [])

  const addSong = (slug: string) => {
    if (!selectedSlugs.includes(slug)) {
      setSelectedSlugs(prev => [...prev, slug])
    }
  }

  const removeSong = (slug: string) => {
    setSelectedSlugs(prev => prev.filter(s => s !== slug))
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    setSelectedSlugs(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const moveDown = (index: number) => {
    setSelectedSlugs(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDate(new Date().toISOString().slice(0, 10))
    setSelectedSlugs([])
  }

  const handleEdit = (set: WorshipSet) => {
    setEditingId(set.id)
    setName(set.name)
    setDate(set.date.slice(0, 10))
    setSelectedSlugs(set.songs.map(s => s.songSlug))
  }

  const handleSave = async () => {
    if (!name || selectedSlugs.length === 0) return

    const url = editingId ? `/api/worship-sets/${editingId}` : '/api/worship-sets'
    const method = editingId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date, songSlugs: selectedSlugs }),
    })

    if (!res.ok) {
      const data = await res.json()
      alert(`Failed: ${JSON.stringify(data)}`)
      return
    }

    resetForm()
    loadSets()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('删除这个歌单？')) return
    await fetch(`/api/worship-sets/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    loadSets()
  }

  return (
    <div className="worship-sets-admin">
      <h2>敬拜歌单</h2>

      <div className="sets-list">
        {sets.map(set => (
          <div key={set.id} className={`set-card${editingId === set.id ? ' editing' : ''}`}>
            <div className="set-card-header">
              <strong>🎶 {set.name}</strong>
              <span className="set-date">{new Date(set.date).toLocaleDateString()}</span>
            </div>
            <div className="set-songs">
              {set.songs.map(s => s.song.title).join('、')}
            </div>
            <div className="set-actions">
              <button onClick={() => handleEdit(set)}>编辑</button>
              <button onClick={() => handleDelete(set.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>

      <hr />

      <div className="set-form">
        <h3>{editingId ? '编辑歌单' : '新建歌单'}</h3>

        <div className="set-form-meta">
          <input
            type="text"
            placeholder="歌单名称（如：主日崇拜）"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="set-columns">
          <div className="set-column">
            <h4>全部歌曲</h4>
            {allSongs.map(s => (
              <button
                key={s.slug}
                className="song-pick-btn"
                onClick={() => addSong(s.slug)}
                disabled={selectedSlugs.includes(s.slug)}
              >
                + {s.title}
              </button>
            ))}
          </div>

          <div className="set-column">
            <h4>本次歌单 ({selectedSlugs.length})</h4>
            {selectedSlugs.map((slug, i) => {
              const song = allSongs.find(s => s.slug === slug)
              return (
                <div key={slug} className="set-song-row">
                  <span>{i + 1}. {song?.title ?? slug}</span>
                  <div className="set-song-row-actions">
                    <button onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                    <button onClick={() => moveDown(i)} disabled={i === selectedSlugs.length - 1}>↓</button>
                    <button onClick={() => removeSong(slug)}>✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="set-form-actions">
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!name || selectedSlugs.length === 0}
          >
            {editingId ? '更新歌单' : '保存歌单'}
          </button>
          {editingId && (
            <button className="cancel-btn" onClick={resetForm}>取消</button>
          )}
        </div>
      </div>
    </div>
  )
}