"use client"

import { useState } from "react"
import { Song } from "@/components/sheet/Song"
import { Metronome } from "@/components/sheet/Metronome"
import { transposeSong } from "@/lib/key_transpose"
import { Song as SongType, ShowOptions } from "@/types/MusicNotation"
import "@/styles/tools.css"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { useShowOptions } from "@/hooks/useShowOptions"
import { useRouter } from "next/navigation"
import { useSongTranspose } from "@/hooks/useSongTranspose"
import { DrawLayer } from "@/components/sheet/DrawLayer"
import { DrawToolbar } from "@/components/sheet/DrawToolbar"
import { useStrokes } from "@/hooks/useStrokes"
import { DrawTool } from "@/types/Drawing"

interface Props {
    song: SongType
    worshipSetId?: string
}

export function SongView({ song, worshipSetId }: Props) {
    const { t } = useLanguage()
    const router = useRouter()

    const {
        offset: transposeOffset,
        transposeUp,
        transposeDown,
        reset: resetTranspose
    } = useSongTranspose(song.slug)

    const { showOptions, toggle } = useShowOptions()
    const [isToolbarVisible, setToolbarVisibility] = useState(false)
    const [isDrawToolbarVisible, setDrawToolbarVisibility] = useState(false)

    const transposedSong = transposeSong(song, transposeOffset)

    const { strokes, persist, undo, canUndo } = useStrokes(worshipSetId, song.slug)
    const [drawTool, setDrawTool] = useState<DrawTool | null>(null)
    const [drawColor, setDrawColor] = useState("#1a1a1a")
    const [drawWidth, setDrawWidth] = useState(3)

    const showLabel: Record<string, string> = {
        "chords": t.song.chords,
        "jianpu": t.song.jianpu,
        "pinyin": t.song.pinyin,
        "lyrics": t.song.lyrics
    }

    return (
        <div className="song-container">
            <button type="button" className="return-btn" onClick={() => router.push("/songs")}>← {t.song.back}</button>
            <div className="song-controls-panel" style={{ display: isToolbarVisible ? "flex" : "none" }}>
                <div className="song-checkboxes">
                    <span className="controls-label">{t.song.show}:</span>
                    {(Object.keys(showOptions) as (keyof ShowOptions)[]).map(key => (
                        <label key={key} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={showOptions[key]}
                                onChange={() => toggle(key)}
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
                            onClick={transposeDown}
                            className="transpose-btn"
                            title={t.song.down}
                        >
                            ♭ - 1
                        </button>
                        {transposeOffset !== 0 && (
                            <button
                                type="button"
                                onClick={resetTranspose}
                                className="transpose-reset-btn"
                                title={t.song.reset}
                            >
                                {t.song.original} ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={transposeUp}
                            className="transpose-btn"
                            title={t.song.up}
                        >
                            ♯ + 1
                        </button>
                    </div>
                </div>

                <Metronome key={song.slug} defaultBpm={song.bpm || 73} timeSignature={song.timeSignature || "4/4"} />
            </div>

            <button
                type="button"
                className="toolbar-toggle-btn"
                onClick={() => setToolbarVisibility(prev => !prev)}
                title="Toggle toolbar"
            >{isToolbarVisible ? '✕' : '⚙️'}</button>

            <button
                type="button"
                className="toolbar-toggle-btn draw-toolbar-toggle-btn"
                onClick={() => setDrawToolbarVisibility(prev => !prev)}
                title="Toggle draw toolbar"
            >{isDrawToolbarVisible ? '✕' : '✎'}</button>

            <div className={`song-sheet-wrapper${drawTool ? " drawing-active" : ""}`} style={{ position: "relative" }}>
                <Song song={transposedSong} showOptions={showOptions} />
                <DrawLayer
                    strokes={strokes}
                    onChange={persist}
                    tool={drawTool}
                    color={drawColor}
                    width={drawWidth}
                />
            </div>

            {isDrawToolbarVisible && (
                <DrawToolbar
                    tool={drawTool}
                    onToolChange={setDrawTool}
                    color={drawColor}
                    onColorChange={setDrawColor}
                    width={drawWidth}
                    onWidthChange={setDrawWidth}
                    onUndo={undo}
                    canUndo={canUndo}
                />
            )}
        </div>
    )
}