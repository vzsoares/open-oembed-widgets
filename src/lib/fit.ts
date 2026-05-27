import { dimensionsFor, widgets } from "../widgets/manifest";

/** Find the widget id from the page path (e.g. /clock/ or /repo/clock/). */
function widgetIdFromPath(): string | undefined {
    const segments = window.location.pathname.split("/").filter(Boolean);
    return segments.reverse().find((s) => widgets.some((w) => w.id === s));
}

/**
 * Scale a widget's `<main>` to fill whatever box the embedding iframe gives it,
 * preserving the design's aspect ratio (contain). At the widget's default size
 * this is a no-op; larger/smaller boxes scale proportionally. The transparent
 * background makes the letterboxed margins invisible.
 */
function init(): void {
    const widget = widgets.find((w) => w.id === widgetIdFromPath());
    const main = document.querySelector<HTMLElement>("main");
    if (!widget || !main) return;

    const params = Object.fromEntries(
        new URLSearchParams(window.location.search),
    );
    const { width, height } = dimensionsFor(widget, params);

    document.body.style.overflow = "hidden";
    main.style.position = "fixed";
    main.style.top = "50%";
    main.style.left = "50%";
    main.style.width = `${width}px`;
    main.style.height = `${height}px`;
    // Override the page's min-h-screen so the box stays the design height.
    main.style.minHeight = `${height}px`;

    const apply = (): void => {
        const scale = Math.min(
            window.innerWidth / width,
            window.innerHeight / height,
        );
        main.style.transform = `translate(-50%, -50%) scale(${scale})`;
    };

    apply();
    window.addEventListener("resize", apply);
}

init();
