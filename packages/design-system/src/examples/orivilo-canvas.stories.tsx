import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { messagesFor, type Messages } from "../i18n/messages/index";
import { expectLabelInkWhole, inVitest, resolvedColor } from "../testing/visual-asserts";
import { OriviloCanvas } from "./orivilo-canvas";
import {
  CHAPTERS,
  IMAGES,
  NODES,
  PALETTE,
  PIECES,
  SEQUENCES,
  copyOf,
  quadInTile,
  type ImageId,
  type SequenceId,
} from "./orivilo-canvas.data";

const meta = {
  title: "Examples/Prototype: ORIVILO canvas",
  component: OriviloCanvas,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A concept prototype (ORV-274): the whole path from a brief to a product on one read-only board, 31 nodes in 8 chapters, with the live catalog parts, the art boards and the brandbook drawn in place, and a preview dialog for each of the 12 results. Sample data and AI images made for this demo; nothing here reads a site or sends anything.",
      },
    },
  },
} satisfies Meta<typeof OriviloCanvas>;

export default meta;
type Story = StoryObj<typeof meta>;

const EN: Messages = messagesFor("en");
const TH: Messages = messagesFor("th");
const body = () => within(document.body);
const at = <T,>(items: readonly T[], i: number): T => {
  const item = items[i];
  if (item === undefined) throw new RangeError(`no item at ${i}`);
  return item;
};
const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));
const frames = async (n = 2) => {
  for (let i = 0; i < n; i++) await frame();
};

// ---- the board

const viewportOf = (root: Element) => root.querySelector<HTMLElement>(".react-flow__viewport");
const zoomOf = (root: Element) =>
  parseFloat(/scale\(([\d.]+)\)/.exec(viewportOf(root)?.style.transform ?? "")?.[1] ?? "NaN");
const nodeEl = (root: Element, id: string) => {
  const el = root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  if (!el) throw new RangeError(`no node ${id}`);
  return el;
};
const boardOf = (root: Element) => {
  const el = root.querySelector<HTMLElement>(".ds-board");
  if (!el) throw new RangeError("no board");
  return el;
};
const dockOf = (root: HTMLElement, words: Messages) =>
  within(root).getByRole("group", { name: words.orvCanvas.dock.chapters });

/**
 * Waits for the board to be ready: every node mounted, the live parts mounted and the fit still.
 * A wait polls a condition and never a fixed time.
 */
async function ready(root: HTMLElement) {
  await waitFor(
    () => expect(root.querySelectorAll(".react-flow__node")).toHaveLength(NODES.length),
    {
      timeout: 20000,
    },
  );
  await waitFor(() => expect(root.querySelector("[data-live-frame] .ds-button")).not.toBeNull(), {
    timeout: 20000,
  });
  let last = Number.NaN;
  await waitFor(
    () => {
      const z = zoomOf(root);
      const still = z === last;
      last = z;
      expect(Number.isFinite(z) && still).toBe(true);
    },
    { timeout: 10000, interval: 120 },
  );
}

/** Waits for every present image of `scope` to be decoded. */
async function imagesLoaded(scope: ParentNode) {
  await waitFor(
    () => {
      for (const img of scope.querySelectorAll("img")) {
        expect(img.complete && img.naturalWidth > 0, img.src).toBe(true);
      }
    },
    { timeout: 20000 },
  );
}

/** A node's card and its label row (28 above), in board px, from its transform and size. */
function boxesOf(root: Element) {
  return [...root.querySelectorAll<HTMLElement>(".react-flow__node")].map((n) => {
    const at2 = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(n.style.transform);
    return {
      id: n.dataset.id ?? "",
      x: Number(at2?.[1]),
      y: Number(at2?.[2]) - 28,
      w: n.offsetWidth,
      h: n.offsetHeight + 28,
    };
  });
}

/** No two rectangles overlap, labels included, and boxes that share a column sit 40 or more apart. */
function expectNoOverlap(root: Element) {
  const boxes = boxesOf(root);
  expect(boxes).toHaveLength(NODES.length);
  for (const a of boxes) {
    for (const b of boxes) {
      if (a.id >= b.id) continue;
      const apartX = a.x + a.w <= b.x || b.x + b.w <= a.x;
      const apartY = a.y + a.h <= b.y || b.y + b.h <= a.y;
      expect(apartX || apartY, `${a.id} overlaps ${b.id}`).toBe(true);
      if (!apartX) {
        const gap = b.y >= a.y + a.h ? b.y - (a.y + a.h) : a.y - (b.y + b.h);
        expect(gap, `${a.id} and ${b.id} stack gap`).toBeGreaterThanOrEqual(40);
      }
    }
  }
}

/** Every node of the chapter lies inside the board and above the dock. */
function expectChapterInView(root: HTMLElement, id: string, words: Messages) {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter) throw new RangeError(`no chapter ${id}`);
  const board = boardOf(root).getBoundingClientRect();
  const dock = dockOf(root, words).closest(".react-flow__panel")?.getBoundingClientRect();
  expect(dock, "the dock").toBeDefined();
  for (const nodeId of chapter.nodes) {
    const r = nodeEl(root, nodeId).getBoundingClientRect();
    expect(r.left, `${nodeId} left`).toBeGreaterThanOrEqual(board.left - 1);
    expect(r.right, `${nodeId} right`).toBeLessThanOrEqual(board.right + 1);
    expect(r.top, `${nodeId} top`).toBeGreaterThanOrEqual(board.top - 1);
    expect(r.bottom, `${nodeId} bottom`).toBeLessThanOrEqual((dock?.top ?? board.bottom) + 1);
  }
}

