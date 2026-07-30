'use client'

import { useState } from 'react'
import { Song } from "@/components/sheet/Song"
import { Metronome } from "@/components/sheet/Metronome"
import { Song as SongType, ShowOptions } from "@/types/MusicNotation"

interface Props {
    song: SongType
}

export function SongView({ song }: Props) {
    const [showOptions, setShowOptions] = useState<ShowOptions>({
        chords: true,
        jianpu: true,
        lyrics: true,
        pinyin: true,
    })

    const toggleOption = (key: keyof ShowOptions) => {
        setShowOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="song-container">
            {/* Control Panel: Checkboxes & Metronome */}
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

                {/* Embedded Metronome Widget */}
                <Metronome defaultBpm={song.bpm || 100} />
            </div>

            {/* Render Song */}
            <Song song={song} showOptions={showOptions} />
        </div>
    )
}