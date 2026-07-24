import type { Jianpu } from "./Jianpu";

export interface Note {
    note: Jianpu | '-'
    dotted?: boolean
    char: string
    punct?: string
    pinyin: string
    chord?: string
    bracketStart?: boolean
    bracketEnd?: boolean
    bracketNumber?: number
}

export interface Measure {
    notes: Note[]
}

export interface Row {
    measures: Measure[]
}

export interface Section {
    label: string
    rows: Row[]
}

export interface Song {
    title: string
    slug: string
    artist?: string
    album?: string
    key: string
    bpm: number
    timeSignature: string
    sections: Section[]
}

export interface ShowOptions {
    chords: boolean
    jianpu: boolean
    lyrics: boolean
    pinyin: boolean
}