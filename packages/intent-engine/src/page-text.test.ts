import { defaultTreeAdapter, parse, type DefaultTreeAdapterMap } from "parse5";
import { describe, expect, it, vi } from "vitest";
import { PATH_MAX_CHARS } from "./evidence";
import {
  MAX_DEPTH,
  pageTextAndPathsOf,
  pageTextOf,
  stylesheetLinksOf,
  wordCount,
} from "./page-text";

// The engine's tsconfig has no DOM or Node lib, so the one global this file uses is declared here.
declare class TextEncoder {
  encode(input: string): Uint8Array;
}

declare const performance: { now(): number }; // the engine tsconfig has no DOM lib; a timer for the time bounds
/** The framework timeout of a test that guards a time bound: above the bound, so vitest never pre-empts the guard under a parallel run. */
const HEAVY_TIMEOUT = 60_000;
/**
 * The wall-clock bounds of the tests below are sized for the CI runner under the parallel full suite
 * (ORV-139, `.claude/rules/testing.md`): each is at least 10 times the slowest local time seen while
 * `pnpm test` ran, or at least 2 times a time measured on CI. The 2 MB description cut took 2,249 ms on
 * CI run 40746575077 (bound 2,000 then), so its bound is 5,000. Where CI showed a slower time than
 * the local run allowed for, the bound follows the slowest CI time seen: the held-depth page took
 * 8,485 ms (run 40826193643), the re-opened-formatting page 7,287 ms (run 40878076151), the
 * 5,000 sibling blocks 1,527 ms (run 40890047958) and the 5,000 path lookups 1,654 ms (run
 * 40713714426). Each also stays below the time the
 * defect it guards takes (a mutant of the product code ran past it), except five, the accepted
 * exceptions of `mutant-exception-1` in `docs/specs/ORV-139/spec.md`, which holds the mutant times:
 * - "returns the held-depth page within 17 s, with nothing cut" and "within 10 s with nothing cut":
 *   no mutant was found, so each bound is sized by the local 10 L or the CI 2 C rule alone.
 * - "returns the re-opened-formatting page within 15 s, cut by the Element count": each cap lifted
 *   alone stays under the bound, and both lifted abort out of memory, red but not on the time line.
 * - "stops the Element count at the push that would be the 1,048,577th" and "returns the parse of
 *   the empty text when the second parse stops too": the mutant is faster than the bound and goes
 *   red on the value assertion (texts `['A']` and `['T']` instead of `[]`).
 */
const DESCRIPTION_BOUND_MS = 5000;
const LOOKUP_BOUND_MS = 4000;
const bytes = (html: string) => new TextEncoder().encode(html);
const blocksOf = (html: string) => pageTextOf(bytes(html)).blocks;
const texts = (html: string) => blocksOf(html).map((b) => b.text);
const THAI = "อยากให้สนุก"; // packages/intent-engine/src/interpreter.test.ts line 42
const DOCUMENT_MAX = 2 * 1024 * 1024; // the 2 MB document bound of the safe read
/** `head` then `unit` repeated while the whole stays within `size` bytes (all ASCII). */
const upTo = (size: number, head: string, unit: string) =>
  head + unit.repeat(Math.floor((size - head.length) / unit.length));
/** The 2 MB documents of rows 7 and 36 that start by pushing the tree builder past the Nesting count. */
const NESTING_DOCUMENTS: [string, string][] = [
  ["nested div elements", upTo(DOCUMENT_MAX, "<body>", "<div>")],
  ["<div></span> repeated", upTo(DOCUMENT_MAX, "<body>", "<div></span>")],
  [
    "<div><script></div></script> repeated",
    upTo(DOCUMENT_MAX, "<body>", "<div><script></div></script>"),
  ],
  [
    "a style that opens a comment, then nested div elements",
    upTo(DOCUMENT_MAX, "<body><style><!--</style>", "<div>"),
  ],
  ["an svg style, then nested g elements", upTo(DOCUMENT_MAX, "<body><svg><style>", "<g>")],
];
/** The held-depth document: the stack sits at the bound and a stray `</p>` pushes a fake p to it and pops it. */
const HELD_DEPTH = upTo(DOCUMENT_MAX, `<body>${"<div>".repeat(MAX_DEPTH - 3)}`, "</p>");
/** `head`, then `unit(0)`, `unit(1)`, ... while the whole stays within `size` bytes, then `tail` (all ASCII). */
const counting = (size: number, head: string, unit: (n: number) => string, tail = "") => {
  const parts = [head];
  let length = head.length + tail.length;
  for (let n = 0; ; n++) {
    const next = unit(n);
    if (length + next.length > size) break;
    parts.push(next);
    length += next.length;
  }
  parts.push(tail);
  return parts.join("");
};
/** The four 2 MB documents of the Work bound (rows 7 and 36). */
const REOPENED_FORMATTING = upTo(
  DOCUMENT_MAX,
  `<body><p>${Array.from({ length: 120 }, (_, i) => `<b id=${i}>`).join("")}`,
  "<p>x",
);
const HTML_ATTRIBUTES = counting(DOCUMENT_MAX, "<body>", (n) => `<html a${n}>`);
const BODY_ATTRIBUTES = counting(DOCUMENT_MAX, "<body>", (n) => `<body a${n}>`);
const ONE_TAG = counting(DOCUMENT_MAX, "<body><p", (n) => ` a${n}`, ">x");
/** The List steps documents (tech notes section 6, The List steps, measured; rows 7 and 36), each to 2 MB. */
const ADOPTION_MOVE = counting(DOCUMENT_MAX, "<body><b><div>", () => "<br>", "</b>");
const ADOPTION_MOVE_TEXT = counting(DOCUMENT_MAX, "<body><b><div>", () => "x<br>", "</b>");
/** 12 formatting tags, three each: 36 entries that the stale round leaves in the list of active formatting elements. */
const FORMATTING_36 = [
  "b",
  "big",
  "code",
  "em",
  "font",
  "i",
  "s",
  "small",
  "strike",
  "strong",
  "tt",
  "u",
]
  .map((tag) => `<${tag}>`.repeat(3))
  .join("");
/** `</template>` with an open `object` removes only the object's marker: 37 entries stay behind each round. */
const STALE_ROUND = `<template>${FORMATTING_36}<object></template>`;
const STALE_MARKERS = upTo(DOCUMENT_MAX, "<body>", STALE_ROUND);
const FOSTERED_TEXT = upTo(DOCUMENT_MAX, "<table>", "x<br>");
const FOSTERED_ELEMENTS = upTo(DOCUMENT_MAX, "<body><table>", "<br>");
const FOSTERED_AFTER_ELEMENTS = `<body>${"<br>".repeat(349_520)}<table>${"a ".repeat(349_520)}<tr>`;

