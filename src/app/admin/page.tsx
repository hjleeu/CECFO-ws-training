"use client"

import { Sheet as SheetType, ShowOptions } from "@/types/MusicNotation"
import { useState } from "react"
import { parse } from "./_components/parser"
import { Sheet } from "@/components/sheet/Sheet"
import "@/styles/admin.css"

const DEFAULT_SHOW: ShowOptions = {
    chords: true,
    jianpu: true,
    pinyin: true,
    lyrics: true
}

export default function AdminPage() {
    /**
     * The useState hook.
     * @param {type} arg1 - the current state
     * @param {function} agr2 - the function that updates the state
     * @param {type} arg3 - the initial value
     */
    const [raw, setRaw] = useState('')
    const [parsed, setParsed] = useState<SheetType | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleChange = (text: string) => {
        setRaw(text)
        try {
            const result = parse(text)
            setParsed(result)
            setError(null)
        } catch (e) {
            /* 当报错，显示错误信息。 */
            setParsed(null)
            setError((e as Error).message)
        }
    }

    return (
        <div className="container">
            <h2>ADMIN EDITOR</h2>
            {error && <p style={{ color: "red", fontSize: "15px" }}>{error}</p>}
            <div>
                <div className="input-area">
                    <textarea
                    value={raw}
                    onChange={e => handleChange(e.target.value)}
                />
                </div>
                <div className="preview-area">
                    {parsed
                        ? <Sheet sheet={parsed} showOptions={DEFAULT_SHOW}></Sheet>
                        : <p style={{ color: "gold" }}>Start typing to see preview</p>
                    }
                </div>
            </div>
            <button disabled={!parsed} className="save-btn">Save to DB</button>
        </div>
    )
}