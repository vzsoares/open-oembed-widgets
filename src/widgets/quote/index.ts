import Alpine from "alpinejs";
import { applyThemeFromQuery } from "../../lib/theme";
import {
    parseQuoteConfig,
    pickQuote,
    type Quote,
    type QuoteConfig,
} from "./quote";

applyThemeFromQuery();

const config = parseQuoteConfig(window.location.search);

interface QuoteWidget {
    config: QuoteConfig;
    quote: Quote;
    init(): void;
    shuffle(): void;
}

Alpine.data(
    "quoteWidget",
    (): QuoteWidget => ({
        config,
        quote: { text: "", author: "" },

        init() {
            this.quote = pickQuote(this.config.collection);
        },

        shuffle() {
            this.quote = pickQuote(this.config.collection);
        },
    }),
);

Alpine.start();
