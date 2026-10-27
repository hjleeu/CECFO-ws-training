"use client"

import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { Language } from "@/lib/i18n/translations"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Globe, Home, ListMusic, Moon, Sun, UserStar, type LucideIcon } from "lucide-react"

interface NavItem {
    href: string
    icon: LucideIcon
}

/* Add or remove nav items here. */
const NAV_ITEMS: NavItem[] = [
    { href: '/', icon: Home },
    { href: "/songs", icon: ListMusic },
    { href: "/admin", icon: UserStar }
]

const LANGUAGE_LABELS: Record<Language, string> = {
    zh: "简中",
    en: "EN",
    it: "IT"
}

export function Navbar() {
    const pathname = usePathname()
    const { language, setLanguage, t } = useLanguage()

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

    // Hide the navbar in song details page.
    const isHidden = /^\/songs\/[^/]+$/.test(pathname) || /^\/worship\/[^/]+$/.test(pathname)

    return isHidden ? null : (
        <nav className="navbar">
            <div className="navbar-inner">
                {NAV_ITEMS.map((item: NavItem) => {
                    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item${active ? " nav-item-active" : ''}`}
                            aria-current={active ? "page" : undefined}
                        >
                            <span className="nav-icon"><Icon aria-hidden="true"></Icon></span>
                            <span className="nav-label">{navLabels[item.href]}</span>
                        </Link>
                    )
                })}

                <button className="nav-item nav-theme-btn" onClick={toggleTheme}>
                    <span className="nav-icon">{theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}</span>
                    <span className="nav-label">{theme === "light" ? t.nav.dark : t.nav.light}</span>
                </button>

                <button className="nav-item" onClick={cycleLanguage}>
                    <span className="nav-icon"><Globe aria-hidden="true" /></span>
                    <span className="nav-label">{LANGUAGE_LABELS[language]}</span>
                </button>
            </div>
        </nav>
    )
}