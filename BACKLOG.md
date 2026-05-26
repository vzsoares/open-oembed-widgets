# Widget backlog

Planned widgets. Each is **client-side only** and follows the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are then generated from the manifest. All
widgets are monochrome, transparent-background, and support `?theme=light|dark`.

---

## 🖼️ Image rotator — `images`

Cycles through a list of images — "one then the other", sequentially or
randomly, every X seconds.

- **Config**
    - `?src=url1,url2,url3` — comma-separated image URLs (required)
      _(or `?album=` pointing at a hosted JSON list, TBD)_
    - `?mode=sequential|random` (default `sequential`)
    - `?every=8` — seconds per image (default ~8)
    - `?fit=cover|contain` (default `cover`)
- **Notes** — preload the next image; cross-fade on swap; pause on hover.
  Watch URL length limits when many images are inlined → the hosted-list option
  is the scalable path. CORS only matters if we read pixels (we don't).
- **Size** — ~480×270 (16:9).

---

### Shared building blocks (available to reuse)

- `src/lib/duration.ts` — d/h/m/s splitting + display segments (used by `timer`).
- `src/lib/interval.ts` — a self-correcting tick that survives tab throttling
  (used by `clock` and `timer`).
- `src/lib/theme.ts` — `?theme=light|dark` resolution.

---

## Project / repo chores

Non-widget tasks for project health and tooling.

- **Sync with the template** — align project with the upstream
  [vite-alpine-tailwind-temaplate](https://github.com/vzsoares/vite-alpine-tailwind-temaplate):
  e2e tests, biome config, and any other tooling/structure that has drifted.
- **Contribution guide** — add a `CONTRIBUTING.md` covering the widget-adding
  workflow (manifest → page → vite input) and the quality checks to run.
- **Configure the GitHub repo** — set the About description, topics, and enable
  the wiki.
