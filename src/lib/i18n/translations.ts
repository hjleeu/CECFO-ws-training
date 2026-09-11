export type Language = "zh" | "en" | "it"

export const translations = {
    zh: {
        home: {
            worshipSets: "敬拜歌单",
            all: "查看全部"
        },
        nav: {
            home: "首页",
            songs: "曲库",
            admin: "管理",
            theme: "主题",
            dark: "暗色",
            light: "亮色"
        },
        select: {
            new: "新增"
        },
        metronome: {
            metronome: "节拍器",
            play: "播放",
            stop: "停止"
        },
        song: {
            show: "显示",
            lyrics: "歌词",
            chords: "和弦",
            jianpu: "歌谱",
            pinyin: "拼音",

            back: "返回",
            transpose: "调性",
            down: "降半调",
            up: "升半调",
            reset: "重置",
            original: "原调",

            favorite: "我的收藏",
            emptyFavorite: "点击爱心添加到收藏。",
            latest: "最近更新",
            all: "查看全部",
            random: "随机推荐",
            library: "曲库",
            emptyLibrary: "暂未任何歌谱数据。"
        },
        admin: {
            heading: "管理页面",
            load: "载入已有歌曲",
            editing: "编辑中",
            clear: "清空",

            title: "歌名",
            artist: "艺术家",
            album: "专辑",
            timeSignature: "拍号",

            save: "录入"
        }
    },
    it: {
        home: {
            worshipSets: "Worship sets",
            all: "Visualizza tutti"
        },
        nav: {
            home: "Home",
            songs: "Libreria",
            admin: "Gestione",
            theme: "Tema",
            dark: "Scuro",
            light: "Chiaro"
        },
        select: {
            new: "Nuovo"
        },
        metronome: {
            metronome: "Metronomo",
            play: "Play",
            stop: "Stop"
        },
        song: {
            show: "Visualizza",
            lyrics: "Testo",
            chords: "Accordi",
            jianpu: "Jianpu",
            pinyin: "Pinyin",

            back: "Torna indietro",
            transpose: "Tonalità",
            down: "Abbassa",
            up: "Alza",
            reset: "Ripristina",
            original: "Originale",

            favorite: "Preferiti",
            emptyFavorite: "Click sul cuore per aggiungre ai preferiti.",
            latest: "Ultimi aggiornamenti",
            all: "Visualizza tutti",
            random: "Consigli random",
            library: "Catalogo",
            emptyLibrary: "Nessun dato per il momento."
        },
        admin: {
            heading: "Pagina di gestione",
            load: "Carica esistente",
            editing: "Modificando",
            clear: "Svuota",

            title: "Titolo",
            artist: "Artista",
            album: "Album",
            timeSignature: "Battito",

            save: "Salva"
        }
    },
    en: {
        home: {
            worshipSets: "Worship sets",
            all: "View all"
        },
        nav: {
            home: "Home",
            songs: "Songs",
            admin: "Admin",
            theme: "Theme",
            dark: "Dark",
            light: "Light"
        },
        select: {
            new: "New"
        },
        metronome: {
            metronome: "Metronome",
            play: "Play",
            stop: "Stop"
        },
        song: {
            show: "Show",
            lyrics: "Lyrics",
            chords: "Chords",
            jianpu: "Jianpu",
            pinyin: "Pinyin",

            back: "Go back",
            transpose: "Key",
            down: "Down",
            up: "Up",
            reset: "Reset",
            original: "Original",

            favorite: "Favorites",
            emptyFavorite: "Try to add song to favorites.",
            latest: "Latest updates",
            all: "Show all",
            random: "Recommended random",
            library: "Library",
            emptyLibrary: "There are no songs yet."
        },
        admin: {
            heading: "Admin page",
            load: "Load from db",
            editing: "Editing",
            clear: "Clear",

            title: "Title",
            artist: "Artist",
            album: "Album",
            timeSignature: "Time signature",

            save: "Save"
        }
    }
}

export type TranslationKey = typeof translations["zh"]