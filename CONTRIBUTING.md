# Contributing

Thanks for your interest! This is a collection of tiny, **client-side-only**,
monochrome widgets that any oEmbed consumer (Notion, etc.) can embed. Each
widget is its own page, built with [Vite](https://vitejs.dev),
[Alpine.js](https://alpinejs.dev) and [Tailwind CSS](https://tailwindcss.com),
and deployed as static files to GitHub Pages.

## Principles

Keep new widgets consistent with the existing ones:

- **Client-side only.** No backend. Data comes from the device (clock), public
  key-less APIs (BTC, Bible), or query params (timer, images). If a widget needs
  data, fetch from CORS-enabled public endpoints and **always render something**
  (skeleton, default, or bundled fallback) so it never shows a broken state.
- **Monochrome + transparent.** Use the theme tokens (`bg`, `fg`, `muted`,
  `border`) so the widget adapts to light/dark and blends into the host page.
- **Themable.** Honor `?theme=light|dark` via `applyThemeFromQuery()` from
  `src/lib/theme.ts`.
- **Configurable via the URL.** Expose options as query params and surface them
  in the gallery through the manifest (see below).

## Setup

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev          # http://localhost:5173 (and /<widget>/)
```

## Adding a widget

A widget is the manifest entry + a page + a registration. Using `clock` as the
simplest reference and `btc` for a data-fetching one:

1. **Manifest** — add a `WidgetDef` to `src/widgets/manifest.ts`. Set `id`
   (URL slug + folder), `title`, `description`, default `width`/`height`, and
   any `params`. The gallery card and `oembed.json` are generated from this.

2. **Page** — create `<id>/index.html`. Copy the `<head>` from an existing
   widget and update the title/description and the oEmbed/Open-Graph URLs to
   your `<id>`. Point the module script at `src/widgets/<id>/index.ts`.

3. **Widget logic** — create `src/widgets/<id>/index.ts`. Call
   `applyThemeFromQuery()`, then register an Alpine component with
   `Alpine.data(...)` and `Alpine.start()`. Keep **pure logic** (parsing,
   formatting, calculations) in a sibling module (e.g. `config.ts`, `time.ts`)
   so it can be unit-tested without a DOM. Reuse the shared libs where they fit:
   - `src/lib/interval.ts` — a self-correcting tick (used by `clock`, `timer`).
   - `src/lib/duration.ts` — d/h/m/s splitting + display segments.
   - `src/lib/theme.ts` — theme resolution.

4. **Register the page** — add it to `build.rollupOptions.input` in
   `vite.config.js` so it's built and served.

### Config params

Each `WidgetParam` becomes a query param and a gallery control. Three `type`s
are supported:

- `select` (default) — a row of option buttons; requires `options`.
- `datetime` — a `datetime-local` picker (see `timer`'s `date`).
- `text` — a free text field with an optional `placeholder` (see `images`' `src`).

Free inputs commit on change (not per keystroke). A blank value is omitted from
the URL, so design the widget to fall back to a sensible default when a param is
missing or invalid.

## Quality checks

Run all of these before opening a PR and fix anything they flag — CI runs the
same gate before deploying:

```bash
bun run lint         # biome (lint + format check)
bun run format       # biome --write (auto-fix)
bun run typecheck    # tsc (app + tooling)
bun run test         # unit tests (bun:test, src/)
bun run test:e2e     # Playwright e2e (uses your system Chrome locally)
bun run build        # vite build + oEmbed generation -> dist/
```

Conventions:

- TypeScript is **strict**. Avoid `as` casts and `any` — type things properly
  (parse/validate untyped data instead of asserting).
- Formatting is Biome's (4-space indent, double quotes, semicolons, trailing
  commas) — let `bun run format` handle it.
- Add a unit test for any pure logic you introduce.
- If your change affects the gallery or a no-network widget, add an `e2e/` spec.
  Prefer accessible/role-based selectors over brittle ones.

## Commits & PRs

- Use [Conventional Commits](https://www.conventionalcommits.org)
  (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) — match the existing history.
- Keep PRs focused, with all quality checks green.
