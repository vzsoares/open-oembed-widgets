import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import { type ButtonDef, type LinksConfig, parseLinksConfig } from "./links";

applyThemeFromQuery();

const config = parseLinksConfig(window.location.search);

interface LinksWidget {
    config: LinksConfig;
    /** Inline style for a button's custom color, or "" for the default look. */
    styleFor(button: ButtonDef): string;
}

Alpine.data(
    "linksWidget",
    (): LinksWidget => ({
        config,

        styleFor(button) {
            if (!button.color) return "";
            return `background:${button.color};color:${button.textColor};border-color:${button.color}`;
        },
    }),
);

Alpine.start();
