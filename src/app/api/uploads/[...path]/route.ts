import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs"
import path from "path";

const ROOT = path.join(process.cwd(), "public", "uploads")
const TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a"
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params
  const file = path.join(ROOT, ...parts)
  const type = TYPES[path.extname(file).toLowerCase()]
  const notFound = new NextResponse("Not found", { status: 404 })

  return file.startsWith(ROOT + path.sep) && type
    ? fs.readFile(file).then(buf => {
        const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") ?? '')
        const start = m && m[1] ? parseInt(m[1]) : 0
        const end = m && m[2] ? parseInt(m[2]) : buf.length - 1
        const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" }
        return m
          ? new NextResponse(new Uint8Array(buf.subarray(start, end + 1)), {
              status: 206,
              headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${buf.length}` },
            })
          : new NextResponse(new Uint8Array(buf), { headers })
      }).catch(() => notFound)
    : notFound
}