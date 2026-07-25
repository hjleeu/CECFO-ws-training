"use client"

import { Song as SongType, ShowOptions } from "@/types/MusicNotation"
import { useEffect, useMemo, useState } from "react"
import { parse } from "./_components/parser"
import "@/styles/admin.css"
import { Song } from "@/components/sheet/Song"
import { toSlug } from "@/lib/slug"
import { SelectOrNew } from "@/components/ui/SelectOrNew"
import { songToRaw } from "@/lib/songParser"

const DEFAULT_SHOW: ShowOptions = {
    chords: true,
    jianpu: true,
    pinyin: true,
    lyrics: true
}

function format(raw: string): string {
    if (!raw) return ''

    const lines = raw.split('\n')

    return lines.map(line => {
        const trimmed = line.trim()

        // 1. Keep empty lines and section headers like [verse] or [chorus] as-is
        if (!trimmed) return line
        if (trimmed.startsWith('[') && trimmed.endsWith(']') && !/\d/.test(trimmed)) {
            return line
        }

        // 2. Determine if line is a Note line or Lyric line
        const hasChinese = /[\u4e00-\u9fff]/.test(line)
        const hasNotes = /[0-7]/.test(line)
        const isNoteLine = hasNotes || (!hasChinese && line.includes('|'))

        if (isNoteLine) {
            const measures = line.split('|')

            const formattedMeasures = measures.map((col, index) => {
                // Preserve trailing empty measure if line ends with '|'
                if (index === measures.length - 1 && col.trim() === '') {
                    return ''
                }

                // Token regex matching:
                // - Optional chord/bracket prefix: [C] or [1.
                // - Note digit 0-7, rest, or dash '-'
                // - Octave dots/apostrophes/commas (',), duration dot (.), beat slashes (/)
                const NOTE_TOKEN_REGEX = /(\[[^\]]+\]?)?([0-7]['`,]*\.?\/{0,2}\.?|-)/g
                const tokens: string[] = []
                let match: RegExpExecArray | null

                while ((match = NOTE_TOKEN_REGEX.exec(col)) !== null) {
                    tokens.push(match[0])
                }

                return tokens.join(' ')
            })

            const result = formattedMeasures.join(' | ')
            // Clean up trailing space before final '|'
            return result.endsWith(' | ') ? result.slice(0, -1) : result
        }

        // 3. Format Lyric line
        const measures = line.split('|')

        const formattedMeasures = measures.map((col, index) => {
            if (index === measures.length - 1 && col.trim() === '') {
                return ''
            }

            const LYRIC_TOKEN_REGEX = /([\u4e00-\u9fff]|[a-zA-Z0-9]+|-+)[，,。!！?？;；]*/g
            const tokens: string[] = []
            let match: RegExpExecArray | null

            while ((match = LYRIC_TOKEN_REGEX.exec(col)) !== null) {
                tokens.push(match[0])
            }

            return tokens.join(' ')
        })

        const result = formattedMeasures.join(' | ')
        return result.endsWith(' | ') ? result.slice(0, -1) : result
    }).join('\n')
}

export default function AdminPage() {
    const [raw, setRaw] = useState('')
    const [parsed, setParsed] = useState<SongType | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [album, setAlbum] = useState('')
    const [songKey, setSongKey] = useState('C')
    const [bpm, setBpm] = useState(80)
    const [timeSignature, setTimeSignature] = useState("4/4")

    const [savedArtists, setArtists] = useState<string[]>([])
    const [savedAlbums, setAlbums] = useState<string[]>([])

    const [editingSlug, setEditingSlug] = useState<string | null>(null)
    const [songs, setSongs] = useState<{ slug: string, title: string }[]>([])

    // Fetch saved songs, artists and albums list.
    useEffect(() => {
        fetch("/api/songs")
            .then(r => r.json())
            .then((data: { slug: string, title: string, artist?: string, album?: string }[]) => {
                const artists = [...new Set(data.map(s => s.artist).filter(Boolean) as string[])]
                const albums = [...new Set(data.map(s => s.album).filter(Boolean) as string[])]
                setArtists(artists)
                setAlbums(albums)
                setSongs(data.map(s => ({ slug: s.slug, title: s.title})))
            })
    }, [])

    const songToPreview = useMemo<SongType | null>(() => {
        if (!parsed) return null
        return {
            ...parsed,
            title,
            slug: toSlug(title),
            artist,
            album,
            key: songKey,
            bpm,
            timeSignature
        }
    }, [parsed, title, artist, album, songKey, bpm, timeSignature])

    const handleChange = (text: string) => {
        setRaw(text)
        try {
            const result = parse(text)
            setParsed(result)
            setError(null)
        } catch (e) {
            setParsed(null)
            setError((e as Error).message)
        }
    }

    const handleBlur = () => {
        const formatted = format(raw)
        setRaw(formatted)
        try {
            const result = parse(formatted)
            setParsed(result)
            setError(null)
        } catch (e) {
            setParsed(null)
            setError((e as Error).message)
        }
    }

    const handleLoad = async (slug: string) => {
        if (!slug) return

        const res = await fetch(`/api/songs/${slug}`)
        const data = await res.json()

        setTitle(data.title)
        setArtist(data.artist ?? '')
        setAlbum(data.album ?? '')
        setSongKey(data.key)
        setBpm(data.bpm)
        setTimeSignature(data.timeSignature)
        setEditingSlug(slug)

        setRaw(songToRaw(data))
    }

    const handleSave = async () => {
        if (!songToPreview) return

        const url = editingSlug ? `/api/songs/${editingSlug}` : "/api/songs"
        const method = editingSlug ? "PUT" : "POST"

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(songToPreview),
            })

            const data = await res.json()

            if (!res.ok) {
                console.error("API error:", data)
                alert(`Failed to save: ${JSON.stringify(data)}`)
                return
            }

            alert(editingSlug ? `Updated: ${data.title}` : `Saved: ${data.title}`)
            setEditingSlug(data.slug)
        } catch (e) {
            alert((e as Error).message)
        }
    }

    return (
        <div className="container">
            <h2>ADMIN EDITOR</h2>
            <div className="load-area">
                <select
                    className="meta-input"
                    onChange={e => handleLoad(e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>载入已有歌曲...</option>
                    {songs.map(s => (
                        <option key={s.slug} value={s.slug}>{s.title}</option>
                    ))}
                </select>
                {editingSlug && (
                    <span className="editing-badge">编辑中: {title}</span>
                )}
            </div>
            <div className="meta-area">
                <div className="meta-group">
                    <label htmlFor="song-title" className="meta-label">歌名</label>
                    <input type="text" id="song-title" className="meta-input" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-artist" className="meta-label">艺术家</label>
                    <SelectOrNew id="song-artist" options={savedArtists} value={artist} onChange={setArtist} placeholder="选择艺术家" label="艺术家"></SelectOrNew>
                </div>
                <div className="meta-group">
                    <label htmlFor="song-album" className="meta-label">专辑</label>
                    <SelectOrNew id="song-album" options={savedAlbums} value={album} onChange={setAlbum} placeholder="选择专辑" label="专辑"></SelectOrNew>
                </div>
                <div className="meta-group">
                    <label htmlFor="song-key" className="meta-label">KEY</label>
                    <input type="text" id="song-key" className="meta-input" value={songKey} onChange={e => setSongKey(e.target.value)} />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-bpm" className="meta-label">BPM</label>
                    <input
                        type="number"
                        inputMode="numeric"
                        step={1}
                        pattern="[0-9]*"
                        min={1}
                        className="meta-input"
                        value={bpm}
                        onChange={e => setBpm(parseInt(e.target.value))}
                    />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-time-sig" className="meta-label">拍号</label>
                    <input type="text" id="song-time-sig" className="meta-input" value={timeSignature} onChange={e => setTimeSignature(e.target.value)} />
                </div>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="content-area">
                <div className="input-area">
                    <textarea
                        spellCheck="false"
                        value={raw}
                        onChange={e => handleChange(e.target.value)}
                        onBlur={handleBlur}
                    />
                </div>
                <div className="preview-area">
                    {songToPreview
                        ? <Song song={songToPreview} showOptions={DEFAULT_SHOW}></Song>
                        : <p>输入来显示预览</p>
                    }
                </div>
            </div>
            <button disabled={!songToPreview} className="save-btn" onClick={handleSave}>保存数据库</button>
        </div>
    )
}