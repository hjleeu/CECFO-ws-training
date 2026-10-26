"use client"

import { Song as SongType, ShowOptions } from "@/types/MusicNotation"
import { useEffect, useMemo, useState } from "react"
import { parse } from "./_components/parser"
import "@/styles/admin.css"
import { Song } from "@/components/sheet/Song"
import { toSlug } from "@/lib/slug"
import { SelectOrNew } from "@/components/ui/SelectOrNew"
import { songToRaw } from "@/lib/songParser"
import { useLanguage } from "@/lib/i18n/LanguageProvider"

const DEFAULT_SHOW: ShowOptions = {
    chords: true,
    jianpu: true,
    pinyin: true,
    lyrics: true
}

function format(raw: string): string {
    try {
        const parsed = parse(raw)

        return songToRaw({
            ...parsed,
            title: '',
            slug: '',
            artist: undefined,
            album: undefined,
            key: '',
            bpm: 0,
            timeSignature: ''
        })
    } catch {
        return raw
    }
}

export default function AdminPage() {
    const [raw, setRaw] = useState('')
    const [parsed, setParsed] = useState<SongType | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [album, setAlbum] = useState('')
    const [songKey, setSongKey] = useState('C')
    const [bpm, setBpm] = useState(73)
    const [timeSignature, setTimeSignature] = useState("4/4")
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState<'cover' | 'audio' | null>(null)

    const [savedArtists, setArtists] = useState<string[]>([])
    const [artistAlbums, setArtistAlbums] = useState<{ artist: string, album: string }[]>([])

    const [editingSlug, setEditingSlug] = useState<string | null>(null)
    const [songs, setSongs] = useState<{ slug: string, title: string }[]>([])

    const [formKey, setFormKey] = useState(0)

    // Fetch saved songs, artists and albums list.
    useEffect(() => {
        fetch("/api/songs")
            .then(r => r.json())
            .then((data: { slug: string, title: string, artist?: string, album?: string }[]) => {
                const artists = [...new Set(data.map(s => s.artist).filter(Boolean) as string[])]
                setArtists(artists)
                setArtistAlbums(
                    data
                        .filter(s => s.artist && s.album)
                        .map(s => ({ artist: s.artist as string, album: s.album as string }))
                )
                setSongs(data.map(s => ({ slug: s.slug, title: s.title })))
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
            timeSignature,
            coverUrl: coverUrl ?? undefined,
            audioUrl: audioUrl ?? undefined
        }
    }, [parsed, title, artist, album, songKey, bpm, timeSignature, coverUrl, audioUrl])

    const filteredAlbums = useMemo(
        () => [...new Set(artistAlbums.filter(a => a.artist === artist).map(a => a.album))],
        [artistAlbums, artist]
    )

    const handleArtistChange = (value: string) => {
        if (value !== artist) {
            setAlbum('')
        }
        setArtist(value)
    }

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
        setCoverUrl(data.coverUrl ?? null)
        setAudioUrl(data.audioUrl ?? null)
        setEditingSlug(slug)
        setFormKey(k => k + 1)

        setRaw(songToRaw(data))
    }

    const handleClear = () => {
        setEditingSlug(null)
        setFormKey(k => k + 1)
        setTitle('')
        setArtist('')
        setAlbum('')
        setSongKey('C')
        setBpm(73)
        setTimeSignature("4/4")
        setCoverUrl(null)
        setAudioUrl(null)
        setRaw('')
        setParsed(null)
        setError(null)
    }

    const handleUpload = async (file: File, kind: 'cover' | 'audio') => {
        const slug = editingSlug ?? toSlug(title)
        if (!slug) {
            alert('请先输入标题 / Enter a title first')
            return
        }

        setUploading(kind)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('kind', kind)
        formData.append('slug', slug)

        try {
            const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
            const data = await res.json()

            if (!res.ok) {
                alert(`Upload failed: ${JSON.stringify(data)}`)
                return
            }

            if (kind === 'cover') setCoverUrl(data.url)
            else setAudioUrl(data.url)
        } catch (e) {
            alert((e as Error).message)
        } finally {
            setUploading(null)
        }
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

    const { t } = useLanguage()

    return (
        <div className="container">
            <h2>{t.admin.heading}</h2>
            <div className="load-area">
                <select
                    className="meta-input"
                    onChange={e => handleLoad(e.target.value)}
                    defaultValue=""
                >
                    <option value="" disabled>{t.admin.load}...</option>
                    {songs.map(s => (
                        <option key={s.slug} value={s.slug}>{s.title}</option>
                    ))}
                </select>
                {editingSlug && (
                    <span className="editing-badge">{t.admin.editing}: {title}</span>
                )}
                <button className="cancel-new-btn" onClick={handleClear}>{t.admin.clear}</button>
            </div>
            <div className="meta-header">
                <div className="cover-dropzone-wrap">
                    <label htmlFor="song-cover" className={`cover-dropzone${uploading === 'cover' ? ' cover-dropzone-busy' : ''}`}>
                        {coverUrl ? (
                            <img src={coverUrl} alt="cover preview" className="cover-dropzone-img" />
                        ) : (
                            <span className="cover-dropzone-label">Cover</span>
                        )}
                    </label>
                    <input
                        type="file"
                        id="song-cover"
                        className="cover-dropzone-input"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploading === 'cover'}
                        onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(file, 'cover')
                        }}
                    />
                    {coverUrl && (
                        <button type="button" className="cover-remove-btn" onClick={() => setCoverUrl(null)}>×</button>
                    )}
                </div>

                <div className="audio-dropzone-wrap">
                    {audioUrl ? (
                        <div className="audio-dropzone audio-dropzone-filled">
                            <audio controls src={audioUrl} className="audio-dropzone-player" />
                            <label htmlFor="song-audio" className="audio-replace-label">Replace</label>
                        </div>
                    ) : (
                        <label htmlFor="song-audio" className={`audio-dropzone${uploading === 'audio' ? ' cover-dropzone-busy' : ''}`}>
                            <span className="audio-dropzone-icon">♪</span>
                            <span className="cover-dropzone-label">Audio</span>
                        </label>
                    )}
                    <input
                        type="file"
                        id="song-audio"
                        className="cover-dropzone-input"
                        accept="audio/mpeg,audio/mp4,audio/x-m4a"
                        disabled={uploading === 'audio'}
                        onChange={e => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(file, 'audio')
                        }}
                    />
                    {audioUrl && (
                        <button type="button" className="cover-remove-btn" onClick={() => setAudioUrl(null)}>×</button>
                    )}
                </div>

                <div className="meta-fields-col">
                    <div className="meta-group meta-group-title">
                        <label htmlFor="song-title" className="meta-label">{t.admin.title}</label>
                        <input type="text" id="song-title" className="meta-input" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div className="meta-row-2col">
                        <div className="meta-group">
                            <label htmlFor="song-artist" className="meta-label">{t.admin.artist}</label>
                            <SelectOrNew
                                key={`artist-${formKey}`}
                                id="song-artist"
                                options={savedArtists}
                                value={artist}
                                onChange={handleArtistChange}
                                placeholder="选择艺术家"
                                label="艺术家"
                            ></SelectOrNew>
                        </div>
                        <div className="meta-group">
                            <label htmlFor="song-album" className="meta-label">{t.admin.album}</label>
                            {artist ? (
                                <SelectOrNew
                                    key={`album-${formKey}-${artist}`}
                                    id="song-album"
                                    options={filteredAlbums}
                                    value={album}
                                    onChange={setAlbum}
                                    placeholder="选择专辑"
                                    label="专辑"
                                ></SelectOrNew>
                            ) : (
                                <input type="text" id="song-album" className="meta-input" disabled placeholder="先选择艺术家" />
                            )}
                        </div>
                    </div>
                    <div className="meta-row-3col">
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
                            <label htmlFor="song-time-sig" className="meta-label">{t.admin.timeSignature}</label>
                            <input type="text" id="song-time-sig" className="meta-input" value={timeSignature} onChange={e => setTimeSignature(e.target.value)} />
                        </div>
                    </div>
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
            <button disabled={!songToPreview} className="save-btn" onClick={handleSave}>{t.admin.save}</button>
        </div>
    )
}