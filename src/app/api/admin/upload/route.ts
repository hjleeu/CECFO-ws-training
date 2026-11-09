import { mkdir, writeFile } from "fs/promises"
import { NextRequest, NextResponse } from "next/server"
import path from "path"

const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"]
const AUDIO_TYPES = ["audio/mp3", "audio/mpeg", "audio/mp4", "audio/x-m4a"]
const LRC_EXTENSIONS = ["lrc", "txt"]
const MAX_COVER_BYTES = 5 * 1024 * 1024
const MAX_AUDIO_BYTES = 50 * 1024 * 1024
const MAX_LRC_BYTES = 200 * 1024

const EXT_BY_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a"
}

const SUBDIR_BY_KIND = { cover: "covers", audio: "audio", lrc: "lyrics" } as const

function isValidUtf8(bytes: Buffer): boolean {
    try {
        new TextDecoder("utf-8", { fatal: true }).decode(bytes)
        return true
    } catch {
        return false
    }
}

export async function POST(request: NextRequest) {
    const formData = await request.formData()
    const file = formData.get("file")
    const kind = formData.get("kind")
    const slug = formData.get("slug")

    const isValidInput =
        file instanceof File &&
        (kind === "cover" || kind === "audio" || kind === "lrc") &&
        typeof slug === "string" &&
        slug.length > 0

    if (!isValidInput) {
        return NextResponse.json({ error: "Missing or invalid file, kind or slug." }, { status: 404 })
    }

    // browsers report .lrc as application/octet-stream or "", so check the extension
    const fileExt = path.extname(file.name).slice(1).toLowerCase()
    const allowedTypes = kind === "cover" ? COVER_TYPES : AUDIO_TYPES
    const isAllowedType = kind === "lrc" ? LRC_EXTENSIONS.includes(fileExt) : allowedTypes.includes(file.type)
    const maxBytes = kind === "cover" ? MAX_COVER_BYTES : kind === "audio" ? MAX_AUDIO_BYTES : MAX_LRC_BYTES

    if (isAllowedType) {
        if (file.size <= maxBytes) {
            const bytes = Buffer.from(await file.arrayBuffer())

            // a GBK/Big5 .lrc would show garbled Chinese: reject it here
            if (kind !== "lrc" || isValidUtf8(bytes)) {
                try {
                    const subDir = SUBDIR_BY_KIND[kind]
                    const uploadDir = path.join(process.cwd(), "public", "uploads", subDir)

                    await mkdir(uploadDir, { recursive: true })

                    const ext = kind === "lrc" ? "lrc" : EXT_BY_MIME[file.type] ?? "bin"
                    const filename = `${slug}.${ext}`
                    await writeFile(path.join(uploadDir, filename), bytes)

                    const publicUrl = `/uploads/${subDir}/${filename}`

                    return NextResponse.json({ url: publicUrl })
                } catch (error) {
                    console.error("Upload failed:", error)
                    return NextResponse.json({ error: "Could not save the file." }, { status: 500 })
                }
            } else {
                return NextResponse.json({ error: "Lyrics file must be UTF-8 encoded." }, { status: 400 })
            }
        } else {
            const maxMb = maxBytes / (1024 * 1024)
            return NextResponse.json({ error: `File exceeds ${maxMb}MB limit.` }, { status: 400 })
        }
    } else {
        return NextResponse.json({ error: `Unsupported file type: ${file.type || fileExt}` }, { status: 400 })
    }
}