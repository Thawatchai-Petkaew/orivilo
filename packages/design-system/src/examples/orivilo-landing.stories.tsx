import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import type { Locale } from "../i18n/locale";
import { messagesFor } from "../i18n/messages/index";
import { expectEdgesOnPorts, expectNoGlyphClip } from "../testing/visual-asserts";
import { ENGLISH_VIEW, THAI_VIEW } from "./business-fixtures";
import { OriviloLanding } from "./orivilo-landing";

const meta = {
  title: "Examples/Marketing: ORIVILO landing",
  component: OriviloLanding,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "ORIVILO's own landing page (ORV-309): dark, English by default, Thai complete. Composed from catalog parts only. The main picture is ORIVILO's own board, drawn live by CanvasBoard; the work and guidebook sections show the live BusinessBoardScreen and GuidebookScreen on their sample projects. One lime intent button, one violet plane, no glow, nothing that moves at rest. A concept page: its footer says so, and the band photograph carries an AI label that goes with it.",
      },
    },
  },
} satisfies Meta<typeof OriviloLanding>;

export default meta;
type Story = StoryObj<typeof meta>;

const BOARD_NODE = ".react-flow__node";
const BOARD_EDGE = ".react-flow__edge";
const JOINER = String.fromCodePoint(0x2060);

/** The page's root: the one element that carries `lang`. */
const pageOf = (canvasElement: HTMLElement) => {
  const root = canvasElement.querySelector<HTMLElement>("[lang]");
  if (!root) throw new Error("no page root with a lang attribute");
  return root;
};

/** The hero board's region: the apps in the work and guidebook frames hold boards of their own. */
const heroBoardOf = (root: HTMLElement, lang: Locale) =>
  within(root).getByRole("region", { name: messagesFor(lang).oriviloLanding.board.label });

/** The page's own copy: everything outside the live frames of the real screens. */
const copyOf = (root: HTMLElement) => {
  const copy = root.cloneNode(true) as HTMLElement;
  // Not ORIVILO's words: the live frames, and the board library's key help and attribution.
  const parts = '[data-live-frame], [id^="react-flow__"], .react-flow__panel';
  for (const part of copy.querySelectorAll(parts)) part.remove();
  return copy.textContent ?? "";
};

/** Waits for the fonts and the hero board's nodes and edges, then returns the board. */
async function ready(root: HTMLElement, lang: Locale, nodes: number, edges: number) {
  await document.fonts.ready;
  const board = heroBoardOf(root, lang);
  await waitFor(() => {
    expect(board.querySelectorAll(BOARD_NODE)).toHaveLength(nodes);
    expect(board.querySelectorAll(BOARD_EDGE)).toHaveLength(edges);
  });
  return board;
}

const lineHeightRatio = (el: Element) => {
  const style = getComputedStyle(el);
  return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
};

/** The sections of proposal 1, in order: the header, six sections and the footer. */
function expectSectionsInOrder(root: HTMLElement) {
  expect([...root.children].map((child) => child.tagName)).toEqual([
    "HEADER",
    "SECTION",
    "SECTION",
    "SECTION",
    "SECTION",
    "SECTION",
    "SECTION",
    "FOOTER",
  ]);
}

/** Exactly one lime button, in the hero; the close button has the same words in primary. */
function expectOneIntent(root: HTMLElement, lang: Locale) {
  const m = messagesFor(lang).oriviloLanding;
  const intent = root.querySelectorAll('.ds-button[data-variant="intent"]');
  expect(intent).toHaveLength(1);
  expect(intent[0]?.textContent).toBe(m.start);
  expect(root.children[1]?.contains(intent[0] ?? null)).toBe(true);
  const starts = within(root).getAllByRole("button", { name: m.start });
  expect(starts).toHaveLength(2);
  expect(starts[1]?.getAttribute("data-variant")).toBe("primary");
  expect(root.children[6]?.contains(starts[1] ?? null)).toBe(true);
}