// ---- the preview

const dialogOf = (title: string) => body().findByRole("dialog", { name: title });
const pagerOf = (dialog: HTMLElement, which: "previous" | "next") => {
  const el = dialog.querySelector<HTMLButtonElement>(`[data-pager="${which}"]`);
  if (!el) throw new RangeError(`no ${which} button`);
  return el;
};
const countOf = (dialog: HTMLElement) => within(dialog).getByText(/^\d+ \/ \d+$/).textContent ?? "";
const stageOf = (dialog: HTMLElement) => {
  const el = dialog.querySelector<HTMLElement>("[data-stage]");
  if (!el) throw new RangeError("no stage");
  return el;
};
/** The stage's content box, less its padding. */
function stageBox(stage: HTMLElement) {
  const r = stage.getBoundingClientRect();
  const cs = getComputedStyle(stage);
  const pt = parseFloat(cs.paddingTop);
  const pb = parseFloat(cs.paddingBottom);
  const pl = parseFloat(cs.paddingLeft);
  const pr = parseFloat(cs.paddingRight);
  return {
    top: r.top + pt,
    left: r.left + pl,
    width: r.width - pl - pr,
    height: r.height - pt - pb,
  };
}

async function openNode(root: HTMLElement, id: string, title: string) {
  nodeEl(root, id).focus();
  await userEvent.keyboard("{Enter}");
  return dialogOf(title);
}

/** Escape closes, focus returns to the opener and the viewport has not moved. */
async function closeToOpener(root: HTMLElement, id: string) {
  const before = viewportOf(root)?.style.transform;
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(document.querySelector("[role='dialog']")).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(nodeEl(root, id)));
  expect(viewportOf(root)?.style.transform).toBe(before);
}

/** A window of `width` by `height` for `check`, restored after; the frame is the screenshot lock's. */
async function atWindow(width: number, height: number, check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (w: number, h: number) => {
    await page.viewport(w, h);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([w, h]));
    await frames();
  };
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(width, height);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

// ---- art

const inertAndHidden = (el: Element) =>
  el instanceof HTMLElement && el.inert && el.getAttribute("aria-hidden") === "true";

/** Every text box of `scope` lies inside `box` (0.5 px of give). */
function expectTextInside(scope: Element, box: DOMRect, what: string) {
  for (const el of scope.querySelectorAll<HTMLElement>("[data-art-line], [data-furniture] *")) {
    if (el.children.length > 0 && !el.hasAttribute("data-art-line")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    expect(r.left, `${what}: ${el.textContent} left`).toBeGreaterThanOrEqual(box.left - 0.5);
    expect(r.right, `${what}: ${el.textContent} right`).toBeLessThanOrEqual(box.right + 0.5);
    expect(r.top, `${what}: ${el.textContent} top`).toBeGreaterThanOrEqual(box.top - 0.5);
    expect(r.bottom, `${what}: ${el.textContent} bottom`).toBeLessThanOrEqual(box.bottom + 0.5);
  }
}

/** Every furniture row of a page reads on one line: its text nodes' line boxes share one top. */
function expectOneLine(page: Element) {
  for (const row of page.querySelectorAll<HTMLElement>("[data-furniture]")) {
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top / 2)));
      expect(tops.size, `${n.textContent} is on one line`).toBe(1);
    }
  }
}

/** The mark of a page is the `Logo` or an SVG that draws with the logo recipe. */
function expectMarksAreLogos(page: Element) {
  for (const mark of page.querySelectorAll<HTMLElement | SVGElement>('[data-kind="mark"]')) {
    expect(
      mark.matches(".ds-logo") || mark.querySelector(".ds-logo__ring, .ds-logo") !== null,
      "a mark draws with the logo recipe",
    ).toBe(true);
  }
}

// ---- the stories

