import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { messagesFor, type Messages } from "../i18n/messages/index";
import {
  expectFocusBorderForm,
  expectEdgeColour,
  expectLabelInkWhole,
  expectNoGlyphClip,
  expectPortPillsClear,
  expectSameHeight,
  inVitest,
  resolvedColor,
  type Side,
} from "../testing/visual-asserts";
import { atWindow } from "../testing/window";
import { OriviloCanvas } from "./orivilo-canvas";
import {
  ADDRESS,
  BRAND_NAME,
  CHAPTERS,
  CLOCK,
  EDGES,
  ICON_SET,
  IMAGES,
  BOOK,
  NODES,
  PALETTE,
  PIECES,
  SEQUENCES,
  SHEETS,
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
          "A concept prototype (ORV-274): the whole path from a brief to a product on one read-only board, 31 nodes in 8 chapters, with the live catalog parts, the art boards, the brandbook, the design system sheets and the product pages drawn in place, and a preview dialog for each of the 14 results. Sample data and AI images made for this demo; nothing here reads a site or sends anything.",
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

/**
 * Waits for the web fonts the page's text asks for. The faces load with `font-display: swap`, and a
 * face is only requested once text that uses it is laid out, so two frames start every request
 * before `document.fonts.ready` is read; a swap after a measurement moves every wrapped line
 * (review R1-7). Call it again after a dialog opens: its text asks for faces too.
 */
async function fontsReady() {
  await frames(2);
  await document.fonts.ready;
  await frames(2);
}

/** A real Tab key in the browser runner (the simulated one does not skip `inert` parts). */
async function pressTab() {
  if (inVitest) {
    const { userEvent: real } = await import("vitest/browser");
    await real.tab();
  } else {
    await userEvent.tab();
  }
}

/**
 * Runs `check` with `prefers-reduced-motion: reduce` emulated in the browser runner (spec row 34);
 * outside it the page keeps the reader's setting and the check still runs.
 */
async function reducedMotion(check: () => Promise<void>) {
  if (!inVitest) return check();
  const { cdp } = await import("vitest/browser");
  const session = cdp();
  const emulate = (value: "reduce" | "no-preference") =>
    session.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value }],
    });
  await emulate("reduce");
  try {
    expect(matchMedia("(prefers-reduced-motion: reduce)").matches, "motion is reduced").toBe(true);
    await check();
  } finally {
    await emulate("no-preference");
  }
}

// ---- the board

const viewportOf = (root: Element) => root.querySelector<HTMLElement>(".react-flow__viewport");
const zoomOf = (root: Element) =>
  parseFloat(/scale\(([\d.]+)\)/.exec(viewportOf(root)?.style.transform ?? "")?.[1] ?? "NaN");
/**
 * The canvas's own nodes. The landing and the app on the product stage hold boards of their own
 * (ORV-309), and their nodes sit inside a live frame, so they are not the canvas's.
 */
const ownNodes = (root: Element) =>
  [...root.querySelectorAll<HTMLElement>(".react-flow__node")].filter(
    (n) => n.closest("[data-live-frame]") === null,
  );
const nodeEl = (root: Element, id: string) => {
  const el = root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
  if (!el) throw new RangeError(`no node ${id}`);
  return el;
};
/** The five product stage nodes: the base, the patterns, the landing, the app and the guidebook. */
const PRODUCT_NODE_IDS = ["p-base", "p-pat", "p-landing", "p-app", "p-guide"];
/** The guidebook's foundation heading: where the product node and its preview start (C2). */
const FOUNDATION = '[data-section="foundation"]';
/** The three product nodes, top to bottom (spec ORV-309 row 5). */
const PRODUCT_PAGE_IDS = ["p-landing", "p-app", "p-guide"] as const;
/**
 * A live page (`live-only-1`, `canvas-image-1`, spec ORV-309 row 7): at least one `.ds-button`, and
 * no `img` or `picture`, except the landing's one band photograph, `direction-making`, which
 * carries its AI label.
 */
function expectLivePage(page: Element, name: string, words: Messages, landing = false) {
  const images = page.querySelectorAll("img, picture");
  if (landing) {
    expect(images, `${name} holds the band photograph only`).toHaveLength(1);
    expect((images[0] as HTMLImageElement).src.endsWith("/orv-274/direction-making.webp")).toBe(
      true,
    );
    expect(
      page.querySelector("[data-ai-label]")?.textContent,
      `${name} labels the photograph`,
    ).toBe(words.oriviloLanding.aiPhoto);
  } else {
    expect(images, `${name} has no image`).toHaveLength(0);
  }
  expect(page.querySelectorAll(".ds-button").length, `${name} has a button`).toBeGreaterThanOrEqual(
    1,
  );
}
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
  await waitFor(() => expect(ownNodes(root)).toHaveLength(NODES.length), {
    timeout: 20000,
  });
  await waitFor(() => expect(root.querySelector("[data-live-frame] .ds-button")).not.toBeNull(), {
    timeout: 20000,
  });
  await fontsReady();
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
  return ownNodes(root).map((n) => {
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

/**
 * Every node of the chapter lies inside the board, its bottom `clear` px (16 or more) above the
 * dock's top (spec ORV-309 C12). Every chapter story asserts it, on a direct open, not only the
 * product chapter.
 */
function expectChapterInView(root: HTMLElement, id: string, words: Messages, clear = 16) {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter) throw new RangeError(`no chapter ${id}`);
  const board = boardOf(root).getBoundingClientRect();
  const dock = dockOf(root, words).closest(".react-flow__panel")?.getBoundingClientRect();
  expect(dock, "the dock").toBeDefined();
  if (zoomOf(root) < 0.999) {
    // The view is the chapter's, not a stale one: unless the chapter is small enough to show at its
    // own size (zoom 1), it fills the board on one axis (8 / 100 of padding leaves it 0.93 of the
    // width, or of the height above the dock).
    const rects = chapter.nodes.map((nodeId) => nodeEl(root, nodeId).getBoundingClientRect());
    const spanX = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left));
    const spanY = Math.max(...rects.map((r) => r.bottom)) - Math.min(...rects.map((r) => r.top));
    const room = (dock?.top ?? board.bottom) - board.top;
    expect(
      spanX >= board.width * 0.8 || spanY >= room * 0.8,
      `the ${id} chapter fills the board (${Math.round(spanX)} x ${Math.round(spanY)} in ${Math.round(board.width)} x ${Math.round(room)})`,
    ).toBe(true);
  }
  for (const nodeId of chapter.nodes) {
    const r = nodeEl(root, nodeId).getBoundingClientRect();
    expect(r.left, `${nodeId} left`).toBeGreaterThanOrEqual(board.left - 1);
    expect(r.right, `${nodeId} right`).toBeLessThanOrEqual(board.right + 1);
    expect(r.top, `${nodeId} top`).toBeGreaterThanOrEqual(board.top - 1);
    expect(r.bottom, `${nodeId} bottom`).toBeLessThanOrEqual((dock?.top ?? board.bottom) + 1);
  }
  {
    const least = Math.min(
      ...chapter.nodes.map(
        (nodeId) =>
          (dock?.top ?? board.bottom) - nodeEl(root, nodeId).getBoundingClientRect().bottom,
      ),
    );
    expect(
      least,
      `the lowest ${id} node sits ${clear} px or more above the dock`,
    ).toBeGreaterThanOrEqual(clear);
  }
}

/** The board's view: where it sits and how large it draws, read from the viewport's transform. */
function viewOf(root: Element) {
  const m =
    /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+)\)/.exec(
      viewportOf(root)?.style.transform ?? "",
    ) ?? [];
  return { x: Number(m[1]), y: Number(m[2]), zoom: Number(m[3]) };
}

/**
 * A direct open equals the dock button's view (spec ORV-309 C12): the view of a chapter is a
 * function of the chapter and the board's size, so pressing the chapter's own button on the open
 * board changes nothing (scale within 0.001, translate within 1 px).
 */
async function expectDockAgrees(root: HTMLElement, id: string, words: Messages) {
  const chapter = CHAPTERS.find((c) => c.id === id);
  if (!chapter) throw new RangeError(`no chapter ${id}`);
  const direct = viewOf(root);
  expect(Number.isFinite(direct.zoom), `${id} has a view`).toBe(true);
  const button = within(dockOf(root, words)).getByRole("button", {
    name: copyOf(words, chapter.title),
  });
  await userEvent.click(button);
  await waitFor(() => expect(button.getAttribute("aria-current")).toBe("true"));
  await frames(4);
  const pressed = viewOf(root);
  expect(Math.abs(pressed.zoom - direct.zoom), `${id} scale, direct and dock`).toBeLessThanOrEqual(
    0.001,
  );
  expect(Math.abs(pressed.x - direct.x), `${id} x, direct and dock`).toBeLessThanOrEqual(1);
  expect(Math.abs(pressed.y - direct.y), `${id} y, direct and dock`).toBeLessThanOrEqual(1);
}

/** Every node of the board lies inside the board's box: the Overview shows the whole path. */
function expectAllInView(root: HTMLElement) {
  const board = boardOf(root).getBoundingClientRect();
  for (const node of NODES) {
    const r = nodeEl(root, node.id).getBoundingClientRect();
    expect(r.left, `${node.id} left`).toBeGreaterThanOrEqual(board.left - 1);
    expect(r.right, `${node.id} right`).toBeLessThanOrEqual(board.right + 1);
    expect(r.top, `${node.id} top`).toBeGreaterThanOrEqual(board.top - 1);
    expect(r.bottom, `${node.id} bottom`).toBeLessThanOrEqual(board.bottom + 1);
  }
}

/**
 * The viewport transform before `act` and on each of the next `n` frames. A view that moves with
 * duration 0 changes once; a glide (xyflow animates a fit through d3-zoom, rewriting the inline
 * transform each frame, never a CSS transition) shows a new value on most of the frames.
 */
async function viewTrail(root: Element, act: () => Promise<unknown>, n = 30) {
  const seen = [viewportOf(root)?.style.transform ?? ""];
  await act();
  for (let i = 0; i < n; i++) {
    await frame();
    seen.push(viewportOf(root)?.style.transform ?? "");
  }
  return seen;
}

/** A jump with no motion: the view held its place, then took its new place in one step and stayed. */
function expectOneStep(trail: readonly string[], what: string) {
  const steps = trail.filter((t, i) => i > 0 && t !== trail[i - 1]);
  expect(steps, `${what} changes the view once, not by a glide`).toHaveLength(1);
}

// ---- the preview

async function dialogOf(title: string) {
  const dialog = await body().findByRole("dialog", { name: title });
  await fontsReady();
  return dialog;
}
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

/**
 * Each art line set at a scale step and each furniture item renders at the size and in the family
 * its own type class gives (row 41, review I2 and I3): a probe that carries only those classes is
 * the reference. An accent span takes its line's size. A boundary on the same element as a type
 * class would reset it to body-md, so 16 px everywhere is the defect this reads.
 */
