import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import type { Mode } from "../../boundary/DesignProfileBoundary";
import { profileById } from "../../profiles/index";
import { tokens } from "../../tokens/index";
import { expectPaintsAt, hexToRgb, inVitest, type PaintProbe } from "../../testing/visual-asserts";
import { Matrix } from "../matrix";
import { Logo, type LogoKind, type LogoTone } from "./Logo";

const meta = {
  title: "Base/Logo",
  component: Logo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The ORIVILO logo (ORV-118): mark, wordmark and the horizontal and stacked lockups. Colour comes from the logo tokens, so a profile and a mode repaint it. Below 20 px the ring is heavier. Under the ORIVILO profile the dot is violet at every size. The only text is the accessible name, which the locale toolbar switches between Thai and English. The mark is not yet screened as a trademark (logo-screen-1).",
      },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = "flex flex-wrap items-end gap-6";

/** The neutral values rows 1 to 4 and 6 compare with (spec W6, DESIGN.md section 3.1). */
const NEUTRAL_LIGHT = { ink: "#16151D", dot: "#7A22C7", dotSmall: "#7A22C7" } as const;
const NEUTRAL_DARK = { ink: "#F2F1EC", dot: "#B07FEE", dotSmall: "#B07FEE" } as const;

interface Colours {
  ink: string;
  dot: string;
  dotSmall: string;
}

/** The `logo.*` component tokens of one profile and mode, resolved from the token source. */
function coloursOf(profile: string, mode: Mode): Colours {
  const set = profileById(profile)?.tokens ?? tokens;
  const read = (name: string) => {
    const token = set.get("component", `logo.${name}`);
    if (!token) throw new Error(`component token logo.${name} is missing`);
    return String(set.resolve(token, mode).value);
  };
  return { ink: read("ink"), dot: read("dot"), dotSmall: read("dot-small") };
}

/**
 * The colours of the profile and mode the toolbar has set, so a play passes under every toolbar
 * pair. `literal` is the neutral light set where the pixel probe runs, and undefined elsewhere.
 */
function toolbarColours(globals: Record<string, unknown>): {
  colours: Colours;
  literal: Colours | undefined;
} {
  const profile = String(globals["profile"]);
  const mode = globals["mode"] as Mode;
  return {
    colours: coloursOf(profile, mode),
    literal: profile === "neutral" && mode === "light" ? NEUTRAL_LIGHT : undefined,
  };
}

/** How a browser reports a computed colour. */
const rgb = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
};

const logosIn = (root: ParentNode) => [...root.querySelectorAll<SVGSVGElement>("svg.ds-logo")];

function logoAt(root: ParentNode, kind: LogoKind, height: number): SVGSVGElement {
  const found = root.querySelector<SVGSVGElement>(
    `svg.ds-logo[data-kind="${kind}"][height="${height}"]`,
  );
  if (!found) throw new Error(`no ${kind} Logo at height ${height}`);
  return found;
}

/**
 * Asserts the computed paint of every part of one Logo (logo-colour-1): the ring and the wordmark
 * strokes and fills in the ink, the dot in the colour its form and tone call for. A kind without a
 * ring has no dot, and a wordmark has neither.
 */
function expectColours(svg: SVGSVGElement, c: Colours) {
  const kind = svg.dataset["kind"] as LogoKind;
  const tone = svg.dataset["tone"] as LogoTone;
  const form = svg.dataset["form"];
  const dot = tone === "one-colour" ? c.ink : form === "master" ? c.dot : c.dotSmall;
  const hasMark = kind !== "wordmark";
  const hasWordmark = kind !== "mark";
  const parts: [selector: string, property: "stroke" | "fill", hex: string, count: number][] = [
    [".ds-logo__ring", "stroke", c.ink, hasMark ? 1 : 0],
    [".ds-logo__dot", "fill", dot, hasMark ? 1 : 0],
    [".ds-logo__strokes", "stroke", c.ink, hasWordmark ? 1 : 0],
    [".ds-logo__fills", "fill", c.ink, hasWordmark ? 1 : 0],
  ];
  for (const [selector, property, hex, count] of parts) {
    const found = svg.querySelectorAll(selector);
    expect(found.length, `${kind} ${selector} count`).toBe(count);
    for (const part of found) {
      expect(
        getComputedStyle(part)[property],
        `${kind} (form ${form}, ${tone}) ${selector} ${property}`,
      ).toBe(rgb(hex));
    }
  }
}

/** Where the mark and the wordmark sit in each kind's viewBox (logo-geometry-1). */
const AT: Record<LogoKind, { mark?: readonly [number, number]; word?: readonly [number, number] }> =
  {
    mark: { mark: [0, 0] },
    wordmark: { word: [0, 0] },
    horizontal: { mark: [0, 0], word: [190, 45] },
    stacked: { mark: [161.5, 0], word: [0, 270] },
  };

