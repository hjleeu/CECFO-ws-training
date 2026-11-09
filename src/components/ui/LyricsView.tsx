"use client"

import { useEffect, useRef } from "react"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { activeLineIndex, type LrcLine } from "@/lib/lrc"

interface LyricsViewProps {
    lines: LrcLine[]
    time: number
    onSeek: (time: number) => void
}

export function LyricsView({ lines, time, onSeek }: LyricsViewProps) {
    const { t } = useLanguage()
    const boxRef = useRef<HTMLDivElement>(null)
    const active = activeLineIndex(lines, time)

    // Scroll the box itself (not the page) so the active line sits in the middle.
    useEffect(() => {
        const box = boxRef.current
        const el = box?.querySelector<HTMLElement>(`[data-line="${active}"]`)
        if (box && el) {
            box.scrollTo({
                top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2,
                behavior: "smooth",
            })
        }
    }, [active])

    return lines.length === 0 ? (
        <p className="lyrics-empty">{t.player.noLyrics}</p>
    ) : (
        <div className="lyrics-view" ref={boxRef}>
            {lines.map((line, i) => (
                <button
                    key={`${line.time}-${i}`}
                    type="button"
                    data-line={i}
                    className={i === active ? "lyric-line active" : "lyric-line"}
                    onClick={() => onSeek(line.time)}
                >
                    {line.text}
                </button>
            ))}
        </div>
    )
}