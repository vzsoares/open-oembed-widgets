# Notion oEmbed Widgets

![License](https://img.shields.io/badge/license-MIT-black)

Tiny, monochrome, **client-side** widgets you can embed in [Notion](https://notion.so)
(or any [oEmbed](https://oembed.com/) consumer). No backend — everything runs in
the browser and is hosted on GitHub Pages.

**Live:** https://vzsoares.github.io/notion-oembed-widgets/

## Widgets

| Widget        | URL     | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| Bitcoin Price | `/btc/` | Live BTC/USD price + 24h change, every 60s. |

## Embed in Notion

1. Open the gallery, copy a widget URL (e.g. `…/notion-oembed-widgets/btc/`).
2. In Notion: paste the link → **Create embed** (or type `/embed`).

Each widget page advertises a static oEmbed document via
`<link rel="alternate" type="application/json+oembed">`, so resolvers like
Notion's (Iframely) get a proper `rich` embed.

### Theme

Widgets are monochrome and follow the viewer's OS light/dark preference. Pin a
theme with a query param when the iframe context doesn't inherit it:

- `…/btc/?theme=dark`
- `…/btc/?theme=light`

## Architecture

- **Multi-page** Vite build — one HTML entry per widget gives each a stable
  embed URL (`/btc/`).
- **Static oEmbed** — `scripts/gen-oembed.ts` reads `src/widgets/manifest.ts`
  and writes `dist/<id>/oembed.json` after the Vite build.
- **Resilient data** — the BTC widget tries CoinGecko → Binance → Coinbase →
  Kraken (all public, key-less, CORS-enabled) and shows the first that answers.

```
/
├── index.html                # widget gallery (home)
├── btc/index.html            # BTC widget page (embeddable)
├── src/
│   ├── home.ts               # gallery logic
│   ├── styles.css            # Tailwind + monochrome theme vars
│   ├── lib/theme.ts          # light/dark resolution
│   └── widgets/
│       ├── manifest.ts       # single source of truth for widgets
│       └── btc/
│           ├── index.ts      # Alpine component
│           ├── price.ts      # provider chain + fallback
│           └── price.test.ts # bun tests
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
