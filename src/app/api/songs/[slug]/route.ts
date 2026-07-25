import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

interface Props {
    params: Promise<{ slug: string }>
}

export async function GET(_: Request, { params }: Props) {
    const { slug } = await params

    const song = await prisma.song.findUnique({ where: {slug} })
    if (!song) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    return NextResponse.json(song)
}

/**
 * Update the song.
 * @param request the request
 * @param param1 the identifier of the song
 * @returns a NextResponse
 */
export async function PUT(request: Request, { params }: Props) {
    const { slug } = await params

    const body = await request.json()

    try {
        const song = await prisma.song.update({
            where: { slug },
            data: {
                title: body.title,
                slug: body.slug,
                artist: body.artist ?? null,
                album: body.album ?? null,
                key: body.key,
                bpm: body.bpm,
                timeSignature: body.timeSignature,
                measures: body.measures
            }
        })
        return NextResponse.json(song)
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}