/** The whole board in English: the dock, the fit, the chapters, the keyboard path and the hygiene rules. */
export const Default: Story = {
  globals: { locale: "en" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    const words = EN;
    await ready(root);
    await imagesLoaded(root);

    // One h1 and the description; the dock reads "View only".
    const h1s = [...root.querySelectorAll("h1")].filter(
      (h) => !h.closest("[data-live-frame], [data-art-frame]"),
    );
    expect(h1s).toHaveLength(1);
    expect(h1s[0]?.textContent).toBe(words.orvCanvas.title);
    expect(within(root).getByText(words.orvCanvas.description)).toBeDefined();
    expect(within(root).getAllByText(words.board.readOnly).length).toBeGreaterThanOrEqual(1);

    // The fit: the whole board at 0.25 or more, chapter titles shown, node labels hidden.
    expect(zoomOf(root)).toBeGreaterThanOrEqual(0.25);
    expect(boardOf(root).dataset.lod).toBe("far");
    expect(root.querySelectorAll("[data-chapter-title]")).toHaveLength(
      CHAPTERS.filter((c) => c.number !== null).length,
    );
    for (const label of root.querySelectorAll(".ds-node__label")) {
      expect(getComputedStyle(label).visibility).toBe("hidden");
    }
    expect(
      within(root).getByText(words.orvCanvas.status.overview.replace("{count}", "31")),
    ).toBeDefined();
    expectNoOverlap(root);

    // The dock: nine buttons; a jump marks only its own, says so, and moves with no transition.
    const dock = dockOf(root, words);
    expect(within(dock).getAllByRole("button")).toHaveLength(9);
    await userEvent.click(within(dock).getByRole("button", { name: "01 Direction" }));
    await waitFor(() =>
      expect(
        within(dock).getByRole("button", { name: "01 Direction" }).getAttribute("aria-current"),
      ).toBe("true"),
    );
    expect(dock.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
    await waitFor(() => expect(within(root).getByText("Jumped to 01 Direction")).toBeDefined());
    expect(getComputedStyle(viewportOf(root) as HTMLElement).transitionDuration).toBe("0s");
    await userEvent.click(within(dock).getByRole("button", { name: "Overview" }));
    await waitFor(() => expect(zoomOf(root)).toBeLessThan(0.3));
    await frames(4);

    // The keyboard path: Tab to the colour part, Enter opens page 6 of 12.
    const title = words.orvCanvas.preview.book;
    // A real Tab key (the simulated one does not skip `inert` parts, so it sticks on a node whose
    // phone holds a live page); outside Vitest the node is focused directly.
    let found = false;
    if (inVitest) {
      const { userEvent: real } = await import("vitest/browser");
      const trail: string[] = [];
      for (let i = 0; i < 200 && !found; i++) {
        await real.tab();
        const now = document.activeElement as HTMLElement | null;
        trail.push(`${now?.tagName}:${now?.dataset.id ?? ""}`);
        found = now?.dataset.id === "bb-colour";
      }
      expect(found, `Tab reaches bb-colour: ${trail.slice(-8).join(" ")}`).toBe(true);
    } else {
      nodeEl(root, "bb-colour").focus();
    }
    const zoomBefore = viewportOf(root)?.style.transform;
    await userEvent.keyboard("{Enter}");
    const dialog = await dialogOf(title);
    expect(countOf(dialog)).toBe("6 / 12");
    expect(within(dialog).getByText("Page 6 of 12")).toBeDefined();
    expect(getComputedStyle(dialog).animationName).toBe("none");
    expect(getComputedStyle(dialog).transitionDuration).toBe("0s");
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(countOf(dialog)).toBe("7 / 12"));
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(countOf(dialog)).toBe("12 / 12"));
    expect(pagerOf(dialog, "next").disabled).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(pagerOf(dialog, "previous")));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(countOf(dialog)).toBe("1 / 12"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector("[role='dialog']")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(nodeEl(root, "bb-colour")));
    expect(viewportOf(root)?.style.transform).toBe(zoomBefore);

    // Each result opens its own sequence, and the scrim closes it.
    for (const record of NODES.filter((n) => n.open)) {
      const open = record.open;
      if (!open) continue;
      const sequence = SEQUENCES.find((s) => s.id === open.sequence);
      if (!sequence) throw new RangeError(`no sequence ${open.sequence}`);
      const d = await openNode(root, record.id, copyOf(words, sequence.title));
      expect(countOf(d), record.id).toBe(`${open.page} / ${sequence.pages.length}`);
      const scrim = document.querySelector<HTMLElement>(".ds-dialog__scrim");
      expect(scrim).not.toBeNull();
      await userEvent.click(scrim as HTMLElement);
      await waitFor(() => expect(document.querySelector("[role='dialog']")).toBeNull());
    }

    // Hygiene: ids, inert art and live parts, one heading, images, no focus inside a body.
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length, "ids found").toBeGreaterThan(0);
    expect(new Set(ids).size, "no duplicate id").toBe(ids.length);
    const parts = root.querySelectorAll("[data-live-frame], [data-art-frame]");
    expect(parts.length).toBeGreaterThan(0);
    for (const part of parts) expect(inertAndHidden(part), "inert and aria-hidden").toBe(true);
    const outside = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(
      (h) => !h.closest("[data-live-frame], [data-art-frame]"),
    );
    expect(outside).toHaveLength(1);
    for (const img of root.querySelectorAll("img")) {
      const record = IMAGES.find((i) => img.src.endsWith(i.file));
      expect(record, img.src).toBeDefined();
      expect(img.naturalWidth, img.src).toBe(record?.width);
    }
    for (const id of ["p-landing", "p-form", "p-report"]) {
      const node = nodeEl(root, id);
      expect(node.querySelectorAll("img, picture"), `${id} has no image`).toHaveLength(0);
      expect(
        node.querySelectorAll(".ds-button").length,
        `${id} has a button`,
      ).toBeGreaterThanOrEqual(1);
    }
    expect(root.textContent).not.toMatch(/AI read|generated by ORIVILO|exported|score/i);
    for (const el of root.querySelectorAll(
      ".ds-node__body button, .ds-node__body input, .ds-node__body a[href], .ds-node__body [tabindex]",
    )) {
      expect(el.closest("[inert]"), `${el.tagName} in a body is not focusable`).not.toBeNull();
    }
    expect(
      root.querySelectorAll("[data-book-page] :is(button, a[href], input, [tabindex='0'])"),
    ).toHaveLength(0);
  },
};

