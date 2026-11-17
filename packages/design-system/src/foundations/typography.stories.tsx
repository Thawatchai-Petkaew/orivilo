import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import {
  expectInkClearsAbove,
  expectLinesClear,
  expectNoGlyphClip,
  inVitest,
} from "../testing/visual-asserts";

type Group = "heading" | "body" | "code";

interface Step {
  /** The `type.*` token this row shows (semantic.json). */
  style: string;
  group: Group;
  /** Utilities from the type scale in src/tokens/orivilo.css (DESIGN.md §4). */
  className: string;
  /** What the caption reads after the style name: size / line height, weight. */
  spec: string;
  weight: string;
  /** The computed line height, in px. */
  lineHeight: number;
  /** The computed top padding, in px, when the row pads its own top. */
  paddingTop?: number;
  sample: string;
}

const SAMPLE = "ฟื้นฟูแบรนด์ด้วยระบบตั้งใจ Intent Engine ให้เป็นผลิตภัณฑ์ที่มีชีวิต 0123";
/** Numerals hold digits only (type-face-1); the sample is the one of the Latin face. */
const NUMERAL_SAMPLE = "Intent Engine 0123";
const LONG_THAI = "บริษัทออริวิโลเทคโนโลยีสร้างสรรค์จำกัดมหาชนสาขากรุงเทพมหานคร";

/**
 * One row per `type.*` token, 15 in all (type-face-1): four heading styles in Inter and Anuphan,
 * ten body styles in Inter and Sarabun, one code style in IBM Plex Mono and Sarabun. The heading
 * rows keep the line heights they had before ORV-275. `type.heading.md` and `type.heading.sm` pad
 * no top of their own, so their rows carry the 8 px (`pt-2`) that DESIGN.md §4 asks above a heading.
 */
const SCALE: readonly Step[] = [
  {
    style: "type.display.lg",
    group: "heading",
    className: "font-display text-display-lg",
    spec: "56 / 1.2, weight 500",
    weight: "500",
    lineHeight: 67.2,
    paddingTop: 24,
    sample: SAMPLE,
  },
  {
    style: "type.display.md",
    group: "heading",
    className: "font-display text-display-md",
    spec: "32 / 1.25, weight 500",
    weight: "500",
    lineHeight: 40,
    paddingTop: 16,
    sample: SAMPLE,
  },
  {
    style: "type.heading.md",
    group: "heading",
    className: "pt-2 font-display text-heading-md",
    spec: "24 / 1.3, weight 500",
    weight: "500",
    lineHeight: 31.2,
    paddingTop: 8,
    sample: SAMPLE,
  },
  {
    style: "type.heading.sm",
    group: "heading",
    className: "pt-2 font-display text-heading-sm",
    spec: "20 / 1.7, weight 500",
    weight: "500",
    lineHeight: 34,
    paddingTop: 8,
    sample: SAMPLE,
  },
  {
    style: "type.body.lg",
    group: "body",
    className: "font-body text-body-lg",
    spec: "20 / 1.7, weight 400",
    weight: "400",
    lineHeight: 34,
    sample: SAMPLE,
  },
  {
    style: "type.body.md",
    group: "body",
    className: "font-body text-body-md",
    spec: "16 / 1.7, weight 400",
    weight: "400",
    lineHeight: 27.2,
    sample: SAMPLE,
  },
  {
    style: "type.body.sm",
    group: "body",
    className: "font-body text-body-sm",
    spec: "14 / 1.7, weight 400",
    weight: "400",
    lineHeight: 23.8,
    sample: SAMPLE,
  },
  {
    style: "type.body.xs",
    group: "body",
    className: "font-body text-body-xs",
    spec: "13 / 1.7, weight 400",
    weight: "400",
    lineHeight: 22.1,
    sample: SAMPLE,
  },
  {
    style: "type.label.md",
    group: "body",
    className: "font-body text-label-md",
    spec: "14 / 1.7, weight 500",
    weight: "500",
    lineHeight: 23.8,
    sample: SAMPLE,
  },
  {
    style: "type.label.sm",
    group: "body",
    className: "font-body text-label-sm",
    spec: "13 / 1.5, weight 500",
    weight: "500",
    lineHeight: 19.5,
    sample: SAMPLE,
  },
  {
    style: "type.control.md",
    group: "body",
    className: "font-body text-control-md",
    spec: "14 / 1.6, weight 500",
    weight: "500",
    lineHeight: 22.4,
    sample: SAMPLE,
  },
  {
    style: "type.field.sm",
    group: "body",
    className: "font-body text-field-sm",
    spec: "14 / 1.6, weight 400",
    weight: "400",
    lineHeight: 22.4,
    sample: SAMPLE,
  },
  {
    style: "type.numeral.lg",
    group: "body",
    className: "font-body text-numeral-lg",
    spec: "40 / 1, weight 500",
    weight: "500",
    lineHeight: 40,
    sample: NUMERAL_SAMPLE,
  },
  {
    style: "type.numeral.md",
    group: "body",
    className: "font-body text-numeral-md",
    spec: "32 / 1, weight 500",
    weight: "500",
    lineHeight: 32,
    sample: NUMERAL_SAMPLE,
  },
  {
    style: "type.code.md",
    group: "code",
    className: "font-mono text-code-md",
    spec: "14 / 1.6, weight 400",
    weight: "400",
    lineHeight: 22.4,
    sample: SAMPLE,
  },
];

