"use client";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import "@/styles/copyright.css"

const CONTACT_EMAIL = "copyright@cecfo.it";

export default function CopyrightPage() {
    const { t } = useLanguage()
    return (
        <main className="copyright-page">
            <h1>{t.copyright.title}</h1>
            <p>{t.copyright.p1}</p>
            <p>{t.copyright.p2}</p>
            <p>{t.copyright.p3}</p>
            <p>{t.copyright.p4}</p>
            <p className="copyright-contact">
                <strong>{t.copyright.contactLabel}:</strong>{' '}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
        </main>
    )
}