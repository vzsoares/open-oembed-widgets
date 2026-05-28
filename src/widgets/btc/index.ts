import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import { btcRanges } from "../manifest";
import { BITCOIN } from "./price";
import { createTicker, initialRange } from "./widget";

applyThemeFromQuery();

Alpine.data("btcWidget", () =>
    createTicker({
        coin: BITCOIN,
        vs: "usd",
        label: "BTC / USD",
        ranges: btcRanges,
        initialRange: initialRange(window.location.search, btcRanges, "1m"),
        refreshMs: 60_000,
    }),
);

Alpine.start();