function expectOwnStep(scope: Element, what: string) {
  const TYPE = /^(font-(display|body|mono)|text-(display|heading|body|label|code)-(lg|md|sm|xs))$/;
  const items = scope.querySelectorAll<HTMLElement>(
    "[data-art-line]:not([data-k]), [data-furniture] > div > div",
  );
  let stepped = 0;
  for (const el of items) {
    const classes = [...el.classList].filter((c) => TYPE.test(c));
    expect(classes.length, `${what}: ${el.textContent} carries a type class`).toBeGreaterThan(0);
    const probe = document.createElement("span");
    probe.className = classes.join(" ");
    el.parentElement?.append(probe);
    const want = getComputedStyle(probe);
    const got = getComputedStyle(el);
    const label = `${what}: "${el.textContent}" (${classes.join(" ")})`;
    expect(got.fontSize, `${label} size`).toBe(want.fontSize);
    expect(got.fontFamily, `${label} family`).toBe(want.fontFamily);
    probe.remove();
    stepped++;
  }
  for (const span of scope.querySelectorAll<HTMLElement>("[data-art-line] > span")) {
    const line = span.parentElement as HTMLElement;
    expect(getComputedStyle(span).fontSize, `${what}: accent "${span.textContent}" size`).toBe(
      getComputedStyle(line).fontSize,
    );
    expect(getComputedStyle(span).fontFamily, `${what}: accent family`).toBe(
      getComputedStyle(line).fontFamily,
    );
  }
  return stepped;
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

/**
 * Row 35: with real Tab presses from before the page, focus visits the board, then its 36 edges,
 * then the 31 nodes in reading order, then the 13 dock buttons, and each kind shows its focus.
 * The order is the one the shared board gives (spec v1.1); no element inside a board takes focus.
 * A real key press needs the browser runner.
 */
async function expectKeyboardOrder(root: HTMLElement, words: Messages) {
  if (!inVitest) return;
  const dock = dockOf(root, words).closest(".react-flow__panel") as HTMLElement;
  const dockButtons = [...dock.querySelectorAll<HTMLElement>("button")];
  expect(dockButtons, "the dock").toHaveLength(13);
  const sentinel = document.createElement("button");
  sentinel.setAttribute("aria-label", "start of the page");
  root.before(sentinel);
  try {
    sentinel.focus();
    const stops: HTMLElement[] = [];
    const seen = new Set<string>();
    const board = boardOf(root);
    const ring = resolvedColor(board, "--ds-focus-ring");
    for (let i = 0; i < 100; i++) {
      await pressTab();
      const el = document.activeElement as HTMLElement;
      stops.push(el);
      const kind = el === board ? "board" : el.matches(".react-flow__edge") ? "edge" : "other";
      const known = el.matches(".react-flow__node") ? "node" : dock.contains(el) ? "dock" : kind;
      if (!seen.has(known)) {
        seen.add(known);
        expect(el.matches(":focus-visible"), `${known} focus is visible`).toBe(true);
        if (known === "dock") {
          await expectFocusBorderForm(el);
        } else if (known === "edge") {
          // A focused edge draws the focus shape along its curve, not a box (ORV-280 D5).
          expect(getComputedStyle(el).outlineStyle, "edge outline").toBe("none");
          const line = el.querySelector(".ds-edge__focus[data-part='line']") as Element;
          expect(getComputedStyle(line).display, "edge focus line shown").not.toBe("none");
          expect(getComputedStyle(line).stroke, "edge focus line is focus.ring").toBe(ring);
        } else {
          const cs = getComputedStyle(el);
          expect(cs.outlineStyle, `${known} outline`).toBe("solid");
          expect(cs.outlineWidth, `${known} outline width`).toBe("1px");
          expect(cs.outlineColor, `${known} outline is focus.ring`).toBe(ring);
          expect(cs.boxShadow, `${known} halo`).toMatch(/ 0px 0px 0px 4px$/);
        }
      }
      if (el === dockButtons.at(-1)) break;
    }
    const names = stops.map((el) => {
      if (el === board) return "board";
      if (el.matches(".react-flow__edge, .react-flow__node")) return el.dataset.id ?? "?";
      const index = dockButtons.indexOf(el);
      return index >= 0 ? `dock ${index}` : `${el.tagName} outside`;
    });
    expect(names).toEqual([
      "board",
      ...EDGES.map((e) => `e${e.n}`),
      ...NODES.map((n) => n.id),
      ...dockButtons.map((_, i) => `dock ${i}`),
    ]);
    expect([...seen].sort(), "each kind showed its focus").toEqual([
      "board",
      "dock",
      "edge",
      "node",
    ]);
  } finally {
    sentinel.remove();
  }
}

/** Words the prototype must never say: nothing in it read, generated, exported or scored anything. */
const HONESTY = /AI read|generated by ORIVILO|exported|score/i;

// ---- the stories

/**
 * Row 32 (B14): every node, focused in turn (the way `NodePort` `PresentNames` does), shows its port
 * name pills, and none comes within 8 world px of another node's card, title line or port dot, at
 * the fit zoom where the whole board shows. Returns how many pills were read, so a board that draws
 * none cannot pass.
 */
async function expectPortPillsApart(root: HTMLElement) {
  let read = 0;
  // The boards of the landing and the app are drawn inside two nodes; their nodes and pills are not
  // the canvas's, and the helper reads every node under the board. Hidden, they have no box.
  const nested = [...root.querySelectorAll<HTMLElement>("[data-live-frame] .react-flow__node")];
  for (const el of nested) el.style.display = "none";
  try {
    for (const record of NODES) {
      const el = nodeEl(root, record.id);
      await waitFor(() => {
        el.focus({ preventScroll: true });
        expect(el).toHaveFocus();
        expect(el.matches(":focus-visible"), `${record.id} has a keyboard focus`).toBe(true);
      });
      await frames(2);
      // Only the distance to other nodes is this row's: the names of one node that share a row of
      // the design system chapter's composed sheet draw over each other (see the report).
      read += expectPortPillsClear(el, 8, Number.NEGATIVE_INFINITY);
      el.blur();
    }
  } finally {
    for (const el of nested) el.style.display = "";
  }
  expect(read, "port pills read").toBeGreaterThan(0);
}

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
    await expectPortPillsApart(root);

    // Row 31 (C10): each point numeral of the demo reads at label-sm (13, weight 500, line height
    // 1) and sits in the middle of its 22 px disc, in the dark scope the disc is drawn in.
    const numerals = [...nodeEl(root, "c-demo").querySelectorAll<HTMLElement>("span")].filter(
      (el) => el.children.length === 0 && /^[1-5]$/.test(el.textContent ?? ""),
    );
    expect(numerals, "five numerals").toHaveLength(5);
    for (const numeral of numerals) {
      const cs = getComputedStyle(numeral);
      const size = tokenSize(root, "--ds-type-label-sm-font-size");
      expect(cs.fontSize, `numeral ${numeral.textContent} size`).toBe(size);
      expect(cs.fontWeight, `numeral ${numeral.textContent} weight`).toBe("500");
      expect(cs.lineHeight, `numeral ${numeral.textContent} line height`).toBe(size);
      const disc = numeral.closest("[data-mode]")?.parentElement as HTMLElement;
      const n = numeral.getBoundingClientRect();
      const d = disc.getBoundingClientRect();
      expect(n.left + n.width / 2 - (d.left + d.width / 2), "numeral x off centre").toBeCloseTo(
        0,
        0,
      );
      expect(n.top + n.height / 2 - (d.top + d.height / 2), "numeral y off centre").toBeCloseTo(
        0,
        0,
      );
    }

    expectDemoRings(root, "--ds-surface-card");

    // The dock: nine buttons. Under reduced motion a jump lands in one frame (row 34), marks only
    // its own button, says so, and frames its chapter; the route is a click, then the keyboard (row 21).
    const dock = dockOf(root, words);
    expect(within(dock).getAllByRole("button")).toHaveLength(9);
    const chapterButton = (name: string) => within(dock).getByRole("button", { name });
    const expectCurrent = (name: string) => {
      expect(chapterButton(name).getAttribute("aria-current"), `${name} is current`).toBe("true");
      expect(dock.querySelectorAll('[aria-current="true"]'), "only one is current").toHaveLength(1);
    };
    await reducedMotion(async () => {
      const trail = await viewTrail(root, () => userEvent.click(chapterButton("01 Direction")));
      expectOneStep(trail, "the jump to 01 Direction");
      await waitFor(() => expectCurrent("01 Direction"));
      await waitFor(() => expect(within(root).getByText("Jumped to 01 Direction")).toBeDefined());
      await waitFor(() => expectChapterInView(root, "direction", words));
      expect(getComputedStyle(viewportOf(root) as HTMLElement).transitionDuration).toBe("0s");

      // Tab on to 05 Brandbook and press Enter.
      for (let i = 0; i < 4; i++) await pressTab();
      expect(document.activeElement, "Tab reaches 05 Brandbook").toBe(
        chapterButton("05 Brandbook"),
      );
      const keyed = await viewTrail(root, () => userEvent.keyboard("{Enter}"));
      expectOneStep(keyed, "the jump to 05 Brandbook");
      await waitFor(() => expectCurrent("05 Brandbook"));
      await waitFor(() => expect(within(root).getByText("Jumped to 05 Brandbook")).toBeDefined());
      await waitFor(() => expectChapterInView(root, "brandbook", words));

      // The world is 4912 wide since the columns moved (row 32): at the 0.25 floor it shows whole in
      // a board 1228 wide or more, which a 1440 window gives (1408) and the 1200 test window (1168)
      // does not.
      await atWindow(1440, 900, async () => {
        const overview = await viewTrail(root, () => userEvent.click(chapterButton("Overview")));
        expectOneStep(overview, "the jump to Overview");
        await waitFor(() => expect(zoomOf(root)).toBeLessThan(0.3));
        await waitFor(() => expectCurrent("Overview"));
        await waitFor(() => expectAllInView(root));
        await frames(4);
      });

      // The keyboard path: Tab to the colour part, Enter opens page 6 of 12.
      const title = words.orvCanvas.preview.book;
      // A real Tab key (the simulated one does not skip `inert` parts, so it sticks on a node whose
      // phone holds a live page); outside Vitest the node is focused directly.
      let found = false;
      if (inVitest) {
        const trail: string[] = [];
        for (let i = 0; i < 200 && !found; i++) {
          await pressTab();
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
    });

    // Each result opens its own sequence, and the scrim closes it. The first node of each sequence
    // also pages through every page, and the honesty scan reads the open dialog at each one
    // (ORV-280 C8): the board scan below runs after every dialog has closed.
    const paged = new Set<string>();
    for (const record of NODES.filter((n) => n.open)) {
      const open = record.open;
      if (!open) continue;
      const sequence = SEQUENCES.find((s) => s.id === open.sequence);
      if (!sequence) throw new RangeError(`no sequence ${open.sequence}`);
      const d = await openNode(root, record.id, copyOf(words, sequence.title));
      expect(countOf(d), record.id).toBe(`${open.page} / ${sequence.pages.length}`);
      const length = sequence.pages.length;
      if (!paged.has(sequence.id)) {
        await userEvent.keyboard("{Home}");
        for (let n = 1; n <= length; n++) {
          await waitFor(() => expect(countOf(d)).toBe(`${n} / ${length}`));
          paged.add(`${sequence.id}:${n}`);
          expect(d.textContent ?? "", `${sequence.id} page ${n}`).not.toMatch(HONESTY);
          if (n < length) await userEvent.keyboard("{ArrowRight}");
        }
        paged.add(sequence.id);
      }
      const scrim = document.querySelector<HTMLElement>(".ds-dialog__scrim");
      expect(scrim).not.toBeNull();
      await userEvent.click(scrim as HTMLElement);
      await waitFor(() => expect(document.querySelector("[role='dialog']")).toBeNull());
    }

    // Hygiene: ids, inert art and live parts, one heading, images, no focus inside a body.
    // A live frame holds whole pages and boards of its own (the landing, the app, the guidebook),
    // each with the ids of its components; they are inert and hidden from the page, so the page's
    // ids are the ones outside them.
    const ids = [...document.querySelectorAll("[id]")]
      .filter((el) => el.closest("[data-live-frame]") === null)
      .map((el) => el.id);
    expect(ids.length, "ids found").toBeGreaterThan(0);
    expect(new Set(ids).size, "no duplicate id").toBe(ids.length);
    const parts = root.querySelectorAll("[data-live-frame], [data-art-frame]");
    expect(parts.length).toBeGreaterThan(0);
    for (const part of parts) expect(inertAndHidden(part), "inert and aria-hidden").toBe(true);
    const outside = [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(
      (h) => !h.closest("[data-live-frame], [data-art-frame]"),
    );
    expect(outside).toHaveLength(1);
    // The photographs are the image records; the scene lockups (ORV-308) are files of their own.
    for (const img of root.querySelectorAll<HTMLImageElement>("img:not([data-lockup])")) {
      const record = IMAGES.find((i) => img.src.endsWith(i.file));
      expect(record, img.src).toBeDefined();
      expect(img.naturalWidth, img.src).toBe(record?.width);
    }
    // Row 7 (live-only-1, canvas-image-1): all five product stage nodes are live, never a screenshot.
    for (const id of PRODUCT_NODE_IDS)
      expectLivePage(nodeEl(root, id), id, words, id === "p-landing");
    expect(root.textContent).not.toMatch(HONESTY);
    // Every one of the 42 preview pages was read (W2 of the spec: 6, 3, 2, 6, 8, 12, 2 and 3).
    expect([...paged].filter((key) => key.includes(":"))).toHaveLength(42);
    for (const el of root.querySelectorAll(
      ".ds-node__body button, .ds-node__body input, .ds-node__body a[href], .ds-node__body [tabindex]",
    )) {
      expect(el.closest("[inert]"), `${el.tagName} in a body is not focusable`).not.toBeNull();
    }
    // A book page holds no control of its own; page 10's live screens hold controls, all inert.
    const controls = root.querySelectorAll(
      "[data-book-page] :is(button, a[href], input, [tabindex='0'])",
    );
    for (const el of controls) {
      expect(
        el.closest("[data-live-frame]"),
        `${el.tagName} on a page is in a live screen`,
      ).not.toBeNull();
      expect(el.closest("[inert]"), `${el.tagName} on a page is inert`).not.toBeNull();
    }
    await expectKeyboardOrder(root, words);
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
    await expectGuideStart(root);
    await expectPortPillsApart(root);

    const dialog = await openNode(root, "bb-cover", TH.orvCanvas.preview.book);
    const stage = stageOf(dialog);
    const sample = inVitest ? new Set([1, 3, 6, 10, 11, 12]) : new Set<number>();
    for (let n = 1; n <= 12; n++) {
      await waitFor(() => expect(stage.querySelector(`[data-book-page="${n}"]`)).not.toBeNull());
      await fontsReady();
      const page = stage.querySelector<HTMLElement>(`[data-book-page="${n}"]`) as HTMLElement;
      expectOneLine(page);
      expectTextInside(page, page.getBoundingClientRect(), `page ${n}`);
      if (n === 10 || n === 11) await expectPartThree(page, n, TH);
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

/**
 * The ring round each demo point numeral (ORV-290 row 31): it keeps the card's ground in light, and
 * the subtle border in dark, where the card's ground would melt into the black paper at point 3.
 */
function expectDemoRings(root: HTMLElement, token: string) {
  const node = nodeEl(root, "c-demo");
  const rings = [...node.querySelectorAll<HTMLElement>("[data-mode] > span")]
    .filter((el) => /^[1-5]$/.test(el.textContent ?? ""))
    .map((numeral) => numeral.closest("[data-mode]")?.parentElement as HTMLElement);
  expect(rings, "five discs").toHaveLength(5);
  for (const ring of rings) {
    expect(getComputedStyle(ring).boxShadow, `the ring of point ${ring.textContent}`).toContain(
      resolvedColor(ring, token),
    );
  }
}

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
    expectDemoRings(root, "--ds-border-subtle");
    await expectKeyboardOrder(root, EN);
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
      await waitFor(() => expectChapterInView(root, "direction", EN));
      await expectDockAgrees(root, "direction", EN);
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
          // The paper treatment screens the photograph onto the brand violet (design gap 21): the
          // container is violet while the image is there, and the paper is multiplied over it.
          const tile = img.closest<HTMLElement>("[data-photo]") as HTMLElement;
          expect(getComputedStyle(tile).backgroundColor, `${image.id} ground`).toBe(
            resolvedColor(tile, "--ds-brand-signature"),
          );
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
      expect(
        expectOwnStep(board, "d-board"),
        "the board has lines at a scale step",
      ).toBeGreaterThan(0);
      const accent = board.querySelector<HTMLElement>('[data-art-line][data-k="2.5"] > span');
      expect(accent, "the accent of the type piece").not.toBeNull();
      expect(parseFloat(getComputedStyle(accent as HTMLElement).fontSize)).toBeGreaterThan(
        displayLg,
      );
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
    await waitFor(() => expectChapterInView(root, "logo", EN));
    await expectDockAgrees(root, "logo", EN);
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
    await waitFor(() => expectChapterInView(root, "colour", EN));
    await expectDockAgrees(root, "colour", EN);
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
        // Row 27: the preview's name reads as the page's title (display-md) and its hex as a clear
        // second line (the heading-sm size), in the design pixels the art is drawn in.
        const nameEl = within(swatch).getByText(
          copyOf(EN, (entry as (typeof PALETTE)[number]).name),
        );
        const hexEl = within(swatch).getByText(entry?.hex ?? "?");
        expect(getComputedStyle(nameEl).fontSize, `${entry?.id} name`).toBe(
          tokenSize(stage, "--ds-type-display-md-font-size"),
        );
        expect(getComputedStyle(hexEl).fontSize, `${entry?.id} hex`).toBe(
          tokenSize(stage, "--ds-type-heading-sm-font-size"),
        );
      }
      if (n < 6) await userEvent.keyboard("{ArrowRight}");
    }
  },
};

/** A token's font size as the browser resolves it, read through a probe inside `scope`. */
function tokenSize(scope: Element, cssVar: string) {
  const probe = document.createElement("span");
  probe.style.fontSize = `var(${cssVar})`;
  scope.append(probe);
  const size = getComputedStyle(probe).fontSize;
  probe.remove();
  return size;
}

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
};

