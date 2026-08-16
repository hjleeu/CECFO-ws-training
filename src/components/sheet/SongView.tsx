'use client'

import { useState } from 'react'
import { Song } from "@/components/sheet/Song"
import { Metronome } from "@/components/sheet/Metronome"
import { transposeSong } from "@/lib/key_transpose"
import { Song as SongType, ShowOptions } from "@/types/MusicNotation"
import "@/styles/tools.css"
import { useLanguage } from '@/lib/i18n/LanguageProvider'

interface Props {
    song: SongType
}

export function SongView({ song }: Props) {
    const { t } = useLanguage()

    const [transposeOffset, setTransposeOffset] = useState<number>(0)
    const [showOptions, setShowOptions] = useState<ShowOptions>({
        chords: true,
        jianpu: true,
        lyrics: true,
        pinyin: true,
    })

    const toggleOption = (key: keyof ShowOptions) => {
        setShowOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const transposedSong = transposeSong(song, transposeOffset)

    const showLabel: Record<string, string> = {
        "chords": t.song.chords,
        "jianpu": t.song.jianpu,
        "pinyin": t.song.pinyin,
        "lyrics": t.song.lyrics
    }

    return (
        <div className="song-container">
            <div className="song-controls-panel">
                <div className="song-checkboxes">
                    <span className="controls-label">{t.song.show}:</span>
                    {(Object.keys(showOptions) as (keyof ShowOptions)[]).map(key => (
                        <label key={key} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={showOptions[key]}
                                onChange={() => toggleOption(key)}
                                className="checkbox-input"
                            />
                            {showLabel[key]}
                        </label>
                    ))}
                </div>

                <div className="transpose-controls">
                    <span className="controls-label">{t.song.transpose}</span>
                    <span className="current-key font-bold">{transposedSong.key || 'C'}</span>
                    <div className="transpose-buttons">
                        <button
                            type="button"
                            onClick={() => setTransposeOffset(prev => prev - 1)}
                            className="transpose-btn"
                            title={t.song.down}
                        >
                            ♭ -1
                        </button>
                        {transposeOffset !== 0 && (
                            <button
                                type="button"
                                onClick={() => setTransposeOffset(0)}
                                className="transpose-reset-btn"
                                title={t.song.reset}
                            >
                                {t.song.original} ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setTransposeOffset(prev => prev + 1)}
                            className="transpose-btn"
                            title={t.song.up}
                        >
                            ♯ +1
                        </button>
                    </div>
                </div>

                <Metronome defaultBpm={song.bpm || 73} />
            </div>

            <Song song={transposedSong} showOptions={showOptions} />
        </div>
    )
}