/** No rating, score, user count, customer logo, quote or success claim: no digit in the copy. */
function expectNoClaims(root: HTMLElement) {
  expect(copyOf(root)).not.toMatch(/\d/);
  expect(root.querySelectorAll("blockquote, q, [aria-label*='rating' i]")).toHaveLength(0);
}

/** The band's picture and its label come and go together (row 4). */
function expectBand(root: HTMLElement, lang: Locale, present: boolean) {
  const m = messagesFor(lang).oriviloLanding;
  const band = root.querySelector<HTMLElement>("[data-band]");
  expect(band).not.toBeNull();
  const images = root.querySelectorAll("img");
  const label = band?.querySelector("[data-ai-label]") ?? null;
  expect(images.length > 0, "the band photograph").toBe(present);
  expect(label !== null, "the AI label is there iff the photograph is").toBe(present);
  const column = band?.firstElementChild as HTMLElement;
  if (present) {
    const image = images[0] as HTMLImageElement;
    expect(images).toHaveLength(1);
    expect(band?.contains(image)).toBe(true);
    expect(image.getAttribute("alt")).toBe(m.bandAlt);
    expect(image.getAttribute("width")).toBe("1448");
    expect(image.getAttribute("height")).toBe("1086");
    expect(label?.textContent).toBe(m.aiPhoto);
    // The photograph sits beside the text from 960 px, and under it below; the label is under the text.
    const imageBox = image.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();
    if ((band?.getBoundingClientRect().width ?? 0) >= 960) {
      expect(imageBox.left).toBeGreaterThanOrEqual(columnBox.right - 1);
    } else {
      expect(imageBox.top).toBeGreaterThanOrEqual(columnBox.bottom - 1);
    }
    const text = within(column).getByText(m.bandText);
    expect(label?.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      text.getBoundingClientRect().bottom,
    );
  } else {
    // The text takes the whole width of the plane, with no label and no broken image.
    expect(band?.textContent).not.toContain(m.aiPhoto);
    expect(column.getBoundingClientRect().width).toBeGreaterThan(
      (band?.getBoundingClientRect().width ?? 0) / 2,
    );
    // One start edge: the band title starts where the hero title starts (48 at 1280, 24 at 390).
    const hero = within(root).getByRole("heading", { level: 1 });
    const bandTitle = band?.querySelector<HTMLElement>("[data-band-title]") as HTMLElement;
    expect(
      Math.abs(bandTitle.getBoundingClientRect().left - hero.getBoundingClientRect().left),
    ).toBeLessThanOrEqual(1);
  }
}

