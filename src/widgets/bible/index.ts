import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import { fetchVerse, type Lang, type Verse } from "./verse";

applyThemeFromQuery();

const LANGS: { id: Lang; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "pt", label: "PT" },
];

function initialLang(): Lang {
    const param = new URLSearchParams(window.location.search).get("lang");
    if (param === "en" || param === "pt") return param;
    return navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

interface BibleWidget {
    langs: typeof LANGS;
    lang: Lang;
    verse: Verse | null;
    loading: boolean;
    init(): void;
    load(): Promise<void>;
    refresh(): void;
    setLang(lang: Lang): void;
    readonly quote: string;
}

Alpine.data(
    "bibleWidget",
    (): BibleWidget => ({
        langs: LANGS,
        lang: initialLang(),
        verse: null,
        loading: true,

        init() {
            void this.load();
        },

        async load() {
            this.loading = true;
            this.verse = await fetchVerse(this.lang);
            this.loading = false;
        },

        refresh() {
            void this.load();
        },

        setLang(lang) {
            if (lang === this.lang) return;
            this.lang = lang;
            this.verse = null;
            void this.load();
        },

        get quote() {
            return this.verse ? `“${this.verse.text}”` : "";
        },
    }),
);

Alpine.start();
