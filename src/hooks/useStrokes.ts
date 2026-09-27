import { Stroke } from "@/types/Drawing"
import { get, set } from "idb-keyval"
import { useCallback, useEffect, useState } from "react"

function storageKey(worshipSetId: string | undefined, songSlug: string) {
    return `strokes:${worshipSetId ?? "standalone"}:${songSlug}`
}

const MAX_HISTORY = 50

export function useStrokes(worshipSetId: string | undefined, songSlug: string) {
    const key = storageKey(worshipSetId, songSlug)
    const [strokes, setStrokesState] = useState<Stroke[]>([])
    const [history, setHistory] = useState<Stroke[][]>([])

    useEffect(() => {
        let cancelled = false
        setHistory([])
        get<Stroke[]>(key).then(saved => {
            if (!cancelled) setStrokesState(saved ?? [])
        })
        return () => { cancelled = true }
    }, [key])

    const persist = useCallback((next: Stroke[]) => {
        setHistory(h => [...h.slice(-(MAX_HISTORY - 1)), strokes])
        setStrokesState(next)
        set(key, next)
    }, [key, strokes])

    const undo = useCallback(() => {
        setHistory(h => {
            if (h.length === 0) return h
            const previous = h[h.length - 1]
            setStrokesState(previous)
            set(key, previous)
            return h.slice(0, -1)
        })
    }, [key])

    return { strokes, persist, undo, canUndo: history.length > 0 }
}