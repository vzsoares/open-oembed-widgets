import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { widgets } from "../src/widgets/manifest";

// Static oEmbed: with no backend we can't host a dynamic endpoint, so we
// pre-generate one JSON document per widget. The widget pages link to these
// via <link rel="alternate" type="application/json+oembed">.
const SITE_URL = "https://vzsoares.github.io/open-oembed-widgets";
const DIST = resolve(process.cwd(), "dist");

for (const w of widgets) {
    const pageUrl = `${SITE_URL}/${w.id}/`;
    const html =
        `<iframe src="${pageUrl}" width="${w.width}" height="${w.height}" ` +
        `style="border:0;border-radius:8px;overflow:hidden;" ` +
        `loading="lazy" referrerpolicy="no-referrer" title="${w.title}"></iframe>`;

    const oembed = {
        version: "1.0",
        type: "rich",
        provider_name: "Open oEmbed Widgets",
        provider_url: SITE_URL,
        title: w.title,
        html,
        width: w.width,
        height: w.height,
        cache_age: 300,
    };

    const dir = resolve(DIST, w.id);
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, "oembed.json");
    writeFileSync(file, `${JSON.stringify(oembed, null, 2)}\n`);
    console.log(`oembed: wrote ${file}`);
}