/** The computed radius of an element that carries only these classes, inside `scope`. */
function radiusOf(scope: Element, className: string) {
  const probe = document.createElement("div");
  probe.className = className;
  scope.append(probe);
  const radius = getComputedStyle(probe).borderTopLeftRadius;
  probe.remove();
  return radius;
}

const cornerOf = (el: Element) => getComputedStyle(el).borderTopLeftRadius;

/**
 * The one phone picture of a piece (design rows 4.1, 4.2 and 4.4): exactly one `img`, `scene-phone`,
 * whole in its tile; the live screen on its display at the record's place, its corner the record's
 * (80 of 611), inside the picture; the pill inside the screen and the clock in the start ear, left of
 * the pill; no image inside the screen. All read back as boxes from the browser.
 */
function expectPhoneScene(piece: HTMLElement, name: string, radii: { round: string }) {
  const record = IMAGES.find((i) => i.id === "scene-phone");
  const device = record?.device;
  if (!record || !device) throw new RangeError("no scene-phone device");
  const images = piece.querySelectorAll<HTMLImageElement>("img");
  expect(images, `${name} holds the one phone picture`).toHaveLength(1);
  const img = images[0] as HTMLImageElement;
  expect(img.src.endsWith("/orv-274/scene-phone.webp"), `${name} picture`).toBe(true);
  const tile = piece.querySelector<HTMLElement>("[data-photo]") as HTMLElement;
  expect(tile.dataset.photo, `${name} tile`).toBe("scene-phone");
  const screenEl = piece.querySelector<HTMLElement>("[data-phone-screen]") as HTMLElement;
  expect(screenEl, `${name} screen`).not.toBeNull();
  expect(
    screenEl.querySelectorAll("img, picture, canvas"),
    `${name} screen holds no image`,
  ).toHaveLength(0);
  const p = img.getBoundingClientRect();
  const s = screenEl.getBoundingClientRect();
  // The screen sits where the record says, as fractions of the picture, and inside the bezel.
  const near = (got: number, want: number, what: string) =>
    expect(Math.abs(got - want), `${name} ${what} (${got} for ${want})`).toBeLessThanOrEqual(0.003);
  near((s.left - p.left) / p.width, device.screen.x / record.width, "screen x");
  near((s.top - p.top) / p.height, device.screen.y / record.height, "screen y");
  near(s.width / p.width, device.screen.w / record.width, "screen width");
  near(s.height / p.height, device.screen.h / record.height, "screen height");
  // The corner is the picture's measured one, in css px of the screen's own box.
  const corner = parseFloat(cornerOf(screenEl));
  near(corner / screenEl.offsetWidth, device.radius / device.screen.w, "screen corner");
  // The picture covers the tile: no violet seam at an edge.
  const t = tile.getBoundingClientRect();
  expect(p.left, `${name} picture covers the start`).toBeLessThanOrEqual(t.left + 0.5);
  expect(p.top, `${name} picture covers the top`).toBeLessThanOrEqual(t.top + 0.5);
  expect(p.right, `${name} picture covers the end`).toBeGreaterThanOrEqual(t.right - 0.5);
  expect(p.bottom, `${name} picture covers the bottom`).toBeGreaterThanOrEqual(t.bottom - 0.5);
  // The pill over the screen, inside it, the clock in the start ear.
  const pill = screenEl.querySelector<HTMLElement>("[data-island]") as HTMLElement;
  const clock = screenEl.querySelector<HTMLElement>("[data-clock]") as HTMLElement;
  expect(pill.textContent, `${name} pill`).toBe("");
  expect(cornerOf(pill), `${name} pill is round`).toBe(radii.round);
  const i = pill.getBoundingClientRect();
  const c = clock.getBoundingClientRect();
  expect(i.left, `${name} pill left`).toBeGreaterThanOrEqual(s.left);
  expect(i.right, `${name} pill right`).toBeLessThanOrEqual(s.right);
  expect(i.top, `${name} pill top`).toBeGreaterThanOrEqual(s.top);
  expect(clock.textContent, `${name} clock`).toBe(CLOCK);
  expect(c.right, `${name} clock is left of the pill`).toBeLessThanOrEqual(i.left + 0.5);
  expect(c.left, `${name} clock inside the screen`).toBeGreaterThanOrEqual(s.left - 0.5);
}

/**
 * Piece C (rows 3.1 and 4.4): one `[data-app-icon]` whose width is 0.15 to 0.17 of the screen's, 19
 * skeleton slots, the mark's ring and dot inside the icon's box, no intent button, and a screen that
 * reads "9:41" and the brand name only. The icon and the slots are `rounded-container`.
 */
function expectHomeScreen(icon: HTMLElement, radii: { round: string; container: string }) {
  const apps = icon.querySelectorAll<HTMLElement>("[data-app-icon]");
  expect(apps, "one app icon").toHaveLength(1);
  const app = (apps[0] as HTMLElement).getBoundingClientRect();
  const screenEl = icon.querySelector<HTMLElement>("[data-home-screen]") as HTMLElement;
  const screen = screenEl.getBoundingClientRect();
  expect(app.width / screen.width, "the icon over the screen").toBeGreaterThanOrEqual(0.15);
  expect(app.width / screen.width, "the icon over the screen").toBeLessThanOrEqual(0.17);
  expect(
    screenEl.querySelectorAll('.ds-skeleton[data-shape="block"]'),
    "the other slots",
  ).toHaveLength(19);
  expect(
    screenEl.querySelectorAll(".ds-skeleton-group, [aria-busy]"),
    "art, not a loading page",
  ).toHaveLength(0);
  const own = apps[0] as HTMLElement;
  for (const part of ["ring", "dot"]) {
    const r = own.querySelector(`.ds-logo__${part}`)?.getBoundingClientRect();
    expect(r, `the mark's ${part}`).toBeDefined();
    expect(r?.left, `${part} left`).toBeGreaterThanOrEqual(app.left - 0.5);
    expect(r?.right, `${part} right`).toBeLessThanOrEqual(app.right + 0.5);
    expect(r?.top, `${part} top`).toBeGreaterThanOrEqual(app.top - 0.5);
    expect(r?.bottom, `${part} bottom`).toBeLessThanOrEqual(app.bottom + 0.5);
  }
  expectPhoneScene(icon, "the home screen", radii);
  expect(icon.querySelectorAll('[data-variant="intent"]'), "no intent button").toHaveLength(0);
  const phoneScreen = icon.querySelector<HTMLElement>("[data-phone-screen]") as HTMLElement;
  const words = [...phoneScreen.querySelectorAll("*")]
    .filter((e) => e.children.length === 0 && (e.textContent ?? "").trim() !== "")
    .map((e) => e.textContent)
    .sort();
  expect(words, "the screen's words").toEqual([BRAND_NAME, CLOCK].sort());
  expect(cornerOf(own), "the icon").toBe(radii.container);
  for (const slot of screenEl.querySelectorAll(".ds-skeleton")) {
    expect(cornerOf(slot.parentElement as Element), "a slot").toBe(radii.container);
  }
}

/**
 * The digital pieces of the In use board (spec ORV-309 row 11, C5, C11), read in `board`: the app in
 * a browser with ORIVILO's live board, the landing on a phone, the app icon on a home screen and the
 * link share card. Exactly one intent button, in the phone, in an inert subtree.
 */
async function expectDigitalPieces(board: Element, words: Messages) {
  const round = radiusOf(board, "rounded-round");
  const container = radiusOf(board, "rounded-container");
  expect(round, "round and container are two radii").not.toBe(container);
  const piece = (id: string) => {
    const el = board.querySelector<HTMLElement>(`[data-piece="${id}"]`);
    if (!el) throw new RangeError(`no piece ${id}`);
    return el;
  };
  const intents = (el: Element) => el.querySelectorAll('.ds-button[data-variant="intent"]');
  const use = words.orvCanvas.use;

  // A: the app in a browser window. C11: a nested board fits only in view, so scroll it there.
  const windowPiece = piece("window");
  windowPiece.scrollIntoView({ block: "nearest" });
  await fontsReady();
  const browser = windowPiece.querySelector<HTMLElement>("[data-browser]");
  expect(browser, "the browser").not.toBeNull();
  const chrome = browser as HTMLElement;
  expect(cornerOf(chrome), "the browser is rounded-container").toBe(container);
  expect(chrome.textContent).toContain(ADDRESS);
  expect(chrome.textContent).toContain(BRAND_NAME);
  expect(chrome.textContent, "its navigation").toContain(words.orvCanvas.sheet.view.board);
  expect(chrome.textContent, "its navigation").toContain(words.orvCanvas.sheet.view.guidebook);
  await waitFor(() => expectAppBoardFitted(chrome, "the window"));
  expect(chrome.querySelectorAll(".ds-node[data-selected]"), "one selected node").toHaveLength(1);
  expect(chrome.querySelector(".ds-node-toolbar"), "its node toolbar").not.toBeNull();
  expect(intents(windowPiece), "the window holds no intent button").toHaveLength(0);
  expect(inertAndHidden(windowPiece.querySelector("[data-live-frame]") as Element)).toBe(true);

  // B: the landing on a phone.
  const phone = piece("phone");
  const live = phone.querySelector<HTMLElement>("[data-live-frame]") as HTMLElement;
  expect(inertAndHidden(live)).toBe(true);
  expectPhoneScene(phone, "the phone", { round });
  expect(
    live.closest("[data-phone-screen]"),
    "the landing is on the phone's screen",
  ).not.toBeNull();
  expect(intents(phone), "the phone holds the one intent button").toHaveLength(1);
  expect(intents(phone)[0]?.closest("[inert]")).not.toBeNull();

  // C: the app icon on a phone's home screen at true scale (row 3.1).
  expectHomeScreen(piece("icon"), { round, container });

  // E: the link share card: the 1.91 : 1 image over the share tagline and the address.
  const share = piece("share");
  const image = share.querySelector<HTMLElement>("[data-share-image]") as HTMLElement;
  const img = image.getBoundingClientRect();
  expect(img.width / img.height, "the share image is 1.91 : 1").toBeCloseTo(600 / 315, 1);
  expect(image.querySelector('[data-kind="horizontal"]'), "the horizontal logo").not.toBeNull();
  const giant = image.querySelector('[data-kind="mark"]') as Element;
  expect(giant, "the giant mark").not.toBeNull();
  const mark = giant.getBoundingClientRect();
  expect(mark.bottom, "the ring runs off the bottom").toBeGreaterThan(img.bottom);
  expect(mark.right, "and stays inside the end").toBeLessThanOrEqual(img.right + 0.5);
  const card = image.parentElement as HTMLElement;
  expect(cornerOf(card), "the card is rounded-container").toBe(container);
  expect(within(card).getByText(use.shareTagline), "the share tagline is the title").toBeDefined();
  expect(within(card).getByText(ADDRESS), "the address").toBeDefined();
  expect(card.getBoundingClientRect().bottom).toBeGreaterThan(img.bottom);
  expect(intents(share), "the share card holds no intent button").toHaveLength(0);
  // Nothing in the digital pieces is a picture of a page or an app: the window and the share card
  // hold no image, and each phone holds its one picture and none on its screen.
  for (const id of ["window", "share"]) {
    expect(piece(id).querySelectorAll("img, picture, canvas"), `${id} holds no image`).toHaveLength(
      0,
    );
  }
  for (const id of ["phone", "icon"]) {
    expect(
      piece(id).querySelectorAll("img, picture, canvas"),
      `${id} holds one image`,
    ).toHaveLength(1);
  }
}

