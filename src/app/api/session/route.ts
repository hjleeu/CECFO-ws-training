import { COOKIE, verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const token = (await cookies()).get(COOKIE)?.value
    return NextResponse.json({ ok: await verifySession(token) })
}