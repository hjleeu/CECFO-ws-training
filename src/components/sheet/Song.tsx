import { Song as SongProps, ShowOptions } from "@/types/MusicNotation";
import { Section } from "./Section";

interface Props {
    song: SongProps,
    showOptions: ShowOptions
}

export function Song({ song, showOptions }: Props) {
    return (
        <div className="song">
            <div className="song-header">
                <h2 className="song-title">{song.title}</h2>
                {song.subtitle && (
                    <p className="song-subtitle">{song.subtitle}</p>
                )}
                <p className="song-meta">
                    Key: {song.key} BPM: {song.bpm}
                </p>
            </div>
            {song.sections.map((s, i) => (
                <Section key={i} section={s} showOptions={showOptions}></Section>
            ))}
        </div>
    )
}