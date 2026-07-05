import type { Jianpu } from "./Jianpu";

export interface Note {
    note: Jianpu
    char: string
    pinyin: string
}

export interface Measure {
    chords: string[]
    notes: Note[]
}

export interface Row {
    measures: Measure[]
}

export interface Sheet {
    rows: Row[]
}