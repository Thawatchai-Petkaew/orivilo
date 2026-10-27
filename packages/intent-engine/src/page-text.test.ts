import { defaultTreeAdapter } from "parse5";
import { describe, expect, it, vi } from "vitest";
import { PATH_MAX_CHARS } from "./evidence";
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
    );

    it("returns the held-depth page within 2 s, with nothing cut", () => {
      expect(HELD_DEPTH.length).toBeLessThanOrEqual(DOCUMENT_MAX);
      const started = performance.now();
      const out = pageTextOf(bytes(HELD_DEPTH));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out.blocks).toEqual([]); // its p elements hold no text
      expect(out.incomplete).toBe(false);
    });
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

    it("returns 5,000 p blocks and 5,000 h2 blocks under a long path within 2 s and 10 MB of path, with none kept", () => {
      // 28 nested divs put every block's path past 500 characters, well inside the depth bound
      const html = `<body>${"<div>".repeat(28)}${"<p>x</p>".repeat(5000)}${"<h2>x</h2>".repeat(5000)}</body>`;
      const started = performance.now();
      const out = pageTextOf(bytes(html));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out.blocks).toEqual([]);
      expect(out.incomplete).toBe(true);
    });

    it("builds no path past the bound: 30,000 blocks under 125 nested long names are dropped in time", () => {
      // 125 elements named 1,000 characters make each block's path 125,000 characters; built whole, 30,000 of them would take far longer
      const name = `x-${"a".repeat(998)}`;
      const html = `<body>${`<${name}>`.repeat(MAX_DEPTH - 4)}${"<p>x</p>".repeat(15_000)}${"<h2>x</h2>".repeat(15_000)}`;
      const started = performance.now();
      const out = pageTextOf(bytes(html));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out.blocks).toEqual([]);
      expect(out.incomplete).toBe(true);
    });

    it("returns the page of 509 nested long names within 2 s, incomplete, with no path over 500", () => {
      const name = `x-${"a".repeat(998)}`;
      const html = `<body>${`<${name}>`.repeat(509)}${"<p>x</p>".repeat(5000)}${"<h2>x</h2>".repeat(5000)}`;
      const started = performance.now();
      const out = pageTextOf(bytes(html));
      expect(performance.now() - started).toBeLessThan(2000);
      expect(out.incomplete).toBe(true);
      expect(out.blocks.every((b) => b.path.length <= PATH_MAX_CHARS)).toBe(true);
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
  );

  it("returns the held-depth page within 2 s with nothing cut", () => {
    const started = performance.now();
    const out = stylesheetLinksOf(bytes(HELD_DEPTH));
    expect(performance.now() - started).toBeLessThan(2000);
    expect(out).toEqual({ hrefs: [], incomplete: false });
  });
});