/** The whole board in Thai: the Thai fonts, the whole brandbook with one-line furniture, marks whole. */
export const InThai: Story = {
  globals: { locale: "th" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    const h1 = [...root.querySelectorAll("h1")].find(
      (h) => !h.closest("[data-live-frame], [data-art-frame]"),
    );
    expect(h1?.textContent).toBe("ORIVILO จากโจทย์ถึงผลิตภัณฑ์");
    expect(within(root).getAllByText("ดูอย่างเดียว").length).toBeGreaterThanOrEqual(1);
    const family = (cssVar: string) => {
      const probe = document.createElement("span");
      probe.style.fontFamily = `var(${cssVar})`;
      root.append(probe);
      const value = getComputedStyle(probe).fontFamily;
      probe.remove();
      return value;
    };
    expect(getComputedStyle(h1 as Element).fontFamily).toBe(family("--ds-font-display"));
    expect(family("--ds-font-display")).toContain("Anuphan");
    expect(getComputedStyle(within(root).getByText(TH.orvCanvas.description)).fontFamily).toBe(
      family("--ds-font-body"),
    );
    expect(family("--ds-font-body")).toContain("Sarabun");

    const dialog = await openNode(root, "bb-cover", TH.orvCanvas.preview.book);
    const stage = stageOf(dialog);
    const sample = inVitest ? new Set([1, 3, 6, 10, 11, 12]) : new Set<number>();
    for (let n = 1; n <= 12; n++) {
      await waitFor(() => expect(stage.querySelector(`[data-book-page="${n}"]`)).not.toBeNull());
      const page = stage.querySelector<HTMLElement>(`[data-book-page="${n}"]`) as HTMLElement;
      expectOneLine(page);
      expectTextInside(page, page.getBoundingClientRect(), `page ${n}`);
      if (sample.has(n)) {
        for (const line of page.querySelectorAll<HTMLElement>("[data-art-line]")) {
          if (/[฀-๿]/.test(line.textContent ?? "") && (line.textContent ?? "").length < 40) {
            await expectLabelInkWhole(line);
            break;
          }
        }
      }
      if (n < 12) {
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(countOf(dialog)).toBe(`${n + 1} / 12`));
      }
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.querySelector("[role='dialog']")).toBeNull());
  },
};

/** The whole board in dark mode: the a11y addon finds nothing, and a violet flood keeps its violet. */
export const Dark: Story = {
  globals: { locale: "en", mode: "dark" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    await imagesLoaded(root);
    const flood = root.querySelector<HTMLElement>('[data-photo="direction-team"]');
    expect(flood).not.toBeNull();
    const probe = document.createElement("div");
    probe.setAttribute("data-mode", "light");
    probe.setAttribute("data-design-profile", "neutral");
    probe.style.background = "var(--ds-brand-signature)";
    document.body.append(probe);
    const lightViolet = getComputedStyle(probe).backgroundColor;
    probe.remove();
    expect(getComputedStyle(flood as HTMLElement).backgroundColor).toBe(lightViolet);
    expect(root.querySelector("[data-mode='dark']")).not.toBeNull();
  },
};

/** The board at 360: no sideways scroll, the title wraps, the dock is one row that scrolls and fits. */
export const At360: Story = {
  globals: { locale: "en" },
  play: async ({ canvasElement }) =>
    atWindow(360, 760, async () => {
      const root = canvasElement;
      await ready(root);
      const frameEl = root.ownerDocument.documentElement;
      expect(frameEl.scrollWidth).toBe(frameEl.clientWidth);
      const h1 = [...root.querySelectorAll("h1")].find(
        (h) => !h.closest("[data-live-frame], [data-art-frame]"),
      ) as HTMLElement;
      expect(h1.getBoundingClientRect().height).toBeGreaterThan(
        parseFloat(getComputedStyle(h1).lineHeight) * 1.5,
      );
      const dock = dockOf(root, EN);
      const buttons = within(dock).getAllByRole("button");
      const tops = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().top)));
      expect(tops.size, "the dock is one row").toBe(1);
      const strip = dock.closest(".ds-controls__children") as HTMLElement;
      expect(strip.scrollWidth, "the strip scrolls").toBeGreaterThan(strip.clientWidth);
      expect(zoomOf(root)).toBeGreaterThanOrEqual(0.25);
      const panel = dock.closest(".react-flow__panel") as HTMLElement;
      expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth + 0.5);
      expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(-0.5);
    }),
};