/** Wide: the live board screen and guidebook, the hero board with 6 nodes and 6 edges. */
async function playWide(canvasElement: HTMLElement, lang: Locale) {
  const m = messagesFor(lang).oriviloLanding;
  const root = pageOf(canvasElement);
  expect(root.getAttribute("lang")).toBe(lang);
  const boundary = root.closest("[data-design-profile]");
  expect(boundary?.getAttribute("data-mode")).toBe("dark");
  expect(boundary?.getAttribute("data-design-profile")).toBe("orivilo");
  expectSectionsInOrder(root);
  await ready(root, lang, 6, 6);
  // Sign-off F3-R1: the hero board's six edges and the work section's eighteen, which sit in a live
  // frame at 0.357 scale, all end on their ports.
  await waitFor(() => expectEdgesOnPorts(root, "the landing", 24));
  expectOneIntent(root, lang);
  expectNoClaims(root);
  expect(within(root).getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(root.querySelector("footer")?.textContent).toContain(m.concept);
  // The work section shows the live board screen on the sample project in the page's language.
  const frames = root.querySelectorAll<HTMLElement>("[data-live-frame]");
  expect(frames).toHaveLength(2);
  expect(frames[0]?.textContent).toContain(
    lang === "en" ? ENGLISH_VIEW.projectName : THAI_VIEW.projectName,
  );
  expect(frames[0]?.querySelector(BOARD_NODE)).not.toBeNull();
  expect(frames[1]?.querySelector('[data-section="foundation"]')).not.toBeNull();
  for (const frame of frames) {
    expect(frame.hasAttribute("inert")).toBe(true);
    expect(frame.getAttribute("aria-hidden")).toBe("true");
  }
  // The crop of the guidebook fades by a token-only overlay (contract need C1).
  expect(root.querySelectorAll("[data-crop-fade]")).toHaveLength(1);
  return root;
}

/** One line of nothing that moves: no animation or transition runs on the page at rest. */
function expectAtRest(root: HTMLElement) {
  expect(root.getAnimations({ subtree: true })).toHaveLength(0);
}

/** English, 1280, toolbar light or dark: the page always sits on the dark ORIVILO profile. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const root = await playWide(canvasElement, "en");
    const m = messagesFor("en").oriviloLanding;
    expect(within(root).getByRole("heading", { level: 1 }).textContent).toBe(m.title);
    expectBand(root, "en", true);
    expectAtRest(root);
  },
};

/** Thai, 1280: every string Thai, Anuphan headings, Sarabun body at 1.7, no tracking, no caps. */
export const Thai: Story = {
  args: { lang: "th" },
  play: async ({ canvasElement }) => {
    const root = await playWide(canvasElement, "th");
    const m = messagesFor("th").oriviloLanding;
    const title = within(root).getByRole("heading", { level: 1 });
    const bandTitle = root.querySelector<HTMLElement>("[data-band-title]") as HTMLElement;
    expect(title.textContent).toBe(m.title);
    expect(bandTitle.textContent).toBe(m.bandTitle);
    expect(root.querySelector("footer")?.textContent).toContain(m.concept);
    // Every string is Thai: none of the English copy is on the page.
    const english = messagesFor("en").oriviloLanding;
    for (const word of [
      english.title,
      english.lede,
      english.start,
      english.concept,
      english.aiPhoto,
      english.workTitle,
      english.closeTitle,
    ]) {
      expect(copyOf(root)).not.toContain(word);
    }
    expect(getComputedStyle(title).fontFamily).toContain("Anuphan");
    expect(getComputedStyle(within(root).getByText(m.lede)).fontFamily).toContain("Sarabun");
    expect(lineHeightRatio(within(root).getByText(m.lede))).toBeCloseTo(1.7, 1);
    for (const el of [title, bandTitle, within(root).getByText(m.lede)]) {
      const style = getComputedStyle(el);
      expect(style.letterSpacing, "no tracking").toBe("normal");
      expect(style.textTransform, "no caps").toBe("none");
    }
    expectNoGlyphClip(title, root);
    expectNoGlyphClip(bandTitle, root);
    expectBand(root, "th", true);
  },
};

/** The Thai title keeps each word whole: the characters beside a word joiner share a line. */
function expectJoinedWordsWhole(title: HTMLElement) {
  const text = title.firstChild as Text;
  const value = text.data;
  const top = (from: number) => {
    const range = document.createRange();
    range.setStart(text, from);
    range.setEnd(text, from + 1);
    return range.getBoundingClientRect().top;
  };
  let joiners = 0;
  for (let i = value.indexOf(JOINER); i >= 0; i = value.indexOf(JOINER, i + 1)) {
    joiners++;
    expect(top(i + 1), `"${value.slice(i - 1, i + 2)}" stays on one line`).toBe(top(i - 1));
  }
  expect(joiners).toBeGreaterThan(0);
}

/** A 390 px page: the narrow rules of proposal 1. */
async function playNarrow(canvasElement: HTMLElement, lang: Locale) {
  const m = messagesFor(lang).oriviloLanding;
  const root = pageOf(canvasElement);
  expect(root.getAttribute("lang")).toBe(lang);
  expectSectionsInOrder(root);
  // The narrow board: logo, colour and guidebook, two edges.
  const board = await ready(root, lang, 3, 2);
  expect(board.getBoundingClientRect().height).toBe(400);
  expectOneIntent(root, lang);
  expectNoClaims(root);
  // The app frame is hidden so the three points carry the work section; the guidebook stays.
  const frames = root.querySelectorAll<HTMLElement>("[data-live-frame]");
  expect(frames).toHaveLength(1);
  expect(frames[0]?.querySelector('[data-section="foundation"]')).not.toBeNull();
  // No BusinessBoardScreen is on the page: it is the one live screen that holds a board.
  expect(frames[0]?.querySelector(".react-flow, " + BOARD_NODE)).toBeNull();
  expect(within(root).queryByText(messagesFor(lang).oriviloLanding.appNote)).toBeNull();
  expect(within(root).getAllByRole("heading", { level: 3 })).toHaveLength(3);
  // The guidebook frame scales from 390 into the page's padding.
  expect(frames[0]?.getBoundingClientRect().width).toBe(390 - 48);
  // The title takes display-md.
  const title = within(root).getByRole("heading", { level: 1 });
  const probe = document.createElement("p");
  probe.className = "text-display-md";
  root.append(probe);
  expect(getComputedStyle(title).fontSize).toBe(getComputedStyle(probe).fontSize);
  probe.remove();
  // Buttons wrap and never shrink below the large control height.
  const large = root.querySelectorAll<HTMLElement>('.ds-button[data-size="lg"]');
  expect(large).toHaveLength(3);
  for (const button of large) {
    expect(button.getBoundingClientRect().height, button.textContent ?? "").toBeGreaterThanOrEqual(
      48,
    );
  }
  expect(root.scrollWidth).toBe(root.clientWidth);
  expect(root.clientWidth).toBe(390);
  expectNoGlyphClip(title, root);
  expectNoGlyphClip(root.querySelector<HTMLElement>("[data-band-title]") as HTMLElement, root);
  expectBand(root, lang, true);
  expect(within(root).getByText(m.concept)).toBeDefined();
  return title;
}

export const At390: Story = {
  args: { width: 390 },
  play: async ({ canvasElement }) => {
    await playNarrow(canvasElement, "en");
  },
};

/** The Thai title sits on two lines with no word split (R7). */
export const At390Thai: Story = {
  args: { lang: "th", width: 390 },
  play: async ({ canvasElement }) => {
    const title = await playNarrow(canvasElement, "th");
    expectJoinedWordsWhole(title);
    expect(
      Math.round(
        title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight),
      ),
    ).toBe(2);
    const band = pageOf(canvasElement).querySelector<HTMLElement>(
      "[data-band-title]",
    ) as HTMLElement;
    expectJoinedWordsWhole(band);
  },
};

