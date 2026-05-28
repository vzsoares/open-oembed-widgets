import Alpine from "alpinejs";
import "../../lib/fit";
import { applyThemeFromQuery } from "../../lib/theme";
import { coinFor } from "../btc/price";
import { createTicker, initialRange } from "../btc/widget";
import { btcRanges } from "../manifest";

applyThemeFromQuery();

const params = new URLSearchParams(window.location.search);
const coin = coinFor(params.get("coin") ?? "bitcoin");
const vs = (params.get("vs") ?? "usd").toLowerCase();

Alpine.data("tickerWidget", () =>
    createTicker({
        coin,
        vs,
        label: `${coin.symbol} / ${vs.toUpperCase()}`,
        ranges: btcRanges,
        initialRange: initialRange(window.location.search, btcRanges, "1m"),
        refreshMs: 60_000,
    }),
);

Alpine.start();
