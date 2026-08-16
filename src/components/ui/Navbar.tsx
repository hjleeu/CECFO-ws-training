"use client"

import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { Language } from "@/lib/i18n/translations"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface NavItem {
    href: string
    icon: string
}

/* Add or remove nav items here. */
const NAV_ITEMS: NavItem[] = [
    { href: '/', icon: "🏠︎" },
    { href: "/songs", icon: "🔍︎" },
    { href: "/admin", icon: "♬" }
]

const LANGUAGE_LABELS: Record<Language, string> = {
    zh: "简中",
    en: "EN",
    it: "IT"
}

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

    const { language, setLanguage, t } = useLanguage()
    
    const cycleLanguage = () => {
        const order: Language[] = ["zh", "en", "it"]
        const next = order[(order.indexOf(language) + 1) % order.length]
        setLanguage(next)
    }

    const navLabels: Record<string, string> = {
        '/': t.nav.home,
        "/songs": t.nav.songs,
        "/admin": t.nav.admin
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
                            <span className="nav-label">{navLabels[item.href]}</span>
                        </Link>
                    )
                })}

                <button className="nav-item nav-theme-btn" onClick={toggleTheme}>
                    <span className="nav-icon">{theme === "light" ? "☾" : "☀︎"}</span>
                    <span className="nav-label">{theme === "light" ? t.nav.dark : t.nav.light}</span>
                </button>

                <button className="nav-item" onClick={cycleLanguage}>
                    <span className="nav-icon">🌐</span>
                    <span className="nav-label">{LANGUAGE_LABELS[language]}</span>
                </button>
            </div>
        </nav>
    )
}