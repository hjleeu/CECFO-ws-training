'use client'

import { useState } from 'react'
import { Song } from "@/components/sheet/Song"
import { Metronome } from "@/components/sheet/Metronome"
import { transposeSong } from "@/lib/key_transpose"
import { Song as SongType, ShowOptions } from "@/types/MusicNotation"
import "@/styles/tools.css"

interface Props {
    song: SongType
}

export function SongView({ song }: Props) {
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

    // Compute transposed song on every offset change
    const transposedSong = transposeSong(song, transposeOffset)

    return (
        <div className="song-container">
            {/* Control Panel: Checkboxes, Transpose Controls & Metronome */}
            <div className="song-controls-panel">
                <div className="song-checkboxes">
                    <span className="controls-label">显示:</span>
                    {(Object.keys(showOptions) as (keyof ShowOptions)[]).map(key => (
                        <label key={key} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={showOptions[key]}
                                onChange={() => toggleOption(key)}
                                className="checkbox-input"
                            />
                            {key}
                        </label>
                    ))}
                </div>

                {/* Transpose Controls */}
                <div className="transpose-controls">
                    <span className="controls-label">调性:</span>
                    <span className="current-key font-bold">{transposedSong.key || 'C'}</span>
                    <div className="transpose-buttons">
                        <button
                            type="button"
                            onClick={() => setTransposeOffset(prev => prev - 1)}
                            className="transpose-btn"
                            title="降半音"
                        >
                            ♭ -1
                        </button>
                        {transposeOffset !== 0 && (
                            <button
                                type="button"
                                onClick={() => setTransposeOffset(0)}
                                className="transpose-reset-btn"
                                title="重置原调"
                            >
                                原调 ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setTransposeOffset(prev => prev + 1)}
                            className="transpose-btn"
                            title="升半音"
                        >
                            ♯ +1
                        </button>
                    </div>
                </div>

                {/* Embedded Metronome Widget */}
                <Metronome defaultBpm={song.bpm || 100} />
            </div>

            {/* Render Song using Transposed Data */}
            <Song song={transposedSong} showOptions={showOptions} />
        </div>
    )
}