/** The brand in use chapter: seven pieces, the scenes' faces read back, the live screens and their parts. */
export const InUseChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "inUse" },
  play: async ({ canvasElement }) =>
    atWindow(1440, 900, async () => {
      const root = canvasElement;
      await ready(root);
      await imagesLoaded(nodeEl(root, "u-board"));
      await waitFor(() => expectChapterInView(root, "inUse", EN));
      await expectDockAgrees(root, "inUse", EN);
      const board = nodeEl(root, "u-board");
      expect(
        [...board.querySelectorAll<HTMLElement>("[data-piece]")].map((p) => p.dataset.piece),
      ).toEqual(["window", "phone", "icon", "hero", "share", "card", "sign"]);
      expectQuadsRead(board);
      expect(expectSceneLockups(board), "both scenes on the board").toBe(2);
      expectMarksAreLogos(board);
      // One label per board (honest-1): the node's meta line says Mockups once, the art says nothing.
      expect(
        within(board).getAllByText(copyOf(EN, "use.badge")),
        "the Mockups label on the node",
      ).toHaveLength(1);
      expect(
        board.querySelector("[data-art-frame]")?.textContent ?? "",
        "the art carries no caption",
      ).not.toMatch(/Mockup/);
      const hero = board.querySelector('[data-photo="brand-hero"]') as HTMLElement;
      expect(hero.children.length, "nothing but the image over the hero").toBe(
        hero.querySelectorAll(":scope > img").length,
      );
      // Every image on the board is a photograph or a scene's lockup (canvas-image-1, row 13).
      for (const img of board.querySelectorAll("img")) {
        expect(
          img.closest("[data-photo]") !== null,
          `${img.getAttribute("src")} sits in a photograph tile`,
        ).toBe(true);
      }
      await expectDigitalPieces(board, EN);
      const intents = board.querySelectorAll('.ds-button[data-variant="intent"]');
      expect(intents, "one intent button on the board").toHaveLength(1);
      expect(intents[0]?.closest("[inert]")).not.toBeNull();
    }),
};

/**
 * ORV-308 rows 1 and 3: the face of each scene in `scope` holds the lockup as an image of the generated
 * file, at the size and tone of the record, and no inline svg (real Chrome draws a stroked inline svg
 * wrongly under the face's perspective matrix). Returns how many scene faces it read.
 */
function expectSceneLockups(scope: Element): number {
  let read = 0;
  for (const piece of PIECES) {
    if (piece.content.kind !== "scene") continue;
    const content = piece.content;
    const tile = scope.querySelector<HTMLElement>(`[data-photo="${content.image}"]`);
    if (!tile) continue;
    const face = tile.querySelector<HTMLElement>("[data-face]");
    if (!face) throw new RangeError(`${piece.id} has no face`);
    expect(face.querySelectorAll("svg"), `${piece.id} face holds no inline svg`).toHaveLength(0);
    const images = face.querySelectorAll<HTMLImageElement>("img");
    expect(images, `${piece.id} face holds the lockup image`).toHaveLength(1);
    const img = images[0] as HTMLImageElement;
    expect(new URL(img.src).pathname, `${piece.id} lockup file`).toBe(content.lockup.file);
    expect(img.getAttribute("alt"), `${piece.id} lockup is decorative`).toBe("");
    const width = content.lockup.width * content.face.w;
    const style = getComputedStyle(img);
    expect(parseFloat(style.width), `${piece.id} lockup width`).toBeCloseTo(width, 1);
    expect(parseFloat(style.height), `${piece.id} lockup height`).toBeCloseTo(
      (width * 150) / 663,
      1,
    );
    read++;
  }
  return read;
}

