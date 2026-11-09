"use client"

import { useCallback, useSyncExternalStore } from "react"

// The queue is an ordered list of song slugs in localStorage, shared by every
// component through useSyncExternalStore (SongCard buttons + /player page stay
// in sync, also across tabs). Local to one browser, like favorites/strokes.
const KEY = "playerQueue"
const EMPTY: string[] = []
const listeners = new Set<() => void>()
let lastRaw = ""
let lastParsed: string[] = EMPTY

function read(): string[] {
    let raw = ""
    try {
        raw = localStorage.getItem(KEY) ?? ""
    } catch { }
    if (raw !== lastRaw) {
        lastRaw = raw
        try {
            const parsed = JSON.parse(raw || "[]")
            lastParsed = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : EMPTY
        } catch {
            lastParsed = EMPTY
        }
    }
    return lastParsed // same reference until the stored value changes
}

function write(next: string[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(next))
    } catch { }
    listeners.forEach((notify) => notify())
}

function subscribe(notify: () => void) {
    listeners.add(notify)
    window.addEventListener("storage", notify)
    return () => {
        listeners.delete(notify)
        window.removeEventListener("storage", notify)
    }
}

export function usePlayerQueue() {
    const queue = useSyncExternalStore(subscribe, read, () => EMPTY)

    const add = useCallback((slug: string) => {
        const current = read()
        if (!current.includes(slug)) write([...current, slug])
    }, [])

    const remove = useCallback((slug: string) => {
        write(read().filter((s) => s !== slug))
    }, [])

    const toggle = useCallback(
        (slug: string) => {
            if (read().includes(slug)) {
                remove(slug)
            } else {
                add(slug)
            }
        },
        [add, remove]
    )

    const clear = useCallback(() => write([]), [])

    return { queue, has: (slug: string) => queue.includes(slug), add, remove, toggle, clear }
}