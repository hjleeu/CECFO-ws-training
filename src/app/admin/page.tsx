"use client"

import { Song as SongType, ShowOptions } from "@/types/MusicNotation"
import { useState } from "react"
import { parse } from "./_components/parser"
import "@/styles/admin.css"
import { Song } from "@/components/sheet/Song"
import { toSlug } from "@/lib/slug"

const DEFAULT_SHOW: ShowOptions = {
    chords: true,
    jianpu: true,
    pinyin: true,
    lyrics: true
}

function format(raw: string): string {
    const lines = raw.split('\n')

    return lines.map(line => {
        if (line.trim().startsWith('[') && line.trim().endsWith(']')) return line
        if (!line.trim()) return line

        const isNoteLine = /[0-7\[\]]]/.test(line)
        const isLyricLine = /[\u4e00-\u9fff-]/.test(line) && !/[0-7]/.test(line)

        if (isNoteLine) {
            return line.split('|').map(col => {
                const tokens: string[] = []
                const TOKEN = /(\[[^\]]+\])?([0-7][',]*\/{0,2}|-)/g
                let match
                while ((match = TOKEN.exec(col)) !== null) {
                    const chord = match[1] ?? ''
                    const note = match[2]
                    tokens.push(`${chord}${note}`)
                }
                return tokens.join(' ')
            }).filter((col, i, arr) => {
                if (i === arr.length - 1 && col.trim() === '') return false
                return true
            }).join(" | ")
        }

        if (isLyricLine) {
            return line.split('|').map(col =>
                [...col.trim().replace(/\s+/g, '')].join(' ')
            ).filter((col, i, arr) => {
                if (i === arr.length - 1 && col.trim() === '') return false
                return true
            }).join(" | ")
        }
        return line
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

    const handleSave = async () => {
        if (!parsed) return

        const song = {
            ...parsed,
            title,
            slug: toSlug(title),
            artist,
            album,
            key: songKey,
            bpm
        }

        try {
            const res = await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(song),
            })

            const data = await res.json()

            if (!res.ok) {
                console.error("API error:", data)
                alert(`Failed to save: ${JSON.stringify(data)}`)
                return
            }

            alert(`Saved: ${data.title} (slug: ${data.slug})`)
        } catch (e) {
            alert((e as Error).message)
        }
    }

    return (
        <div className="container">
            <h2>ADMIN EDITOR</h2>
            <div className="meta-area">
                <div className="meta-group">
                    <label htmlFor="song-title" className="meta-label">歌名</label>
                    <input type="text" id="song-title" className="meta-input" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-artist" className="meta-label">艺术家</label>
                    <input type="text" id="song-artist" className="meta-input" value={artist} onChange={e => setArtist(e.target.value)} />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-album" className="meta-label">专辑</label>
                    <input type="text" id="song-album" className="meta-input" value={album} onChange={e => setAlbum(e.target.value)} />
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
                    {parsed
                        ? <Song song={parsed} showOptions={DEFAULT_SHOW}></Song>
                        : <p>输入来显示预览</p>
                    }
                </div>
            </div>
            <button disabled={!parsed} className="save-btn" onClick={handleSave}>保存数据库</button>
        </div>
    )
}