/** Each scene's four markers lie within 1 px of the measured corners through the cover crop. */
function expectQuadsRead(scope: Element) {
  for (const piece of PIECES) {
    if (piece.content.kind !== "scene") continue;
    const tile = scope.querySelector<HTMLElement>(`[data-photo="${piece.content.image}"]`);
    if (!tile) continue;
    const record = IMAGES.find((i) => i.id === (piece.content as { image: ImageId }).image);
    if (!record?.quad) throw new RangeError(`no quad for ${piece.id}`);
    // The size the tile was drawn at: a one tile page draws at whole design px, not piece.box.
    const drawn = getComputedStyle(tile);
    const size = { w: parseFloat(drawn.width), h: parseFloat(drawn.height) };
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
    await waitFor(() => expectChapterInView(root, "brandbook", EN));
    await expectDockAgrees(root, "brandbook", EN);
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

const ALL_SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

/**
 * A page on the stage shows its bounds (ORV-290 row 28, C4, R28-1, R28-2, R28-3): a 1 px line of
 * `border.subtle` that follows the shape of the page. A square sheet keeps one line over the frame's
 * edge. A page of rounded tiles (a board, or one tile) has the frame line off and one untransformed
 * line box per tile laid over the frame, so the browser draws the border on whole device px, the
 * same px as the frame's clip, at every position and device scale; the box carries the tile's radius
 * times the art's scale and a 1 px ring of the stage's fill outside the line. `ink` names the sides
 * read from a screenshot: one line of that colour, 1 px wide, on each. The read runs at the Vitest
 * window, outside `atWindow`, because a pixel read inside it deadlocks on the screenshot lock.
 */
async function expectPaperBounds(
  stage: HTMLElement,
  { ink = [], tiles: roundedTiles = false }: { ink?: readonly Side[]; tiles?: boolean } = {},
) {
  const frame = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
  const colour = resolvedColor(frame, "--ds-border-subtle");
  const frameLine = getComputedStyle(frame, "::after");
  const tiles = Array.from(
    frame.querySelectorAll<HTMLElement>(
      ":scope > * > .rounded-media, :scope > * > [data-board-art] > [data-piece] > .rounded-media",
    ),
  );
  if (!roundedTiles) {
    expect(frameLine.content, "the bounds line exists").not.toBe("none");
    expect(frameLine.position).toBe("absolute");
    expect(frameLine.borderTopWidth).toBe("1px");
    expect(frameLine.borderTopColor).toBe(colour);
    expect(frameLine.pointerEvents).toBe("none");
  } else {
    expect(tiles.length, "the page's tiles are found").toBeGreaterThan(0);
    expect(frameLine.content, "a page of tiles has no frame line").toBe("none");
    const boxes = Array.from(frame.querySelectorAll<HTMLElement>(":scope > [data-page-lines] > *"));
    expect(boxes, "one line box per tile").toHaveLength(tiles.length);
    expect(
      getComputedStyle(frame.querySelector("[data-page-lines]") as HTMLElement).pointerEvents,
      "the line layer takes no pointer",
    ).toBe("none");
    const scale =
      frame.getBoundingClientRect().width / (frame.firstElementChild as HTMLElement).offsetWidth;
    const matte = resolvedColor(frame, "--ds-surface-sunken");
    tiles.forEach((tile, i) => {
      const box = boxes[i] as HTMLElement;
      const own = getComputedStyle(tile);
      expect(getComputedStyle(tile, "::after").content, "the tile draws no line of its own").toBe(
        "none",
      );
      const t = tile.getBoundingClientRect();
      const r = box.getBoundingClientRect();
      for (const edge of ["left", "top", "right", "bottom"] as const) {
        // Layout lays boxes on 1/64 px, so the two boxes differ by a hair, never by a device px.
        expect(
          Math.abs(r[edge] - t[edge]),
          `line box ${i} lies on the tile's ${edge} edge`,
        ).toBeLessThanOrEqual(0.02);
      }
      const line = getComputedStyle(box);
      expect(
        Math.abs(r.width - parseFloat(line.width)),
        `line box ${i} is untransformed in width`,
      ).toBeLessThanOrEqual(0.01);
      expect(
        Math.abs(r.height - parseFloat(line.height)),
        `line box ${i} is untransformed in height`,
      ).toBeLessThanOrEqual(0.01);
      expect(
        [line.borderTopWidth, line.borderRightWidth, line.borderBottomWidth, line.borderLeftWidth],
        `line box ${i} border widths`,
      ).toEqual(["1px", "1px", "1px", "1px"]);
      expect(
        [line.borderTopStyle, line.borderRightStyle, line.borderBottomStyle, line.borderLeftStyle],
        `line box ${i} border styles`,
      ).toEqual(["solid", "solid", "solid", "solid"]);
      expect(
        [line.borderTopColor, line.borderRightColor, line.borderBottomColor, line.borderLeftColor],
        `line box ${i} is the stage's border.subtle`,
      ).toEqual([colour, colour, colour, colour]);
      expect(line.boxShadow, `line box ${i} rings the line in the stage's fill`).toBe(
        `${matte} 0px 0px 0px 1px`,
      );
      const radii = [
        line.borderTopLeftRadius,
        line.borderTopRightRadius,
        line.borderBottomRightRadius,
        line.borderBottomLeftRadius,
      ];
      const tileRadii = [
        own.borderTopLeftRadius,
        own.borderTopRightRadius,
        own.borderBottomRightRadius,
        own.borderBottomLeftRadius,
      ];
      radii.forEach((radius, k) => {
        expect(
          Math.abs(parseFloat(radius) - parseFloat(tileRadii[k] as string) * scale),
          `line box ${i} corner ${k} is the tile's radius times the scale`,
        ).toBeLessThanOrEqual(0.01);
      });
      if (tiles.length === 1) {
        // One tile page: whole design px, or Chrome lays the tile off its box inside the scale.
        expect(Number.isInteger(parseFloat(own.width)), `tile width ${own.width} is whole`).toBe(
          true,
        );
        expect(Number.isInteger(parseFloat(own.height)), `tile height ${own.height} is whole`).toBe(
          true,
        );
      }
    });
  }
  if (ink.length > 0 && inVitest) {
    await expectEdgeColour(frame, ink, colour, 1);
  }
}

/** The box of `el` inside `page`, in the page's own 1280 x 800 design px. */
function designBox(el: Element, page: Element) {
  const p = page.getBoundingClientRect();
  const k = p.width / 1280;
  const r = el.getBoundingClientRect();
  return { x: (r.left - p.left) / k, y: (r.top - p.top) / k, w: r.width / k, h: r.height / k };
}

/**
 * Brandbook part 03 (spec ORV-309 row 12): page 10 holds the ink half and a field of three live
 * screens at -12 degrees on violet, no image and one intent button, in the landing; page 11 holds six
 * placements, the phone with its layout grid and measure, the window, the icon, the icon set of 24
 * glyphs, the card and the sign, and one intent button, in the phone. Nothing is clipped or spills.
 */
async function expectPartThree(page: HTMLElement, n: 10 | 11, words: Messages) {
  const intents = page.querySelectorAll('.ds-button[data-variant="intent"]');
  expect(intents, `page ${n} holds one intent button`).toHaveLength(1);
  expect(intents[0]?.closest("[inert]"), `page ${n} intent is inert`).not.toBeNull();
  if (n === 10) {
    expect(page.querySelectorAll("img, picture"), "page 10 holds no image").toHaveLength(0);
    const field = page.querySelector<HTMLElement>("[data-field-art]") as HTMLElement;
    expect(field, "the field").not.toBeNull();
    // The three screens, not the live frames nested inside them (the landing holds its own).
    const frames = [...field.querySelectorAll<HTMLElement>("[data-live-frame]")].filter(
      (f) => f.parentElement?.closest("[data-live-frame]") === null,
    );
    expect(frames, "three live screens").toHaveLength(3);
    for (const frame of frames) expect(inertAndHidden(frame)).toBe(true);
    expect(field.querySelector("[data-browser]"), "the app in a browser").not.toBeNull();
    // Row 3.2: the field's window shows the same board with no node over another.
    expectWindowBoard(field.querySelector("[data-browser]") as HTMLElement, "page 10 window");
    expect(field.querySelector(FOUNDATION), "the guidebook").not.toBeNull();
    expect(intents[0]?.closest("[data-live-frame]"), "the intent is in the landing").toBe(
      frames[0],
    );
    const group = field.firstElementChild as HTMLElement;
    const m = new DOMMatrix(getComputedStyle(group).transform);
    expect((Math.atan2(m.b, m.a) * 180) / Math.PI, "tilted -12 degrees").toBeCloseTo(-12, 1);
    // The landing's logo and title stay inside the panel.
    const panel = field.getBoundingClientRect();
    const landing = frames[0] as HTMLElement;
    // The landing's own logo and title: the first of each (a later h1 is its nested guidebook).
    const own = [
      landing.querySelector<HTMLElement>("[data-kind='horizontal']"),
      landing.querySelector<HTMLElement>("h1"),
    ];
    for (const el of own as HTMLElement[]) {
      expect(el, "the landing's logo and title").not.toBeNull();
      const r = el.getBoundingClientRect();
      expect(r.left, `${el.tagName} left`).toBeGreaterThanOrEqual(panel.left - 0.5);
      expect(r.right, `${el.tagName} right`).toBeLessThanOrEqual(panel.right + 0.5);
      expect(r.top, `${el.tagName} top`).toBeGreaterThanOrEqual(panel.top - 0.5);
    }
    return;
  }
  const placements = page.querySelectorAll<HTMLElement>("[data-piece], [data-placement]");
  expect(placements, "six placements").toHaveLength(6);
  const art = BOOK.find((p) => p.n === 11)?.art;
  expect(art?.kind).toBe("pieces");
  const list = art?.kind === "pieces" ? art.pieces : [];
  placements.forEach((el, i) => {
    const want = at(list, i).box;
    const got = designBox(el, page);
    expect(Math.abs(got.x - want.x), `placement ${i} x`).toBeLessThanOrEqual(1);
    expect(Math.abs(got.y - want.y), `placement ${i} y`).toBeLessThanOrEqual(1);
    expect(Math.abs(got.w - want.w), `placement ${i} width`).toBeLessThanOrEqual(1);
    expect(Math.abs(got.h - want.h), `placement ${i} height`).toBeLessThanOrEqual(1);
  });
  // Row 3.1: piece C is a home screen at true scale in its 300 x 317 box.
  expectHomeScreen(page.querySelector<HTMLElement>('[data-piece="icon"]') as HTMLElement, {
    round: radiusOf(page, "rounded-round"),
    container: radiusOf(page, "rounded-container"),
  });
  expectPhoneScene(
    page.querySelector<HTMLElement>('[data-piece="phone"]') as HTMLElement,
    "page 11 phone",
    {
      round: radiusOf(page, "rounded-round"),
    },
  );
  const phone = page.querySelector<HTMLElement>('[data-piece="phone"]') as HTMLElement;
  expect(intents[0]?.closest('[data-piece="phone"]'), "the intent is in piece B's phone").toBe(
    phone,
  );
  // The layout grid: two dashed lines at 24 and 366 of the 390 screen, the measure 24, 342, 24.
  const live = phone.querySelector<HTMLElement>("[data-live-frame]") as HTMLElement;
  const screen = live.getBoundingClientRect();
  const lines = [...phone.querySelectorAll<HTMLElement>("[data-layout-grid] > div")];
  expect(lines, "two grid lines").toHaveLength(2);
  const dashed = getComputedStyle(lines[0] as HTMLElement);
  expect(dashed.borderInlineStartStyle, "dashed").toBe("dashed");
  expect(dashed.borderInlineStartColor, "brand signature").toBe(
    resolvedColor(lines[0] as HTMLElement, "--ds-brand-signature"),
  );
  const at390 = (x: number) => ((x - screen.left) / screen.width) * 390;
  expect(at390((lines[0] as HTMLElement).getBoundingClientRect().left)).toBeCloseTo(24, 0);
  expect(at390((lines[1] as HTMLElement).getBoundingClientRect().left)).toBeCloseTo(366, 0);
  const measure = phone.querySelector<HTMLElement>("[data-measure]") as HTMLElement;
  const labels = [...measure.querySelectorAll<HTMLElement>("span")];
  expect(
    labels.map((l) => l.textContent),
    "the measure",
  ).toEqual(["24", "342", "24"]);
  const ticks = [...measure.querySelectorAll<HTMLElement>(".border-s")];
  expect(ticks, "four ticks").toHaveLength(4);
  [0, 24, 366, 390].forEach((x, i) => {
    expect(at390((ticks[i] as HTMLElement).getBoundingClientRect().left), `tick ${i}`).toBeCloseTo(
      x,
      0,
    );
  });
  const title = within(measure).getByText(words.orvCanvas.use.grid);
  const tile = phone.getBoundingClientRect();
  const parts = [title, ...labels];
  for (const el of parts) {
    const r = el.getBoundingClientRect();
    expect(r.left, `${el.textContent} left`).toBeGreaterThanOrEqual(tile.left - 0.5);
    expect(r.right, `${el.textContent} right`).toBeLessThanOrEqual(tile.right + 0.5);
    expect(r.top, `${el.textContent} top`).toBeGreaterThanOrEqual(tile.top - 0.5);
  }
  const t = title.getBoundingClientRect();
  // Row 4.6: the measure has the top band to itself, above the screen; the title is under the phone,
  // at the bottom start, 24 from the start and 16 from the bottom of the tile.
  const phoneImg = phone.querySelector("img")?.getBoundingClientRect() as DOMRect;
  const phoneScreen = phone
    .querySelector("[data-phone-screen]")
    ?.getBoundingClientRect() as DOMRect;
  const scale = tile.width / 300; // the tile is 300 design px wide
  for (const el of [...labels, ...ticks]) {
    expect(
      el.getBoundingClientRect().bottom,
      "the measure is above the screen",
    ).toBeLessThanOrEqual(phoneScreen.top + 0.5);
  }
  const bodyBottom = phoneImg.top + (phoneImg.height * 1465) / 1600;
  expect(t.top, "the title is under the phone").toBeGreaterThanOrEqual(bodyBottom - 0.5);
  expect(t.left - tile.left, "the title is 24 from the start").toBeCloseTo(24 * scale, 0);
  expect(tile.bottom - t.bottom, "the title is 16 from the bottom").toBeCloseTo(16 * scale, 0);
  for (const label of labels) {
    const r = label.getBoundingClientRect();
    const apart = r.left >= t.right || r.right <= t.left || r.top >= t.bottom || r.bottom <= t.top;
    expect(apart, `"${label.textContent}" is clear of the title`).toBe(true);
  }
  // The window crops to the tile: the tab, the address and the navigation show.
  const crop = page.querySelector<HTMLElement>('[data-piece="window"]') as HTMLElement;
  const cropBox = crop.firstElementChild?.getBoundingClientRect() as DOMRect;
  for (const text of [BRAND_NAME, ADDRESS, words.orvCanvas.sheet.view.board]) {
    const el = within(crop).getAllByText(text)[0] as HTMLElement;
    const r = el.getBoundingClientRect();
    expect(r.right, `${text} is inside the window's tile`).toBeLessThanOrEqual(cropBox.right + 0.5);
    expect(r.bottom, `${text} is inside the window's tile`).toBeLessThanOrEqual(
      cropBox.bottom + 0.5,
    );
  }
  // The icon set: 24 glyphs, 6 across and 4 down, whole in their cells, in the design's order.
  const set = page.querySelector<HTMLElement>('[data-placement="icons"]') as HTMLElement;
  const cells = [...set.querySelectorAll<HTMLElement>("[data-glyph]")];
  expect(cells.map((c) => c.dataset.glyph)).toEqual([...ICON_SET]);
  expect(
    new Set(cells.map((c) => Math.round(c.getBoundingClientRect().top))),
    "4 rows",
  ).toHaveProperty("size", 4);
  expect(
    new Set(cells.map((c) => Math.round(c.getBoundingClientRect().left))),
    "6 columns",
  ).toHaveProperty("size", 6);
  const setBox = set.getBoundingClientRect();
  for (const cell of cells) {
    const c = cell.getBoundingClientRect();
    const svg = cell.querySelector("svg") as SVGElement;
    expect(svg, `${cell.dataset.glyph} is drawn`).not.toBeNull();
    const g = svg.getBoundingClientRect();
    expect(g.width, `${cell.dataset.glyph} has a size`).toBeGreaterThan(0);
    expect(g.left, `${cell.dataset.glyph} left`).toBeGreaterThanOrEqual(c.left - 0.5);
    expect(g.right, `${cell.dataset.glyph} right`).toBeLessThanOrEqual(c.right + 0.5);
    expect(g.top, `${cell.dataset.glyph} top`).toBeGreaterThanOrEqual(c.top - 0.5);
    expect(g.bottom, `${cell.dataset.glyph} bottom`).toBeLessThanOrEqual(c.bottom + 0.5);
    expect(c.right, `${cell.dataset.glyph} cell inside the specimen`).toBeLessThanOrEqual(
      setBox.right,
    );
    expect(c.bottom, `${cell.dataset.glyph} cell inside the specimen`).toBeLessThanOrEqual(
      setBox.bottom,
    );
  }
  for (const text of [words.orvCanvas.use.icons, words.orvCanvas.use.iconsNote]) {
    const r = within(set).getByText(text).getBoundingClientRect();
    expect(r.left, `${text} left`).toBeGreaterThanOrEqual(setBox.left - 0.5);
    expect(r.right, `${text} right`).toBeLessThanOrEqual(setBox.right + 0.5);
    expect(r.bottom, `${text} bottom`).toBeLessThanOrEqual(setBox.bottom + 0.5);
  }
}

/** Pages 1 to 12 of the book in the open dialog: fill, one-line furniture, marks, the page 11 intent button. */
async function pageBook(dialog: HTMLElement) {
  // At 1440 by 900 a page fills the stage height (design: the preview's stage).
  await atWindow(1440, 900, async () => {
    const stage = stageOf(dialog);
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(countOf(dialog)).toBe("1 / 12"));
    for (let n = 1; n <= 12; n++) {
      await waitFor(() => expect(stage.querySelector(`[data-book-page="${n}"]`)).not.toBeNull());
      await fontsReady();
      const art = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
      const box = stageBox(stage);
      expect(
        Math.abs(art.getBoundingClientRect().height - box.height),
        `page ${n} fills the stage`,
      ).toBeLessThanOrEqual(2);
      await expectPaperBounds(stage);
      const page = stage.querySelector<HTMLElement>(`[data-book-page="${n}"]`) as HTMLElement;
      expectOneLine(page);
      expectOwnStep(page, `page ${n}`);
      expectMarksAreLogos(page);
      if (n === 10 || n === 11) await expectPartThree(page, n, EN);
      // Row 4.5: page 11 says mockups and AI pictures; the other pages keep the plain book line.
      expect(
        within(dialog).getAllByText(
          copyOf(EN, n === 11 ? "preview.bookSubUse" : "preview.bookSub"),
        ),
        `page ${n} second line`,
      ).toHaveLength(1);
      if (n === 11) {
        await imagesLoaded(page);
        expect(expectSceneLockups(page), "the card and the sign on page 11").toBe(2);
      }
      if (n < 12) {
        await userEvent.keyboard("{ArrowRight}");
        await waitFor(() => expect(countOf(dialog)).toBe(`${n + 1} / 12`));
      }
    }
  });
}

/**
 * Spec ORV-309 row 6 (C1, C2): the guidebook node starts at its foundation heading, whole, within 24
 * px of the frame's top, and its cropped bottom fades.
 */
async function expectGuideStart(root: HTMLElement) {
  const guide = nodeEl(root, "p-guide").querySelector<HTMLElement>("[data-live-frame]");
  expect(guide, "the guidebook frame").not.toBeNull();
  const frameEl = guide as HTMLElement;
  const section = await waitFor(() => {
    const el = frameEl.querySelector<HTMLElement>(FOUNDATION);
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  await waitFor(() =>
    expect(
      Math.abs(section.getBoundingClientRect().top - frameEl.getBoundingClientRect().top),
      "the heading starts the frame",
    ).toBeLessThanOrEqual(24),
  );
  expectNoGlyphClip(section.querySelector("h2") as Element, frameEl);
  const fade = frameEl.querySelector<HTMLElement>("[data-crop-fade]");
  expect(fade, "the guidebook crop fades").not.toBeNull();
  expect(getComputedStyle(fade as Element).backgroundImage).toContain("gradient");
  expect((fade as Element).getBoundingClientRect().bottom).toBeCloseTo(
    frameEl.getBoundingClientRect().bottom,
    0,
  );
}

/**
 * A sheet node (spec ORV-309 rows 8 and 9): its frame is 540 x 337.5 inside the node's media, and
 * the 1280 x 800 sheet lies whole inside the frame. Sizes are read in board px (rect over zoom).
 */
function expectSheetFrame(root: HTMLElement, id: string) {
  const node = nodeEl(root, id);
  const media = node.querySelector<HTMLElement>(".ds-node__media");
  const frame = node.querySelector<HTMLElement>("[data-live-frame]");
  expect(media, `${id} media`).not.toBeNull();
  expect(frame, `${id} frame`).not.toBeNull();
  const zoom = zoomOf(root);
  const f = (frame as HTMLElement).getBoundingClientRect();
  const m = (media as HTMLElement).getBoundingClientRect();
  expect(f.width / zoom, `${id} frame width`).toBeCloseTo(540, 0);
  expect(f.height / zoom, `${id} frame height`).toBeCloseTo(337.5, 0);
  for (const [side, inside] of [
    ["left", f.left >= m.left - 1],
    ["right", f.right <= m.right + 1],
    ["top", f.top >= m.top - 1],
    ["bottom", f.bottom <= m.bottom + 1],
  ] as const) {
    expect(inside, `${id} frame ${side} edge is inside its media`).toBe(true);
  }
  expect(inertAndHidden(frame as Element), `${id} frame is inert and hidden`).toBe(true);
  const sheet = (frame as HTMLElement).querySelector<HTMLElement>("[data-sheet]");
  expect(sheet, `${id} sheet`).not.toBeNull();
  expect((sheet as HTMLElement).offsetWidth, `${id} sheet width`).toBe(1280);
  expect((sheet as HTMLElement).offsetHeight, `${id} sheet height`).toBe(800);
  return { frame: frame as HTMLElement, sheet: sheet as HTMLElement };
}

/** The sheet's frame is inert: the play lifts it to focus a control, then puts it back. */
function unlock(frame: HTMLElement) {
  frame.inert = false;
  return () => {
    frame.inert = true;
  };
}

/**
 * The base sheet (row 8, base-sheet-1, C9): the 21 catalog entries in three columns, each a live
 * instance under its catalog name, all inside the 1280 x 800 sheet, with no intent button.
 */
function expectBaseSheet(sheet: HTMLElement, words: Messages) {
  const names = SHEETS.base.flatMap((column) => column.entries);
  const items = [...sheet.querySelectorAll<HTMLElement>("[data-catalog]")];
  expect(
    items.map((item) => item.dataset.catalog),
    "the 21 entries, in order",
  ).toEqual(names);
  const box = sheet.getBoundingClientRect();
  for (const item of items) {
    const name = item.dataset.catalog;
    expect(item.firstElementChild?.textContent, `${name} is labelled by its catalog name`).toBe(
      name,
    );
    expect(item.children.length, `${name} has a live instance`).toBeGreaterThan(1);
    const r = item.getBoundingClientRect();
    expect(r.left, `${name} left`).toBeGreaterThanOrEqual(box.left - 1);
    expect(r.right, `${name} right`).toBeLessThanOrEqual(box.right + 1);
    expect(r.top, `${name} top`).toBeGreaterThanOrEqual(box.top - 1);
    expect(r.bottom, `${name} bottom`).toBeLessThanOrEqual(box.bottom + 1);
  }
  expect(sheet.querySelectorAll("[data-column]"), "three columns").toHaveLength(3);
  expect(sheet.querySelector('.ds-button[data-variant="intent"]'), "no intent button").toBeNull();
  expect(sheet.textContent, "C9: the command menu key").toContain(
    words.orvCanvas.sheet.view.command,
  );
  expect(sheet.querySelector(".ds-kbd"), "C9: a Kbd").not.toBeNull();
}

/**
 * Focus on a sheet field is the border form (ORV-192): its own border turns `focus.ring` on every
 * side, the outline stays clear so no second line sits beside it, and a 3 px halo touches it. The
 * ring colour is read beside the field, because an input holds no probe element.
 */
async function expectSheetFocus(frame: HTMLElement, sheet: HTMLElement, label: string) {
  const relock = unlock(frame);
  const control = within(sheet).getByLabelText(new RegExp(label)) as HTMLElement;
  const ring = resolvedColor(control.parentElement as HTMLElement, "--ds-focus-ring");
  control.focus();
  expect(control.matches(":focus-visible"), "the field takes keyboard focus").toBe(true);
  await Promise.all(control.getAnimations().map((a) => a.finished));
  const style = getComputedStyle(control);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    expect(style[`border${side}Color`], `border ${side} is focus.ring`).toBe(ring);
    expect(parseFloat(style[`border${side}Width`]), `border ${side} width`).toBe(1);
  }
  if (style.outlineStyle !== "none") {
    expect(style.outlineColor, "the outline is transparent").toBe("rgba(0, 0, 0, 0)");
  }
  expect(style.boxShadow, "the halo is 3 px").toMatch(/ 0px 0px 0px 3px$/);
  control.blur();
  relock();
}

/** The composed sheet (row 9): a working Studio, a board, an inspector, a chat by rules, a task bar. */
async function expectComposedSheet(frame: HTMLElement, sheet: HTMLElement, words: Messages) {
  const board = await waitFor(() => {
    const el = sheet.querySelector<HTMLElement>(".ds-board");
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  await waitFor(() => expect(board.querySelectorAll(".react-flow__node")).toHaveLength(5));
  expect(board.querySelectorAll(".react-flow__edge"), "four edges").toHaveLength(4);
  await waitFor(() => expectEdgesOnPorts(board, "the composed sheet", 4));
  const selected = board.querySelectorAll<HTMLElement>(".ds-node[data-selected]");
  expect(selected, "one selected node").toHaveLength(1);
  expect(board.querySelector(".ds-node-toolbar"), "its toolbar").not.toBeNull();
  expect(sheet.querySelector(".ds-inspector"), "the inspector").not.toBeNull();
  // The chat holds one sample exchange, seeded when the sheet mounts, and says how it answers.
  const basis = await waitFor(() => {
    const el = sheet.querySelector<HTMLElement>(".ds-chat__basis");
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  expect(basis.textContent).toBe(words.taskBar.basisRules);
  expect(sheet.querySelectorAll('.ds-button[data-variant="intent"]').length).toBeLessThanOrEqual(1);
  // C6: the collapsed task bar keeps a space.6 (24) inset above the board's bottom edge, clear of
  // the attribution link. Measured in the sheet's own px: board px times the frame's scale.
  const bar = board.querySelector<HTMLElement>(".ds-taskbar");
  expect(bar, "the task bar").not.toBeNull();
  expect(
    (bar as HTMLElement).querySelector("[aria-expanded]")?.getAttribute("aria-expanded"),
    "the task bar is collapsed",
  ).toBe("false");
  const scale = sheet.getBoundingClientRect().width / 1280;
  const b = board.getBoundingClientRect();
  const t = (bar as HTMLElement).getBoundingClientRect();
  expect((b.bottom - t.bottom) / scale, "the task bar's bottom inset").toBeCloseTo(24, 0);
  const link = board.querySelector<HTMLElement>(".react-flow__attribution a");
  if (link) {
    const a = link.getBoundingClientRect();
    const apart = a.right <= t.left || a.left >= t.right || a.bottom <= t.top || a.top >= t.bottom;
    expect(apart, "the attribution link is clear of the task bar").toBe(true);
  }
  // Selection and focus are two shapes: the node's 1 px outline, the control's line and 3 px halo.
  const relock = unlock(frame);
  const control = sheet.querySelector<HTMLElement>(".ds-chat textarea.ds-control");
  expect(control, "the chat's box").not.toBeNull();
  const field = control as HTMLElement;
  const node = getComputedStyle(selected[0] as HTMLElement);
  const nodeOutline = `${node.outlineStyle} ${node.outlineWidth} ${node.outlineColor}`;
  const nodeShadow = node.boxShadow;
  // The chat's box draws the focus of its textarea: the line on the box and the 3 px halo.
  const box = field.closest<HTMLElement>(".ds-chat__box");
  expect(box, "the chat's box").not.toBeNull();
  const ring = resolvedColor((box as HTMLElement).parentElement as HTMLElement, "--ds-focus-ring");
  field.focus();
  await Promise.all((box as HTMLElement).getAnimations().map((a) => a.finished));
  const focus = getComputedStyle(box as HTMLElement);
  expect(focus.borderTopColor, "the focused box's line is focus.ring").toBe(ring);
  expect(focus.boxShadow, "the focused box has the 3 px halo").toMatch(/ 0px 0px 0px 3px$/);
  expect(`${focus.outlineStyle} ${focus.outlineWidth} ${focus.outlineColor}`).not.toBe(nodeOutline);
  expect(focus.boxShadow).not.toBe(nodeShadow);
  field.blur();
  relock();
}

/** Runs the chapter's checks and returns the mode the base sheet renders in. */
async function playDesignSystemChapter(root: HTMLElement, words: Messages) {
  await ready(root);
  await waitFor(() => expectChapterInView(root, "system", words));
  await expectDockAgrees(root, "system", words);
  // C4: a nested board in a scaled frame fits only when it is in view at mount, so each node is
  // scrolled into view before it is read; the chapter already frames them, so the view must not move.
  const view = viewportOf(root)?.style.transform;
  for (const id of ["p-base", "p-pat"]) nodeEl(root, id).scrollIntoView({ block: "nearest" });
  await fontsReady();
  expect(viewportOf(root)?.style.transform, "scrolling into view leaves the board's view").toBe(
    view,
  );
  const base = expectSheetFrame(root, "p-base");
  const composed = expectSheetFrame(root, "p-pat");
  expectBaseSheet(base.sheet, words);
  for (const sheet of [base.sheet, composed.sheet]) {
    expect(sheet.closest("[data-design-profile]")?.getAttribute("data-design-profile")).toBe(
      "orivilo",
    );
  }
  // The probe takes the sheet's own mode, so the colour check holds under the toolbar's light and dark.
  const sheetMode = base.sheet.closest("[data-mode]")?.getAttribute("data-mode");
  expect(sheetMode).toMatch(/^(light|dark)$/);
  const probe = document.createElement("div");
  probe.setAttribute("data-mode", sheetMode ?? "");
  probe.setAttribute("data-design-profile", "orivilo");
  document.body.append(probe);
  const primary = getComputedStyle(probe).getPropertyValue("--ds-action-primary");
  probe.remove();
  const button = base.sheet.querySelector(".ds-button") as HTMLElement;
  expect(getComputedStyle(button).getPropertyValue("--ds-action-primary")).toBe(primary);
  expect(primary).not.toBe("");
  await expectComposedSheet(composed.frame, composed.sheet, words);
  // Last, because a focus may move the board's view: the focus line with its halo on a sheet field.
  await expectSheetFocus(base.frame, base.sheet, words.orvCanvas.sheet.field.name);
  return sheetMode;
}

/** The design system chapter: the base sheet and the composed Studio, live in the orivilo profile. */
export const DesignSystemChapter: Story = {
  globals: { locale: "en", mode: "light" },
  args: { chapter: "system" },
  play: async ({ canvasElement }) => {
    expect(await playDesignSystemChapter(canvasElement, EN)).toBe("light");
  },
};

/** The same chapter with the toolbar on dark: the probe reads the sheet's dark mode. */
export const DesignSystemChapterDark: Story = {
  globals: { locale: "en", mode: "dark" },
  args: { chapter: "system" },
  play: async ({ canvasElement }) => {
    expect(await playDesignSystemChapter(canvasElement, EN)).toBe("dark");
  },
};

/** The same chapter in Thai: every label, answer and the chat's "ตามกฎ" come from the Thai catalog. */
export const DesignSystemChapterThai: Story = {
  globals: { locale: "th", mode: "light" },
  args: { chapter: "system" },
  play: async ({ canvasElement }) => {
    expect(await playDesignSystemChapter(canvasElement, TH)).toBe("light");
  },
};

/** Page 1 of the design system sequence: the base sheet, whole in the stage. */
async function playPreviewDesignSystem(words: Messages) {
  const dialog = await dialogOf(words.orvCanvas.preview.designSystem);
  expect(countOf(dialog)).toBe("1 / 2");
  const stage = stageOf(dialog);
  const frame = await waitFor(() => {
    const el = stage.querySelector<HTMLElement>("[data-live-frame]");
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  const box = frame.getBoundingClientRect();
  expect(box.width / box.height).toBeCloseTo(1280 / 800, 1);
  expectBaseSheet(frame.querySelector("[data-sheet]") as HTMLElement, words);
  expect(within(dialog).getByText(words.orvCanvas.node.base)).toBeDefined();
  await userEvent.keyboard("{ArrowRight}");
  await waitFor(() => expect(countOf(dialog)).toBe("2 / 2"));
  expect(within(dialog).getByText(words.orvCanvas.node.composed)).toBeDefined();
  const second = await waitFor(() => {
    const el = stageOf(dialog).querySelector<HTMLElement>("[data-live-frame]");
    expect(el?.querySelector('[data-sheet="composed"]')).not.toBeNull();
    return el as HTMLElement;
  });
  await waitFor(() => expect(second.querySelectorAll(".react-flow__node")).toHaveLength(5));
  // F3: the composed sheet's edges start and end on their ports in the dialog too.
  await waitFor(() => expectEdgesOnPorts(second, "the composed sheet in the preview", 4));
}

/** The design system sequence: the base sheet, then the composed Studio, at the stage's size. */
export const PreviewDesignSystem: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "system", page: 1 } },
  play: async () => playPreviewDesignSystem(EN),
};

/** The nested board of the app frame, fitted in its 1280 x 800 box: no empty top, no cut node. */
function expectAppBoardFitted(frameEl: Element, name: string) {
  const board = frameEl.querySelector<HTMLElement>(".ds-board");
  expect(board, `${name} holds the board screen's board`).not.toBeNull();
  const box = (board as HTMLElement).getBoundingClientRect();
  const nodes = [...(board as HTMLElement).querySelectorAll(".react-flow__node")];
  expect(nodes.length, `${name} board nodes`).toBeGreaterThan(0);
  const tops: number[] = [];
  for (const node of nodes) {
    const r = node.getBoundingClientRect();
    tops.push(r.top);
    expect(r.left, `${name} node left`).toBeGreaterThanOrEqual(box.left - 1);
    expect(r.right, `${name} node right`).toBeLessThanOrEqual(box.right + 1);
    expect(r.top, `${name} node top`).toBeGreaterThanOrEqual(box.top - 1);
    expect(r.bottom, `${name} node bottom`).toBeLessThanOrEqual(box.bottom + 1);
  }
  expect(Math.min(...tops) - box.top, `${name} has no empty top`).toBeLessThan(box.height * 0.3);
}

/**
 * Every edge of every board in `scope` starts and ends on its handle (sign-off F3): each end of an
 * edge's path lies within 2 px of a handle's box. An edge is drawn to the outer edge of its handle,
 * so the box and not the centre is the target (the centre is half a handle, about 3 to 5 px, away
 * at the frame's scale). The ends are read in screen px through the path's own matrix, so a scale
 * above the board shows as a gap.
 */
function expectEdgesOnPorts(scope: Element, name: string, count: number) {
  const flows = [...scope.querySelectorAll<HTMLElement>(".react-flow")];
  expect(flows.length, `${name} holds a board`).toBeGreaterThan(0);
  let checked = 0;
  for (const flow of flows) {
    const handles = [...flow.querySelectorAll(".react-flow__handle")].map((h) =>
      h.getBoundingClientRect(),
    );
    for (const edge of flow.querySelectorAll(".react-flow__edge")) {
      const path = [...edge.querySelectorAll("path")].find((p) => p.getTotalLength() > 0);
      expect(path, `${name} edge ${edge.getAttribute("data-id")} has a path`).toBeDefined();
      if (!path) continue;
      const m = path.getScreenCTM() as DOMMatrix;
      for (const length of [0, path.getTotalLength()]) {
        const q = path.getPointAtLength(length);
        const x = m.a * q.x + m.c * q.y + m.e;
        const y = m.b * q.x + m.d * q.y + m.f;
        const gap = Math.min(
          ...handles.map((r) =>
            Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom)),
          ),
        );
        expect(
          gap,
          `${name} edge ${edge.getAttribute("data-id")} end at ${length}`,
        ).toBeLessThanOrEqual(2);
      }
      checked++;
    }
  }
  expect(checked, `${name} edges checked`).toBe(count);
}

/**
 * The window's board (design row 3.2, sign-off F2): no two nodes intersect and every port row lies
 * inside its node. Boxes are read in the board's own px (a node's transform and size), so a scale or
 * the tilt of page 10's field does not change them.
 */
function expectWindowBoard(browser: HTMLElement, name: string) {
  const nodes = [...browser.querySelectorAll<HTMLElement>(".react-flow__node")];
  expect(nodes.map((n) => n.dataset.id).sort(), `${name} nodes`).toEqual([
    "brief",
    "colour",
    "guide",
    "logo",
    "pos",
    "product",
  ]);
  const boxes = nodes.map((n) => {
    const at = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(n.style.transform);
    return {
      id: n.dataset.id,
      x: Number(at?.[1]),
      y: Number(at?.[2]),
      w: n.offsetWidth,
      h: n.offsetHeight,
    };
  });
  for (const a of boxes) {
    for (const b of boxes) {
      if ((a.id ?? "") >= (b.id ?? "")) continue;
      const area =
        Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
        Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      expect(area, `${name}: ${a.id} and ${b.id} intersect`).toBe(0);
    }
  }
  for (const node of nodes) {
    const box = node.getBoundingClientRect();
    const ports = node.querySelector(".ds-node__ports")?.getBoundingClientRect();
    expect(ports, `${name}: ${node.dataset.id} has a port row`).toBeDefined();
    expect(ports?.left, `${name}: ${node.dataset.id} ports left`).toBeGreaterThanOrEqual(
      box.left - 1,
    );
    expect(ports?.right, `${name}: ${node.dataset.id} ports right`).toBeLessThanOrEqual(
      box.right + 1,
    );
    expect(ports?.top, `${name}: ${node.dataset.id} ports top`).toBeGreaterThanOrEqual(box.top - 1);
    expect(ports?.bottom, `${name}: ${node.dataset.id} ports bottom`).toBeLessThanOrEqual(
      box.bottom + 1,
    );
  }
}

/** The product chapter's three nodes (spec ORV-309 rows 5 and 7), in the words of one language. */
async function playProductChapter(root: HTMLElement, words: Messages, lang: "en" | "th") {
  // F4: at 1440 x 900 the three product nodes sit 16 px or more above the dock. The window is
  // resized after the board mounted, so the chapter fits again on the new size.
  await atWindow(1440, 900, () => playProductChapterAt(root, words, lang));
  // The fit follows the board: a shorter window frames the chapter again, and there the fractional
  // padding is small (24 px), so the fit's 24 px of margin on top of it is what gives 40.
  await atWindow(1440, 700, async () => {
    await waitFor(() => expectChapterInView(root, "product", words, 40));
  });
}

async function playProductChapterAt(root: HTMLElement, words: Messages, lang: "en" | "th") {
  await ready(root);
  await waitFor(() => expectChapterInView(root, "product", words, 16));
  await expectDockAgrees(root, "product", words);
  // C4: a nested board in a scaled frame fits only when it is in view at mount, so each node is
  // scrolled into view before it is read. The chapter already frames them: the view must not move.
  const view = viewportOf(root)?.style.transform;
  for (const id of PRODUCT_PAGE_IDS) nodeEl(root, id).scrollIntoView({ block: "nearest" });
  await fontsReady();
  expect(viewportOf(root)?.style.transform, "scrolling into view leaves the board's view").toBe(
    view,
  );
  const p = words.orvCanvas.product;
  const tops = PRODUCT_PAGE_IDS.map((id) => nodeEl(root, id).getBoundingClientRect().top);
  expect(tops).toEqual([...tops].sort((a, b) => a - b));
  const titles = [
    words.orvCanvas.node.landing,
    words.orvCanvas.node.app,
    words.orvCanvas.node.guide,
  ];
  const notes = [p.landingNote, p.appNote, p.guideNote];
  const badges = [p.landingBadge, p.badge, p.badge];
  const medias: Element[] = [];
  PRODUCT_PAGE_IDS.forEach((id, i) => {
    const node = nodeEl(root, id);
    expect(node.offsetWidth, `${id} is 480 wide`).toBe(480);
    expect(within(node).getByText(at(titles, i)), `${id} title`).toBeDefined();
    const live = node.querySelector<HTMLElement>("[data-live-frame]");
    expect(live, id).not.toBeNull();
    expect(inertAndHidden(live as Element), id).toBe(true);
    expectLivePage(node, id, words, id === "p-landing");
    // One badge row each: one Badge in the media's sibling row, with its note.
    const media = node.querySelector(".ds-node__media") as Element;
    medias.push(media);
    const row = media.nextElementSibling as HTMLElement;
    const badge = row.querySelectorAll(".ds-badge");
    expect(badge, `${id} has one badge`).toHaveLength(1);
    expect(badge[0]?.textContent, `${id} badge`).toBe(at(badges, i));
    expect(within(row).getByText(at(notes, i)), `${id} note`).toBeDefined();
  });
  expectSameHeight(medias[0] as Element, ...medias.slice(1));
  // The landing frame speaks the canvas's language; the app frame keeps its explicit 1280 x 800 box.
  const landing = nodeEl(root, "p-landing").querySelector("[data-live-frame] [lang]");
  expect(landing?.getAttribute("lang")).toBe(lang);
  const app = nodeEl(root, "p-app").querySelector("[data-live-frame]") as HTMLElement;
  const inner = app.querySelector<HTMLElement>('div[style*="width: 1280px"]');
  expect(inner?.offsetWidth, "the app frame is 1280 wide").toBe(1280);
  const screen = inner?.querySelector<HTMLElement>('div[style*="height: 800px"]');
  expect(screen?.offsetHeight, "the app frame is 800 tall").toBe(800);
  await waitFor(() => expectAppBoardFitted(app, "p-app"));
  await expectGuideStart(root);
}

/** The product chapter: the landing, the app and the guidebook, each live, inert and hidden from the page. */
export const ProductChapter: Story = {
  globals: { locale: "en" },
  args: { chapter: "product" },
  play: async ({ canvasElement }) => playProductChapter(canvasElement, EN, "en"),
};

/** The same chapter with the canvas in Thai: the landing, the board screen and the guidebook follow. */
export const ProductChapterThai: Story = {
  globals: { locale: "th" },
  args: { chapter: "product" },
  play: async ({ canvasElement }) => playProductChapter(canvasElement, TH, "th"),
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
    await expectPaperBounds(stage, { ink: ALL_SIDES, tiles: true });
    expect(within(dialog).getByText(copyOf(EN, "image.label"))).toBeDefined();
    const sequence = SEQUENCES.find((s) => s.id === "direction");
    for (let n = 2; n <= 6; n++) {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 6`));
      await waitFor(() => expect(stage.querySelectorAll("[data-piece]").length).toBe(0));
      const rec = at(sequence?.pages ?? [], n - 1);
      expect(Object.keys(rec.show)[0]).toBe("piece");
      await expectPaperBounds(stage, { ink: ALL_SIDES, tiles: true });
      const footer = within(dialog).getByText(copyOf(EN, rec.caption));
      expect(footer.closest("[data-stage]")).toBeNull();
      expect(stage.textContent).not.toContain(copyOf(EN, rec.caption));
    }
  },
};

/** The direction board in dark mode: the stage and the page still meet at a line of the subtle border (row 28). */
export const PreviewDirectionBoardDark: Story = {
  globals: { locale: "en", mode: "dark" },
  args: { preview: { sequence: "direction", page: 1 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.node.directionBoard);
    const stage = stageOf(dialog);
    await imagesLoaded(stage);
    await expectPaperBounds(stage, { ink: ALL_SIDES, tiles: true });
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
    await expectPaperBounds(stage, { ink: ALL_SIDES, tiles: true });
    expectQuadsRead(stage);
    expectMarksAreLogos(stage);
    await expectDigitalPieces(stage, EN);
    // One label (honest-1), in the caption and not on the art.
    expect(within(dialog).getAllByText(copyOf(EN, "use.note"))).toHaveLength(1);
    expect(stage.textContent).not.toContain(copyOf(EN, "use.note"));
    // At 1440 by 900 the board fills the stage height within 2 px (row 29, as row 28 for the direction board).
    await atWindow(1440, 900, async () => {
      await fontsReady();
      const art = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
      expect(
        Math.abs(art.getBoundingClientRect().height - stageBox(stage).height),
        "the board fills the stage",
      ).toBeLessThanOrEqual(2);
    });
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
          expect(expectSceneLockups(stage), `${piece.id} lockup on its page`).toBe(1);
        }
        if (piece?.id === "phone" || piece?.id === "icon") {
          await imagesLoaded(stage);
          // The piece's own page holds the one phone picture (the stage holds nothing else).
          expectPhoneScene(stage, `${piece.id} page`, { round: radiusOf(stage, "rounded-round") });
        }
        // One intent button on the whole board, in the phone: its page holds it, no other does.
        expect(
          stage.querySelectorAll('.ds-button[data-variant="intent"]'),
          `${piece?.id} page intent buttons`,
        ).toHaveLength(piece?.id === "phone" ? 1 : 0);
        if (piece?.id === "window") {
          const browser = stage.querySelector<HTMLElement>("[data-browser]") as HTMLElement;
          await waitFor(() => expectAppBoardFitted(browser, "the window page"));
          expectWindowBoard(browser, "the window page");
          expectEdgesOnPorts(browser, "the window page", 6);
        }
        await expectPaperBounds(stage, { ink: ALL_SIDES, tiles: true });
      }
    }
  },
};

/**
 * The guidebook preview keeps the reader's place after any scroll (ORV-280 C9): a scroll event that
 * the re-apply did not cause itself stops the re-apply. A programmatic `scrollTop` change stands in
 * for a scrollbar drag, which fires no wheel, key, pointer or touch event on the area.
 */
export const PreviewProductPagesScrollbar: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "pages", page: 3 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.preview.pages);
    const stage = stageOf(dialog);
    const foundation = await waitFor(() => {
      const el = stage.querySelector<HTMLElement>(FOUNDATION);
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    const viewport = stage.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement;
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    const gapOf = () =>
      foundation.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
    expect(Math.abs(gapOf())).toBeLessThanOrEqual(24);
    // The browser keeps an anchored node in place by itself; switch that off to read the page.
    viewport.style.overflowAnchor = "none";
    // The drag: the position changes by script, and the scroll event is the only sign of it.
    const scrolled = new Promise((done) =>
      viewport.addEventListener("scroll", done, { once: true }),
    );
    const before = viewport.scrollTop;
    viewport.scrollTop = before + 120;
    await scrolled;
    expect(viewport.scrollTop).toBeGreaterThan(before + 100);
    const spacer = document.createElement("div");
    spacer.style.height = "240px";
    foundation.before(spacer);
    await frames(4);
    expect(gapOf(), "the reader's place is kept after a scroll that is theirs").toBeGreaterThan(
      100,
    );
    spacer.remove();
  },
};

/**
 * The product pages (spec ORV-309 rows 6 and 7): the landing, the app, then the guidebook, each live
 * at its design width. The guidebook opens at its foundation heading in both languages, with no
 * Thai mark cut, and keeps the reader's place once they scroll.
 */
async function playPreviewProductPages(canvasElement: HTMLElement, words: Messages) {
  const dialog = await dialogOf(words.orvCanvas.preview.pages);
  expect(countOf(dialog)).toBe("3 / 3");
  const stage = stageOf(dialog);
  const foundation = await waitFor(() => {
    const el = stage.querySelector<HTMLElement>(FOUNDATION);
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
  const viewport = stage.querySelector<HTMLElement>(
    "[data-radix-scroll-area-viewport]",
  ) as HTMLElement;
  await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
  const gapOf = () => foundation.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  expect(Math.abs(gapOf()), "the heading is at the top of the frame").toBeLessThanOrEqual(24);
  expectNoGlyphClip(foundation.querySelector("h2") as Element, viewport);
  // A font that swaps in after mount, or a late image, grows the page above the heading: the
  // guidebook opens at its heading again (review R1-7) until the reader moves the page.
  const spacer = (height: number) => {
    const el = document.createElement("div");
    el.style.height = `${height}px`;
    foundation.before(el);
    return el;
  };
  // The browser keeps an anchored node in place by itself; switch that off to read the page.
  viewport.style.overflowAnchor = "none";
  const above = spacer(240);
  await waitFor(() =>
    expect(Math.abs(gapOf()), "the heading stays at the top").toBeLessThanOrEqual(24),
  );
  viewport.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
  const grown = spacer(240);
  await frames(4);
  expect(gapOf(), "the reader's place is kept once they scroll").toBeGreaterThan(100);
  above.remove();
  grown.remove();
  expect(dialog.querySelector("h2")).not.toBeNull();
  expect(
    [...canvasElement.querySelectorAll("h1")].filter(
      (h) => !h.closest("[data-live-frame], [data-art-frame]"),
    ),
  ).toHaveLength(1);
  // Row 7: page 3 is the guidebook, then the app (page 2) and the landing (page 1), all live.
  await waitFor(() => expectLivePage(stage, "page 3", words));
  await userEvent.keyboard("{ArrowLeft}");
  await waitFor(() => expect(countOf(dialog)).toBe("2 / 3"));
  await waitFor(() => expectLivePage(stage, "page 2", words));
  expect(within(dialog).getByText(words.orvCanvas.node.app)).toBeDefined();
  expect(within(dialog).getByText(words.orvCanvas.product.appNote)).toBeDefined();
  // The app fills its 1280 x 800 box scaled to the stage, whole.
  const app = stage.querySelector<HTMLElement>("[data-live-frame]") as HTMLElement;
  await waitFor(() => expectAppBoardFitted(app, "page 2"));
  const box = app.getBoundingClientRect();
  expect(box.width / box.height).toBeCloseTo(1280 / 800, 1);
  await userEvent.keyboard("{ArrowLeft}");
  await waitFor(() => expect(countOf(dialog)).toBe("1 / 3"));
  await waitFor(() => expectLivePage(stage, "page 1", words, true));
  expect(within(dialog).getByText(words.orvCanvas.node.landing)).toBeDefined();
  expect(within(dialog).getByText(words.orvCanvas.product.landingNote)).toBeDefined();
}

/** The product pages in English: the guidebook opens at its foundation heading. */
export const PreviewProductPages: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "pages", page: 3 } },
  play: async ({ canvasElement }) => playPreviewProductPages(canvasElement, EN),
};

/** The same pages in Thai: the heading is at the same place and its marks are whole. */
export const PreviewProductPagesThai: Story = {
  globals: { locale: "th" },
  args: { preview: { sequence: "pages", page: 3 } },
  play: async ({ canvasElement }) => playPreviewProductPages(canvasElement, TH),
};

/** The pager sits in the middle of the caption's row: its centre is the footer's centre, within 1 px. */
function expectPagerCentred(dialog: HTMLElement) {
  const group = pagerOf(dialog, "next").parentElement as HTMLElement;
  const footer = group.parentElement as HTMLElement;
  const centre = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return (r.left + r.right) / 2;
  };
  expect(
    Math.abs(centre(group) - centre(footer)),
    `the pager is ${(centre(group) - centre(footer)).toFixed(1)} px off the footer's centre at ${window.innerWidth}`,
  ).toBeLessThanOrEqual(1);
}

/** The first page of the brandbook at 360: the footer is one column, the panel 328 wide, focus on Next, the pager centred (also at 599). */
export const PreviewAt360: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "book", page: 1 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.preview.book);
    await atWindow(360, 760, async () => {
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
      expectPagerCentred(dialog);
    });
    // Row 30 (C6): just under the 600 px break the pager is still centred, as it is above it.
    await atWindow(599, 760, async () => {
      await fontsReady();
      expectPagerCentred(dialog);
    });
  },
};

