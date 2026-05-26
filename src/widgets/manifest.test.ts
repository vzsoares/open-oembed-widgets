import { describe, expect, test } from "bun:test";
import { dimensionsFor, type WidgetDef } from "./manifest";

const w: WidgetDef = {
    id: "x",
    title: "X",
    description: "",
    width: 480,
    height: 270,
};

describe("dimensionsFor", () => {
    test("landscape is the default", () => {
        expect(dimensionsFor(w)).toEqual({ width: 480, height: 270 });
        expect(dimensionsFor(w, { orient: "landscape" })).toEqual({
            width: 480,
            height: 270,
        });
    });

    test("portrait swaps width and height", () => {
        expect(dimensionsFor(w, { orient: "portrait" })).toEqual({
            width: 270,
            height: 480,
        });
    });

    test("unrelated params don't change the dimensions", () => {
        expect(dimensionsFor(w, { mode: "random" })).toEqual({
            width: 480,
            height: 270,
        });
    });
});
