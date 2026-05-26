# Widget backlog

All originally planned widgets have shipped (clock, timer, image rotator).
New widgets are **client-side only** and follow the existing pattern:

1. add an entry to `src/widgets/manifest.ts`
2. create `<id>/index.html` + `src/widgets/<id>/index.ts`
3. register the page in `vite.config.js` (`build.rollupOptions.input`)

The gallery card and `oembed.json` are then generated from the manifest. All
widgets are monochrome, transparent-background, and support `?theme=light|dark`.

---

### Shared building blocks (available to reuse)

- `src/lib/duration.ts` — d/h/m/s splitting + display segments (used by `timer`).
- `src/lib/interval.ts` — a self-correcting tick that survives tab throttling
  (used by `clock` and `timer`).
- `src/lib/theme.ts` — `?theme=light|dark` resolution.

---

## Project / repo chores

Non-widget tasks for project health and tooling. **All done:** template sync
(e2e + CI gate), `CONTRIBUTING.md`, GitHub repo About + topics, per-widget e2e
coverage, and the major dependency upgrades (Vite 8, Tailwind 4, TypeScript 6,
vitest).

_Nothing outstanding — add new widget ideas or chores here as they come up._
