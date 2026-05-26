# Widget backlog

All originally planned widgets have shipped (clock, timer, image rotator).
New widgets are **client-side only** and follow the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are then generated from the manifest. All
widgets are monochrome, transparent-background, and support `?theme=light|dark`.

---

## 💡 Future widget ideas

- **Image rotator `?album=`** — point at a hosted JSON list of URLs instead of
  inlining them in `?src=`, to dodge URL-length limits for large albums.

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
