import type { Jianpu } from "./Jianpu";

export interface Note {
    note: Jianpu | '-'
    dotted?: boolean
    fermata?: boolean
    char: string
    punct?: string
    pinyin: string
    chord?: string
    bracketStart?: boolean
    bracketEnd?: boolean
    bracketNumber?: number
}

export interface Measure {
    id: string
    notes: Note[]
    sectionLabel?: string
}

export interface Song {
    title: string
    slug: string
    artist?: string
    album?: string
    key: string
    bpm: number
    timeSignature: string
    measures: Measure[]
}

export interface ShowOptions {
    chords: boolean
    jianpu: boolean
    lyrics: boolean
    pinyin: boolean
}