/** The direction chapter at 1440: five pieces, no mark, the treatments and the type scale. */
export const DirectionChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "direction" },
  play: async ({ canvasElement }) => {
    await atWindow(1440, 900, async () => {
      const root = canvasElement;
      await ready(root);
      await imagesLoaded(nodeEl(root, "d-board"));
      expectChapterInView(root, "direction", EN);
      const board = nodeEl(root, "d-board");
      const pieces = board.querySelectorAll<HTMLElement>("[data-piece]");
      expect(pieces).toHaveLength(5);
      expect(board.querySelectorAll(".ds-logo, [data-swatch]")).toHaveLength(0);
      expect(board.textContent).not.toMatch(/#[0-9a-f]{6}/i);
      const photo = (id: ImageId) => board.querySelector<HTMLElement>(`[data-photo="${id}"] img`);
      for (const image of IMAGES.filter((i) => i.treatment !== "photo")) {
        const img = photo(image.id);
        if (!img) continue;
        const cs = getComputedStyle(img);
        if (image.treatment === "violet") {
          expect(cs.mixBlendMode, image.id).toBe("luminosity");
          expect(cs.filter, image.id).toBe("grayscale(1) contrast(1.1)");
        } else {
          expect(cs.mixBlendMode, image.id).toBe("screen");
          expect(cs.filter, image.id).toBe("grayscale(1) brightness(1.2) contrast(1.15)");
          const sibling = img.nextElementSibling as HTMLElement | null;
          expect(sibling, `${image.id} multiply sibling`).not.toBeNull();
          expect(getComputedStyle(sibling as HTMLElement).mixBlendMode).toBe("multiply");
          expect(getComputedStyle(sibling as HTMLElement).backgroundColor).toBe(
            resolvedColor(sibling as HTMLElement, "--ds-surface-canvas"),
          );
        }
      }
      const displayLg = parseFloat(
        (() => {
          const probe = document.createElement("span");
          probe.style.fontSize = "var(--ds-type-display-lg-font-size)";
          board.append(probe);
          const size = getComputedStyle(probe).fontSize;
          probe.remove();
          return size;
        })(),
      );
      for (const line of board.querySelectorAll<HTMLElement>("[data-art-line][data-k]")) {
        const k = Number(line.dataset.k);
        expect(
          parseFloat(getComputedStyle(line).fontSize) / displayLg,
          line.textContent ?? "",
        ).toBeCloseTo(k, 1);
      }
      for (const piece of pieces) {
        expectTextInside(piece, piece.getBoundingClientRect(), piece.dataset.piece ?? "piece");
      }
    });
    // The ink check takes the screenshot lock, which `atWindow` holds, so it runs after the window is restored.
    if (inVitest) {
      const board = nodeEl(canvasElement, "d-board");
      const thai = [...board.querySelectorAll<HTMLElement>("[data-art-line]")].find((l) =>
        /[฀-๿]/.test(l.textContent ?? ""),
      );
      expect(thai, "a Thai art line").toBeDefined();
      if (thai) await expectLabelInkWhole(thai);
    }
  },
};

/** The logo chapter: the logo preview draws the live mark on its three pages, and the type pages use the font tokens. */
export const LogoChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "logo" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    expectChapterInView(root, "logo", EN);
    const dialog = await openNode(root, "l-logo", EN.orvCanvas.preview.logo);
    const stage = stageOf(dialog);
    for (let n = 1; n <= 3; n++) {
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 3`));
      await waitFor(() => expect(stage.querySelector(".ds-logo")).not.toBeNull());
      expectMarksAreLogos(stage);
      if (n < 3) await userEvent.keyboard("{ArrowRight}");
    }
    await closeToOpener(root, "l-logo");

    const type = await openNode(root, "t-type", EN.orvCanvas.node.type);
    const familyOf = (cssVar: string) => {
      const probe = document.createElement("span");
      probe.style.fontFamily = `var(${cssVar})`;
      type.append(probe);
      const value = getComputedStyle(probe).fontFamily;
      probe.remove();
      return value;
    };
    const typeStage = stageOf(type);
    const display = familyOf("--ds-font-display");
    const bodyFamily = familyOf("--ds-font-body");
    await waitFor(() => expect(countOf(type)).toBe("1 / 2"));
    expect(within(type).getAllByText(EN.orvCanvas.preview.latin).length).toBeGreaterThanOrEqual(1);
    const latinGlyphs = typeStage.querySelector<HTMLElement>(
      "p.font-display[lang='en']",
    ) as HTMLElement;
    expect(getComputedStyle(latinGlyphs).fontFamily).toBe(display);
    expect(display).toContain("Inter");
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(countOf(type)).toBe("2 / 2"));
    expect(within(type).getAllByText(EN.orvCanvas.preview.thai).length).toBeGreaterThanOrEqual(1);
    await waitFor(() =>
      expect(typeStage.querySelector("p.font-display[lang='th']")).not.toBeNull(),
    );
    const thaiGlyphs = typeStage.querySelector<HTMLElement>(
      "p.font-display[lang='th']",
    ) as HTMLElement;
    const thaiBody = typeStage.querySelector<HTMLElement>("p.font-body[lang='th']") as HTMLElement;
    expect(getComputedStyle(thaiGlyphs).fontFamily).toBe(display);
    expect(getComputedStyle(thaiBody).fontFamily).toBe(bodyFamily);
    expect(display).toContain("Anuphan");
    expect(bodyFamily).toContain("Sarabun");
  },
};

/** The colour chapter: each palette swatch holds its name and hex on its own colour with a hairline. */
export const ColourChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "colour" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    expectChapterInView(root, "colour", EN);
    const card = nodeEl(root, "c-pal");
    for (const entry of PALETTE) {
      const swatch = card.querySelector<HTMLElement>(`[data-swatch="${entry.id}"]`);
      expect(swatch, entry.id).not.toBeNull();
      const el = swatch as HTMLElement;
      expect(el.style.background.toLowerCase().replace(/\s/g, "")).toContain(
        hexToRgb(entry.hex).replace(/\s/g, ""),
      );
      expect(el.textContent).toContain(copyOf(EN, entry.name));
      expect(el.textContent).toContain(entry.hex);
      expect(parseFloat(getComputedStyle(el).borderTopWidth)).toBeGreaterThan(0);
      const box = el.getBoundingClientRect();
      for (const child of el.children) {
        const r = child.getBoundingClientRect();
        expect(r.left, `${entry.id} left`).toBeGreaterThanOrEqual(box.left - 0.5);
        expect(r.right, `${entry.id} right`).toBeLessThanOrEqual(box.right + 0.5);
      }
      const hex = [...el.children].find((c) => c.textContent === entry.hex) as HTMLElement;
      expect(hex.getBoundingClientRect().height, `${entry.id} hex on one line`).toBeLessThan(
        parseFloat(getComputedStyle(hex).lineHeight) * 1.5,
      );
    }
    const dialog = await openNode(root, "c-pal", EN.orvCanvas.preview.palette);
    const stage = stageOf(dialog);
    for (let n = 1; n <= 6; n++) {
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 6`));
      await waitFor(() => expect(stage.querySelector("[data-swatch]")).not.toBeNull());
      for (const swatch of stage.querySelectorAll<HTMLElement>("[data-swatch]")) {
        const entry = PALETTE.find((p) => p.id === swatch.dataset.swatch);
        expect(entry, swatch.dataset.swatch).toBeDefined();
        expect(swatch.textContent).toContain(entry?.hex ?? "?");
        expect(swatch.textContent).toContain(copyOf(EN, (entry as (typeof PALETTE)[number]).name));
        expect(swatch.style.background).not.toBe("");
        expect(parseFloat(getComputedStyle(swatch).borderTopWidth)).toBeGreaterThan(0);
      }
      if (n < 6) await userEvent.keyboard("{ArrowRight}");
    }
  },
};

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
};

