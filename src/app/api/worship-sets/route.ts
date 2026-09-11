import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const worshipSets = await prisma.worshipSet.findMany({
        orderBy: {date: "desc"},
        include: {songs: {orderBy: {order: "asc"}, include: {song: true}}}
    })

    return NextResponse.json(worshipSets)
}

export async function POST(request:Request) {
    try {
        const body = await request.json()

        const worshipSet = await prisma.worshipSet.create({
            data: {
                name: body.name,
                date: new Date(body.date),
                songs: {
                    create: (body.songSlugs ?? []).map((slug: string, i: number) => ({
                        songSlug: slug,
                        order: i
                    }))
                }
            },
            include:  {
                songs: { orderBy: { order: "asc"}, include: { song: true } }
            }
        })

        return NextResponse.json(worshipSet, { status: 201 })
    } catch (e) {
        console.error("DB error -> ", e)
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}