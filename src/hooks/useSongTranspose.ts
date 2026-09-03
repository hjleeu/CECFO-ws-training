"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "song-transpose"

type TransposeMap = Record<string, number>

export function useSongTranspose(slug: string) {
    const [offset, setOffset] = useState(0)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)

            if (stored) {
                const parsed: TransposeMap = JSON.parse(stored)
                setOffset(parsed[slug] ?? 0)
            }
        } catch {}

        setLoaded(true)
    }, [slug])

    useEffect(() => {
        if (!loaded) return

        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            const parsed: TransposeMap = stored ? JSON.parse(stored) : {}

            if (offset === 0) {
                delete parsed[slug]
            } else {
                parsed[slug] = offset
            }

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(parsed)
            )
        } catch {}
    }, [slug, offset, loaded])

    const transposeUp = () => { setOffset(prev => prev + 1) }
    const transposeDown = () => { setOffset(prev => prev - 1) }
    const reset = () => { setOffset(0) }

    return {
        offset,
        setOffset,
        transposeUp,
        transposeDown,
        reset,
        loaded
    }
}