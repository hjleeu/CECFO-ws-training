import { pinyin } from "pinyin-pro";

export function toSlug(title: string): string {
    return pinyin(title, { toneType: "none", type: "array" })
        .join('').toLowerCase().replace(/[^a-z0-9]/g, '')
}