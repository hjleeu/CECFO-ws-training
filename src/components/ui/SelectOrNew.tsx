"use client"

import { useLanguage } from "@/lib/i18n/LanguageProvider"
import { useState } from "react"

interface Props {
    options: string[]
    value: string
    onChange: (val: string) => void
    placeholder: string
    label: string
    id: string
}

export function SelectOrNew({ options, value, onChange, placeholder, label, id }: Props) {
    const [isNew, setIsNew] = useState(false)

    const { t } = useLanguage()

    return (
        <div className="select-or-new">
            {!isNew ? (
                <select
                    id={id}
                    className="meta-input"
                    value={value}
                    onChange={e => {
                        if (e.target.value === "__new__") {
                            setIsNew(true)
                            onChange('')
                        } else {
                            onChange(e.target.value)
                        }
                    }}
                >
                    <option value="" disabled>{placeholder}</option>
                    {options.map(o => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                    <option value="__new__">+ {t.select.new}...</option>
                </select>
            ) : (
                <div className="new-input-row">
                    <input
                        type="text"
                        className="meta-input"
                        value={value}
                        placeholder={placeholder}
                        onChange={e => onChange(e.target.value)}
                        autoFocus
                    />
                    <button className="cancel-new-btn" onClick={() => { setIsNew(false); onChange('') }}>✕</button>
                </div>
            )}
        </div>
    )
}