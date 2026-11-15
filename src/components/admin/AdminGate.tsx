"use client"

import { ReactNode, useEffect, useState } from "react";
import "@/styles/admin.css"

export function AdminGate({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<"loading" | "out" | "in">("loading")
    const [pwd, setPwd] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        fetch("/api/login")
            .then(r => r.json())
            .then(d => setStatus(d.ok ? "in" : "out"))
            .catch(() => setStatus("out"))
    }, [])

    async function submit() {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pwd })
        })
        res.ok ? setStatus("in") : setError("Wrong password")
    }

    return status === "in" ? (
        <>{children}</>
    ) : status === "out" ? (
        <div className="admin-gate-backdrop">
            <div className="admin-gate-modal" role="dialog" aria-modal="true">
                <input
                    type="password"
                    autoFocus
                    value={pwd}
                    placeholder="Password"
                    onChange={e => { setPwd(e.target.value); setError('') }}
                    onKeyDown={e => e.key === "Enter" && submit()}
                />
                <button onClick={submit}>Enter</button>
                {error && <p className="admin-gate-error">{error}</p>}
            </div>
        </div>
    ) : null
}