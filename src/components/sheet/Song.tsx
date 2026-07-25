import { Song as SongProps, ShowOptions } from "@/types/MusicNotation";
import { Measure } from "./Measure";
import "@/styles/sheet.css"

interface Props {
    song: SongProps,
    showOptions: ShowOptions
}

export function Song({ song, showOptions }: Props) {
    return (
        <div className="song">
            <div className="song-header">
                <h2 className="song-title">{song.title}</h2>
                <span className="song-meta">{song.artist}·{song.album}</span>
                <span className="song-meta">1= {song.key} {song.timeSignature} | BPM = {song.bpm}</span>
            </div>
            <div className="measures-container">
                {song.measures?.map((measure, index) => {
                    const hasSectionLabel = Boolean(measure.sectionLabel)
                    const noteCount = measure.notes.length || 1

                    return (
                        <div key={measure.id || index} className="measure-wrapper">
                            {hasSectionLabel && (
                                <div className="measure-section-label">
                                    {measure.sectionLabel}
                                </div>
                            )}

                            <div className="measure-content">
                                <Measure
                                    measure={measure}
                                    showOptions={showOptions}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}