/**
 * Spec ORV-309 rows 11 and 12 at 360: every page of the In use preview and of brandbook part 03
 * holds its art inside the stage with no sideways scroll, the pieces inside the art.
 */
async function expectPagesHoldAt360(dialog: HTMLElement, from: number, count: number) {
  await atWindow(360, 760, async () => {
    const stage = stageOf(dialog);
    for (let n = from; n < from + count; n++) {
      await waitFor(() => expect(countOf(dialog)).toMatch(new RegExp(`^${n} / `)));
      await fontsReady();
      const art = stage.querySelector<HTMLElement>("[data-art-frame]") as HTMLElement;
      expect(art.scrollWidth, `page ${n}: the frame's scrollWidth`).toBe(art.clientWidth);
      const frame = art.getBoundingClientRect();
      expect(frame.right, `page ${n}: inside the stage`).toBeLessThanOrEqual(
        stage.getBoundingClientRect().right + 0.5,
      );
      expect(
        document.documentElement.scrollWidth,
        `page ${n}: the document does not scroll sideways`,
      ).toBe(document.documentElement.clientWidth);
      for (const piece of art.querySelectorAll<HTMLElement>("[data-piece], [data-placement]")) {
        const r = piece.getBoundingClientRect();
        const label = piece.dataset.piece ?? piece.dataset.placement;
        expect(r.left, `page ${n} ${label} left`).toBeGreaterThanOrEqual(frame.left - 1);
        expect(r.right, `page ${n} ${label} right`).toBeLessThanOrEqual(frame.right + 1);
        expect(r.bottom, `page ${n} ${label} bottom`).toBeLessThanOrEqual(frame.bottom + 1);
      }
      if (n < from + count - 1) {
        await userEvent.keyboard("{ArrowRight}");
      }
    }
  });
}

