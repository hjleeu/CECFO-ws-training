"use client"

import { useCallback, useEffect, useState } from "react"

const MIN = 0.5
const MAX = 2
const STEP = 0.1
const DEFAULT = 1

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10))
const keyFor = (slug: string) => `songScale:${slug}`

export function useSongScale(slug: string) {
    const [scale, setScale] = useState(DEFAULT)

    useEffect(() => {
        const saved = parseFloat(localStorage.getItem(keyFor(slug)) ?? '')
        setScale(Number.isNaN(saved) ? DEFAULT : clamp(saved))
    }, [slug])

    const update = useCallback((next: number) => {
        const value = clamp(next)
        setScale(value)
        if (value === DEFAULT) { localStorage.removeItem(keyFor(slug)) }
        else { localStorage.setItem(keyFor(slug), String(value)) }
    }, [slug])

    return {
        scale,
        zoomIn: () => update(scale + STEP),
        zoomOut: () => update(scale - STEP),
        reset: () => update(DEFAULT)
    }
}