import type { Jianpu } from "./Jianpu";

export interface Note {
    note: Jianpu | '-'
    char: string
    pinyin: string
    chord?: string
}

export interface Measure {
    notes: Note[]
}

export interface Row {
    measures: Measure[]
}

export interface Sheet {
    label: string
    rows: Row[]
}

export interface ShowOptions {
    chords: boolean
    jianpu: boolean
    lyrics: boolean
    pinyin: boolean
}