/** The In use board at 360: all 8 pages (the board, then each piece) hold. */
export const PreviewInUseBoardAt360: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "inUse", page: 1 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.node.inUseBoard);
    await expectPagesHoldAt360(dialog, 1, 8);
  },
};

/** Brandbook part 03 at 360: page 10 (the field) and page 11 (six placements) hold. */
export const PreviewBrandbookAt360: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "book", page: 10 } },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.preview.book);
    await expectPagesHoldAt360(dialog, 10, 3);
  },
};

const ALL_IMAGES: readonly ImageId[] = IMAGES.map((i) => i.id);

/** Page 11 with only the phone picture missing: both phone placements fall back, the rest holds. */
export const MissingPhonePicture: Story = {
  globals: { locale: "en" },
  args: { preview: { sequence: "book", page: 11 }, missingImages: ["scene-phone"] },
  play: async () => {
    const dialog = await dialogOf(EN.orvCanvas.preview.book);
    await waitFor(() => expect(countOf(dialog)).toBe("11 / 12"));
    const page = (await waitFor(() => {
      const el = stageOf(dialog).querySelector<HTMLElement>('[data-book-page="11"]');
      expect(el).not.toBeNull();
      return el as HTMLElement;
    })) as HTMLElement;
    expectPhoneMissing(page, "page 11");
    expect(page.textContent, "no title of the layout grid").not.toContain(EN.orvCanvas.use.grid);
    // The card and the sign are still there with their own pictures.
    expect(page.querySelector('[data-photo="scene-card"] img')).not.toBeNull();
    expect(page.querySelector('[data-photo="scene-sign"] img')).not.toBeNull();
  },
};

