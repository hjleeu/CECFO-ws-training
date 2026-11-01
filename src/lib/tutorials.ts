export type TutorialPage = "home" | "songs" | "song" | "worship" | "admin"
export type TutorialLang = "zh" | "en" | "it"

interface Step { heading: string; text: string }
interface Content { title: string; steps: Step[] }

export const TUTORIAL_UI: Record<TutorialLang, { help: string; close: string; gotIt: string }> = {
    zh: { help: "教程", close: "关闭", gotIt: "我已了解" },
    en: { help: "Tutorial", close: "Close", gotIt: "Got it" },
    it: { help: "Aiuto", close: "Chiudi", gotIt: "Ho capito" }
}

export const TUTORIALS: Record<TutorialPage, Record<TutorialLang, Content>> = {
    home: {
        zh: {
            title: "欢迎", steps: [
                { heading: "收藏的歌曲", text: "在歌曲卡片上点击爱心，歌曲会出现在首页。" },
                { heading: "敬拜歌单", text: "点击歌单进入现场查看模式。「全部」可查看所有歌单。" },
                { heading: "已过期歌单", text: "过期歌单默认隐藏，点击按钮可显示。" },
            ]
        },
        en: {
            title: "Welcome", steps: [
                { heading: "Favorite songs", text: "Tap the heart on a song card and it shows up here." },
                { heading: "Worship sets", text: "Tap a set to open the live viewer. \"All\" lists every set." },
                { heading: "Past sets", text: "Past sets are hidden by default; use the button to show them." },
            ]
        },
        it: {
            title: "Benvenuto", steps: [
                { heading: "Canzoni preferite", text: "Tocca il cuore su una canzone e comparirà qui." },
                { heading: "Worship set", text: "Tocca un set per aprire la vista live. «Tutti» mostra tutti i set." },
                { heading: "Set passati", text: "I set passati sono nascosti; usa il pulsante per mostrarli." },
            ]
        },
    },
    songs: {
        zh: {
            title: "歌曲库", steps: [
                { heading: "搜索", text: "输入标题、艺术家、专辑即可搜索。" },
                { heading: "筛选", text: "按艺术家、调性筛选；「有音频」只显示带参考音频的歌曲。" },
                { heading: "收藏", text: "点击卡片上的爱心收藏；点击卡片打开乐谱。" },
            ]
        },
        en: {
            title: "Song library", steps: [
                { heading: "Search", text: "Type a title, artist or album to search." },
                { heading: "Filters", text: "Filter by artist or key; \"With audio\" shows only songs with a reference track." },
                { heading: "Favorites", text: "Tap the heart on a card to favorite it; tap the card to open the sheet." },
            ]
        },
        it: {
            title: "Libreria canzoni", steps: [
                { heading: "Ricerca", text: "Scrivi titolo, artista o album per cercare." },
                { heading: "Filtri", text: "Filtra per artista o tonalità; «Con audio» mostra solo le canzoni con traccia di riferimento." },
                { heading: "Preferiti", text: "Tocca il cuore sulla card per salvarla; tocca la card per aprire lo spartito." },
            ]
        },
    },
    song: {
        zh: {
            title: "乐谱页面", steps: [
                { heading: "设置面板", text: "点击右下的滑块按钮：显示/隐藏和弦、简谱、拼音、歌词。" },
                { heading: "转调与字号", text: "♭/♯ 转调（只改和弦），A−/A+ 调整字号，设置会保存在本机。" },
                { heading: "音频与节拍器", text: "有参考音频时可播放、拖动进度、后退5秒；节拍器按歌曲的速度和拍号。" },
                { heading: "手写批注", text: "点击笔按钮：笔、荧光笔、橡皮、选择。单指书写，双指滚动或缩放。批注只保存在本机。" },
                { heading: "歌单模式", text: "在歌单中左右滑动或按方向键切换歌曲。" },
            ]
        },
        en: {
            title: "Song sheet", steps: [
                { heading: "Settings panel", text: "Tap the sliders button to show/hide chords, jianpu, pinyin and lyrics." },
                { heading: "Transpose & size", text: "♭/♯ transposes (chords only); A−/A+ changes text size. Saved on this device." },
                { heading: "Audio & metronome", text: "If the song has a reference track you can play it, seek and skip back 5s; the metronome follows the song's tempo and meter." },
                { heading: "Handwritten notes", text: "Tap the pen button: pen, highlighter, eraser, select. One finger draws, two fingers scroll or zoom. Notes stay on this device only." },
                { heading: "Worship set mode", text: "Inside a set, swipe left/right or use the arrow keys to change song." },
            ]
        },
        it: {
            title: "Spartito", steps: [
                { heading: "Pannello impostazioni", text: "Tocca il pulsante con i cursori per mostrare/nascondere accordi, jianpu, pinyin e testo." },
                { heading: "Trasposizione e dimensione", text: "♭/♯ traspone (solo gli accordi); A−/A+ cambia la dimensione. Salvato su questo dispositivo." },
                { heading: "Audio e metronomo", text: "Se c'è una traccia di riferimento puoi ascoltarla, spostarti e tornare indietro di 5s; il metronomo segue tempo e metro della canzone." },
                { heading: "Appunti a mano", text: "Tocca il pulsante della penna: penna, evidenziatore, gomma, selezione. Un dito disegna, due dita scorrono o zoomano. Gli appunti restano solo su questo dispositivo." },
                { heading: "Modalità worship set", text: "In un set, scorri a sinistra/destra o usa le frecce per cambiare canzone." },
            ]
        },
    },
    worship: {
        zh: {
            title: "敬拜歌单", steps: [
                { heading: "查看", text: "点击歌单进入现场模式，歌曲逐首显示。" },
                { heading: "切换歌曲", text: "左右滑动、方向键或底部圆点。" },
                { heading: "编辑", text: "可重命名歌单、调整顺序、增删歌曲。" },
            ]
        },
        en: {
            title: "Worship sets", steps: [
                { heading: "Open", text: "Tap a set to enter live mode, one song at a time." },
                { heading: "Change song", text: "Swipe, use the arrow keys or the dots." },
                { heading: "Edit", text: "Rename a set, reorder it, add or remove songs." },
            ]
        },
        it: {
            title: "Worship set", steps: [
                { heading: "Apri", text: "Tocca un set per entrare in modalità live, una canzone alla volta." },
                { heading: "Cambia canzone", text: "Scorri, usa le frecce o i puntini." },
                { heading: "Modifica", text: "Rinomina il set, riordinalo, aggiungi o rimuovi canzoni." },
            ]
        },
    },
    admin: {
        zh: {
            title: "编辑歌曲", steps: [
                { heading: "基本信息", text: "填写标题、艺术家、专辑（先选艺术家）、调性、速度、拍号。可上传封面和参考音频。" },
                { heading: "简谱写法", text: "一行音符，下一行歌词。[G] 和弦；| 小节线；- 延长；1' 高八度，1, 低八度；1/ 八分音符；1~2 连音线。" },
                { heading: "段落", text: "单独一行 [Verse 1] 作为段落标题。" },
                { heading: "预览与保存", text: "右侧实时预览，确认后点击保存。" },
            ]
        },
        en: {
            title: "Song editor", steps: [
                { heading: "Basic info", text: "Fill in title, artist, album (pick the artist first), key, tempo, time signature. You can upload a cover and a reference track." },
                { heading: "Jianpu syntax", text: "A line of notes, then a line of lyrics. [G] chord; | barline; - hold; 1' high octave, 1, low octave; 1/ eighth note; 1~2 tie." },
                { heading: "Sections", text: "A line like [Verse 1] starts a section." },
                { heading: "Preview & save", text: "The preview updates live; press save when happy." },
            ]
        },
        it: {
            title: "Editor canzoni", steps: [
                { heading: "Dati base", text: "Compila titolo, artista, album (prima l'artista), tonalità, tempo, metro. Puoi caricare copertina e traccia di riferimento." },
                { heading: "Sintassi jianpu", text: "Una riga di note, poi una riga di testo. [G] accordo; | stanghetta; - nota tenuta; 1' ottava alta, 1, ottava bassa; 1/ ottavo; 1~2 legatura." },
                { heading: "Sezioni", text: "Una riga come [Verse 1] inizia una sezione." },
                { heading: "Anteprima e salvataggio", text: "L'anteprima si aggiorna in tempo reale; salva quando sei soddisfatto." },
            ]
        }
    }
}