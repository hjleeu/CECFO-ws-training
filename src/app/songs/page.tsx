import { prisma } from "@/lib/prisma";

export default async function SongsPage() {
    const songs = await prisma.song.findMany({
        orderBy: {title: "asc"}
    })

    return (
        <ul>
            {songs.map(song => (
                <li key={song.id}>
                    {song.title}
                </li>
            ))}
        </ul>
    )
}