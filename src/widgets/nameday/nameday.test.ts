import { describe, expect, test } from "vitest";
import { mmdd, nameDayView, namesFor, parseLang } from "./nameday";

describe("parseLang", () => {
    test("defaults to Czech for missing or unknown locales", () => {
        expect(parseLang(null)).toBe("cz");
        expect(parseLang("")).toBe("cz");
        expect(parseLang("de")).toBe("cz");
    });

    test("accepts a known locale, case-insensitively", () => {
        expect(parseLang("sk")).toBe("sk");
        expect(parseLang("FR")).toBe("fr");
        expect(parseLang("es")).toBe("es");
    });
});

describe("mmdd", () => {
    test("zero-pads month and day", () => {
        expect(mmdd(new Date(2026, 0, 5))).toBe("01-05");
        expect(mmdd(new Date(2026, 5, 29))).toBe("06-29");
    });
});

describe("namesFor", () => {
    test("Petr/Pavel on June 29 (Czech)", () => {
        expect(namesFor("cz", new Date(2026, 5, 29))).toEqual([
            "Petr",
            "Pavel",
        ]);
    });

    test("Peter/Pavol on June 29 (Slovak)", () => {
        expect(namesFor("sk", new Date(2026, 5, 29))).toContain("Peter");
    });

    test("a day with no name day returns an empty list", () => {
        // Jan 1 (New Year) has no name day in either calendar.
        expect(namesFor("cz", new Date(2026, 0, 1))).toEqual([]);
    });
});

describe("nameDayView", () => {
    test("renders the date in the locale's language", () => {
        const v = nameDayView("cz", new Date(2026, 5, 29));
        expect(v.names).toEqual(["Petr", "Pavel"]);
        expect(v.localeName).toBe("Czech");
        // Czech renders June as "června".
        expect(v.dateText).toContain("29");
        expect(v.dateText.toLowerCase()).toContain("červ");
    });
});
