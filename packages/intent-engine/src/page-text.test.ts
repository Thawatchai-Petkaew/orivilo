import { describe, expect, it } from "vitest";
import { pageTextOf, stylesheetLinksOf, wordCount } from "./page-text";

// The engine's tsconfig has no DOM or Node lib, so the one global this file uses is declared here.
declare class TextEncoder {
  encode(input: string): Uint8Array;
}

const bytes = (html: string) => new TextEncoder().encode(html);
const texts = (html: string) => pageTextOf(bytes(html)).map((b) => b.text);
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
    expect(pageTextOf(bytes(fixture)).map((b) => [b.kind, b.text])).toEqual([
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
    const blocks = pageTextOf(bytes(html));
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
      const out = pageTextOf(bytes(`<p>${words(300)}</p><p>${words(300)}</p><p>later</p>`));
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

    it("does not count the title, the meta description or headings against the bound", () => {
      const long = words(600);
      const out = pageTextOf(
        bytes(
          `<head><title>${long}</title><meta name="description" content="${long}"></head><body><h1>${long}</h1><p>${words(500)}</p><h2>${long}</h2></body>`,
        ),
      );
      expect(out.map((b) => [b.kind, b.text.length])).toEqual([
        ["title", 5999],
        ["meta", 5999],
        ["heading", 5999],
        ["body", 4999],
        ["heading", 5999],
      ]);
    });
  });

  it("gives deep-equal blocks for equal bytes", () => {
    expect(pageTextOf(bytes(fixture))).toEqual(pageTextOf(bytes(fixture)));
  });

  it("decodes bytes as UTF-8 and turns an invalid sequence into U+FFFD without throwing", () => {
    const decoded = new Uint8Array([
      0x3c, 0x70, 0x3e, 0xe0, 0xb8, 0xad, 0xff, 0x3c, 0x2f, 0x70, 0x3e,
    ]);
    expect(pageTextOf(decoded).map((b) => b.text)).toEqual(["อ�"]);
  });

  it("counts the Thai example as 3 words where splitting on spaces gives 1", () => {
    const folded = pageTextOf(bytes(`<p> \n  ${THAI}  </p>`))[0]?.text;
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
    expect(stylesheetLinksOf(bytes(html))).toEqual(["/a.css", "/b.css"]);
  });

  it("reads the same tree html-text-1 reads: a link in a template is not a link of the page", () => {
    expect(
      stylesheetLinksOf(
        bytes('<body><template><link rel="stylesheet" href="/t.css"></template></body>'),
      ),
    ).toEqual([]);
  });
});
