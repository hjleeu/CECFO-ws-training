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

export interface Section {
    label: string
    rows: Row[]
}

export interface Song {
    title: string
    subtitle: string
    key: string
    bpm: number
    sections: Section[]
}

export interface ShowOptions {
    chords: boolean
    jianpu: boolean
    lyrics: boolean
    pinyin: boolean
}