/** The brand in use chapter: seven pieces, the scenes' faces read back, the live phone and the guides. */
export const InUseChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "inUse" },
  play: async ({ canvasElement }) =>
    atWindow(1440, 900, async () => {
      const root = canvasElement;
      await ready(root);
      await imagesLoaded(nodeEl(root, "u-board"));
      expectChapterInView(root, "inUse", EN);
      const board = nodeEl(root, "u-board");
      expect(board.querySelectorAll("[data-piece]")).toHaveLength(7);
      expectQuadsRead(board);
      const hero = board.querySelector('[data-photo="brand-hero"]') as HTMLElement;
      expect(hero.children.length, "nothing but the image over the hero").toBe(
        hero.querySelectorAll(":scope > img").length,
      );
      const phone = board.querySelector<HTMLElement>('[data-piece="phone"]') as HTMLElement;
      const live = phone.querySelector<HTMLElement>("[data-live-frame]") as HTMLElement;
      expect(inertAndHidden(live)).toBe(true);
      expect(live.querySelector(".ds-button")).not.toBeNull();
      const intents = board.querySelectorAll('.ds-button[data-variant="intent"]');
      expect(intents).toHaveLength(1);
      expect(intents[0]?.closest("[inert]")).not.toBeNull();
      const lockup = board.querySelector<HTMLElement>("[data-guides]") as HTMLElement;
      const scope = lockup.closest("[data-mode]") as HTMLElement;
      expect(scope.getAttribute("data-mode")).toBe("dark");
      const secondary = resolvedColor(scope, "--ds-text-secondary");
      const strokes = lockup.querySelector("g") as SVGElement;
      expect(getComputedStyle(strokes).stroke).toBe(secondary);
      expect(getComputedStyle(strokes).opacity).toBe("1");
      expect(getComputedStyle(lockup).opacity).toBe("1");
    }),
};

/** Each scene's four markers lie within 1 px of the measured corners through the cover crop. */
function expectQuadsRead(scope: Element) {
  for (const piece of PIECES) {
    if (piece.content.kind !== "scene") continue;
    const tile = scope.querySelector<HTMLElement>(`[data-photo="${piece.content.image}"]`);
    if (!tile) continue;
    const record = IMAGES.find((i) => i.id === (piece.content as { image: ImageId }).image);
    if (!record?.quad) throw new RangeError(`no quad for ${piece.id}`);
    const size = { w: piece.box.w, h: piece.box.h };
    const corners = quadInTile(record.quad, size, { w: record.width, h: record.height });
    const rect = tile.getBoundingClientRect();
    const scale = rect.width / size.w;
    const markers = tile.querySelectorAll<HTMLElement>("[data-quad-marker]");
    expect(markers, `${piece.id} markers`).toHaveLength(4);
    markers.forEach((marker, i) => {
      const r = marker.getBoundingClientRect();
      const [cx, cy] = at(corners, Number(marker.dataset.quadMarker) || i);
      expect(r.left - rect.left, `${piece.id} marker ${i} x`).toBeCloseTo(cx * scale, 0);
      expect(r.top - rect.top, `${piece.id} marker ${i} y`).toBeCloseTo(cy * scale, 0);
    });
  }
}

/** The brandbook chapter: four parts of one size, each showing its first page; the whole book pages through. */
export const BrandbookChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "brandbook" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    expectChapterInView(root, "brandbook", EN);
    const parts = ["bb-cover", "bb-logo", "bb-colour", "bb-use"].map((id) => nodeEl(root, id));
    const sizes = new Set(parts.map((p) => `${p.offsetWidth}x${p.offsetHeight}`));
    expect(sizes.size, "one size").toBe(1);
    const first = [1, 3, 6, 10];
    parts.forEach((part, i) => {
      expect(
        part.querySelector(`[data-book-page="${at(first, i)}"]`),
        `first page of part ${i}`,
      ).not.toBeNull();
    });
    const dialog = await openNode(root, "bb-cover", EN.orvCanvas.preview.book);
    await pageBook(dialog);
    await closeToOpener(root, "bb-cover");
  },
};

