"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface NavItem {
    href: string
    label: string
    icon: string
}

/* Add or remove nav items here. */
const NAV_ITEMS: NavItem[] = [
    { href: '/', label: "首页", icon: "🏠︎" },
    { href: "/songs", label: "曲库", icon: "🔍︎" },
    { href: "/admin", label: "管理", icon: "♬" }
]

export function Navbar() {
    const pathname = usePathname()

    /* Default use light theme. */
    const [theme, setTheme] = useState<"light" | "dark">("light")

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const stored = localStorage.getItem("theme") as "light" | "dark" | null

        if (stored) {
            setTheme(stored)
            document.documentElement.dataset.theme = stored
        } else {
            setTheme(mq.matches ? "dark" : "light")
        }
    }, [])

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light"
        setTheme(next)
        document.documentElement.dataset.theme = next
        localStorage.setItem("theme", next)
    }

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {NAV_ITEMS.map(item => {
                    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item${active ? " nav-item-active" : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </Link>
                    )
                })}

                <button className="nav-item nav-theme-btn" onClick={toggleTheme}>
                    <span className="nav-icon">{theme === "light" ? "☾" : "☀︎"}</span>
                    <span className="nav-label">{theme === "light" ? "暗色" : "亮色"}</span>
                </button>
            </div>
        </nav>
    )
}