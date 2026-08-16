import { SongView } from "@/components/sheet/SongView"
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { prisma } from "@/lib/prisma"
import { Song as SongType } from "@/types/MusicNotation"

export const dynamic = 'force-dynamic';

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
    const { t } = useLanguage()

    const { slug } = await params

    const raw = await prisma.song.findUnique({
        where: { slug }
    })

    if (!raw) return <p>{t.song.emptyLibrary}</p>

    const song = raw as unknown as SongType

    return (
        <SongView song={song}></SongView>
    )
}