/** Pages 1 to 12 of the book in the open dialog: fill, one-line furniture, marks, the page 11 intent button. */
async function pageBook(dialog: HTMLElement) {
  // At 1440 by 900 a page fills the stage height (design: the preview's stage).
  await atWindow(1440, 900, async () => {
    const stage = stageOf(dialog);
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(countOf(dialog)).toBe("1 / 12"));
    for (let n = 1; n <= 12; n++) {
      await waitFor(() => expect(stage.querySelector(`[data-book-page="${n}"]`)).not.toBeNull());
      await frames();
      const art = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
      const box = stageBox(stage);
      expect(
        Math.abs(art.getBoundingClientRect().height - box.height),
        `page ${n} fills the stage`,
      ).toBeLessThanOrEqual(2);
      const page = stage.querySelector<HTMLElement>(`[data-book-page="${n}"]`) as HTMLElement;
      expectOneLine(page);
      expectMarksAreLogos(page);
      if (n === 11) {
        const intent = page.querySelector('.ds-button[data-variant="intent"]');
        expect(intent, "page 11 intent button").not.toBeNull();
        expect(intent?.closest("[inert]")).not.toBeNull();
      }
      if (n < 12) {
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(countOf(dialog)).toBe(`${n + 1} / 12`));
      }
    }
  });
}

/** The design system chapter: the base parts are live, the composed rows sit in the orivilo profile. */
export const DesignSystemChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "system" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    expectChapterInView(root, "system", EN);
    const base = nodeEl(root, "p-base");
    expect(
      within(base).getByRole("button", { name: "Read this page", hidden: true }),
    ).toBeDefined();
    expect(base.querySelector(".ds-badge")).not.toBeNull();
    expect(base.querySelector("input")).not.toBeNull();
    expect(base.querySelector('[role="radiogroup"]')).not.toBeNull();
    expect(base.querySelector('[role="alert"], .ds-alert')).not.toBeNull();
    const pat = nodeEl(root, "p-pat");
    expect(pat.querySelectorAll("[data-live-frame]")).toHaveLength(5);
    for (const sheet of root.querySelectorAll("[data-sheet]")) {
      expect(sheet.closest("[data-design-profile]")?.getAttribute("data-design-profile")).toBe(
        "orivilo",
      );
    }
    const probe = document.createElement("div");
    probe.setAttribute("data-mode", "light");
    probe.setAttribute("data-design-profile", "orivilo");
    document.body.append(probe);
    const primary = getComputedStyle(probe).getPropertyValue("--ds-action-primary");
    probe.remove();
    const button = base.querySelector(".ds-button") as HTMLElement;
    expect(getComputedStyle(button).getPropertyValue("--ds-action-primary")).toBe(primary);
    expect(primary).not.toBe("");
  },
};

/** The product chapter: three live frames, Landing first, each inert and hidden from the page. */
export const ProductChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "product" },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    expectChapterInView(root, "product", EN);
    const ids = ["p-landing", "p-form", "p-report"];
    const tops = ids.map((id) => nodeEl(root, id).getBoundingClientRect().top);
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    for (const id of ids) {
      const live = nodeEl(root, id).querySelector("[data-live-frame]");
      expect(live, id).not.toBeNull();
      expect(inertAndHidden(live as Element), id).toBe(true);
      expect(live?.querySelector("img, picture"), id).toBeNull();
      expect(live?.querySelectorAll(".ds-button").length, id).toBeGreaterThanOrEqual(1);
    }
  },
};

/** Page 6 of the brandbook open at the start, then the whole book. */
export const PreviewBrandbook: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "book", page: 6 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.preview.book);
    expect(countOf(dialog)).toBe("6 / 12");
    await pageBook(dialog);
  },
};

/** The direction board open at page 1: the board fills the stage, the others show one piece each. */
export const PreviewDirectionBoard: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "direction", page: 1 } },
  play: async () => {
    const title = EN.orvCanvas.node.directionBoard;
    const dialog = await dialogOf(title);
    expect(countOf(dialog)).toBe("1 / 6");
    const stage = stageOf(dialog);
    await imagesLoaded(stage);
    const art = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
    expect(
      Math.abs(art.getBoundingClientRect().height - stageBox(stage).height),
    ).toBeLessThanOrEqual(2);
    expect(within(dialog).getByText(copyOf(EN, "image.label"))).toBeDefined();
    const sequence = SEQUENCES.find((s) => s.id === "direction");
    for (let n = 2; n <= 6; n++) {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 6`));
      await waitFor(() => expect(stage.querySelectorAll("[data-piece]").length).toBe(0));
      const rec = at(sequence?.pages ?? [], n - 1);
      expect(Object.keys(rec.show)[0]).toBe("piece");
      const footer = within(dialog).getByText(copyOf(EN, rec.caption));
      expect(footer.closest("[data-stage]")).toBeNull();
      expect(stage.textContent).not.toContain(copyOf(EN, rec.caption));
    }
  },
};

/** The brand in use board open at page 1 of 8: each scene piece reads its face back. */
export const PreviewInUseBoard: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "inUse", page: 1 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.node.inUseBoard);
    expect(countOf(dialog)).toBe("1 / 8");
    const stage = stageOf(dialog);
    await imagesLoaded(stage);
    expectQuadsRead(stage);
    const sequence = SEQUENCES.find((s) => s.id === "inUse");
    for (let n = 2; n <= 8; n++) {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 8`));
      const rec = at(sequence?.pages ?? [], n - 1);
      if ("piece" in rec.show) {
        const piece = PIECES.find((p) => p.id === (rec.show as { piece: string }).piece);
        if (piece?.content.kind === "scene") {
          await imagesLoaded(stage);
          expectQuadsRead(stage);
        }
      }
    }
  },
};

