"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Language, translations } from "./translations"

interface LanguageContextValue {
    language: Language
    setLanguage: (l: Language) => void
    t: typeof translations["zh"]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("zh")

    useEffect(() => {
        const stored = localStorage.getItem("language") as Language | null

        if (stored && (stored === "zh" || stored === "en" || stored === "it")) {
            setLanguageState(stored)
        } else {
            // Default browser language preference.
            const browserLang = navigator.language.slice(0, 2)
            setLanguageState(browserLang === "it" ? "it" : (browserLang === "en" ?  "en" : "zh"))
        }
    }, [])

    const setLanguage = (l: Language) => {
        setLanguageState(l)
        localStorage.setItem("language", l)
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const ctx = useContext(LanguageContext)
    if (!ctx) {
        throw new Error("useLanguage must be used within LanguageProvider")
    }
    return ctx
}