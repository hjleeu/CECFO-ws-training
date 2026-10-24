import { mkdir, writeFile } from "fs/promises"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"]
const AUDIO_TYPES = ["audio/mp3", "audio/mpeg", "audio/mp4", "audio/x-m4a"]
const MAX_COVER_BYTES = 5 * 1024 * 1024
const MAX_AUDIO_BYTES = 50 * 1024 * 1024

const EXT_BY_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a"
}

export async function POST(request: NextRequest) {
    const formData = await request.formData()
    const file = formData.get("file")
    const kind = formData.get("kind")
    const slug = formData.get("slug")

    const isValidInput = 
        file instanceof File &&
        (kind === "cover" || kind === "audio") &&
        typeof slug === "string" &&
        slug.length > 0

    if (!isValidInput) {
        return NextResponse.json({ error: "Missing or invalid file, kind or slug." }, { status: 404 })
    }

    const allowedTypes = kind === "cover" ? COVER_TYPES : AUDIO_TYPES
    const maxBytes = kind === "cover" ? MAX_COVER_BYTES : MAX_AUDIO_BYTES

    if (allowedTypes.includes(file.type)) {
        if (file.size <= maxBytes) {
            const subDir = kind === "cover" ? "covers" : "audio"
            const uploadDir = path.join(process.cwd(), "public", "uploads", subDir)

            await mkdir(uploadDir, { recursive: true })

            const ext = EXT_BY_MIME[file.type] ?? "bin"
            const filename = `${slug}.${ext}`
            const bytes = Buffer.from(await file.arrayBuffer())
            await writeFile(path.join(uploadDir, filename), bytes)

            const publicUrl = `uploads/${subDir}/${filename}`

            return NextResponse.json({ url: publicUrl })
        } else {
            const maxMb = maxBytes / (1024 * 1024)
            return NextResponse.json({ error: `File exceeds ${maxMb}MB limit.` }, { status: 400 })
        }
    } else {
        return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 })
    }
}