/** The product pages open at the report: its heading levels, its scroll, and a form that keeps its keys. */
export const PreviewProductPages: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "pages", page: 3 } },
  play: async ({ canvasElement }) => {
    const dialog = await dialogOf(EN.orvCanvas.preview.pages);
    expect(countOf(dialog)).toBe("3 / 3");
    const stage = stageOf(dialog);
    const report = await waitFor(() => {
      const el = stage.querySelector<HTMLElement>("[data-report]");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const viewport = stage.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    const gap = report.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    expect(Math.abs(gap)).toBeLessThanOrEqual(24);
    expect(dialog.querySelector("h2")).not.toBeNull();
    expect(stage.querySelector("h3"), "the page heading is h3").not.toBeNull();
    expect(report.querySelector("h4"), "its sections are h4").not.toBeNull();
    expect(stage.querySelector("h1, h2")).toBeNull();
    expect(
      [...canvasElement.querySelectorAll("h1")].filter(
        (h) => !h.closest("[data-live-frame], [data-art-frame]"),
      ),
    ).toHaveLength(1);

    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(countOf(dialog)).toBe("2 / 3"));
    const input = await waitFor(() => {
      const el = stage.querySelector<HTMLInputElement>("input");
      expect(el).not.toBeNull();
      return el as HTMLInputElement;
    });
    input.focus();
    await userEvent.keyboard("abc");
    expect(countOf(dialog)).toBe("2 / 3");
    expect(input.value.endsWith("abc")).toBe(true);
    const radio = stage.querySelector<HTMLElement>('[role="radio"]');
    expect(radio).not.toBeNull();
    radio?.focus();
    await userEvent.keyboard("{ArrowDown}");
    await frames(2);
    expect(countOf(dialog)).toBe("2 / 3");
  },
};

/** The first page of the brandbook at 360: the footer is one column, the panel 328 wide, focus on Next. */
export const PreviewAt360: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "book", page: 1 } },
  play: async () =>
    atWindow(360, 760, async () => {
      const dialog = await dialogOf(EN.orvCanvas.preview.book);
      expect(dialog.getBoundingClientRect().width).toBeCloseTo(328, 0);
      await waitFor(() => expect(document.activeElement).toBe(pagerOf(dialog, "next")));
      const footer = pagerOf(dialog, "next").closest("[data-pager]")?.parentElement?.parentElement;
      const columns = getComputedStyle(footer as Element).gridTemplateColumns.split(" ").length;
      expect(columns, "one column").toBe(1);
      const stage = stageOf(dialog);
      const art = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
      expect(art.getBoundingClientRect().right).toBeLessThanOrEqual(
        stage.getBoundingClientRect().right + 0.5,
      );
    }),
};

const ALL_IMAGES: readonly ImageId[] = IMAGES.map((i) => i.id);

/** Every image missing: flood, id and the catalog line on each photo; the scenes keep the lockup on the face. */
export const MissingImages: Story = {
  globals: { locale: "en" },
  args: { chapter: "inUse", missingImages: ALL_IMAGES },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    expect(root.querySelectorAll("img")).toHaveLength(0);
    const tiles = root.querySelectorAll<HTMLElement>("[data-photo]");
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles) {
      expect(tile.style.background, `${tile.dataset.photo} flood`).not.toBe("");
      expect(tile.textContent).toContain(tile.dataset.photo ?? "?");
      expect(tile.textContent).toContain(EN.orvCanvas.image.missing);
    }
    for (const piece of PIECES.filter((p) => p.content.kind === "scene")) {
      const tile = nodeEl(root, "u-board").querySelector(`[data-piece="${piece.id}"]`);
      expect(tile?.querySelector("polygon"), `${piece.id} polygon`).not.toBeNull();
      expect(tile?.querySelector(".ds-logo"), `${piece.id} lockup`).not.toBeNull();
    }
    const dialog = await openNode(root, "u-board", EN.orvCanvas.node.inUseBoard);
    const sequence = SEQUENCES.find((s) => s.id === ("inUse" satisfies SequenceId));
    for (let n = 2; n <= 8; n++) {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 8`));
      const rec = at(sequence?.pages ?? [], n - 1);
      if ("piece" in rec.show) {
        const piece = PIECES.find((p) => p.id === (rec.show as { piece: string }).piece);
        const image = piece && "image" in piece.content ? piece.content.image : null;
        if (image) {
          expect(
            within(dialog).getByText(image, { selector: "p" }),
            `${piece?.id} second line`,
          ).toBeDefined();
        }
      }
    }
  },
};
