"use client"

import { Section as SectionType, ShowOptions } from "@/types/MusicNotation"
import { useState } from "react"
import { parse } from "./_components/parser"
import "@/styles/admin.css"
import { Section } from "@/components/sheet/Section"

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
    const [parsed, setParsed] = useState<SectionType | null>(null)
    const [error, setError] = useState<string | null>(null)

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

    return (
        <div className="container">
            <h2>ADMIN EDITOR</h2>
            <div className="meta-area">
                <div className="meta-group">
                    <label htmlFor="song-title" className="meta-label">歌名</label>
                    <input type="text" id="song-title" className="meta-input" />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-subtitle" className="meta-label">副标题</label>
                    <input type="text" id="song-subtitle" className="meta-input" />
                </div>
                <div className="meta-group">
                    <label htmlFor="song-key" className="meta-label">KEY</label>
                    <input type="text" id="song-key" className="meta-input" />
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
                        ? <Section section={parsed} showOptions={DEFAULT_SHOW}></Section>
                        : <p>输入来显示预览</p>
                    }
                </div>
            </div>
            <button disabled={!parsed} className="save-btn">录入到数据库</button>
        </div>
    )
}