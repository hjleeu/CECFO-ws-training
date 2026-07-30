import { prisma } from "@/lib/prisma";

export default async function SongsPage() {
    const songs = await prisma.song.findMany({
        orderBy: {title: "asc"}
    })

    return (
        <div>
            {songs.map(s => (
                <span style={{display: "block"}}>
                    <a href={`songs/${s.slug}`}>{s.title} | {s.artist} - {s.album}</a>
                </span>
            ))}
        </div>
    )
}