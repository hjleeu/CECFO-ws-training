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
                {(song.artist || song.album) && (
                    <p className="song-artist">
                        {song.artist}
                        {song.artist && song.album ? " • " : ""}
                        {song.album}
                    </p>
                )}
                <p className="song-meta">
                    Key: {song.key} BPM: {song.bpm} 拍号: {song.timeSignature}
                </p>
            </div>
            {song.sections.map((s, i) => (
                <Section key={i} section={s} showOptions={showOptions}></Section>
            ))}
        </div>
    )
}