/**
 * The phone's missing state (design row 4.5): the violet flood with the id and the catalog's line,
 * and nothing drawn on it: no picture, no screen, no pill, no clock, no layout grid, no measure, no
 * live frame, and so no intent button in `scope`.
 */
function expectPhoneMissing(scope: Element, name: string) {
  for (const id of ["phone", "icon"]) {
    const piece = scope.querySelector<HTMLElement>(`[data-piece="${id}"]`) as HTMLElement;
    expect(piece, `${name} ${id}`).not.toBeNull();
    const tile = piece.querySelector<HTMLElement>('[data-photo="scene-phone"]') as HTMLElement;
    expect(tile.textContent, `${name} ${id} id`).toContain("scene-phone");
    expect(tile.textContent, `${name} ${id} line`).toContain(EN.orvCanvas.image.missing);
    for (const part of [
      "img",
      "[data-phone-screen]",
      "[data-island]",
      "[data-clock]",
      "[data-layout-grid]",
      "[data-measure]",
      "[data-live-frame]",
    ]) {
      expect(piece.querySelectorAll(part), `${name} ${id} holds no ${part}`).toHaveLength(0);
    }
  }
  expect(
    scope.querySelectorAll('.ds-button[data-variant="intent"]'),
    `${name} holds no intent button`,
  ).toHaveLength(0);
}

/** Every image missing: flood, id and the catalog line on each photo; the scenes keep the lockup on the face. */
export const MissingImages: Story = {
  globals: { locale: "en" },
  args: { chapter: "inUse", missingImages: ALL_IMAGES },
  play: async ({ canvasElement }) => {
    const root = canvasElement;
    await ready(root);
    // The only images left are the two scene lockups, each on its face (they are files of their own,
    // not the missing photographs): the fallback keeps the lockup on the face as an image.
    expect(
      root.querySelectorAll("img:not([data-face] > img[data-lockup])"),
      "no photograph",
    ).toHaveLength(0);
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
    }
    expect(expectSceneLockups(nodeEl(root, "u-board")), "both lockups on the faces").toBe(2);
    // Row 4.5: a phone without its picture is its flood and the missing label, never a screen
    // floating on violet: no screen, no pill, no clock, and so no intent button on the board.
    expectPhoneMissing(nodeEl(root, "u-board"), "the board");
    const dialog = await openNode(root, "u-board", EN.orvCanvas.node.inUseBoard);
    await expectPaperBounds(stageOf(dialog), { ink: ALL_SIDES, tiles: true });
    const sequence = SEQUENCES.find((s) => s.id === ("inUse" satisfies SequenceId));
    for (let n = 2; n <= 8; n++) {
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(() => expect(countOf(dialog)).toBe(`${n} / 8`));
      const rec = at(sequence?.pages ?? [], n - 1);
      if ("piece" in rec.show) {
        const piece = PIECES.find((p) => p.id === (rec.show as { piece: string }).piece);
        const image =
          piece &&
          (piece.content.kind === "photo" ||
            piece.content.kind === "scene" ||
            piece.content.kind === "phone" ||
            piece.content.kind === "icon")
            ? piece.content.image
            : null;
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