/**
 * Probe points wholly inside a part (expectPaintsAt): the ring at its left extreme and the dot at
 * its centre, the wordmark's first `o` stroke and its first i-dot.
 */
function probesOf(svg: SVGSVGElement, c: Colours): PaintProbe[] {
  const kind = svg.dataset["kind"] as LogoKind;
  const tone = svg.dataset["tone"] as LogoTone;
  const form = svg.dataset["form"];
  const dot = tone === "one-colour" ? c.ink : form === "master" ? c.dot : c.dotSmall;
  const { mark, word } = AT[kind];
  const probes: PaintProbe[] = [];
  if (mark) {
    probes.push({ x: mark[0] + 22.5, y: mark[1] + 77.5, hex: c.ink });
    probes.push({ x: mark[0] + 105.11, y: mark[1] + 34.49, hex: dot });
  }
  if (word) {
    probes.push({ x: word[0] + 12, y: word[1] + 50, hex: c.ink });
    probes.push({ x: word[0] + 182, y: word[1] - 25, hex: c.ink });
  }
  return probes;
}

/**
 * Reads the rendered pixels where Vitest browser mode runs; the static Storybook has no screenshot.
 * One screenshot covers every Logo handed in (ORV-118 R2), because each shot queues on the shared
 * screenshot lock behind every other story file.
 */
async function expectPaint(svgs: readonly SVGSVGElement[], c: Colours) {
  if (!inVitest) return;
  await expectPaintsAt(svgs.map((svg) => ({ svg, probes: probesOf(svg, c) })));
}

const near = (read: number, expected: number) => Math.abs(read - expected) <= 0.02;

/** The four kinds at height 64 (D7: 96 would overflow the 360 px column). */
export const Kinds: Story = {
  render: () => (
    <div className={row}>
      <Logo kind="mark" height={64} />
      <Logo kind="wordmark" height={64} />
      <Logo kind="horizontal" height={64} />
      <Logo kind="stacked" height={64} />
    </div>
  ),
  play: async ({ canvasElement, globals }) => {
    const { colours, literal } = toolbarColours(globals);
    const logos = logosIn(canvasElement);
    expect(logos.map((svg) => svg.dataset["kind"])).toEqual([
      "mark",
      "wordmark",
      "horizontal",
      "stacked",
    ]);
    const widths = [64, 201.81, 282.88, 80.73];
    logos.forEach((svg, i) => {
      const box = svg.getBoundingClientRect();
      expect(box.height, `${svg.dataset["kind"]} height`).toBeCloseTo(64, 1);
      expect(
        near(box.width, widths[i] as number),
        `${svg.dataset["kind"]} width ${box.width}`,
      ).toBe(true);
    });
    for (const svg of logos) expectColours(svg, colours);
    if (literal) await expectPaint(logos, literal);
  },
};

const SMALL_HEIGHTS = [12, 16, 19.9, 20, 24, 24.1, 32, 120];

/** The mark at the heights where the form changes. Below 16 it renders at 16, the minimum. */
export const SmallSizes: Story = {
  render: () => (
    <div className={row}>
      {SMALL_HEIGHTS.map((height) => (
        <Logo key={height} kind="mark" height={height} />
      ))}
    </div>
  ),
  play: async ({ canvasElement, globals }) => {
    const { colours, literal } = toolbarColours(globals);
    const logos = logosIn(canvasElement);
    expect(logos).toHaveLength(SMALL_HEIGHTS.length);
    // W3: the form and the ring stroke for each asked height.
    const heights = ["16", "16", "19.9", "20", "24", "24.1", "32", "120"];
    const forms = ["16", "16", "16", "24", "24", "master", "master", "master"];
    const strokes = ["34", "34", "34", "32", "32", "30", "30", "30"];
    for (const [i, svg] of logos.entries()) {
      const at = `asked ${SMALL_HEIGHTS[i]}`;
      expect(svg.getAttribute("height"), `${at}: rendered height`).toBe(heights[i]);
      expect(svg.dataset["form"], `${at}: form`).toBe(forms[i]);
      expect(
        svg.querySelector(".ds-logo__ring")?.getAttribute("stroke-width"),
        `${at}: stroke`,
      ).toBe(strokes[i]);
      // The small forms read the small dot and the master the master dot: one violet under neutral.
      expectColours(svg, colours);
    }
    if (literal) await expectPaint(logos, literal);
  },
};

const ONE_COLOUR: readonly { kind: LogoKind; height: number }[] = [
  { kind: "mark", height: 16 },
  { kind: "mark", height: 64 },
  { kind: "horizontal", height: 24 },
  { kind: "wordmark", height: 20 },
  { kind: "stacked", height: 80 },
];