interface Face {
  key: "inter" | "anuphan" | "sarabun";
  /** The utilities that set the family of the sample. */
  className: string;
  /** The Thai face of the sample's stack: the second family name. */
  thaiFace: "Anuphan" | "Sarabun";
  captionEn: string;
  captionTh: string;
  sample: string;
}

/** The three families of type-face-1, in the order Inter, Anuphan, Sarabun. */
const FACES: readonly Face[] = [
  {
    key: "inter",
    className: "font-body text-body-lg",
    thaiFace: "Sarabun",
    captionEn: "Inter: Latin letters and digits in every style",
    captionTh: "Inter: ตัวอักษรละตินและตัวเลขในทุกสไตล์",
    sample: "Brand evidence report 0123",
  },
  {
    key: "anuphan",
    className: "font-display text-heading-md",
    thaiFace: "Anuphan",
    captionEn: "Anuphan: Thai in headings",
    captionTh: "Anuphan: ภาษาไทยในหัวข้อ",
    sample: "ฟื้นฟูแบรนด์ด้วยระบบตั้งใจ",
  },
  {
    key: "sarabun",
    className: "font-body text-body-lg",
    thaiFace: "Sarabun",
    captionEn: "Sarabun: Thai in body text",
    captionTh: "Sarabun: ภาษาไทยในเนื้อความ",
    sample: "ผลิตภัณฑ์ที่มีชีวิตเริ่มจากความตั้งใจของธุรกิจ",
  },
];

const INTRO_EN =
  "Thai and Latin on the same line at each step of the scale. Latin letters and digits are Inter in every style. Thai headings are Anuphan, and Thai body text is looped Sarabun, in every profile. Code is IBM Plex Mono, with Sarabun for Thai. Fonts are self-hosted from this package. No letter-spacing and no text-transform on Thai.";
const INTRO_TH =
  "ภาษาไทยและละตินบนบรรทัดเดียวกันในทุกขั้นของสเกล ตัวอักษรละตินและตัวเลขใช้ Inter ในทุกสไตล์ หัวข้อภาษาไทยใช้ Anuphan และเนื้อความภาษาไทยใช้ Sarabun แบบมีหัว ในทุกโปรไฟล์ โค้ดใช้ IBM Plex Mono และใช้ Sarabun กับภาษาไทย ฟอนต์โหลดจากแพ็กเกจนี้เอง ภาษาไทยไม่เว้นระยะตัวอักษรและไม่แปลงรูปตัวอักษร";

function TypographyPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="font-display text-display-md">Typography</h1>
      <p className="mt-2 max-w-prose text-text-secondary">{INTRO_EN}</p>
      <p lang="th" className="mt-2 max-w-prose text-text-secondary">
        {INTRO_TH}
      </p>
      <dl className="mt-8 space-y-6" data-faces>
        {FACES.map((face) => (
          <div key={face.key} data-face={face.key}>
            <dt className="font-mono text-body-sm text-text-secondary">{face.captionEn}</dt>
            <dt lang="th" className="font-mono text-body-sm text-text-secondary">
              {face.captionTh}
            </dt>
            <dd className={face.className}>{face.sample}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-8 space-y-8" data-scale>
        {SCALE.map((step) => (
          // The wrapper clips its overflow (layout) so `expectNoGlyphClip` has a clipping ancestor
          // to check against; its 24 px bottom padding holds Inter's font box and the ink that
          // falls below a 56 / 1.2 line.
          <div
            key={step.style}
            data-style={step.style}
            data-group={step.group}
            className="overflow-hidden border-b border-border-subtle pb-6"
          >
            <dt className="font-mono text-body-sm text-text-secondary">
              {step.style}: {step.spec}
            </dt>
            <dd className={step.className}>{step.sample}</dd>
            {step.group === "heading" ? (
              <dd data-wrapped className={`${step.className} w-[360px] max-w-full`}>
                {step.sample}
              </dd>
            ) : null}
          </div>
        ))}
      </dl>
      <h2 className="mt-10 font-display text-heading-sm">
        Fixture lines every component must survive
      </h2>
      <ul data-fixtures className="mt-3 space-y-2 wrap-anywhere">
        <li>{LONG_THAI}</li>
        <li>A long Latin word: Donaudampfschifffahrtsgesellschaftskapitän</li>
        <li className="text-text-secondary">
          A missing value: shown as an empty state, never as a placeholder number
        </li>
      </ul>
    </div>
  );
}

const meta = {
  title: "Foundations/Typography",
  component: TypographyPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The type scale from DESIGN.md §4 with Thai and Latin together, self-hosted fonts: Inter for Latin, Anuphan for Thai headings, Sarabun for Thai body text.",
      },
    },
  },
} satisfies Meta<typeof TypographyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Runs `check` with the browser at 360 by 640, then puts the size back. Vitest's browser iframe is
 * 1200 by 900, wide enough to hide a word that runs off a phone. The static Storybook has no
 * `vitest/browser`; there the frame is the viewport the toolbar chose. */