/** The band photograph is missing: the text at full width on the plane, no label, no image. */
export const MissingImage: Story = {
  args: { photograph: false },
  play: async ({ canvasElement }) => {
    const root = pageOf(canvasElement);
    await ready(root, "en", 6, 6);
    expectBand(root, "en", false);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    expectOneIntent(root, "en");
  },
};

/** The same at 390: the band title keeps the page's start edge of 24. */
export const MissingImageAt390: Story = {
  args: { photograph: false, width: 390 },
  play: async ({ canvasElement }) => {
    const root = pageOf(canvasElement);
    await ready(root, "en", 3, 2);
    expectBand(root, "en", false);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    const band = root.querySelector<HTMLElement>("[data-band-title]") as HTMLElement;
    const rootLeft = root.getBoundingClientRect().left;
    expect(Math.abs(band.getBoundingClientRect().left - rootLeft - 24)).toBeLessThanOrEqual(1);
  },
};

/** A photograph file that fails to load counts as missing: the label goes with it, no broken image. */
export const PhotographFails: Story = {
  play: async ({ canvasElement }) => {
    const root = pageOf(canvasElement);
    await ready(root, "en", 6, 6);
    const image = root.querySelector("img");
    expect(image).not.toBeNull();
    expectBand(root, "en", true);
    image?.dispatchEvent(new Event("error"));
    await waitFor(() => expectBand(root, "en", false));
    expect(root.querySelectorAll("img")).toHaveLength(0);
  },
};
