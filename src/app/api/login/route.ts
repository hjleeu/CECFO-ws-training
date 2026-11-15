import { COOKIE, signSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { pwd } = await req.json()
    const ok = pwd === process.env.ADMIN_PWD
    const res = ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "Wrong password" }, { status: 401 })

    if (ok) {
        res.cookies.set(COOKIE, await signSession(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        })
    }
    return res
}