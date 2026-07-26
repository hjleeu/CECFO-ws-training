export type JianpuBase     = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7"
export type JianpuOctave   = "" | "'" | "''" | "," | ",,"
export type JianpuDuration = "" | "/" | "//"
export type JianpuAccidental = '' | '#' | 'b' | '='
export type Jianpu         = `${JianpuAccidental}${JianpuBase}${JianpuOctave}${JianpuDuration}`