async function atPhoneSize(check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (width: number, height: number) => {
    await page.viewport(width, height);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([width, height]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(360, 640);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

/**
 * ORV-275 rows 7 and 10 at a 360 px frame: the fixture lines break inside their box. The long Latin
 * word is wider than the frame in Inter, so the list sets `overflow-wrap: anywhere`; no line may
 * reach past the list's content box, and the document may not scroll sideways.
 */
async function expectFixturesHoldAt360(canvasElement: HTMLElement) {
  await document.fonts.load("400 16px Inter", "A");
  await document.fonts.load("400 16px Sarabun", "ก");
  await document.fonts.ready;
  await atPhoneSize(async () => {
    const lines = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-fixtures] > li"));
    await expect(lines).toHaveLength(3);
    for (const line of lines) {
      const text = document.createRange();
      text.selectNodeContents(line);
      const box = line.getBoundingClientRect();
      await expect(text.getBoundingClientRect().right, line.textContent ?? "").toBeLessThanOrEqual(
        box.right + 0.01,
      );
      await expect(line.scrollWidth, line.textContent ?? "").toBeLessThanOrEqual(line.clientWidth);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });
}

/** The families of a computed `font-family`, without quotes. */
const familiesOf = (el: Element) =>
  getComputedStyle(el)
    .fontFamily.split(",")
    .map((name) => name.trim().replaceAll('"', ""));

const fontNames = (faces: readonly FontFace[]) => faces.map((f) => f.family.replaceAll('"', ""));

/** The `dd` of a row that sets the style, the first one in its wrapper. */
const sampleOf = (row: HTMLElement) => row.querySelector<HTMLElement>("dd") as HTMLElement;

const rowsOf = (scope: Element) =>
  Array.from(scope.querySelectorAll<HTMLElement>("[data-scale] > [data-style]"));

/**
 * type-face-1 (ORV-275). The sans roles set Latin and digits in Inter; the heading role names
 * Anuphan for Thai, the body role looped Sarabun, the mono role Sarabun after IBM Plex Mono. The
 * browser takes the first family that carries the glyph, so the stack order is the rule.
 *
 * type-clear-1: the four heading styles keep their line heights. Each heading row's wrapper clips
 * its overflow, so `expectNoGlyphClip` has something to check, and `expectInkClearsAbove` reads
 * the ink that rises above the line box, which `expectNoGlyphClip` cannot see. Only the wrapped
 * `type.heading.sm` sample asserts clear lines; the wrapped display and `type.heading.md` samples
 * are for the designer's sign-off (docs/specs/ORV-275/tech.md, section Metrics).
 */
export const Scale: Story = {
  play: async ({ canvasElement }) => {
    const inter = await document.fonts.load("400 16px Inter", "A");
    await expect(fontNames(inter)).toContain("Inter");
    const anuphanLarge = await document.fonts.load("500 56px Anuphan", "ฟื้นฟู");
    await expect(fontNames(anuphanLarge)).toContain("Anuphan");
    const anuphanSmall = await document.fonts.load("500 20px Anuphan", "ก");
    await expect(fontNames(anuphanSmall)).toContain("Anuphan");
    const sarabun = await document.fonts.load("400 16px Sarabun", "ก");
    await expect(fontNames(sarabun)).toContain("Sarabun");
    // Sarabun is a Thai subset: Latin never comes from it.
    await expect(await document.fonts.load("400 16px Sarabun", "A")).toHaveLength(0);

    const rows = rowsOf(canvasElement);
    await expect(rows).toHaveLength(SCALE.length);
    for (const step of SCALE) {
      const row = rows.find((r) => r.dataset.style === step.style) as HTMLElement;
      const dd = sampleOf(row);
      const families = familiesOf(dd);
      if (step.group === "code") {
        await expect(getComputedStyle(dd).fontFamily, step.style).toMatch(
          /^"IBM Plex Mono", Sarabun,/,
        );
      } else {
        await expect(families[0], step.style).toBe("Inter");
        await expect(families, step.style).not.toContain("IBM Plex Sans");
        await expect(getComputedStyle(dd).fontFamily, step.style).toMatch(
          step.group === "heading" ? /^Inter, Anuphan,/ : /^Inter, Sarabun,/,
        );
        if (step.group === "body") await expect(families, step.style).not.toContain("Anuphan");
      }
      await expect(getComputedStyle(dd).fontWeight, step.style).toBe(step.weight);
      await expect(parseFloat(getComputedStyle(dd).lineHeight), step.style).toBeCloseTo(
        step.lineHeight,
        1,
      );
      if (step.paddingTop !== undefined) {
        await expect(getComputedStyle(dd).paddingTop, step.style).toBe(`${step.paddingTop}px`);
      }
    }
    await expect(canvasElement.querySelectorAll("h1, h2")).toHaveLength(2);
    for (const heading of canvasElement.querySelectorAll("h1, h2")) {
      await expect(getComputedStyle(heading).fontFamily).toMatch(/^Inter, Anuphan,/);
      await expect(getComputedStyle(heading).fontWeight).toBe("500");
    }

    // ORV-192 row 19 and ORV-275 type-clear-1: each heading row keeps its ink whole and clear of
    // the caption above it. The ink above the font's ascent (the stacks of ฟื้ and ปี๊) is read
    // by `expectInkClearsAbove`, never by `expectNoGlyphClip`.
    for (const row of rows.filter((r) => r.dataset.group === "heading")) {
      const dd = sampleOf(row);
      // A shot reads the pixels of the viewport: bring the row to its top first, as the rows sit
      // below the intro and the faces block.
      row.scrollIntoView({ block: "start" });
      expectNoGlyphClip(row);
      if (inVitest) {
        await expectInkClearsAbove(dd, row.querySelector("dt") as Element, 4);
        if (row.dataset.style === "type.heading.sm") {
          await expectLinesClear(row.querySelector<HTMLElement>("[data-wrapped]") as HTMLElement);
        }
      }
    }

    // ORV-275 font-files-1: every self-hosted font file the page loaded came from its own origin.
    const files = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => name.endsWith(".woff2"));
    await expect(files.length).toBeGreaterThan(0);
    for (const name of files) await expect(name.startsWith(location.origin), name).toBe(true);

    await expectFixturesHoldAt360(canvasElement);
  },
};

/**
 * Row 10: the three families of type-face-1 in the order Inter, Anuphan, Sarabun, each with its
 * English and Thai caption and a sample in its own family.
 */
export const Families: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(INTRO_EN)).toBeVisible();
    await expect(canvas.getByText(INTRO_TH)).toBeVisible();
    const blocks = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-face]"));
    await expect(blocks.map((b) => b.dataset.face)).toEqual(["inter", "anuphan", "sarabun"]);
    for (const face of FACES) {
      await expect(canvas.getByText(face.captionEn)).toBeVisible();
      await expect(canvas.getByText(face.captionTh)).toBeVisible();
      const sample = canvas.getByText(face.sample);
      const families = familiesOf(sample);
      // The Thai face of a stack is its second name: the Latin face comes first (Inter).
      await expect(families[0], face.key).toBe("Inter");
      await expect(families[1], face.key).toBe(face.thaiFace);
      await expect(families, face.key).not.toContain("IBM Plex Sans");
    }
    await expectFixturesHoldAt360(canvasElement);
  },
};

/**
 * ORV-275 type-face-1: Friendly sets no heading in another family, so its display and heading
 * lines read the same Inter and Anuphan stack as every other profile.
 */
export const Friendly: Story = {
  globals: { profile: "friendly" },
  play: async ({ canvasElement }) => {
    const lines = canvasElement.querySelectorAll<HTMLElement>(
      "[data-group='heading'] > dd, h1, h2",
    );
    await expect(lines.length).toBeGreaterThanOrEqual(7);
    for (const line of lines) {
      await expect(getComputedStyle(line).fontFamily, line.className).toMatch(/^Inter, Anuphan,/);
    }
  },
};
