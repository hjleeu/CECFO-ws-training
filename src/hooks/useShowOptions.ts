"use client"

import { useEffect, useState } from "react"
import type { ShowOptions } from "@/types/MusicNotation"

const STORAGE_KEY = "song-show-options"

const DEFAULT_OPTIONS: ShowOptions = {
    chords: true,
    jianpu: true,
    pinyin: true,
    lyrics: true
}

export function useShowOptions() {
    const [showOptions, setShowOptions] = useState<ShowOptions>(DEFAULT_OPTIONS)

    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)

        if (stored) {
            try {
                const parsed = JSON.parse(stored)

                setShowOptions({
                    ...DEFAULT_OPTIONS,
                    ...parsed
                })
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
        // Always set to true even if no data are loaded.
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (!isLoaded) {
            return
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(showOptions)
        )
    }, [showOptions, isLoaded])

    const toggle = (key: keyof ShowOptions) => {
        setShowOptions(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    return {
        showOptions,
        setShowOptions,
        toggle,
        isLoaded
    }
}