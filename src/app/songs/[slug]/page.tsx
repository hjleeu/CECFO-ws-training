import { SongView } from "@/components/sheet/SongView"
import { prisma } from "@/lib/prisma"
import { Song as SongType } from "@/types/MusicNotation"

interface Props {
    params: Promise<{ slug: string }>
}

const SHOW_OPTION = {
    chords: true,
    jianpu: true,
    lyrics: true,
    pinyin: true
}

export default async function SongsPage({ params }: Props) {
    const { slug } = await params

    const raw = await prisma.song.findUnique({
        where: { slug }
    })

    if (!raw) return <p>There are no songs.</p>

    const song = raw as unknown as SongType

    return (
        <SongView song={song}></SongView>
    )
}