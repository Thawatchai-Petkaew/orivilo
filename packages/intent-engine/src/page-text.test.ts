import { describe, expect, it } from "vitest";
import { MAX_DEPTH, pageTextOf, stylesheetLinksOf, wordCount } from "./page-text";

// The engine's tsconfig has no DOM or Node lib, so the one global this file uses is declared here.
declare class TextEncoder {
  encode(input: string): Uint8Array;
}

declare const performance: { now(): number }; // the engine tsconfig has no DOM lib; a timer for the time bounds
const bytes = (html: string) => new TextEncoder().encode(html);
const blocksOf = (html: string) => pageTextOf(bytes(html)).blocks;
const texts = (html: string) => blocksOf(html).map((b) => b.text);
const THAI = "อยากให้สนุก"; // packages/intent-engine/src/interpreter.test.ts line 42

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

    it("keeps nothing of a block with no whitespace before the limit, and nothing after it", () => {
      expect(texts(`<p>${"a".repeat(5000 + 1)}</p><p>later</p>`)).toEqual([]);
    });

    it("does not count the title, the meta description or headings against the body bound", () => {
      const long = words(600);
      const out = blocksOf(
        `<head><title>${long}</title><meta name="description" content="${long}"></head><body><h1>${words(100)}</h1><p>${words(500)}</p><h2>${words(100)}</h2></body>`,
      );
      expect(out.map((b) => [b.kind, b.text.length])).toEqual([
        ["title", 5999],
        ["meta", 5999],
        ["heading", 999],
        ["body", 4999],
        ["heading", 999],
      ]);
    });
  });

  describe("the heading bound", () => {
    const word = "xxxxxxxxx";
    const words = (n: number) => Array<string>(n).fill(word).join(" ");

    it("keeps 294 of 40,000 headings, 4,998 characters in all, and reports page-incomplete in time", () => {
      const html = `<body>${"<h2>heading text here</h2>".repeat(40_000)}</body>`;
      const started = performance.now();
      const out = pageTextOf(bytes(html));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out.blocks).toHaveLength(294);
      expect(out.blocks.reduce((n, b) => n + b.text.length, 0)).toBe(4998);
      expect(out.incomplete).toBe(true);
    });

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

  describe("the depth bound", () => {
    // html is depth 1 and body is 2, so a p under n divs lies at depth 3 + n
    const under = (divs: number, inner: string) =>
      `<body>${"<div>".repeat(divs)}${inner}${"</div>".repeat(divs)}</body>`;

    it("is 512", () => {
      expect(MAX_DEPTH).toBe(512);
    });

    it("keeps a block at depth 512 and drops one at depth 513", () => {
      const at512 = pageTextOf(bytes(under(509, "<p>deep</p>")));
      expect(at512.blocks.map((b) => b.text)).toEqual(["deep"]);
      expect(at512.incomplete).toBe(false);
      const at513 = pageTextOf(bytes(under(510, "<p>deep</p>")));
      expect(at513.blocks).toEqual([]);
      expect(at513.incomplete).toBe(true);
    });

    it("walks 5,000 nested elements without throwing, gives no block for the innermost and says so", () => {
      const out = pageTextOf(bytes(under(5000, "<p>deep</p>")));
      expect(out.blocks.map((b) => b.text)).not.toContain("deep");
      expect(out.incomplete).toBe(true);
    });

    it("gives the path of a block at depth 512 without recursion", () => {
      const out = pageTextOf(bytes(under(509, "<p>deep</p>")));
      expect(out.blocks[0]?.path.split(">")).toHaveLength(512);
    });

    it("keeps the text of an inline element at depth 512", () => {
      const html = `<body>${"<div>".repeat(497)}<p>A${"<b>".repeat(12)}x</p></body>`;
      expect(texts(html)).toEqual(["Ax"]);
    });

    it("leaves the text of an inline element below the bound out of the block above it", () => {
      const html = `<body>${"<div>".repeat(497)}<p>A${"<b>".repeat(20)}x</p></body>`;
      const out = pageTextOf(bytes(html));
      expect(out.blocks.map((b) => b.text)).toEqual(["A"]);
      expect(out.incomplete).toBe(true);
    });

    it("reports page-incomplete for inline elements below the bound too", () => {
      const out = pageTextOf(bytes(`<body>${"<b>".repeat(520)}x</body>`));
      expect(out.incomplete).toBe(true);
    });
  });

  describe("paths in one pass per parent", () => {
    it("numbers 5,000 sibling blocks in time", () => {
      const html = `<body>${"<p>x</p>".repeat(100_000)}</body>`;
      const started = performance.now();
      const out = pageTextOf(bytes(html));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out.blocks).toHaveLength(5000);
      expect(out.blocks[4999]?.path).toBe("html>body>p:nth-of-type(5000)");
    });

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

  it("keeps a link at depth 512 and drops one at depth 513", () => {
    const link = '<link rel="stylesheet" href="/x.css">';
    expect(stylesheetLinksOf(bytes(`<body>${"<div>".repeat(509)}${link}</body>`))).toEqual({
      hrefs: ["/x.css"],
      incomplete: false,
    });
    expect(stylesheetLinksOf(bytes(`<body>${"<div>".repeat(510)}${link}</body>`))).toEqual({
      hrefs: [],
      incomplete: true,
    });
  });
});