/** `tone="one-colour"`: the whole drawing, dot included, in the ink, under six boundaries. */
export const OneColour: Story = {
  render: () => (
    <Matrix>
      <div className={row}>
        {ONE_COLOUR.map(({ kind, height }) => (
          <Logo key={`${kind}-${height}`} kind={kind} height={height} tone="one-colour" />
        ))}
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const profile = cell.dataset["matrixProfile"] ?? "";
      const mode = cell.dataset["matrixMode"] as Mode;
      const colours = coloursOf(profile, mode);
      const logos = logosIn(cell);
      expect(logos, `${profile} ${mode}`).toHaveLength(ONE_COLOUR.length);
      for (const svg of logos) {
        expect(svg.dataset["tone"]).toBe("one-colour");
        expectColours(svg, colours);
      }
      // The pixels: the dot is the ring's colour, on the neutral canvas in both modes.
      if (profile === "neutral") {
        const literal = mode === "dark" ? NEUTRAL_DARK : NEUTRAL_LIGHT;
        expect(colours.ink).toBe(literal.ink);
        await expectPaint(logos, literal);
      }
    }
  },
};

/** `<Logo />` is an image named ORIVILO; the locale toolbar shows the name in Thai and English. */
export const Named: Story = {
  render: () => <Logo />,
  play: async ({ canvasElement }) => {
    // The test locale is Thai (the English name is covered by logo.test.ts).
    const image = within(canvasElement).getByRole("img", { name: "ORIVILO" });
    expect(image.tagName.toLowerCase()).toBe("svg");
    expect(image.getAttribute("aria-hidden")).toBeNull();
  },
};

/** `decorative`: for where text or an enclosing link already says the name. Nothing is announced. */
export const Decorative: Story = {
  render: () => <Logo decorative />,
  play: async ({ canvasElement }) => {
    const [svg] = logosIn(canvasElement);
    expect(logosIn(canvasElement)).toHaveLength(1);
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.hasAttribute("aria-label")).toBe(false);
    expect(svg?.hasAttribute("role")).toBe(false);
    // Hidden elements are included, so a stray role="img" would still be found.
    expect(within(canvasElement).queryAllByRole("img", { hidden: true })).toHaveLength(0);
  },
};

/** The box each fixture draws, from the viewBox ratios (spec W4). */
const FIXTURE = [
  { kind: "mark", height: 16, width: 16, form: "16", stroke: "34" },
  { kind: "mark", height: 24, width: 24, form: "24", stroke: "32" },
  { kind: "mark", height: 64, width: 64, form: "master", stroke: "30" },
  { kind: "horizontal", height: 32, width: 141.44, form: "master", stroke: "30" },
  { kind: "wordmark", height: 20, width: 63.07, form: "master", stroke: undefined },
  { kind: "stacked", height: 80, width: 100.91, form: "master", stroke: "30" },
] as const satisfies readonly {
  kind: LogoKind;
  height: number;
  width: number;
  form: string;
  stroke: string | undefined;
}[];

/** All kinds and forms under neutral, Professional and Friendly, light and dark. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <div className={row}>
        {FIXTURE.map(({ kind, height }) => (
          <Logo key={`${kind}-${height}`} kind={kind} height={height} />
        ))}
      </div>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]");
    expect(cells).toHaveLength(6);
    for (const cell of cells) {
      const profile = cell.dataset["matrixProfile"] ?? "";
      const mode = cell.dataset["matrixMode"] as Mode;
      const at = `${profile} ${mode}`;
      const neutralDark = profile === "neutral" && mode === "dark";
      const colours = neutralDark ? NEUTRAL_DARK : coloursOf(profile, mode);
      expect(logosIn(cell), at).toHaveLength(FIXTURE.length);
      for (const f of FIXTURE) {
        const svg = logoAt(cell, f.kind, f.height);
        // Row 9: the same box in every boundary.
        const box = svg.getBoundingClientRect();
        expect(near(box.width, f.width), `${at}: ${f.kind} ${f.height} width ${box.width}`).toBe(
          true,
        );
        expect(near(box.height, f.height), `${at}: ${f.kind} ${f.height} height`).toBe(true);
        // Rows 3 and 4: the form, and the ring stroke it draws.
        expect(svg.dataset["form"], `${at}: ${f.kind} ${f.height} form`).toBe(f.form);
        expect(svg.querySelector(".ds-logo__ring")?.getAttribute("stroke-width")).toBe(
          f.stroke ?? undefined,
        );
        // Rows 2, 4 and 9: the paint follows the profile and the mode.
        expectColours(svg, colours);
      }
      // Rows 2 and 4: the neutral dark cell is read from its pixels too.
      if (neutralDark) await expectPaint(logosIn(cell), colours);
    }
  },
};
