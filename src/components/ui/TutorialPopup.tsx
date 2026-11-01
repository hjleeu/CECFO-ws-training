"use client"

import { useEffect, useState } from "react"
import { HelpCircle, X } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { TUTORIALS, TUTORIAL_UI, TutorialLang, TutorialPage } from "@/lib/tutorials"
import "@/styles/tutorial.css"

interface Props { page: TutorialPage }

export function TutorialPopup({ page }: Props) {
    const { language } = useLanguage()
    const [open, setOpen] = useState(false)
    const key = `tutorialSeen:${page}`

    const lang = (language in TUTORIAL_UI ? language : "zh") as TutorialLang
    const ui = TUTORIAL_UI[lang]
    const content = TUTORIALS[page][lang]

    useEffect(() => {
        try {
            setOpen(localStorage.getItem(key) === null)
        } catch {
            setOpen(false)
        }
    }, [key])

    const close = () => {
        setOpen(false)
        try { localStorage.setItem(key, "1") } catch { /* ignore */ }
    }

    useEffect(() => {
        if (open) {
            const onKey = (e: KeyboardEvent) => {
                // keep arrows from switching song in the worship viewer while the popup is open
                if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.stopImmediatePropagation()
                if (e.key === "Escape") close()
            }
            window.addEventListener("keydown", onKey, true)
            return () => window.removeEventListener("keydown", onKey, true)
        }
    }, [open])

    return (
        <>
            <button type="button" className="tutorial-help-btn" onClick={() => setOpen(true)} title={ui.help} aria-label={ui.help}>
                <HelpCircle size={18} />
            </button>

            {open && (
                <div
                    className="tutorial-overlay"
                    onClick={close}
                    onTouchStart={e => e.stopPropagation()}
                    onTouchEnd={e => e.stopPropagation()}
                >
                    <div className="tutorial-modal" role="dialog" aria-modal="true" aria-label={content.title} onClick={e => e.stopPropagation()}>
                        <button type="button" className="tutorial-close" onClick={close} aria-label={ui.close}>
                            <X size={18} />
                        </button>
                        <h2 className="tutorial-title">{content.title}</h2>
                        <ol className="tutorial-steps">
                            {content.steps.map(s => (
                                <li key={s.heading}>
                                    <strong>{s.heading}</strong>
                                    <span>{s.text}</span>
                                </li>
                            ))}
                        </ol>
                        <button type="button" className="tutorial-ok" onClick={close}>{ui.gotIt}</button>
                    </div>
                </div>
            )}
        </>
    )
}