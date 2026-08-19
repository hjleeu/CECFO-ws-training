"use client"

import { SongView } from "@/components/sheet/SongView"
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Song as SongType } from "@/types/MusicNotation"
import { use, useEffect, useState } from "react";

interface Props {
    params: Promise<{ slug: string }>
}

const SHOW_OPTION = {
    chords: true,
    jianpu: true,
    lyrics: true,
    pinyin: true
}

export default function SongsPage({ params }: Props) {
    const { t } = useLanguage()

    const { slug } = use(params)

    const [song, setSong] = useState<SongType | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/songs/${slug}`)
        .then(r => r.ok ? r.json() : null)
        .then(setSong)
        .finally(() => setLoading(false))
    }, [slug])

    if (loading) return null
    if (!song) return <p>{t.song.emptyLibrary}</p>

    return (
        <SongView song={song}></SongView>
    )
}