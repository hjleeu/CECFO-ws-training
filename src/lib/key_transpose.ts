import { Song } from "@/types/MusicNotation"

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const PITCH_MAP: Record<string, number> = {
    'C': 0, 'B#': 0,
    'C#': 1, 'Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4,
    'F': 5, 'E#': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11
}

/**
 * Return the corrected pitch after transposing.
 * @param pitch the input pitch
 * @param semitones number of semitones to switch
 * @param useFlats if are using flats
 */
function transposePitch(pitch: string, semitones: number, useFlats = false): string {
    const index = PITCH_MAP[pitch]

    if (index === undefined) return pitch

    let newIndex = (index + semitones) % 12
    if (newIndex < 0) newIndex += 12

    const scale = useFlats ? FLATS : SHARPS
    return scale[newIndex]
}

/**
 * Return the full chord transposed.
 * @param chord the original chord
 * @param semitones the semitones to tranponse
 * @param useFlats if using flat scale
 */
export function transposeChord(chord: string, semitones: number, useFlats = false): string {
    if (!chord) return chord

    // Handles input like 'C/D'.
    const parts = chord.split('/')
    const mainChord = parts[0]
    const bassNote = parts[1]

    const tranponsedMain = mainChord.replace(/^([A-G][#b]?)(.*)$/, (_, root, suffix) => {
        return transposePitch(root, semitones, useFlats) + suffix
    })

    if (bassNote) {
        const tranponsedBass = bassNote.replace(/^([A-G][#b]?)(.*)$/, (_, root, suffix) => {
            return transposePitch(root, semitones, useFlats) + suffix
        })
        return `${tranponsedMain}/${tranponsedBass}`
    }

    return tranponsedMain
}

export function transposeKey(key: string, semitones: number, useFlats = false): string {
    if (!key) return key
    return key.replace(/([A-G][#b]?)/g, (match) => transposePitch(match, semitones, useFlats))
}

export function transposeSong(song: Song, semitones: number): Song {
    if (semitones === 0) return song

    const targetKey = transposeKey(song.key || 'C', semitones)
    const useFlats = /([Ff]|[Bb]b|[Ee]b|[Aa]b|[Dd]b|[Gg]b)/.test(targetKey)

    return {
        ...song,
        key: transposeKey(song.key, semitones, useFlats),
        measures: song.measures.map(measure => ({
            ...measure,
            notes: measure.notes.map(note => ({
                ...note,
                chord: note.chord ? transposeChord(note.chord, semitones, useFlats) : undefined
            }))
        }))
    }
}