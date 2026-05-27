---
name: Open oEmbed Widgets
description: Monochrome, editorial design system for the widgets and gallery.
tokens:
  color:
    # Light theme (dark theme swaps these via [data-theme="dark"] / OS preference)
    bg: "#ffffff" # page / widget background (transparent in embeds)
    fg: "#0a0a0a" # primary text + filled controls
    muted: "#737373" # secondary text
    border: "#e5e5e5" # hairlines
    surface: "#f7f7f5" # quiet panels + inputs (gallery only)
    bg-dark: "#000000"
    fg-dark: "#fafafa"
    muted-dark: "#a3a3a3"
    border-dark: "#262626"
    surface-dark: "#141414"
  font:
    sans: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    serif: "ui-serif, Georgia, Cambria, Times New Roman, serif"
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
  type:
    hero: { size: "48px", weight: 600, tracking: "-0.02em", leading: 1.1 }
    title: { size: "16px", weight: 500, leading: 1.4 }
    body: { size: "16px", weight: 400, leading: 1.6 }
    small: { size: "14px", weight: 400, leading: 1.5 }
    label: { size: "11px", weight: 500, tracking: "0.15em", transform: uppercase }
  radius: { sm: "4px", md: "8px", lg: "12px", pill: "9999px" }
  elevation:
    card-hover: "0 4px 16px rgba(0,0,0,0.06)"
  layout: { container: "1152px", gutter: "24px", grid: "1 / 2 / 3 columns" }
---

# Design

## Overview

A **monochrome, editorial** system: only neutrals, with the foreground color
itself acting as the single "accent" (filled buttons, progress bars, clock
tiles). Inspired by Notion's sober-editorial geometry — generous whitespace,
tight headline tracking, 12px card radii — but stripped to greyscale so the
widgets blend into any host page. Theme is light by default and follows the OS
or an explicit `?theme=` / toggle; everything is driven by CSS variables so one
set of utilities adapts to both.

## Colors

Two tones do the work: **fg** on **bg**, with **muted** for secondary text and
**border** for hairlines. `surface` is a barely-there step off the background
for inputs and quiet panels, used **only in the gallery** — widgets keep a
transparent background so they sit invisibly inside an embed. No hues: color, if
any, comes only from user content (e.g. a Button List's custom color, an image).

## Typography

System sans throughout (serif reserved for quotations, mono for code/labels and
tabular numbers). Headlines are weight **600** with slightly negative tracking;
labels are small, uppercase, with wide tracking. Numerals that tick (clocks,
timers, prices) use `tabular-nums` so they don't jitter.

## Layout

Centered hero (constrained to ~prose width) above a responsive card grid:
**1 column on mobile, 2 on tablet (≥768px), 3 on wide screens (≥1280px)**, in a
1152px max container with a 24px gutter. A slim sticky top bar holds the
wordmark, the help link, and the theme toggle.

## Elevation & Shapes

Mostly flat: cards are defined by their **1px border + 12px radius**, lifting to
a soft shadow only on hover. Buttons and inputs use an **8px** radius (not
pills); full-radius is reserved for small toggle chips and the theme button.

## Components

- **Card** — `border` + `radius.lg` + 20px padding; hover raises `elevation.card-hover`.
- **Option button** — selected = `bg-fg / text-bg`; idle = bordered, muted text.
- **Input** — `surface` fill, `border`, `radius.md`, 44px tall; border darkens to `fg` on focus.
- **Filled control** (clock tiles, progress fill) — `bg-fg` with `text-bg` on top, so it inverts cleanly with the theme.

## Do / Don't

- **Do** let the foreground color be the accent; keep widget backgrounds transparent.
- **Do** scale widgets to their box (see `src/lib/fit.ts`) rather than fixing pixel sizes.
- **Don't** introduce brand hues or pastel fills — they break the "blends anywhere" promise.
- **Don't** use drop shadows inside widgets; embeds should read flat against the host.
