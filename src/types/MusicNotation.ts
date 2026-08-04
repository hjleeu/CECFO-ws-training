import type { Jianpu } from "./Jianpu";

export interface Note {
    note: Jianpu | '-'
    dotted?: boolean
    fermata?: boolean
    lyrics: LyricEntry[]
    chord?: string
}

export interface LyricEntry {
    char: string
    pinyin: string
    punct?: string
}

export interface Measure {
    id: string
    notes: Note[]
    sectionLabel?: string
}

export interface BracketSpan {
    id: string
    startMeasure: number
    startNote: number
    endMeasure: number
    endNote: number
    number?: number
    level: number
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
    brackets: BracketSpan[]
}

export interface ShowOptions {
    chords: boolean
    jianpu: boolean
    lyrics: boolean
    pinyin: boolean
}