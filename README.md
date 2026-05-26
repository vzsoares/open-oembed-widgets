# Open oEmbed Widgets

![License](https://img.shields.io/badge/license-MIT-black)

Tiny, monochrome, **client-side** widgets you can embed in any
[oEmbed](https://oembed.com/) consumer — [Notion](https://notion.so) and others.
No backend — everything runs in the browser and is hosted on GitHub Pages.

**Live:** https://vzsoares.github.io/open-oembed-widgets/

## Widgets

| Widget        | URL       | Description                                        |
| ------------- | --------- | -------------------------------------------------- |
| Bitcoin Price | `/btc/`   | Live BTC/USD price + sparkline, range 1D–1Y, ~60s. |
| Clock         | `/clock/` | Flip-clock with time + date, timezone & 24h options. |
| Bible Verse   | `/bible/` | Random verse in English or Portuguese.             |

## Embed

1. Open the gallery, pick a theme + range, copy the URL
   (e.g. `…/open-oembed-widgets/btc/?theme=dark&range=1w`).
2. Paste the link into your tool's embed block
   (in Notion: **Create embed**, or type `/embed`).

Widgets have **transparent** backgrounds so they blend into the embedding page.
Each widget page advertises a static oEmbed document via
`<link rel="alternate" type="application/json+oembed">`, so resolvers like
Notion's (Iframely) get a proper `rich` embed.

### Config (query params)

- **Theme** — monochrome, follows the viewer's OS light/dark preference. Pin it
  when the iframe context doesn't inherit it: `?theme=dark` / `?theme=light`.
- **Range** (BTC) — initial chart window: `?range=1d|1w|1m|3m|1y` (default `1m`).
  The range buttons inside the widget stay interactive inside the embed too.
- **Clock** — `?show=time|date|both` (default `both`), `?seconds=1` for a
  seconds tile, `?h24=1` for a 24-hour clock (default: locale), and
  `?tz=Area/City` for an IANA timezone (default: viewer's local).
- **Language** (Bible) — `?lang=en|pt` (default: viewer's locale). EN/PT buttons
  stay interactive in the embed.

## Architecture

- **Multi-page** Vite build — one HTML entry per widget gives each a stable
  embed URL (`/btc/`).
- **Static oEmbed** — `scripts/gen-oembed.ts` reads `src/widgets/manifest.ts`
  and writes `dist/<id>/oembed.json` after the Vite build.
- **Resilient data** — the BTC chart tries CoinGecko → Binance → Coinbase
  (all public, key-less, CORS-enabled) and uses the first that answers. The
  Bible widget uses bible-api.com and falls back to a bundled verse list if the
  API is unreachable, so it always renders.
- **No-dependency chart** — a hand-built SVG sparkline (`chart.ts`), monochrome.
- **Config via manifest** — each widget declares `params` (range, language, …);
  the gallery renders selectors and bakes them into the embed URL.

```
/
├── index.html                # widget gallery (home)
├── btc/index.html            # BTC widget page (embeddable)
├── clock/index.html          # Clock widget page (embeddable)
├── bible/index.html          # Bible widget page (embeddable)
├── src/
│   ├── home.ts               # gallery logic
│   ├── styles.css            # Tailwind + monochrome theme vars
│   ├── lib/theme.ts          # light/dark resolution
│   └── widgets/
│       ├── manifest.ts       # widgets + params (single source)
│       ├── btc/              # index.ts, price.ts, chart.ts, *.test.ts
│       ├── clock/            # index.ts, time.ts, time.test.ts
│       └── bible/            # index.ts, verse.ts, fallback.json, *.test.ts
├── scripts/gen-oembed.ts     # post-build oEmbed JSON generator
└── vite.config.js
```

## Develop

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev          # http://localhost:5173  (and /btc/)
bun test             # unit tests
bun run typecheck    # tsc, both app + tooling configs
bun run format       # prettier
bun run build        # vite build + oEmbed generation -> dist/
bun run preview      # serve the production build
```

Deploys automatically to GitHub Pages on push to `main`
(`.github/workflows/deploy.yml`).

## Add a widget

1. Add an entry to `src/widgets/manifest.ts`.
2. Create `<id>/index.html` + `src/widgets/<id>/index.ts`.
3. Register the page in `vite.config.js` (`build.rollupOptions.input`).

oEmbed JSON and the gallery card are generated from the manifest.

## License

[MIT](LICENSE) · Created by [vzsoares](https://github.com/vzsoares)
