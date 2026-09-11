import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Props) {
    const { id } = await params

    const worshipSet = await prisma.worshipSet.findUnique({
        where: { id },
        include: {
            songs: { orderBy: { order: "asc" }, include: { song: true } }
        }
    })

    if (!worshipSet) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(worshipSet)
}

export async function PUT(request: Request, { params }: Props) {
    const { id } = await params

    try {
        const body = await request.json()

        await prisma.worshipSetSong.deleteMany({ where: { worshipSetId: id } })

        const worshipSet = await prisma.worshipSet.update({
            where: { id },
            data: {
                ...(body.name ? { name: body.name} : {}),
                ...(body.date ? { date: new Date(body.date) } : {}),
                songs: {
                    create: (body.songSlugs ?? []).map((slug: string, i: number) => ({
                        songSlug: slug,
                        order: i
                    }))
                }
            },
            include: {
                songs: { orderBy: { order: "asc" }, include: { song: true } }
            }
        })

        return NextResponse.json(worshipSet)
    } catch (e) {
        console.error("DB error -> ", e)
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}

export async function DELETE(_:Request, { params }: Props) {
    const { id } = await params

    try {
        await prisma.worshipSet.delete({ where: { id } })
        return NextResponse.json({ ok: true})
    } catch (e) {
        console.error("DB error -> ", e)
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}