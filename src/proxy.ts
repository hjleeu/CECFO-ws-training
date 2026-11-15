import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifySession } from "./lib/auth";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl
    const isWriteApi = pathname !== "/api/login" && req.method !== "GET"

    const ok = isWriteApi
        ? await verifySession(req.cookies.get(COOKIE)?.value)
        : true

    return ok
        ? NextResponse.next()
        : NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export const config = { matcher: ["/api/:path*"] }