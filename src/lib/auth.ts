import { jwtVerify, SignJWT } from "jose"

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET)

export const COOKIE = "admin-session"

export async function signSession() {
    return new SignJWT({ admin: true })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(secret())
}

export async function verifySession(token?: string) {
    try {
        await jwtVerify(token ?? '', secret())
        return true
    } catch {
        return false
    }
}