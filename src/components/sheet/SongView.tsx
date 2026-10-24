"use client"

import { useEffect, useState } from "react"
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
import { useSongScale } from "@/hooks/useSongScale"

interface Props {
    song: SongType
    worshipSetId?: string
    onDrawingActiveChange?: (active: boolean) => void
}

export function SongView({ song, worshipSetId, onDrawingActiveChange }: Props) {
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

    useEffect(() => {
        onDrawingActiveChange?.(drawTool !== null)
    }, [drawTool, onDrawingActiveChange])

    const { scale, zoomIn, zoomOut, reset: resetScale } = useSongScale(song.slug)

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
                    <span className="controls-label">Aa</span>
                    <span className="current-key font-bold">{Math.round(scale * 100)}%</span>
                    <div className="transpose-buttons">
                        <button type="button" onClick={zoomOut} className="transpose-btn">A −</button>
                        <button type="button" onClick={resetScale} className="transpose-reset-btn">100%</button>
                        <button type="button" onClick={zoomIn} className="transpose-btn">A +</button>
                    </div>
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
                        <button
                            type="button"
                            onClick={resetTranspose}
                            className="transpose-reset-btn"
                            title={t.song.reset}
                        >
                            {t.song.original} ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                        </button>
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

                {song.audioUrl && (
                    <div className="audio-controls">
                        <span className="controls-label">♪</span>
                        <audio
                            controls
                            controlsList="nodownload noplaybackrate"
                            onContextMenu={(e) => e.preventDefault()}
                            src={song.audioUrl.startsWith('/') ? song.audioUrl : `/${song.audioUrl}`}
                            className="audio-controls-player"
                        ></audio>
                    </div>
                )}

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
            >{isDrawToolbarVisible ? '✕' : '✍🏻'}</button>

            <div className={`song-sheet-wrapper${drawTool ? " drawing-active" : ""}`} style={{ position: "relative" }}>
                <Song song={transposedSong} showOptions={showOptions} scale={scale}/>
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