describe("html-text-1", () => {
  const fixture = `<!doctype html><html><head><title>  My
    Title </title><meta name="description" content="A  short   description">
    <style>head-style{}</style><script>headScript()</script></head><body>
    <h1>Main heading</h1><p>First paragraph</p>
    <script>bodyScript()</script><style>bodyStyle{}</style>
    <template><p>Template text</p></template>
    <svg><text>Svg text</text></svg><iframe>Iframe text</iframe>
    <div hidden><p>Hidden text</p></div><div aria-hidden="true">Aria hidden text</div>
    <noscript><p>Enable JavaScript</p></noscript></body></html>`;

  it("keeps the title, the meta description, headings and body text, and nothing the rule skips", () => {
    expect(blocksOf(fixture).map((b) => [b.kind, b.text])).toEqual([
      ["title", "My Title"],
      ["meta", "A short description"],
      ["heading", "Main heading"],
      ["body", "First paragraph"],
      ["body", "Enable JavaScript"],
    ]);
  });

  it.each([
    ["script", "<script>Skip me</script>"],
    ["style", "<style>Skip me</style>"],
    ["template", "<template><p>Skip me</p></template>"],
    ["svg", "<svg><text>Skip me</text></svg>"],
    ["iframe", "<iframe>Skip me</iframe>"],
    ["hidden", "<div hidden>Skip me</div>"],
    ["aria-hidden", '<div aria-hidden="true">Skip me</div>'],
  ])("skips a %s subtree", (_name, html) => {
    expect(texts(`<body>${html}<p>Kept</p></body>`)).toEqual(["Kept"]);
  });

  it("keeps aria-hidden when it is not true, and a noscript in the body", () => {
    expect(texts('<body><div aria-hidden="false">Shown</div></body>')).toEqual(["Shown"]);
    expect(texts("<body><noscript><p>Enable JavaScript</p></noscript></body>")).toEqual([
      "Enable JavaScript",
    ]);
  });

  it("reads only the title and the meta description of the head", () => {
    expect(
      texts(
        '<head><title>T</title><meta name="keywords" content="k"><meta name="Description" content="D"><base href="/x"></head><body></body>',
      ),
    ).toEqual(["T", "D"]);
  });

  it("takes the first description only, and an empty one is no block", () => {
    expect(
      texts(
        '<head><meta name="description" content="  "><meta name="description" content="one"><meta name="description" content="two"></head>',
      ),
    ).toEqual(["one"]);
  });

  it("folds runs of ASCII whitespace to one space and trims, leaving other spaces", () => {
    expect(texts("<p> \n a \t\r\n\f b&nbsp;&nbsp;c </p>")).toEqual(["a b  c"]);
  });

  it("joins inline text and leaves nested blocks out of the outer block", () => {
    expect(texts("<ul><li>one <b>bold</b> two<ul><li>inner</li></ul> three</li></ul>")).toEqual([
      "one bold two three",
      "inner",
    ]);
  });

  it("makes a block of any other element with its own text and no block ancestor", () => {
    expect(texts("<div>Lead <span>inline</span><p>para</p></div><span>solo</span>")).toEqual([
      "Lead inline",
      "para",
      "solo",
    ]);
  });

  it("gives an element with no text child of its own no block, and its inline child the block", () => {
    const out = blocksOf("<body><div><span>solo</span></div></body>");
    expect(out.map((b) => [b.path, b.text])).toEqual([
      ["html>body>div:nth-of-type(1)>span:nth-of-type(1)", "solo"],
    ]);
  });

  it("leaves an element whose only text is whitespace without a block, so its inline child takes the block", () => {
    const out = blocksOf("<body><div> \n <span>x</span> </div></body>");
    expect(out.map((b) => [b.path, b.text])).toEqual([
      ["html>body>div:nth-of-type(1)>span:nth-of-type(1)", "x"],
    ]);
  });

  it("makes no second block of an inline element inside a heading or a listed block", () => {
    const out = blocksOf("<body><h2>Head <span>inner</span></h2><p>Para <i>deep</i></p></body>");
    expect(out.map((b) => [b.path, b.kind, b.text])).toEqual([
      ["html>body>h2:nth-of-type(1)", "heading", "Head inner"],
      ["html>body>p:nth-of-type(1)", "body", "Para deep"],
    ]);
  });

  it("leaves out of a block the text of a hidden, script or svg descendant, and keeps the rest", () => {
    expect(
      texts(
        '<p>Keep<span hidden>B</span>C<span aria-hidden="true">D</span><script>E</script><svg>F</svg>G</p>',
      ),
    ).toEqual(["KeepCG"]);
  });

  it("folds a carriage return written as a character reference like the other ASCII whitespace", () => {
    expect(texts("<p>a&#13;b&#13;&#13;c</p>")).toEqual(["a b c"]);
  });

  it("makes no block of another element once the body bound is full", () => {
    expect(texts(`<p>${"a".repeat(5001)}</p><span>later</span>`)).toEqual([]);
  });

  it("skips a title that carries the hidden attribute", () => {
    expect(texts("<head><title hidden>T</title></head><body><p>x</p></body>")).toEqual(["x"]);
  });

  it("gives the whole meta element as the span of the description", () => {
    const html = '<head><meta name="description" content="A  short   one"></head><body></body>';
    const meta = blocksOf(html)[0];
    expect(meta?.kind).toBe("meta");
    expect(meta?.path).toBe("html>head>meta:nth-of-type(1)");
    expect(html.slice(meta?.span.start, meta?.span.end)).toBe(
      '<meta name="description" content="A  short   one">',
    );
  });

  it("numbers the meta description among the meta elements of head", () => {
    const html = '<head><meta charset="utf-8"><meta name="description" content="D"></head>';
    expect(blocksOf(html)[0]?.path).toBe("html>head>meta:nth-of-type(2)");
  });

  it("gives the title the text node's span and the path of title", () => {
    const html = "<head><title> T </title></head>";
    const title = blocksOf(html)[0];
    expect(title?.path).toBe("html>head>title:nth-of-type(1)");
    expect(html.slice(title?.span.start, title?.span.end)).toBe(" T ");
  });

  it("gives each block an element path and the source span of its text", () => {
    const html =
      "<!doctype html><html><body><main><h1>Top</h1><p>a</p><p>b &amp; c</p></main></body></html>";
    const blocks = blocksOf(html);
    expect(blocks.map((b) => b.path)).toEqual([
      "html>body>main:nth-of-type(1)>h1:nth-of-type(1)",
      "html>body>main:nth-of-type(1)>p:nth-of-type(1)",
      "html>body>main:nth-of-type(1)>p:nth-of-type(2)",
    ]);
    expect(blocks.map((b) => html.slice(b.span.start, b.span.end))).toEqual([
      "Top",
      "a",
      "b &amp; c",
    ]);
    expect(blocks[2]?.text).toBe("b & c");
  });

  describe("the body bound", () => {
    const word = "xxxxxxxxx"; // 9 characters, so n words joined by a space are 10n - 1
    const words = (n: number) => Array<string>(n).fill(word).join(" ");

    it("cuts body text on whitespace within 5,000 characters across blocks", () => {
      const out = blocksOf(`<p>${words(300)}</p><p>${words(300)}</p><p>later</p>`);
      expect(out.map((b) => b.text)).toEqual([words(300), words(200)]);
      expect(out.reduce((n, b) => n + b.text.length, 0)).toBeLessThanOrEqual(5000);
    });

    it("keeps a block of exactly 5,000 characters whole", () => {
      const text = "a".repeat(5000);
      expect(texts(`<p>${text}</p>`)).toEqual([text]);
    });

    it("cuts at a space that sits exactly on the limit", () => {
      expect(texts(`<p>${"a".repeat(5000)} bb</p>`)).toEqual(["a".repeat(5000)]);
    });

    it("does not cut at a space one past the limit", () => {
      expect(texts(`<p>${"a".repeat(5001)} bb</p>`)).toEqual([]);
    });

    it("keeps nothing of a block with no whitespace before the limit, and nothing after it", () => {
      expect(texts(`<p>${"a".repeat(5000 + 1)}</p><p>later</p>`)).toEqual([]);
    });

    it("does not count the title, the meta description or headings against the body bound", () => {
      const long = words(600);
      const out = blocksOf(
        `<head><title>${long}</title><meta name="description" content="${long}"></head><body><h1>${words(100)}</h1><p>${words(500)}</p><h2>${words(100)}</h2></body>`,
      );
      expect(out.map((b) => [b.kind, b.text.length])).toEqual([
        ["title", 999], // cut by its own bound of 1,000 (SEC-4), not by the body bound
        ["meta", 999],
        ["heading", 999],
        ["body", 4999],
        ["heading", 999],
      ]);
    });
  });

  describe("the title and description bound (SEC-4)", () => {
    const of = {
      title: (text: string) => `<head><title>${text}</title></head><body><p>after</p></body>`,
      meta: (text: string) =>
        `<head><meta name="description" content="${text}"></head><body><p>after</p></body>`,
    };
    const run = (kind: "title" | "meta", text: string) => {
      const out = pageTextOf(bytes(of[kind](text)));
      return { kept: out.blocks.find((b) => b.kind === kind)?.text, incomplete: out.incomplete };
    };

    it.each(["title", "meta"] as const)("%s: 1,000 characters are kept whole", (kind) => {
      const text = `${"x ".repeat(499)}xx`;
      expect(text).toHaveLength(1000);
      expect(run(kind, text)).toEqual({ kept: text, incomplete: false });
    });

    it.each(["title", "meta"] as const)(
      "%s: 1,001 characters are cut at the last space and the page text is incomplete",
      (kind) => {
        const text = `${"x ".repeat(500)}x`;
        expect(text).toHaveLength(1001);
        expect(run(kind, text)).toEqual({ kept: text.slice(0, 999), incomplete: true });
      },
    );

    it.each(["title", "meta"] as const)(
      "%s: a space at the limit itself counts, one past it does not",
      (kind) => {
        expect(run(kind, `${"a".repeat(1000)} b`)).toEqual({
          kept: "a".repeat(1000),
          incomplete: true,
        });
        expect(run(kind, `${"a".repeat(1001)} b`)).toEqual({ kept: undefined, incomplete: true });
      },
    );

    it.each(["title", "meta"] as const)(
      "%s: one with no space within the limit keeps nothing and does not let a later one in",
      (kind) => {
        const html =
          kind === "title"
            ? `<head><title>${"a".repeat(1500)}</title><title>second</title></head>`
            : `<head><meta name="description" content="${"a".repeat(1500)}"><meta name="description" content="second"></head>`;
        const out = pageTextOf(bytes(html));
        expect(out.blocks).toEqual([]);
        expect(out.incomplete).toBe(true);
      },
    );

    it("each has a bound of its own: a full title leaves the description its 1,000", () => {
      const text = `${"x ".repeat(499)}xx`;
      const out = pageTextOf(
        bytes(
          `<head><title>${text}</title><meta name="description" content="${text}"></head><body><p>after</p></body>`,
        ),
      );
      expect(out.blocks.map((b) => [b.kind, b.text.length])).toEqual([
        ["title", 1000],
        ["meta", 1000],
        ["body", 5],
      ]);
      expect(out.incomplete).toBe(false);
    });

    it("keeps the source span of the whole element when it cuts the text", () => {
      const html = of.meta("x ".repeat(800));
      const meta = pageTextOf(bytes(html)).blocks.find((b) => b.kind === "meta");
      expect(meta?.span.start).toBe(html.indexOf("<meta"));
      expect(meta?.span.end).toBe(html.indexOf(">", html.indexOf("<meta")) + 1);
    });

    it(
      "a 2 MB meta description is cut to 1,000 characters in time",
      () => {
        const html = of.meta("we are calm and friendly not bold ".repeat(60_000));
        expect(html.length).toBeLessThanOrEqual(DOCUMENT_MAX);
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(DESCRIPTION_BOUND_MS);
        const meta = out.blocks.find((b) => b.kind === "meta");
        expect(meta?.text.length).toBeLessThanOrEqual(1000);
        expect(meta?.text.length).toBeGreaterThan(900);
        expect(out.incomplete).toBe(true);
      },
      HEAVY_TIMEOUT,
    );
  });

  describe("the heading bound", () => {
    const word = "xxxxxxxxx";
    const words = (n: number) => Array<string>(n).fill(word).join(" ");

    it(
      "keeps 294 of 40,000 headings, 4,998 characters in all, and reports page-incomplete in time",
      () => {
        const html = `<body>${"<h2>heading text here</h2>".repeat(40_000)}</body>`;
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(3000);
        expect(out.blocks).toHaveLength(294);
        expect(out.blocks.reduce((n, b) => n + b.text.length, 0)).toBe(4998);
        expect(out.incomplete).toBe(true);
      },
      HEAVY_TIMEOUT,
    );

    it("cuts heading text on whitespace within 5,000 characters, and later headings are dropped", () => {
      const out = pageTextOf(bytes(`<h1>${words(300)}</h1><h2>${words(300)}</h2><h3>later</h3>`));
      expect(out.blocks.map((b) => b.text)).toEqual([words(300), words(200)]);
      expect(out.incomplete).toBe(true);
    });

    it("keeps a heading of exactly 5,000 characters whole and complete", () => {
      const text = "a".repeat(5000);
      const out = pageTextOf(bytes(`<h1>${text}</h1>`));
      expect(out.blocks.map((b) => b.text)).toEqual([text]);
      expect(out.incomplete).toBe(false);
    });

    it("drops a heading of 5,001 characters with no whitespace and reports page-incomplete", () => {
      const out = pageTextOf(bytes(`<h1>${"a".repeat(5001)}</h1><h2>later</h2>`));
      expect(out.blocks).toEqual([]);
      expect(out.incomplete).toBe(true);
    });

    it("counts headings apart from body text, and the cut of one does not stop the other", () => {
      const out = pageTextOf(
        bytes(`<h1>${words(600)}</h1><p>${words(500)}</p><p>${words(100)}</p>`),
      );
      expect(out.blocks.map((b) => [b.kind, b.text.length])).toEqual([
        ["heading", 4999],
        ["body", 4999],
      ]);
    });

    it("does not report page-incomplete when the body bound cuts", () => {
      expect(pageTextOf(bytes(`<p>${words(600)}</p>`)).incomplete).toBe(false);
    });
  });

  describe("the depth bound and the Nesting count", () => {
    // html is depth 1 and body is 2, so an element under n divs lies at depth 3 + n
    const under = (divs: number, inner: string) =>
      `<body>${"<div>".repeat(divs)}${inner}${"</div>".repeat(divs)}</body>`;

    it("is 128", () => {
      expect(MAX_DEPTH).toBe(128);
    });

    it("stops the count at the push that makes the stack 129 deep: the text after it is not read", () => {
      // The "deep" block lies too deep for its path (Path bound), so only "after" can tell the cut from the walk.
      const tail = (divs: number) =>
        `<body>${"<div>".repeat(divs)}<p>deep</p>${"</div>".repeat(divs)}<p>after</p>`;
      // 125 divs: the p is the 128th open element, nothing stops, and "after" is read
      expect(blocksOf(tail(MAX_DEPTH - 3)).map((b) => b.text)).toEqual(["after"]);
      // 126 divs: the p is the 129th, the parse stops there, and the walk alone would have kept "after"
      const cut = pageTextOf(bytes(tail(MAX_DEPTH - 2)));
      expect(cut.blocks).toEqual([]);
      expect(cut.incomplete).toBe(true);
    });

    it("meets a void element one past the bound in the walk, which the count never sees", () => {
      // 126 divs fill the stack to 128; a br is attached without a push, at depth 129
      const out = pageTextOf(bytes(`<body>${"<div>".repeat(MAX_DEPTH - 2)}<br></body>`));
      expect(out.blocks).toEqual([]);
      expect(out.incomplete).toBe(true);
      // one div fewer: the br lies at depth 128 and nothing is cut
      expect(
        pageTextOf(bytes(`<body>${"<div>".repeat(MAX_DEPTH - 3)}<br></body>`)).incomplete,
      ).toBe(false);
    });

    it("walks 5,000 nested elements without throwing, gives no block for the innermost and says so", () => {
      const out = pageTextOf(bytes(under(5000, "<p>deep</p>")));
      expect(out.blocks.map((b) => b.text)).not.toContain("deep");
      expect(out.incomplete).toBe(true);
    });

    it("keeps the text of an inline element at depth 128", () => {
      const out = pageTextOf(bytes(`<body><p>A${"<b>".repeat(MAX_DEPTH - 3)}x</p></body>`));
      expect(out.blocks.map((b) => b.text)).toEqual(["Ax"]);
      expect(out.incomplete).toBe(false);
    });

    it("cuts the parse inside a block: the text before the element past the bound is kept, the rest is not", () => {
      const out = pageTextOf(bytes(`<body><p>A${"<b>".repeat(MAX_DEPTH - 2)}x</p></body>`));
      expect(out.blocks.map((b) => b.text)).toEqual(["A"]);
      expect(out.incomplete).toBe(true);
    });

    it("keeps the text of the element at depth 128 that comes before the one past the bound", () => {
      const out = pageTextOf(bytes(`<body><p>A${"<b>".repeat(MAX_DEPTH - 3)}x<b>y</b></p></body>`));
      expect(out.blocks.map((b) => b.text)).toEqual(["Ax"]);
      expect(out.incomplete).toBe(true);
    });

    it("reports page-incomplete for inline elements past the bound too", () => {
      const out = pageTextOf(bytes(`<body>${"<b>".repeat(MAX_DEPTH + 8)}x</body>`));
      expect(out.incomplete).toBe(true);
    });

    it("cuts at the latest start tag pushed when the element past the bound has no start tag of its own (a fake tbody)", () => {
      // 125 divs make 127, the table 128, and the fake tbody in front of the td 129
      const html = `<body>${"<div>".repeat(MAX_DEPTH - 3)}<link rel=stylesheet href=a.css><table><td>`;
      expect(stylesheetLinksOf(bytes(html))).toEqual({ hrefs: ["a.css"], incomplete: true });
    });

    it("cuts at the latest start tag pushed when the element past the bound is a re-opened formatting element", () => {
      // 124 divs, p and b make 128; </p> closes both and leaves b to be re-opened by the text "x" at 129
      const html = `<body>${"<div>".repeat(MAX_DEPTH - 4)}<p><b></p><div><link rel=stylesheet href=a.css><div>x`;
      expect(stylesheetLinksOf(bytes(html))).toEqual({ hrefs: ["a.css"], incomplete: true });
    });

    it.each(NESTING_DOCUMENTS)(
      "returns the 2 MB page of %s within 2 s, cut and incomplete",
      (_n, html) => {
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(2000);
        expect(out.incomplete).toBe(true);
        expect(out.blocks).toEqual([]);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "returns the held-depth page within 17 s, with nothing cut",
      () => {
        expect(HELD_DEPTH.length).toBeLessThanOrEqual(DOCUMENT_MAX);
        const started = performance.now();
        const out = pageTextOf(bytes(HELD_DEPTH));
        expect(performance.now() - started).toBeLessThan(17000);
        expect(out.blocks).toEqual([]); // its p elements hold no text
        expect(out.incomplete).toBe(false);
      },
      HEAVY_TIMEOUT,
    );
  });

  describe("the path bound", () => {
    // html>body>NAME:nth-of-type(1)>p:nth-of-type(1) is the name's length plus 42 characters
    const named = (length: number) => `x-${"a".repeat(length - 2)}`;
    const pathOfNamed = (length: number) => {
      const name = named(length);
      return blocksOf(`<body><${name}><p>x</p></${name}></body>`)[0]?.path;
    };

    it("keeps a block whose path is exactly 500 characters and drops one of 501", () => {
      expect(PATH_MAX_CHARS).toBe(500);
      expect(pathOfNamed(PATH_MAX_CHARS - 42)?.length).toBe(500);
      const name = named(PATH_MAX_CHARS - 41);
      const out = pageTextOf(bytes(`<body><${name}><p>x</p></${name}></body>`));
      expect(out.blocks).toEqual([]);
      expect(out.incomplete).toBe(true);
    });

    it("a path under the bound leaves incomplete false", () => {
      const name = named(PATH_MAX_CHARS - 42);
      expect(pageTextOf(bytes(`<body><${name}><p>x</p></${name}></body>`)).incomplete).toBe(false);
    });

    it("drops a block whose heading path passes the bound as well, and counts nothing of it", () => {
      const name = named(PATH_MAX_CHARS);
      const out = pageTextOf(bytes(`<body><${name}><h2>x</h2></${name}><p>kept</p></body>`));
      expect(out.blocks.map((b) => [b.kind, b.text])).toEqual([["body", "kept"]]);
      expect(out.incomplete).toBe(true);
    });

    it("drops a div block with text of its own when its path passes the bound", () => {
      const name = named(PATH_MAX_CHARS);
      const out = pageTextOf(bytes(`<body><${name}>text</${name}></body>`));
      expect(out.blocks).toEqual([]);
      expect(out.incomplete).toBe(true);
    });

    it("uses none of the body bound for a dropped block", () => {
      const name = named(PATH_MAX_CHARS);
      const big = "word ".repeat(900).trim();
      const out = pageTextOf(bytes(`<body><${name}><p>${big}</p></${name}><p>${big}</p></body>`));
      expect(out.blocks.map((b) => b.text)).toEqual([big]);
    });

    it(
      "returns 5,000 p blocks and 5,000 h2 blocks under a long path within 2 s and 10 MB of path, with none kept",
      () => {
        // 28 nested divs put every block's path past 500 characters, well inside the depth bound
        const html = `<body>${"<div>".repeat(28)}${"<p>x</p>".repeat(5000)}${"<h2>x</h2>".repeat(5000)}</body>`;
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(2000);
        expect(out.blocks).toEqual([]);
        expect(out.incomplete).toBe(true);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "builds no path past the bound: 30,000 blocks under 125 nested long names are dropped in time",
      () => {
        // 125 elements named 1,000 characters make each block's path 125,000 characters; built whole, 30,000 of them would take far longer
        const name = `x-${"a".repeat(998)}`;
        const html = `<body>${`<${name}>`.repeat(MAX_DEPTH - 4)}${"<p>x</p>".repeat(15_000)}${"<h2>x</h2>".repeat(15_000)}`;
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(4000);
        expect(out.blocks).toEqual([]);
        expect(out.incomplete).toBe(true);
      },
      HEAVY_TIMEOUT,
    );

    it(
      "returns the page of 509 nested long names within 2 s, incomplete, with no path over 500",
      () => {
        const name = `x-${"a".repeat(998)}`;
        const html = `<body>${`<${name}>`.repeat(509)}${"<p>x</p>".repeat(5000)}${"<h2>x</h2>".repeat(5000)}`;
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(2000);
        expect(out.incomplete).toBe(true);
        expect(out.blocks.every((b) => b.path.length <= PATH_MAX_CHARS)).toBe(true);
      },
      HEAVY_TIMEOUT,
    );
  });

  describe("paths in one pass per parent", () => {
    it(
      "numbers 5,000 sibling blocks in time",
      () => {
        const html = `<body>${"<p>x</p>".repeat(100_000)}</body>`;
        const started = performance.now();
        const out = pageTextOf(bytes(html));
        expect(performance.now() - started).toBeLessThan(4000);
        expect(out.blocks).toHaveLength(5000);
        expect(out.blocks[4999]?.path).toBe("html>body>p:nth-of-type(5000)");
      },
      HEAVY_TIMEOUT,
    );

    it("counts siblings of the same name only", () => {
      const out = pageTextOf(bytes("<body><p>a</p><h1>b</h1><p>c</p><h1>d</h1></body>"));
      expect(out.blocks.map((b) => b.path)).toEqual([
        "html>body>p:nth-of-type(1)",
        "html>body>h1:nth-of-type(1)",
        "html>body>p:nth-of-type(2)",
        "html>body>h1:nth-of-type(2)",
      ]);
    });
  });

  describe("one block per block-list member and per heading level", () => {
    // Each member sits in the context the parser needs, inside a div that has text of its own.
    // As a block of its own, its text leaves the div's text: "Leadtail" and "inner". An element
    // outside the list would be read into the div: "Leadinnertail".
    const members: [string, string][] = [
      ["p", "<p>inner</p>"],
      ["li", "<ul><li>inner</li></ul>"],
      ["dt", "<dl><dt>inner</dt></dl>"],
      ["dd", "<dl><dd>inner</dd></dl>"],
      ["blockquote", "<blockquote>inner</blockquote>"],
      ["figcaption", "<figure><figcaption>inner</figcaption></figure>"],
      ["caption", "<table><caption>inner</caption></table>"],
      ["td", "<table><tr><td>inner</td></tr></table>"],
      ["th", "<table><tr><th>inner</th></tr></table>"],
      ["pre", "<pre>inner</pre>"],
      ["button", "<button>inner</button>"],
      ["label", "<label>inner</label>"],
      ["summary", "<details><summary>inner</summary></details>"],
    ];
    it.each(members)("%s is a block of its own", (_tag, html) => {
      expect(blocksOf(`<div>Lead${html}tail</div>`).map((b) => [b.kind, b.text])).toEqual([
        ["body", "Leadtail"],
        ["body", "inner"],
      ]);
    });

    it("an element outside the list is read into its block (the control)", () => {
      expect(texts("<div>Lead<span>inner</span>tail</div>")).toEqual(["Leadinnertail"]);
    });

    it.each(["h1", "h2", "h3", "h4", "h5", "h6"])("%s is a heading block of its own", (tag) => {
      expect(
        blocksOf(`<div>Lead<${tag}>inner</${tag}>tail</div>`).map((b) => [b.kind, b.text]),
      ).toEqual([
        ["body", "Leadtail"],
        ["heading", "inner"],
      ]);
    });
  });

  it("spans two text nodes split by inline markup from the first to the last", () => {
    const html = "<body><p>one <b>two</b> three</p></body>";
    const b = blocksOf(html)[0];
    expect(b?.text).toBe("one two three");
    expect(html.slice(b?.span.start, b?.span.end)).toBe("one <b>two</b> three");
  });

  it("keeps the first title only", () => {
    expect(texts("<head><title>One</title><title>Two</title></head><body><p>x</p></body>")).toEqual(
      ["One", "x"],
    );
  });

  it("gives deep-equal blocks for equal bytes", () => {
    expect(pageTextOf(bytes(fixture))).toEqual(pageTextOf(bytes(fixture)));
  });

  it("decodes bytes as UTF-8 and turns an invalid sequence into U+FFFD without throwing", () => {
    const decoded = new Uint8Array([
      0x3c, 0x70, 0x3e, 0xe0, 0xb8, 0xad, 0xff, 0x3c, 0x2f, 0x70, 0x3e,
    ]);
    expect(pageTextOf(decoded).blocks.map((b) => b.text)).toEqual(["อ�"]);
  });

  it("counts the Thai example as 3 words where splitting on spaces gives 1", () => {
    const folded = blocksOf(`<p> \n  ${THAI}  </p>`)[0]?.text;
    expect(folded).toBe(THAI);
    expect(folded?.split(" ").length).toBe(1);
    expect(wordCount(THAI)).toBe(3);
  });

  it("counts word-like segments only", () => {
    expect(wordCount("one, two... three!")).toBe(3);
    expect(wordCount("")).toBe(0);
  });

  describe("the Work bound", () => {
    const items = (n: number, make: (i: number) => string, sep = " ") =>
      Array.from({ length: n }, (_, i) => make(i)).join(sep);
    const names = (n: number, sep = " ") => items(n, (i) => `a${i}`, sep);
    /** Distinct two-character names, so 300 of them stay under the 1,000 characters of a title or description (SEC-4). */
    const shortNames = (n: number) => items(n, (i) => i.toString(36).padStart(2, "a"));
    /** What the page reads from a text: its block texts and whether it says it cut something. */
    const read = (html: string) => {
      const out = pageTextOf(bytes(html));
      return { texts: out.blocks.map((b) => b.text), incomplete: out.incomplete };
    };

    describe("the four 2 MB documents", () => {
      it(
        "returns the re-opened-formatting page within 15 s, cut by the Element count",
        () => {
          expect(REOPENED_FORMATTING.length).toBeLessThanOrEqual(DOCUMENT_MAX);
          const started = performance.now();
          const out = pageTextOf(bytes(REOPENED_FORMATTING));
          expect(performance.now() - started).toBeLessThan(15000);
          expect(out.incomplete).toBe(true);
        },
        HEAVY_TIMEOUT,
      );

      it.each([
        ["html start tags with distinct attribute names (the Attribute merge)", HTML_ATTRIBUTES],
        ["body start tags with distinct attribute names (the Attribute merge)", BODY_ATTRIBUTES],
        ["one start tag holding distinct attribute names (the Attribute count)", ONE_TAG],
      ])(
        "returns the 2 MB page of %s within 2 s, with nothing of it kept",
        (_n, html) => {
          expect(html.length).toBeLessThanOrEqual(DOCUMENT_MAX);
          expect(DOCUMENT_MAX - html.length).toBeLessThan(20); // filled to the bound
          const started = performance.now();
          const out = pageTextOf(bytes(html));
          expect(performance.now() - started).toBeLessThan(2000);
          expect(out).toEqual({ blocks: [], incomplete: true });
        },
        HEAVY_TIMEOUT,
      );

      it("gives stylesheetLinksOf the same cut: a link before the cut is kept, one after it is not", () => {
        const link = (name: string) => `<link rel=stylesheet href=${name}.css>`;
        const doc = (tag: string) => `<body>${link("a")}<p>A</p>${tag}${link("b")}`;
        expect(stylesheetLinksOf(bytes(doc(`<p ${names(257)}>`)))).toEqual({
          hrefs: ["a.css"],
          incomplete: true,
        });
        expect(stylesheetLinksOf(bytes(doc(`<p ${names(256)}>`)))).toEqual({
          hrefs: ["a.css", "b.css"],
          incomplete: false,
        });
        const merged = `<body>${link("a")}<p>A</p>${items(257, (i) => `<html b${i}>`, "")}${link("b")}`;
        expect(stylesheetLinksOf(bytes(merged))).toEqual({ hrefs: ["a.css"], incomplete: true });
      });
    });

    describe("the Element count", () => {
      // <body> pushes html, head and body, <p> a fourth, and each stray </p> pushes a fake p and pops it
      const strays = (n: number) => `<body><p>A</p>${"</p>".repeat(n)}`;

      it(
        "stops the Element count at the push that would be the 1,048,577th",
        () => {
          const started = performance.now();
          expect(read(strays(1_048_572))).toEqual({ texts: ["A"], incomplete: false }); // exactly 1,048,576
          expect(read(strays(1_048_573))).toEqual({ texts: [], incomplete: true });
          expect(performance.now() - started).toBeLessThan(11000);
        },
        HEAVY_TIMEOUT,
      );

      it(
        "returns the parse of the empty text when the second parse stops too",
        () => {
          // A template in head makes the end of the text push an implied body: the cut text then makes
          // 1,048,577 pushes. 107 <i></i> line the count up; 106 or 108 do not (tech notes section 6).
          const doc = (idle: number) =>
            `<title>T</title><template>${"<i></i>".repeat(idle)}<p>${Array.from({ length: 120 }, (_, i) => `<b id=${i}>`).join("")}${"<p>x".repeat(8700)}`;
          // the 12 s guard is the row's claim for the document that reaches the third parse; the other two
          // are read outside it, so a loaded runner is not charged for three reads against one bound
          const started = performance.now();
          expect(read(doc(107))).toEqual({ texts: [], incomplete: true });
          expect(performance.now() - started).toBeLessThan(12000);
          expect(read(doc(108))).toEqual({ texts: ["T"], incomplete: true });
          expect(read(doc(106))).toEqual({ texts: ["T"], incomplete: true });
        },
        HEAVY_TIMEOUT,
      );
    });

    describe("the Attribute count", () => {
      // The text between `<p` (or `</p`) and `>`, for n attribute names written in one syntax.
      const SYNTAX: [string, (n: number) => string][] = [
        ["a space", (n) => ` ${names(n)}`],
        ["a tab", (n) => `\t${names(n, "\t")}`],
        ["a line feed", (n) => `\n${names(n, "\n")}`],
        ["a form feed", (n) => `\f${names(n, "\f")}`],
        ["a carriage return", (n) => `\r${names(n, "\r")}`],
        ["a solidus", (n) => ` ${names(n, "/")}`],
        ["two solidi", (n) => ` ${names(n, "//")}`],
        ["a solidus between spaces", (n) => ` ${names(n, " / ")}`],
        ["unquoted values", (n) => ` ${items(n, (i) => `a${i}=1`)}`],
        ["spaces around the equals sign", (n) => ` ${items(n, (i) => `a${i} = 1`)}`],
        [
          "double-quoted values holding > < = / and a space",
          (n) => ` ${items(n, (i) => `a${i}=">'<= /"`)}`,
        ],
        [
          "single-quoted values holding > < = / and a space",
          (n) => ` ${items(n, (i) => `a${i}='>"<= /'`)}`,
        ],
        ["quoted values with nothing between", (n) => ` ${items(n, (i) => `a${i}="1"`, "")}`],
        ["quoted values with a solidus between", (n) => ` ${items(n, (i) => `a${i}="1"`, "/")}`],
        ["a first name that starts with an equals sign", (n) => ` =${names(n)}`],
        [
          "names holding a quote or a less-than sign",
          (n) => ` ${items(n, (i) => [`a${i}"x`, `a${i}'x`, `a${i}<1`][i % 3] ?? "")}`,
        ],
        [
          "unquoted values holding a quote, an equals sign or a solidus",
          (n) =>
            ` ${items(n, (i) => [`a${i}=x"y`, `a${i}=x'y`, `a${i}=x=y`, `a${i}=x/y`][i % 4] ?? "")}`,
        ],
      ];
      const start = (n: number, tag: (n: number) => string) => `<body><p>A</p>${tag(n)}<p>B</p>`;

      it.each(SYNTAX)("cuts at a tag that starts its 257th attribute name: %s", (_n, syntax) => {
        const tag = (n: number) => `<p${syntax(n)}>`;
        expect(read(start(256, tag))).toEqual({ texts: ["A", "B"], incomplete: false });
        expect(read(start(257, tag))).toEqual({ texts: ["A"], incomplete: true });
      });

      it.each(SYNTAX)("counts the attribute names of an end tag: %s", (_n, syntax) => {
        const tag = (n: number) => `</p${syntax(n)}>`;
        expect(read(start(256, tag))).toEqual({ texts: ["A", "B"], incomplete: false });
        expect(read(start(257, tag))).toEqual({ texts: ["A"], incomplete: true });
      });

      it("cuts at the very start of the text, for a start tag and for an end tag", () => {
        expect(read(`<p ${names(257)}>B`)).toEqual({ texts: [], incomplete: true });
        expect(read(`<p ${names(256)}>B`)).toEqual({ texts: ["B"], incomplete: false });
        expect(read(`</p ${names(257)}>B`)).toEqual({ texts: [], incomplete: true });
        expect(read(`</p ${names(256)}>B`)).toEqual({ texts: ["B"], incomplete: false });
      });

      describe("agrees with the tokenizer on every short run of attribute syntax", () => {
        // Every transition of the scan's table, checked against parse5's own count. A prefix puts the
        // tag in each of the ten states in turn; then every string of up to three characters from the
        // list below follows (names get a number each, so only the tokenizer's rules decide what a
        // name is). The tag gets a tail of names so that the tokenizer starts exactly 256 in all, and
        // then 257: the scan must cut the second and not the first.
        const PREFIXES = ["", " ", " n", " n ", " n=", ' n="', " n='", " n=n", ' n="n"', "/"];
        const CHARS = [" ", "/", "=", '"', "'", ">", "n"];
        /** `<p` and the syntax, every `n` a new name; `tail` more names after it. */
        const tagOf = (syntax: string, tail: number) => {
          let serial = 0;
          const written = syntax.replace(/n/g, () => `n${serial++}`);
          return `<p${written}${tail > 0 ? ` ${items(tail, (i) => `t${i}`)}` : ""}>B`;
        };
        /** Names the tokenizer starts in the tag, repeats included; null when the tag is never emitted. */
        const started = (html: string): number | null => {
          let repeats = 0;
          const doc = parse(`<body>${html}`, {
            onParseError: (e) => {
              if (e.code === "duplicate-attribute") repeats++;
            },
          });
          type Node = { childNodes?: Node[]; tagName?: string; attrs?: unknown[] };
          // the first element under body that body's own start tag did not make: the tag under test,
          // whatever the syntax made of its name
          const find = (node: Node): Node | null => {
            for (const child of node.childNodes ?? []) {
              if (child.tagName !== undefined && !["html", "head", "body"].includes(child.tagName))
                return child;
              const inner = find(child);
              if (inner) return inner;
            }
            return null;
          };
          const tag = find(doc as Node);
          return tag?.attrs ? tag.attrs.length + repeats : null;
        };
        const fragments = (): string[] => {
          const out: string[] = [];
          for (const prefix of PREFIXES) {
            let level = [""];
            for (let length = 0; length <= 3; length++) {
              for (const f of level) out.push(prefix + f);
              if (length < 3) level = level.flatMap((f) => CHARS.map((c) => f + c));
            }
          }
          return out;
        };

        it(
          "cuts exactly when the tokenizer starts a 257th name",
          () => {
            let checked = 0;
            for (const syntax of fragments()) {
              const base = started(tagOf(syntax, 1));
              if (base === null || base > 256) continue;
              const tail = 1 + (256 - base);
              if (started(tagOf(syntax, tail)) !== 256 || started(tagOf(syntax, tail + 1)) !== 257)
                continue; // the tail is part of a value, or the tag ended early: nothing to line up
              const fits = pageTextOf(bytes(`<body>${tagOf(syntax, tail)}`)).incomplete;
              const over = pageTextOf(bytes(`<body>${tagOf(syntax, tail + 1)}`)).incomplete;
              if (fits || !over)
                expect.soft({ syntax, fits, over }).toEqual({ syntax, fits: false, over: true });
              checked++;
            }
            expect(checked).toBeGreaterThan(1500);
          },
          HEAVY_TIMEOUT,
        );
      });

      it("counts a repeated name each time", () => {
        expect(read(start(257, () => `<p ${"a ".repeat(257)}>`))).toEqual({
          texts: ["A"],
          incomplete: true,
        });
        expect(read(start(256, () => `<p ${"a ".repeat(256)}>`))).toEqual({
          texts: ["A", "B"],
          incomplete: false,
        });
      });

      it("counts nothing for characters that are not whitespace to the tokenizer", () => {
        // a vertical tab and a no-break space are name characters, so 300 of them make one name
        for (const sep of ["\u000b", "\u00a0"]) {
          expect(read(start(300, () => `<p ${names(300, sep)}>`))).toEqual({
            texts: ["A", "B"],
            incomplete: false,
          });
        }
      });

      it.each([
        ["<p>", "from the tag name"],
        ["<p >", "from before a name"],
        ["<p a>", "from a name"],
        ["<p a >", "from after a name"],
        ["<p a=>", "from before a value"],
        ["<p a=b>", "from an unquoted value"],
        ['<p a="b">', "from after a double-quoted value"],
        ["<p a='b'>", "from after a single-quoted value"],
        ["<p/>", "from a self-closing solidus"],
        ["<p a/>", "from a self-closing solidus after a name"],
        ["</p>", "from the end tag's name"],
      ])("ends a run at the > that emits its tag: %s (%s)", (tag) => {
        // 300 words after the tag are text to the tokenizer; a run that outlived its > would count them
        const out = read(`<body><p>A</p>${tag}${names(300)}`);
        expect(out.incomplete).toBe(false);
        expect(out.texts.join(" ")).toContain("a299");
      });

      it.each(["<a", "<z", "<A", "<Z", "</a", "</z", "</A", "</Z"])(
        "starts a run at an ASCII letter of either case: %s",
        (open) => {
          expect(read(`<body><p>A</p>${open} ${names(257)}>B`)).toEqual({
            texts: ["A"],
            incomplete: true,
          });
          expect(read(`<body><p>A</p>${open} ${names(256)}>B`).incomplete).toBe(false);
        },
      );

      it.each([
        "< p",
        "<1",
        "<!",
        "<?",
        "</ ",
        "</1",
        "<=",
        "<>",
        "<@",
        "<[",
        "<`",
        "<{",
        "</@",
        "</[",
      ])("starts no run at %s: it is not a tag open", (open) => {
        expect(read(`<body><p>A</p>${open}${names(300)}>B`).incomplete).toBe(false);
      });

      it("does not hold a quoted value's own words against its tag", () => {
        // the quoted value holds 300 words; the tag holds three names
        const meta = `<meta name=description content="${shortNames(300)}">`;
        const out = pageTextOf(bytes(`<head>${meta}</head><body><p>A</p>`));
        expect(out.blocks.map((b) => b.kind)).toEqual(["meta", "body"]);
        expect(out.incomplete).toBe(false);
      });

      it("starts a run at every tag start, inside another run's quoted value too", () => {
        // the run from the comment's <a reads a quoted value up to the " after c=, past the real <p
        const html = (n: number) => `<!-- <a b="-->\n<p ${names(n)}>x\n<p c="y">z`;
        expect(read(html(257))).toEqual({ texts: [], incomplete: true });
        expect(read(html(256))).toEqual({ texts: ["x", "z"], incomplete: false });
      });

      it("keeps one run for a state, the higher count and the earlier start on a tie", () => {
        // inside a title everything is text, so the title shows where the text was cut
        const title = (tags: string) => read(`<title>T <${tags} ${names(300)}</title>`).texts;
        // two runs in the same state: the earlier one has the higher count, and the cut is at it
        expect(title("a x <b")).toEqual(["T"]);
        // the later run has the higher count (its names came while the earlier one was in a value)
        const later = read(
          `<title>T <a x="<b ${names(20, " ")}" ${names(300, " ").replace(/a/g, "w")}</title>`,
        );
        expect(later.texts).toEqual(['T <a x="']);
        // equal counts, one run kept at the start: the earlier start wins
        expect(title("a<b")).toEqual(["T"]);
        // equal counts, two runs that step into one state: the earlier start wins too
        // (the first run is after a quoted value, the second in a name that began at a quote)
        expect(read(`<title>T <a x="<b " ${names(300)}</title>`).texts).toEqual(["T"]);
      });

      describe("where the tokenizer reads no tag (the honest limit)", () => {
        const inside = (wrap: (words: string) => string) => (n: number) =>
          read(`<body><p>A</p>${wrap(`<b ${names(n)}>`)}<p>B</p>`);
        it.each([
          ["a comment", (w: string) => `<!-- ${w}-->`],
          ["script text", (w: string) => `<script>x${w}</script>`],
          ["style text", (w: string) => `<style>x${w}</style>`],
          ["textarea text", (w: string) => `<textarea>${w}</textarea>`],
          ["an iframe's text", (w: string) => `<iframe>${w}</iframe>`],
          ["a CDATA section", (w: string) => `<svg><![CDATA[${w}]]></svg>`],
          ["a quoted value", (w: string) => `<div title="${w}">`],
        ])("cuts at a run in %s that holds more than 256 words", (_n, wrap) => {
          const kept = inside(wrap)(256);
          expect(kept.incomplete).toBe(false);
          expect(kept.texts.at(-1)).toBe("B");
          expect(inside(wrap)(257)).toEqual({ texts: ["A"], incomplete: true });
        });
        it("cuts at a run in a title that holds more than 256 words", () => {
          const html = (n: number) => `<title>x<b ${shortNames(n)}></title><body><p>A</p><p>B</p>`;
          expect(read(html(256)).incomplete).toBe(false);
          expect(read(html(257))).toEqual({ texts: ["x"], incomplete: true });
        });
      });
    });

    describe("the Attribute merge", () => {
      it("stops the Attribute merge at the 257th attribute of html", () => {
        const doc = (n: number) =>
          `<html a0><body><p>A</p>${items(n, (i) => `<html b${i}>`, "")}<p>B</p>`;
        // a0 and 255 more make 256: the parse is not stopped
        expect(read(doc(255))).toEqual({ texts: ["A", "B"], incomplete: false });
        // one more makes 257: the parse stops, the cut is the <p> of "A", the latest start tag pushed
        expect(read(doc(256))).toEqual({ texts: [], incomplete: true });
      });

      it("stops the Attribute merge at the 257th attribute of body", () => {
        const doc = (n: number) =>
          `<body a0><p>A</p>${items(n, (i) => `<body b${i}>`, "")}<p>B</p>`;
        expect(read(doc(255))).toEqual({ texts: ["A", "B"], incomplete: false });
        expect(read(doc(256))).toEqual({ texts: [], incomplete: true });
      });

      it("counts only the names the element does not hold yet", () => {
        // 300 tags with the same name add one attribute, not 300
        const same = `<html a0><body><p>A</p>${"<html b0>".repeat(300)}<p>B</p>`;
        expect(read(same)).toEqual({ texts: ["A", "B"], incomplete: false });
        // an offered name the element already holds is not a new one
        const held = `<html ${names(256)}><body><p>A</p><html a0 a255><p>B</p>`;
        expect(read(held)).toEqual({ texts: ["A", "B"], incomplete: false });
        const over = `<html ${names(256)}><body><p>A</p><html a0 b0><p>B</p>`;
        expect(read(over)).toEqual({ texts: [], incomplete: true });
      });

      it("adds the attributes the element lacks and keeps the ones it has, as the default does", () => {
        // an html that gains `hidden` is skipped whole; one that already says aria-hidden="false" keeps it
        expect(read(`<html lang=en><body><p>A</p><html hidden>`)).toEqual({
          texts: [],
          incomplete: false,
        });
        expect(read(`<html aria-hidden=false><body><p>A</p><html aria-hidden=true>`)).toEqual({
          texts: ["A"],
          incomplete: false,
        });
        expect(read(`<body lang=en><p>A</p><body hidden>`)).toEqual({
          texts: [],
          incomplete: false,
        });
        expect(read(`<body aria-hidden=false><p>A</p><body aria-hidden=true>`)).toEqual({
          texts: ["A"],
          incomplete: false,
        });
      });

      it(
        "checks each offered name against a set kept for the element, not one built per call",
        () => {
          // About 930,000 one-name tags are offered to an html element. A set kept for the element makes the
          // cost of a call the same whether the element holds 1 name or 256; a set built per call, as the
          // default merge does, makes it 256 times the work of the 1-name element. The measure is the ratio
          // of the two, each the fastest of 3 runs, so a loaded machine slows both alike (about 1 for the
          // kept set, about 8 for the per-call set; tech notes section 14 row 36).
          const offered = (held: number) =>
            counting(4 * DOCUMENT_MAX, `<html ${names(held)}><body>`, () => "<html a0>");
          const fastest = (doc: string) => {
            let best = Infinity;
            for (let run = 0; run < 3; run++) {
              const started = performance.now();
              expect(read(doc).incomplete).toBe(false);
              best = Math.min(best, performance.now() - started);
            }
            return best;
          };
          const one = fastest(offered(1));
          const many = fastest(offered(256));
          expect(many / one).toBeLessThan(3);
        },
        HEAVY_TIMEOUT,
      );

      it("merges nothing into the html element while a template is open", () => {
        expect(read(`<html><body><template><html hidden></template><p>A</p>`)).toEqual({
          texts: ["A"],
          incomplete: false,
        });
      });
    });

    describe("the List steps", () => {
      // The steps of the first parse, by the design of tech notes section 6: a node inserted before a
      // sibling adds the nodes after that sibling, a node detached adds its parent's child count, and an
      // element pushed adds the length of the list of active formatting elements.
      const adoption = (children: number) =>
        `<body><b><div>${"<br>".repeat(children)}</b><p>after</p>`;

      it.each([
        ["adoption move document", ADOPTION_MOVE],
        ["adoption move document with text before each line", ADOPTION_MOVE_TEXT],
        ["stale-marker document", STALE_MARKERS],
      ])(
        "returns the 2 MB %s within 13 s, cut by the List steps",
        (_n, html) => {
          expect(html.length).toBeLessThanOrEqual(DOCUMENT_MAX);
          const started = performance.now();
          const out = pageTextOf(bytes(html));
          expect(performance.now() - started).toBeLessThan(13000);
          expect(out).toEqual({ blocks: [], incomplete: true });
        },
        HEAVY_TIMEOUT,
      );

      it.each([
        ["table with text and a br after each", FOSTERED_TEXT],
        ["table with a br after each", FOSTERED_ELEMENTS],
        ["table after many br, then text", FOSTERED_AFTER_ELEMENTS],
      ])(
        "returns the 2 MB page fostered out of a %s within 18 s, uncut",
        (_n, html) => {
          expect(html.length).toBeLessThanOrEqual(DOCUMENT_MAX);
          const started = performance.now();
          const out = pageTextOf(bytes(html));
          expect(performance.now() - started).toBeLessThan(18000);
          expect(out.incomplete).toBe(false);
        },
        HEAVY_TIMEOUT,
      );

      it(
        "reads the fostered text as html-text-1 does: a run with no space to stop at gives no block, text with spaces gives one",
        () => {
          // the first two pages foster only characters with no whitespace, where the body bound has no place to stop
          expect(read(FOSTERED_TEXT)).toEqual({ texts: [], incomplete: false });
          expect(read(FOSTERED_ELEMENTS)).toEqual({ texts: [], incomplete: false });
          const fostered = pageTextOf(bytes(FOSTERED_AFTER_ELEMENTS));
          expect(fostered.blocks).toHaveLength(1);
          expect(fostered.blocks[0]?.text).toBe("a ".repeat(2499) + "a");
        },
        HEAVY_TIMEOUT,
      );

      it(
        "stops the List steps at the step past 268,435,456",
        () => {
          // 23,169 children add 268,412,868 steps, 22,588 under the bound; 23,170 add 268,436,038, 582 past it
          expect(read(adoption(23_169))).toEqual({ texts: ["after"], incomplete: false });
          expect(read(adoption(23_170))).toEqual({ texts: [], incomplete: true });
        },
        HEAVY_TIMEOUT,
      );

      it(
        "counts the steps of each parse afresh",
        () => {
          // 23,169 children use all but 22,588 of the steps, so a count kept from the call before would cut the next
          for (let call = 0; call < 3; call++) {
            expect(read(adoption(23_169))).toEqual({ texts: ["after"], incomplete: false });
          }
          expect(read(adoption(23_170))).toEqual({ texts: [], incomplete: true });
          expect(read(adoption(23_169))).toEqual({ texts: ["after"], incomplete: false });
        },
        HEAVY_TIMEOUT,
      );

      it(
        "cuts at the latest start tag pushed: the div of the adoption move, with the link before it kept",
        () => {
          const link = (name: string) => `<link rel=stylesheet href=${name}.css>`;
          // the div holds 23,170 children in all, the last of them the second link
          const doc = (children: number) =>
            `<body>${link("a")}<b><div>${"<br>".repeat(children - 1)}${link("b")}</b><p>after</p>`;
          expect(stylesheetLinksOf(bytes(doc(23_169)))).toEqual({
            hrefs: ["a.css", "b.css"],
            incomplete: false,
          });
          expect(stylesheetLinksOf(bytes(doc(23_170)))).toEqual({
            hrefs: ["a.css"],
            incomplete: true,
          });
        },
        HEAVY_TIMEOUT,
      );

      it(
        "adds the length of the list of active formatting elements at each push",
        () => {
          // 200 stale rounds leave 7,400 entries; each later p push then adds that many steps. The 32,439th
          // push of a p stays within the bound and the 32,440th passes it. Counting a different length at
          // each push (one fewer or one more) moves this pair, the stale-marker documents alone do not.
          const doc = (pushes: number) =>
            `<body>${STALE_ROUND.repeat(200)}${"<p></p>".repeat(pushes - 1)}<p>Z</p>`;
          expect(read(doc(32_439))).toEqual({ texts: ["Z"], incomplete: false });
          expect(read(doc(32_440))).toEqual({ texts: [], incomplete: true });
        },
        HEAVY_TIMEOUT,
      );

      it(
        "returns the parse of the empty text when the List steps stop the second parse",
        () => {
          // A template open in head makes the end of the text push an implied body, which adds the length
          // of the list: the text before the cut then passes the bound at that push. With a body before the
          // template no body is implied, and the second parse returns with the title.
          const started = performance.now();
          const stopped = pageTextOf(bytes(upTo(DOCUMENT_MAX, "<title>T</title>", STALE_ROUND)));
          // The time is read right after the stopped parse, before any value check: the defect (the List
          // steps not counted) runs that parse for about 40 s and would otherwise go red on the value first.
          expect(performance.now() - started).toBeLessThan(10000);
          expect(stopped).toEqual({ blocks: [], incomplete: true });
          const kept = pageTextOf(bytes(upTo(DOCUMENT_MAX, "<title>T</title><body>", STALE_ROUND)));
          expect(kept.blocks.map((b) => b.text)).toEqual(["T"]);
          expect(kept.incomplete).toBe(true);
        },
        HEAVY_TIMEOUT,
      );

      describe("the tree is the one the default adapter builds", () => {
        type TreeNode = DefaultTreeAdapterMap["node"];
        /** The tree as plain data, checking on the way that each child names its parent. */
        const shape = (node: TreeNode, parent: TreeNode | null): unknown => {
          if ("parentNode" in node) expect(node.parentNode).toBe(parent);
          return {
            name: node.nodeName,
            ...("value" in node ? { value: node.value } : {}),
            ...("data" in node ? { data: node.data } : {}),
            ...("attrs" in node ? { attrs: node.attrs.map((a) => [a.name, a.value]) } : {}),
            ...("content" in node ? { content: shape(node.content, null) } : {}),
            children: ("childNodes" in node ? node.childNodes : []).map((c) => shape(c, node)),
          };
        };
        /** The document the page text reads, caught as the parse creates it. */
        const treeOf = (html: string) => {
          const spy = vi.spyOn(defaultTreeAdapter, "createDocument");
          try {
            pageTextOf(bytes(html));
            expect(spy).toHaveBeenCalledTimes(1); // no stop: one parse
            const made = spy.mock.results[0];
            if (made?.type !== "return") throw new Error("createDocument did not return");
            return shape(made.value, null);
          } finally {
            spy.mockRestore();
          }
        };

        it.each([
          [
            "text and an element fostered out of a table",
            "<table>a<b>x</b>c<tr><td>d</td></tr></table>e",
          ],
          ["text fostered in pieces, merged into one node", "<table>a b<tr>c d<td>e"],
          ["a text node before the table takes the fostered text", "<body>x<table>a<tr>b"],
          ["a br fostered after a text node", "<table>x<br>y<br>z"],
          ["fostering inside a template", "<template><table>a<b>x</b><tr>c</template>"],
          [
            "a formatting end tag over a block with children",
            "<b>1<div>2<br>3<i>4</i>5</b>6</div>7",
          ],
          [
            "the adoption agency, nested",
            "<p><b>one<div>two<span>s</span></b>three</div><i>x</p>y",
          ],
          [
            "a formatting end tag over a block and void elements",
            "<body><b><div><br>t<br></b><p>after</p>",
          ],
          ["a link over an a end tag", "<a>1<table><a>2</a>3</table>4</a>5"],
          ["a clone detached before it has a parent", "<b><a><li></b>"],
          ["the frameset detaching body", "<head></head><!--c--><div><frameset>"],
          ["a doctype after comments", "<!--c--><!--d--><!DOCTYPE html><p>x"],
        ])("builds the same tree for %s", (_n, html) => {
          const reference = parse(html, { scriptingEnabled: false, sourceCodeLocationInfo: true });
          expect(treeOf(html)).toEqual(shape(reference, null));
        });
      });
    });
  });
});

describe("the shared parse", () => {
  it("rethrows an error that is not the Nesting count's stop, untouched", () => {
    const spy = vi.spyOn(defaultTreeAdapter, "createElement").mockImplementation(() => {
      throw new Error("not a nesting stop");
    });
    try {
      expect(() => pageTextOf(bytes("<p>x</p>"))).toThrow("not a nesting stop");
      expect(() => stylesheetLinksOf(bytes("<p>x</p>"))).toThrow("not a nesting stop");
    } finally {
      spy.mockRestore();
    }
  });

  it("rethrows the first parse's other error instead of parsing again", () => {
    const spy = vi.spyOn(defaultTreeAdapter, "createElement").mockImplementationOnce(() => {
      throw new Error("once");
    });
    try {
      expect(() => pageTextOf(bytes("<p>x</p>"))).toThrow("once");
    } finally {
      spy.mockRestore();
    }
  });

  it("builds the word segmenter once, not per call", () => {
    const spy = vi.spyOn(Intl, "Segmenter");
    try {
      wordCount("one two");
      wordCount(THAI);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe("stylesheetLinksOf", () => {
  it("gives the href of each stylesheet link in document order and no other link", () => {
    const html = `<head><link rel="stylesheet" href="/a.css"><link rel="icon" href="/i.ico"><link rel="preload" as="style" href="/p.css"></head>
      <body><a href="/other">x</a><img src="/i.png"><script src="/s.js"></script><link REL="Alternate StyleSheet" href=" /b.css "><link rel="stylesheet"><link rel="stylesheet" href="  "></body>`;
    expect(stylesheetLinksOf(bytes(html))).toEqual({
      hrefs: ["/a.css", "/b.css"],
      incomplete: false,
    });
  });

  it("reads the same tree html-text-1 reads: a link in a template is not a link of the page", () => {
    expect(
      stylesheetLinksOf(
        bytes('<body><template><link rel="stylesheet" href="/t.css"></template></body>'),
      ).hrefs,
    ).toEqual([]);
  });

  it("walks 5,000 nested elements: a link in the 100th is found, one in the 600th is not, and it says so", () => {
    const link = (n: string) => `<link rel="stylesheet" href="/${n}.css">`;
    const html = `<body>${"<div>".repeat(99)}<div>${link("a")}</div>${"<div>".repeat(500)}<div>${link("b")}</div>${"<div>".repeat(4400)}</body>`;
    expect(stylesheetLinksOf(bytes(html))).toEqual({ hrefs: ["/a.css"], incomplete: true });
  });

  it("keeps a link at depth 128 and drops one past the Nesting count", () => {
    const link = '<link rel="stylesheet" href="/x.css">';
    expect(
      stylesheetLinksOf(bytes(`<body>${"<div>".repeat(MAX_DEPTH - 3)}${link}</body>`)),
    ).toEqual({ hrefs: ["/x.css"], incomplete: false });
    // 126 divs fill the stack to 128; the link is void, so only the walk meets it at depth 129
    expect(
      stylesheetLinksOf(bytes(`<body>${"<div>".repeat(MAX_DEPTH - 2)}${link}</body>`)),
    ).toEqual({ hrefs: [], incomplete: true });
    // 127 divs: the 127th is the 129th open element, so the parse stops there
    expect(
      stylesheetLinksOf(bytes(`<body>${"<div>".repeat(MAX_DEPTH - 1)}${link}</body>`)),
    ).toEqual({ hrefs: [], incomplete: true });
  });

  it("skips a link below the bound in the tree although the stack never passed it (the walk, not the count)", () => {
    // After <a><table><a> the tree builder lifts a td one deeper in the tree than on its stack:
    // the stack peaks at 128, the td lies at depth 129 and the link in it at depth 130.
    const html = `<body>${"<div>".repeat(MAX_DEPTH - 6)}<a><table><a><td><link rel=stylesheet href=a.css>`;
    expect(stylesheetLinksOf(bytes(html))).toEqual({ hrefs: [], incomplete: true });
    const shallower = `<body>${"<div>".repeat(MAX_DEPTH - 8)}<a><table><a><td><link rel=stylesheet href=a.css>`;
    expect(stylesheetLinksOf(bytes(shallower))).toEqual({ hrefs: ["a.css"], incomplete: false });
  });

  it.each(NESTING_DOCUMENTS)(
    "returns the 2 MB page of %s within 2 s, cut and incomplete",
    (_n, html) => {
      const started = performance.now();
      const out = stylesheetLinksOf(bytes(html));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out).toEqual({ hrefs: [], incomplete: true });
    },
    HEAVY_TIMEOUT,
  );

  it(
    "returns the held-depth page within 10 s with nothing cut",
    () => {
      const started = performance.now();
      const out = stylesheetLinksOf(bytes(HELD_DEPTH));
      expect(performance.now() - started).toBeLessThan(10000);
      expect(out).toEqual({ hrefs: [], incomplete: false });
    },
    HEAVY_TIMEOUT,
  );
});

// ---------------------------------------------------------------- row 9, F52

describe("pageTextAndPathsOf names the elements pathOf names", () => {
  // Tech notes section 8, "The element paths of the tokenized document", and section 14, row 9.
  const HTML = `<!doctype html><html><head><title>T</title></head><body>
<p:x>px</p:x><a:nth-of-type(1)>weird</a:nth-of-type(1)>
<p>Lead <span>inline</span></p>
<div aria-hidden="true"><p>aria</p></div><div hidden><p>hid</p></div>
<template><p>tpl</p></template></body></html>`;
  const unmatchedOf = (html: string, paths: string[]) =>
    pageTextAndPathsOf(bytes(html), paths).unmatchedPaths;

  const MATCHED: [string, string][] = [
    ["an element named p:x", "html>body>p:x:nth-of-type(1)"],
    ["an element named a:nth-of-type(1)", "html>body>a:nth-of-type(1):nth-of-type(1)"],
    ["a span inside a block", "html>body>p:nth-of-type(1)>span:nth-of-type(1)"],
    ["an element inside aria-hidden", "html>body>div:nth-of-type(1)>p:nth-of-type(1)"],
    ["an element inside a hidden div", "html>body>div:nth-of-type(2)>p:nth-of-type(1)"],
    ["the title", "html>head>title:nth-of-type(1)"],
    ["the root", "html"],
    ["body", "html>body"],
  ];
  const COUNTED: [string, string][] = [
    ["template content", "html>body>template:nth-of-type(1)>p:nth-of-type(1)"],
    ["an index on body", "html>body:nth-of-type(1)"],
    ["a bare segment below the root that is not html, head or body", "html>body>p"],
    ["an index of 0", "html>body>p:nth-of-type(0)"],
    ["an index with a leading zero", "html>body>p:nth-of-type(01)"],
    ["an index past the last", "html>body>p:nth-of-type(2)"],
    ["a name nothing has", "html>body>x-made-up:nth-of-type(1)"],
    ["a first segment that is not the root", "body>p:nth-of-type(1)"],
    ["an empty segment", "html>>p:nth-of-type(1)"],
    ["a path of 501 characters", `html>body>${"p".repeat(PATH_MAX_CHARS - 10)}:nth-of-type(1)`],
  ];

  it.each(MATCHED)("matches %s", (_name, path) => {
    expect(unmatchedOf(HTML, [path])).toBe(0);
  });

  it.each(COUNTED)("counts %s", (_name, path) => {
    expect(unmatchedOf(HTML, [path])).toBe(1);
  });

  it("counts every path that names nothing, once each, among those that match", () => {
    const paths = [...MATCHED, ...COUNTED].map(([, path]) => path);
    expect(unmatchedOf(HTML, paths)).toBe(COUNTED.length);
  });

  it("counts a path of 501 characters even when an element has it", () => {
    // An element whose name is 500 characters long: pathOf never builds its path, so no path names it.
    const name = "a".repeat(PATH_MAX_CHARS - 10);
    const path = `html>body>${name}:nth-of-type(1)`;
    expect(path.length).toBeGreaterThan(PATH_MAX_CHARS);
    expect(unmatchedOf(`<body><${name}>x</${name}>`, [path])).toBe(1);
  });

  it("gives the text of pageTextOf whatever the paths are", () => {
    const out = pageTextAndPathsOf(bytes(HTML), ["html>body>p", "html>body>p:nth-of-type(1)"]);
    expect(out.text).toEqual(pageTextOf(bytes(HTML)));
    expect(out.unmatchedPaths).toBe(1);
  });

  it("names the element of every block path, on a page that has them", () => {
    const blocks = pageTextOf(bytes(HTML)).blocks;
    expect(blocks.length).toBeGreaterThan(2);
    const out = pageTextAndPathsOf(
      bytes(HTML),
      blocks.map((b) => b.path),
    );
    expect(out.unmatchedPaths).toBe(0);
  });

  it("matches a path up to the cut of the Attribute count and counts one after it", () => {
    const attributes = Array.from({ length: 257 }, (_v, i) => ` a${i}`).join("");
    const html = `<body><p>one</p><p${attributes}>two</p>`;
    const out = pageTextAndPathsOf(bytes(html), [
      "html>body>p:nth-of-type(1)",
      "html>body>p:nth-of-type(2)",
    ]);
    expect(out.unmatchedPaths).toBe(1);
    expect(out.text.incomplete).toBe(true);
  });

  const SMALL_FIXTURES: [string, string][] = [
    ["the html-text-1 fixture", HTML],
    ["a fostered table", "<table>x<tr><td>cell</td></tr>text</table><p>after</p>"],
    ["nested lists and inline text", "<ul><li>one <b>bold</b><ul><li>inner</li></ul></li></ul>"],
    [
      "a heading, a title and a meta description",
      '<title>T</title><meta name="description" content="D"><h1>H</h1><p>P</p>',
    ],
    [
      "svg and math",
      "<body><svg><text>t</text></svg><math><html><p>m</p></html></math><p>after</p>",
    ],
    ["a frameset", "<frameset><frame></frameset>"],
  ];
  it.each(SMALL_FIXTURES)(
    "%s: the text equals pageTextOf and its block paths all match",
    (_n, html) => {
      const out = pageTextAndPathsOf(bytes(html), []);
      expect(out.text).toEqual(pageTextOf(bytes(html)));
      const again = pageTextAndPathsOf(
        bytes(html),
        out.text.blocks.map((b) => b.path),
      );
      expect(again.unmatchedPaths).toBe(0);
    },
  );

  it.each([
    ...NESTING_DOCUMENTS,
    ["the held-depth document", HELD_DEPTH] as [string, string],
    ["re-opened formatting elements", REOPENED_FORMATTING] as [string, string],
    ["one tag with too many attributes", ONE_TAG] as [string, string],
  ])(
    "%s (2 MB): the text equals pageTextOf and its block paths all match",
    (_n, html) => {
      const out = pageTextAndPathsOf(bytes(html), []);
      expect(out.text).toEqual(pageTextOf(bytes(html)));
      const again = pageTextAndPathsOf(
        bytes(html),
        out.text.blocks.map((b) => b.path),
      );
      expect(again.unmatchedPaths).toBe(0);
    },
    HEAVY_TIMEOUT,
  );

  it(
    "looks 5,000 paths up in a 2 MB document of br elements within the bound",
    () => {
      const html = upTo(DOCUMENT_MAX, "<body>", "<br>");
      const paths = Array.from({ length: 5000 }, (_v, i) =>
        i % 2 === 0 ? `html>body>br:nth-of-type(${i * 100 + 1})` : `html>body>br:nth-of-type(0)`,
      );
      const started = performance.now();
      const out = pageTextAndPathsOf(bytes(html), paths);
      expect(performance.now() - started).toBeLessThan(LOOKUP_BOUND_MS);
      expect(out.unmatchedPaths).toBe(2500);
    },
    HEAVY_TIMEOUT,
  );
});
