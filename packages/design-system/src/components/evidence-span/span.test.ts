import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { messagesFor } from "../../i18n/messages/index";
import { RECIPE_PAIRS } from "../../recipes/pairs";
import { tokens } from "../../tokens/index";
import { type EvidenceItem, CARD_GUTTER, countLabel, spanOf } from "./span";

const text = { kind: "text", path: "brief", start: 0, end: 12 } as const;

/** Only the fields `EvidenceItem` picks; the rest of an engine item is never read. */
function item(
  quote: string | undefined,
  locator: EvidenceItem["source"]["locator"] = text,
): EvidenceItem {
  return {
    id: "00000001",
    inputKind: "brief-text",
    fromModel: false,
    source: {
      ref: "fixture:brief",
      locator,
      contentHash: "0".repeat(64),
      retrievedAt: "2026-11-01T00:00:00.000Z",
      renderer: null,
    },
    observation: { kind: "brand-name", subject: "name", ...(quote === undefined ? {} : { quote }) },
  };
}

describe("spanOf (ev-span-1, W1)", () => {
  it("returns the quote unchanged for a text locator", () => {
    expect(spanOf(item("ร้านบ้านกาแฟ"))).toBe("ร้านบ้านกาแฟ");
  });

  it("does not trim a quote it returns", () => {
    expect(spanOf(item("  ร้าน  "))).toBe("  ร้าน  ");
  });

  it("case 1: undefined item is null", () => {
    expect(spanOf(undefined)).toBeNull();
  });

  it("case 2: no quote is null", () => {
    expect(spanOf(item(undefined, { kind: "element", path: "brief" }))).toBeNull();
    expect(spanOf(item(undefined))).toBeNull();
  });

  it("case 3: a quote on a locator that is not text is null", () => {
    expect(spanOf(item("x", { kind: "box", x: 0, y: 0, width: 1, height: 1 }))).toBeNull();
    expect(spanOf(item("x", { kind: "element", path: "brief" }))).toBeNull();
  });

  it("case 4: a quote of only white space is null", () => {
    expect(spanOf(item("   "))).toBeNull();
  });
});

describe("countLabel (ev-count-1, W2)", () => {
  const th = messagesFor("th");
  const en = messagesFor("en");

  it("uses the plural form for 3", () => {
    expect(countLabel(th, 3)).toBe("ยกมาจากบรีฟ 3 ข้อความ");
    expect(countLabel(en, 3)).toBe("3 quotes from the brief");
  });

  it("uses the singular form for 1", () => {
    expect(countLabel(th, 1)).toBe("ยกมาจากบรีฟ 1 ข้อความ");
    expect(countLabel(en, 1)).toBe("1 quote from the brief");
  });

  it("does not take the singular form for 2", () => {
    expect(countLabel(en, 2)).toBe("2 quotes from the brief");
  });
});

describe("CARD_GUTTER (ev-open-1, W3)", () => {
  it("equals space.gutter resolved through the token source", () => {
    const token = tokens.get("semantic", "space.gutter");
    if (!token) throw new Error("space.gutter is gone");
    expect(parseFloat(String(tokens.resolve(token, "light").value))).toBe(CARD_GUTTER);
    expect(CARD_GUTTER).toBe(16);
  });
});

describe("the pairs of ev-pairs-1", () => {
  it("lists the source line on the card and the secondary text on the page, at the text floor", () => {
    const pairs = RECIPE_PAIRS.filter((p) => p.recipe === "evidence").map((p) => [
      p.slot,
      p.fg,
      p.bg,
      p.floor,
    ]);
    expect(pairs).toEqual([
      ["source line", "ds:text.secondary", "popover.bg", 4.5],
      ["secondary text on the page", "ds:text.secondary", "ds:surface.canvas", 4.5],
    ]);
  });
});

describe("the recipe classes of ev-recipe-1", () => {
  const css = readFileSync(
    path.join(import.meta.dirname, "../../recipes/recipes.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");
  const body = (selector: string) => {
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(
      (m) => (m[1] ?? "").trim() === selector,
    );
    expect(rules, selector).toHaveLength(1);
    return (rules[0]?.[2] ?? "")
      .split(";")
      .map((d) => d.trim().replace(/\s+/g, " "))
      .filter(Boolean);
  };
  const type = (size: string) =>
    ["font-family", "font-size", "line-height", "font-weight", "letter-spacing"].map(
      (prop) => `${prop}: var(--ds-type-body-${size}-${prop})`,
    );

  it("sets the span, the pill place and the missing text", () => {
    expect(body(".ds-evidence-span")).toEqual(["display: inline"]);
    expect(body(".ds-evidence-span__trigger")).toEqual([
      "vertical-align: baseline",
      "margin-inline-start: var(--ds-space-inline-sm)",
    ]);
    expect(body(".ds-evidence-span__missing")).toEqual([
      "margin-inline-start: var(--ds-space-inline-sm)",
      "color: var(--ds-text-secondary)",
    ]);
  });

  it("caps the card at the default panel width", () => {
    expect(body(".ds-evidence-card")).toEqual(["max-inline-size: var(--ds-size-panel-default)"]);
  });

  it("draws the quote with a start line in border.control, an 8 px indent and body.md type, with no colour", () => {
    const quote = body(".ds-evidence-quote__text");
    expect(quote).toEqual([
      "margin: 0",
      "padding-inline-start: var(--ds-space-inline-md)",
      "border-inline-start: 2px solid var(--ds-border-control)",
      "min-inline-size: 0",
      "overflow-wrap: anywhere",
      ...type("md"),
    ]);
    expect(quote.some((d) => d.startsWith("color:"))).toBe(false);
  });

  it("puts the source line 4 px under the quote in secondary ink and body.sm type", () => {
    expect(body(".ds-evidence-quote__meta")).toEqual([
      "margin: 0",
      "margin-block-start: var(--ds-space-inline-sm)",
      "color: var(--ds-text-secondary)",
      ...type("sm"),
    ]);
  });

  it("stacks the list items 16 px apart", () => {
    expect(body(".ds-evidence-list__items")).toEqual([
      "list-style: none",
      "margin: 0",
      "padding: 0",
      "display: flex",
      "flex-direction: column",
      "gap: var(--ds-space-stack-md)",
    ]);
  });

  it("keeps the trigger's height and label edge for the list's missing text", () => {
    expect(body(".ds-evidence-list__missing")).toEqual([
      "display: flex",
      "align-items: center",
      "min-block-size: var(--cmp-button-height-md)",
      "margin: 0",
      "padding-inline: calc(var(--cmp-button-padding-x-md) + 1px)",
      "color: var(--ds-text-secondary)",
      ...type("sm"),
    ]);
  });
});
