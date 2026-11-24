"use client"

import { useEffect, useRef, useState } from "react"
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
import { AudioPlayer } from "../ui/AudioPlayer"
import { Headset, Pencil, PenOff, SlidersHorizontal, X } from "lucide-react"
import { TutorialPopup } from "../ui/TutorialPopup"
import { useSongPlayback } from "@/hooks/useSongPlayback"

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
    const [tempo, setTempo] = useState<{ slug: string; bpm: number } | null>(null)
    const bpm = tempo?.slug === song.slug ? tempo.bpm : song.bpm || 73
    const playSong = { ...song, bpm }

    const { strokes, persist, undo, canUndo } = useStrokes(worshipSetId, song.slug)
    const [drawTool, setDrawTool] = useState<DrawTool | null>(null)
    const [drawColor, setDrawColor] = useState("#1A1A1A")
    const [drawWidth, setDrawWidth] = useState(3)

    const sheetRef = useRef<HTMLDivElement>(null)
    const meterRef = useRef<HTMLSpanElement>(null)
    const { playing, practicing, score, error, toggle: togglePlayBack, togglePractice } = useSongPlayback(playSong, transposeOffset, sheetRef, meterRef)

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
            <TutorialPopup page="song"></TutorialPopup>
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
                        <AudioPlayer src={song.audioUrl.startsWith("/") ? song.audioUrl : `/${song.audioUrl}`} />
                    </div>
                )}

                <div className="transpose-controls">
                    <span className="controls-label"><Headset /></span>
                    <button type="button" disabled={practicing} onClick={togglePlayBack} className={`metronome-btn ${playing && !practicing ? "stop" : "play"}`}>
                        {playing && !practicing ? "■" : "▶"}
                    </button>
                    <button type="button" disabled={playing && !practicing} onClick={togglePractice} className={`metronome-btn ${practicing ? "stop" : "play"}`}>
                        {practicing ? "■" : "练习模式"}
                    </button>
                    {score && <span className="current-key font-bold">{((score.ok / score.total) * 100).toPrecision(3)}%</span>}
                    {error === "headphones" && <span>Use headphones (speaker sound detected)</span>}
                    {error === "mic" && <span>Microphone not available</span>}
                </div>

                <Metronome key={song.slug} bpm={bpm} onBpmChange={b => setTempo({ slug: song.slug, bpm: b })} timeSignature={song.timeSignature || "4/4"} />
            </div>

            <button
                type="button"
                className="toolbar-toggle-btn"
                onClick={() => setToolbarVisibility(prev => !prev)}
                title="Toggle toolbar"
            >{isToolbarVisible ? <X size={18} /> : <SlidersHorizontal size={18}/>}</button>

            <button
                type="button"
                className="toolbar-toggle-btn draw-toolbar-toggle-btn"
                onClick={() => setDrawToolbarVisibility(prev => !prev)}
                title="Toggle draw toolbar"
            >{isDrawToolbarVisible ? <PenOff size={18} /> : <Pencil size={18} />}</button>

            {practicing && (
                <button type="button" className="practice-meter" onClick={togglePractice}>
                    <span ref={meterRef} data-state="idle">...</span> ■
                </button>
            )}

            <div ref={sheetRef} className={`song-sheet-wrapper${drawTool ? " drawing-active" : ""}`} style={{ position: "relative" }}>
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