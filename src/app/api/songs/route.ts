import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(songs)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const song = await prisma.song.create({
      data: {
        title:    body.title,
        slug:     body.slug,
        artist:   body.artist ?? null,
        album:    body.album ?? null,
        key:      body.key,
        bpm:      body.bpm,
        sections: body.sections,
      }
    })

    return NextResponse.json(song, { status: 201 })
  } catch (e) {
    console.log("Db error:", e)
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    )
  }
}