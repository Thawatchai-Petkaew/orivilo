import {
  BUSINESS_FIELDS,
  BUSINESS_NODES,
  type BusinessNodeId,
  type BusinessReadReason,
  type BusinessView,
} from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Under } from "../components/matrix";
import { inVitest } from "../testing/visual-asserts";
import { formatNumber } from "../i18n/format";
import { LocaleProvider } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";
import { BusinessBoardScreen } from "./business-board";
import {
  aiUnavailableView,
  ENGLISH_READ_VIEW,
  ENGLISH_VIEW,
  LONG_NAME,
  NARROW_VIEW,
  MARKUP_READINGS,
  SKIPPED_VIEW,
  THAI_READ_VIEW,
  THAI_VIEW,
  UNTRUSTED,
  UNTRUSTED_VIEW,
} from "./business-fixtures";
import {
  en,
  expectAccessScreen,
  expectFitsAt360,
  FixtureNote,
  inEnglish,
  textOf,
  th,
} from "./business-story-helpers";
import {
  fromModelNote,
  readReasonLine,
  fieldLabel,
  nodeTitle,
  questionText,
} from "./business-text";

const meta = {
  title: "Examples/Application: Business board",
  component: BusinessBoardScreen,
  args: { access: "ready", view: THAI_VIEW, signInHref: "/account", listHref: "/business" },
  decorators: [
    (Story) => (
      <>
        <FixtureNote />
        <Story />
      </>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The project board screen, slice 2 (ORV-282): the project name, what the page holds, when it was saved and the five business nodes on a read-only present board, left to right in the order they are filled, with the six links between them. A node at rest shows its state and the names of its fields; opening it (click, Enter or Space) shows its view in a viewer: its state, its fields with the person's words and how they got there, and the questions still to ask. Every project here is a labelled fixture; nobody gave these answers. Nothing is read by AI in this slice and the screen says nothing of it. The page that renders it owns the one `main`.",
      },
    },
  },
} satisfies Meta<typeof BusinessBoardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// ----- helpers -----

/** The kind word `CanvasNode` adds to a node's accessible name, in each language. */
const KIND_WORD = { th: "ความรู้", en: "knowledge" } as const;
type Lang = keyof typeof KIND_WORD;
const langOf = (m: Messages): Lang => (m === th ? "th" : "en");

const nodeEl = (root: ParentNode, id: string) =>
  root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
const nodeNamed = (m: Messages, id: BusinessNodeId) =>
  fill(m.graph.nodeLabel, { title: nodeTitle(m, id), kind: KIND_WORD[langOf(m)] });
const fieldOf = (node: ParentNode, field: string) =>
  node.querySelector<HTMLElement>(`[data-field="${field}"]`) as HTMLElement;
const answersOf = (view: BusinessView) =>
  view.nodes.flatMap((n) => n.fields.flatMap((f) => (f.answer === null ? [] : [f])));
const viewNode = (view: BusinessView, id: BusinessNodeId) =>
  view.nodes.find((n) => n.id === id) as BusinessView["nodes"][number];

/** React Flow keeps a node hidden until it is measured and draws edges after: wait for all of it. */
const boardReady = (root: HTMLElement) =>
  waitFor(() => {
    expect(root.querySelectorAll(".react-flow__node")).toHaveLength(5);
    expect(root.querySelectorAll(".react-flow__edge")).toHaveLength(6);
    for (const n of root.querySelectorAll<HTMLElement>(".react-flow__node")) {
      expect(n.style.visibility).not.toBe("hidden");
    }
  });

const viewportOf = (root: HTMLElement) =>
  (root.querySelector(".react-flow__viewport") as HTMLElement).style.transform;

/** The viewer is portaled to the body, so it is looked up there. */
const dialogNamed = (name: string) => within(document.body).findByRole("dialog", { name });
const noDialog = () =>
  waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());
const focusOn = (root: HTMLElement, id: string) =>
  waitFor(() => expect(document.activeElement).toBe(nodeEl(root, id)));

/** Closes the viewer with Escape; focus lands back on the node that opened it. */
async function closeViewer(root: HTMLElement, id: string) {
  await userEvent.keyboard("{Escape}");
  await noDialog();
  await focusOn(root, id);
}

/** What `honest-business-1` puts under the field it belongs to, per note key. */
const noteLine = (m: Messages, note: BusinessView["nodes"][number]["notes"][number]) =>
  ({
    "business.industry.awaitingTaxonomy": m.business.industry.awaitingTaxonomy,
    "business.website.notRead": m.business.website.notRead,
    "business.competitors.coloursNotRead": m.business.competitors.coloursNotRead,
  })[note];

/**
 * The view in the viewer for one node (spec rows 14, 15, 16, 19, 23): the title, the gate line on
 * Positioning, the state, each field of the engine's table in order, each answer a text node in a
 * `bdi` with its label, the notes, and the questions still to ask.
 */
async function expectViewer(
  dialog: HTMLElement,
  m: Messages,
  view: BusinessView,
  id: BusinessNodeId,
) {
  const node = viewNode(view, id);
  const d = within(dialog);
  await expect(d.getByRole("heading", { level: 2, name: nodeTitle(m, id) })).toBeVisible();
  if (node.gate) {
    await expect(dialog).toHaveAccessibleDescription(m.business.state.gate);
  } else {
    await expect(d.queryByText(m.business.state.gate)).toBeNull();
  }
  // The view draws no heading of its own: the dialog's title is the heading.
  await expect(d.getAllByRole("heading", { level: 2 })).toHaveLength(1);
  await expect(d.getByRole("region", { name: nodeTitle(m, id) })).toBeVisible();
  // Row D1: the state is a text line, and with no heading of its own it is the only line under the dialog title.
  await expectStateLine(dialog, m, node.state);
  // A project with no reading record (slice 1 and 2) says nothing of AI.
  await expect(dialog.querySelector("[data-ai-line]")).toBeNull();
  await expect(d.queryByText(m.business.label.aiUnavailable)).toBeNull();
  await expect(dialog.querySelector(".ds-section-header")).toBeNull();
  await expect(
    [...dialog.querySelectorAll("[data-field]")].map((f) => f.getAttribute("data-field")),
  ).toEqual(BUSINESS_FIELDS.filter((f) => f.node === id).map((f) => f.id));
  // Each answer exactly as typed, with its label; a field with none says skipped or nothing given.
  const given = node.fields.flatMap((f) => (f.answer === null ? [] : [f]));
  for (const f of node.fields) {
    const el = fieldOf(dialog, f.field);
    if (f.answer === null) {
      await expect(el.querySelector("bdi")).toBeNull();
      if (node.state === "skipped") await expect(textOf(el)).toContain(m.business.state.skipped);
    } else {
      await expect(el.querySelector("bdi")?.textContent).toBe(f.answer.text);
      await expect(textOf(el)).toContain(m.business.label.yourWords);
    }
  }
  await expect(d.queryAllByText(m.business.label.yourWords)).toHaveLength(given.length);
  // The notes sit with their field, last.
  for (const note of node.notes) {
    await expect(
      [...dialog.querySelectorAll("[data-field] p")]
        .map(textOf)
        .filter((t) => t === noteLine(m, note)),
    ).toHaveLength(1);
  }
  // Still to ask, in the engine's order, and no heading when there is nothing to ask.
  const asked = d.queryAllByRole("heading", { level: 3, name: m.business.stillToAsk });
  if (node.stillToAsk.length === 0) {
    await expect(asked).toHaveLength(0);
  } else {
    await expect(asked).toHaveLength(1);
    await expect([...dialog.querySelectorAll("ul li")].map(textOf)).toEqual(
      node.stillToAsk.map((q) => questionText(m, q)),
    );
  }
  // Nothing from a person became a link, an image or markup.
  await expect(dialog.querySelectorAll("a, img, script, b")).toHaveLength(0);
  // Fields 24 px apart.
  const fields = [...dialog.querySelectorAll<HTMLElement>("[data-field]")];
  for (let i = 1; i < fields.length; i++) {
    const gap =
      (fields[i] as HTMLElement).getBoundingClientRect().top -
      (fields[i - 1] as HTMLElement).getBoundingClientRect().bottom;
    await expect(Math.abs(gap - 24)).toBeLessThanOrEqual(0.5);
  }
}

/** Opens one node by click, reads its view, and closes it again. */
async function readNode(root: HTMLElement, m: Messages, view: BusinessView, id: BusinessNodeId) {
  await userEvent.click(nodeEl(root, id));
  const dialog = await dialogNamed(nodeTitle(m, id));
  await expect(within(document.body).getAllByRole("dialog")).toHaveLength(1);
  await expectViewer(dialog, m, view, id);
  await closeViewer(root, id);
}

// ----- access (row 7) -----

/** No database set up: the heading and the line, no board (spec row 7). */
export const NotConfigured: Story = {
  args: { access: "not-configured", view: undefined },
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, th, th.business.list.heading, "not-configured");
    await expect(canvasElement.querySelector(".react-flow")).toBeNull();
  },
};

export const NotConfiguredEnglish: Story = {
  args: { access: "not-configured", view: undefined },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectAccessScreen(canvasElement, en, en.business.list.heading, "not-configured");
  },
};

/** Rows D1 and D2: the node's state is a text line carrying `data-node-state`, never a badge. */
async function expectStateLine(
  node: HTMLElement,
  m: Messages,
  state: BusinessView["nodes"][number]["state"],
) {
  await expect(node.querySelector(".ds-badge")).toBeNull();
  const line = node.querySelector<HTMLElement>("[data-node-state]");
  await expect(line).not.toBeNull();
  await expect(line?.getAttribute("data-node-state")).toBe(state);
  await expect(textOf(line as HTMLElement)).toBe(m.business.state[state]);
}

// ----- the board (rows 22, 23, 25) -----

const W2 = [
  "situation>business-core",
  "situation>audience",
  "situation>competitive-frame",
  "business-core>positioning",
  "audience>positioning",
  "competitive-frame>positioning",
];

/** The header, the five nodes at rest, the six edges and the dock (spec row 22). */
async function expectBoard(
  canvasElement: HTMLElement,
  m: Messages,
  view: BusinessView,
  saved: RegExp,
) {
  const canvas = within(canvasElement);
  await boardReady(canvasElement);
  await expect(canvas.getByRole("heading", { level: 1, name: view.projectName })).toBeVisible();
  const lede = canvas.getByText(m.business.board.lede);
  await expect(lede).toBeVisible();
  await expect(textOf(canvasElement)).toMatch(saved);
  await expect(canvas.getByRole("link", { name: m.business.list.heading })).toHaveAttribute(
    "href",
    "/business",
  );
  await expect(canvasElement.querySelector("main")).toBeNull();
  await expect(canvasElement.querySelector(".ds-alert")).toBeNull();
  // The board region has its own name, and the lede comes before it.
  const region = canvas.getByRole("region", { name: m.business.board.label });
  await expect(region.getAttribute("data-variant")).toBe("present");
  await expect(
    lede.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  // Five nodes titled as the catalog says, in fill order, each named "title, kind" and opening a view.
  const nodes = [...canvasElement.querySelectorAll<HTMLElement>(".react-flow__node")];
  await expect(nodes.map((n) => n.dataset["id"])).toEqual([...BUSINESS_NODES]);
  for (const id of BUSINESS_NODES) {
    const el = nodeEl(canvasElement, id);
    await expect(el).toHaveAccessibleName(nodeNamed(m, id));
    await expect(el).toHaveAttribute("aria-haspopup", "dialog");
    await expect(textOf(el.querySelector(".ds-node__title") as HTMLElement)).toBe(nodeTitle(m, id));
    // The title row ends with the open glyph and has no page count (spec row 23).
    await expect(el.querySelector(".ds-node__open")).toBeVisible();
    await expect(el.querySelector(".ds-node__pages")).toBeNull();
    await expect(getComputedStyle(el.querySelector(".ds-node") as Element).cursor).toBe("zoom-in");
  }
  // The card at rest: the state, the names of the fields, never an answer or a reading.
  for (const id of BUSINESS_NODES) {
    const node = viewNode(view, id);
    const card = nodeEl(canvasElement, id).querySelector(".ds-node") as HTMLElement;
    await expectStateLine(card, m, node.state);
    await expect([...card.querySelectorAll(".ds-node__body ul li")].map(textOf)).toEqual(
      BUSINESS_FIELDS.filter((f) => f.node === id).map((f) => fieldLabel(m, f.id)),
    );
    await expect(textOf(card).includes(m.business.state.gate)).toBe(id === "positioning");
    await expect(card.querySelector("bdi")).toBeNull();
  }
  for (const f of answersOf(view)) {
    await expect(textOf(region)).not.toContain(f.answer?.text ?? "");
  }
  // Exactly the six edges of W2, and the dock says view only.
  const edges = [...canvasElement.querySelectorAll<HTMLElement>(".react-flow__edge")].map((e) => {
    const [, source, , target] = (e.dataset["id"] ?? "").split(":");
    return `${source}>${target}`;
  });
  await expect(edges).toEqual(W2);
  // The word sits in the dock; the board's own corner badge steps aside so it is said once.
  const mode = canvasElement.querySelector<HTMLElement>(".ds-controls__mode") as HTMLElement;
  await expect(mode).toBeVisible();
  await expect(textOf(mode)).toBe(m.board.readOnly);
  await expect(
    getComputedStyle(canvasElement.querySelector(".ds-board__mode") as Element).display,
  ).toBe("none");
  // Cards clear of the next label at the fit zoom and at the dock's 100 percent.
  await expectCardsClear(canvasElement);
  await userEvent.click(
    canvasElement.querySelector('[data-command="board.zoom-100"]') as HTMLElement,
  );
  await waitFor(() => expect(zoomOf(canvasElement)).toBeCloseTo(1, 3));
  await expectCardsClear(canvasElement);
  await expectStateAlignment(canvasElement);
  await userEvent.click(
    canvasElement.querySelector('[data-command="board.zoom-to-fit"]') as HTMLElement,
  );
  // The fit animates; the gestures below start from where it comes to rest.
  await settled(canvasElement);
  // Nothing can be dragged or connected.
  await expect(canvasElement.querySelectorAll(".react-flow__node.draggable")).toHaveLength(0);
  await expect(canvasElement.querySelectorAll(".react-flow__handle.connectable")).toHaveLength(0);
}

/** Waits until the viewport stops moving: the same transform on two reads in a row. */
async function settled(root: HTMLElement) {
  let last = "";
  await waitFor(() => {
    const now = viewportOf(root);
    const rested = now === last;
    last = now;
    expect(rested).toBe(true);
  });
}

/** The screen zoom of the board's viewport, read from its transform. */
const zoomOf = (root: HTMLElement) =>
  new DOMMatrix(getComputedStyle(root.querySelector(".react-flow__viewport") as Element).transform)
    .a;

/**
 * Row D2: on every card the state's ink starts where the first field name starts (within 1 px), and
 * the field list sits 8 under the state line. Measured at the zoom the board is at, in world px.
 */
async function expectStateAlignment(root: HTMLElement) {
  const zoom = zoomOf(root);
  for (const id of BUSINESS_NODES) {
    const card = nodeEl(root, id).querySelector(".ds-node") as HTMLElement;
    const line = card.querySelector<HTMLElement>("[data-node-state]") as HTMLElement;
    const first = card.querySelector<HTMLElement>(".ds-node__body ul li") as HTMLElement;
    const list = first.parentElement as HTMLElement;
    const ink = (el: HTMLElement) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().left;
    };
    await expect(Math.abs(ink(line) - ink(first)) / zoom).toBeLessThanOrEqual(1);
    await expect(
      Math.abs((list.getBoundingClientRect().top - line.getBoundingClientRect().bottom) / zoom - 8),
    ).toBeLessThanOrEqual(1);
  }
}

/**
 * Down column 2, from each card's bottom to the next node's label top is at least 40 screen pixels
 * (design 6.3), measured from the rendered boxes at the zoom the board is at.
 */
async function expectCardsClear(root: HTMLElement) {
  const column = ["business-core", "audience", "competitive-frame"] as const;
  const gaps: number[] = [];
  for (let i = 1; i < column.length; i++) {
    const above = nodeEl(root, column[i - 1] as string).querySelector(".ds-node") as HTMLElement;
    const label = nodeEl(root, column[i] as string).querySelector(".ds-node__label") as HTMLElement;
    gaps.push(label.getBoundingClientRect().top - above.getBoundingClientRect().bottom);
  }
  for (const gap of gaps) await expect(gap).toBeGreaterThanOrEqual(40);
}

/**
 * Click, Tab, Enter, Space and Escape (spec row 23): each gesture opens exactly one view of that
 * node, Escape closes it, focus comes back to the node, and the viewport never moves.
 */
async function expectGestures(canvasElement: HTMLElement, m: Messages, view: BusinessView) {
  const before = viewportOf(canvasElement);
  await userEvent.click(nodeEl(canvasElement, "situation"));
  const first = await dialogNamed(nodeTitle(m, "situation"));
  await expectViewer(first, m, view, "situation");
  await closeViewer(canvasElement, "situation");
  // Tab goes to the next node in fill order, with a visible focus.
  await userEvent.tab();
  await focusOn(canvasElement, "business-core");
  await expect((document.activeElement as HTMLElement).matches(":focus-visible")).toBe(true);
  await userEvent.keyboard("{Enter}");
  await dialogNamed(nodeTitle(m, "business-core"));
  await expect(within(document.body).getAllByRole("dialog")).toHaveLength(1);
  await closeViewer(canvasElement, "business-core");
  await userEvent.keyboard(" ");
  await dialogNamed(nodeTitle(m, "business-core"));
  await expect(within(document.body).getAllByRole("dialog")).toHaveLength(1);
  await closeViewer(canvasElement, "business-core");
  await expect(viewportOf(canvasElement)).toBe(before);
}

/** Tab reaches each node in fill order, then the dock, each with a visible focus (spec row 25). */
async function expectTabOrder(canvasElement: HTMLElement) {
  (nodeEl(canvasElement, BUSINESS_NODES[0]) as HTMLElement).focus();
  await focusOn(canvasElement, BUSINESS_NODES[0]);
  const seen: string[] = [BUSINESS_NODES[0]];
  for (let i = 1; i < BUSINESS_NODES.length; i++) {
    await userEvent.tab();
    const active = document.activeElement as HTMLElement;
    await expect(active.matches(":focus-visible")).toBe(true);
    seen.push(active.dataset["id"] ?? "");
  }
  await expect(seen).toEqual([...BUSINESS_NODES]);
  const dock = canvasElement.querySelector(".ds-controls") as HTMLElement;
  const buttons = [...dock.querySelectorAll<HTMLElement>("button")];
  await expect(buttons.length).toBeGreaterThan(0);
  (buttons[0] as HTMLElement).focus();
  await expect(document.activeElement).toBe(buttons[0]);
}

const SAVED_TH = /บันทึกเมื่อ .*2569.*10:15/;
const SAVED_EN = /Saved .*Nov 18, 2026.*10:15/;

/** A saved Thai project on the present board: five nodes, six edges, the dock, the gestures (rows 22, 23, 25). */
export const Board: Story = {
  play: async ({ canvasElement }) => {
    await expectBoard(canvasElement, th, THAI_VIEW, SAVED_TH);
    await expectGestures(canvasElement, th, THAI_VIEW);
    await expectTabOrder(canvasElement);
  },
};

/** The same board in English with an English project. */
export const BoardEnglish: Story = {
  args: { view: ENGLISH_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectBoard(canvasElement, en, ENGLISH_VIEW, SAVED_EN);
    await expectGestures(canvasElement, en, ENGLISH_VIEW);
    await expectTabOrder(canvasElement);
  },
};

/** The Thai project read in English: the page's words change, the person's Thai answers stay as typed (row 19). */
export const BoardOtherLanguage: Story = {
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await expectBoard(canvasElement, en, THAI_VIEW, SAVED_EN);
    await readNode(canvasElement, en, THAI_VIEW, "situation");
  },
};

// ----- the viewer for every node (rows 14, 15, 23) -----

/** Opens each of the five nodes and reads its view: the person's words, their labels, the notes, the questions. */
async function viewersPlay(canvasElement: HTMLElement, m: Messages, view: BusinessView) {
  await boardReady(canvasElement);
  for (const id of BUSINESS_NODES) await readNode(canvasElement, m, view, id);
}

/** Every node's view, Thai project. A full intake leaves every node not confirmed. */
export const Viewers: Story = {
  play: async ({ canvasElement }) => {
    await viewersPlay(canvasElement, th, THAI_VIEW);
    // Row 15 in the viewer: the labels sit with their fields, and no address is a link.
    await userEvent.click(nodeEl(canvasElement, "situation"));
    const dialog = await dialogNamed(th.business.node.situation);
    await expect(textOf(fieldOf(dialog, "situation.industry"))).toContain(
      th.business.industry.awaitingTaxonomy,
    );
    await expect(textOf(fieldOf(dialog, "situation.website"))).toContain(
      th.business.website.notRead,
    );
    await expect(textOf(fieldOf(dialog, "situation.name"))).toContain(th.business.state.empty);
    await closeViewer(canvasElement, "situation");
    await userEvent.click(nodeEl(canvasElement, "competitive-frame"));
    const frame = await dialogNamed(th.business.node.competitiveFrame);
    await expect(
      fieldOf(frame, "competitive-frame.alternatives").lastElementChild?.textContent,
    ).toBe(th.business.competitors.coloursNotRead);
    // The category is read by a model only, so no answer fills it: nothing given, never skipped.
    const category = textOf(fieldOf(frame, "competitive-frame.category"));
    await expect(category).toContain(th.business.state.empty);
    await expect(category).not.toContain(th.business.state.skipped);
    await closeViewer(canvasElement, "competitive-frame");
    // Positioning keeps its gate line as the dialog's description.
    await userEvent.click(nodeEl(canvasElement, "positioning"));
    const positioning = await dialogNamed(th.business.node.positioning);
    await expect(positioning).toHaveAccessibleDescription(th.business.state.gate);
    await closeViewer(canvasElement, "positioning");
  },
};

export const ViewersEnglish: Story = {
  args: { view: ENGLISH_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await viewersPlay(canvasElement, en, ENGLISH_VIEW);
  },
};

// ----- the viewer at two window sizes (design 6.3) -----

/**
 * Runs `check` with the browser at `width` by `height`, then puts the size back. The viewer is as
 * large as the window and Vitest's browser iframe is 1200 by 900, so the size is set, not assumed.
 * The static Storybook has no `vitest/browser`; there the window is the size the toolbar chose.
 */
async function atWindow(width: number, height: number, check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (w: number, h: number) => {
    await page.viewport(w, h);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([w, h]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(width, height);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

/** Opens one node and reads where the viewer's parts sit; focus starts on the scroll region. */
async function viewerAt(
  canvasElement: HTMLElement,
  m: Messages,
  id: BusinessNodeId,
  check: (parts: {
    dialog: HTMLElement;
    region: HTMLElement;
    fields: HTMLElement;
    asked: HTMLElement | null;
  }) => Promise<void>,
) {
  await boardReady(canvasElement);
  await userEvent.click(nodeEl(canvasElement, id));
  const dialog = await dialogNamed(nodeTitle(m, id));
  const region = within(dialog).getByRole("region", { name: nodeTitle(m, id) });
  // On open, focus is on the scroll region so the arrow keys scroll the view.
  await waitFor(() => expect(document.activeElement).toBe(region));
  const fields = dialog.querySelector("[data-field]")?.parentElement?.parentElement as HTMLElement;
  const asked =
    [...dialog.querySelectorAll<HTMLElement>("h3")].find((h) => textOf(h) === m.business.stillToAsk)
      ?.parentElement ?? null;
  await check({ dialog, region, fields, asked });
  await closeViewer(canvasElement, id);
}

/** At 1440 by 900 the panel is the window less 16 on each side, and the questions take a second column. */
export const ViewerAt1440: Story = {
  play: async ({ canvasElement }) => {
    await atWindow(1440, 900, async () => {
      await viewerAt(
        canvasElement,
        th,
        "business-core",
        async ({ dialog, region, fields, asked }) => {
          const box = dialog.getBoundingClientRect();
          await expect(box.width).toBeCloseTo(1440 - 32, 0);
          await expect(box.height).toBeCloseTo(900 - 32, 0);
          await expect(asked).not.toBeNull();
          const a = (asked as HTMLElement).getBoundingClientRect();
          const f = fields.getBoundingClientRect();
          // Two columns, each with one start edge, the questions top aligned with the state.
          await expect(a.left).toBeGreaterThan(f.right);
          await expect(Math.abs(a.top - f.top)).toBeLessThanOrEqual(0.5);
          await expect(f.width).toBeLessThanOrEqual(42 * 16 + 0.5);
          await expect(a.width).toBeLessThanOrEqual(20 * 16 + 0.5);
          await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
        },
      );
    });
  },
};

/** At 360 by 760 the view is one column, the long answers scroll in the region, nothing runs sideways. */
export const ViewerAt360: Story = {
  args: { view: NARROW_VIEW },
  play: async ({ canvasElement }) => {
    await atWindow(360, 760, async () => {
      await viewerAt(canvasElement, th, "situation", async ({ dialog, region }) => {
        const box = dialog.getBoundingClientRect();
        await expect(box.left).toBeGreaterThanOrEqual(0);
        await expect(box.right).toBeLessThanOrEqual(360);
        await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
        for (const el of dialog.querySelectorAll<HTMLElement>("[data-field], bdi")) {
          await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
        }
        // The region is the scroller and a Tab stop, so the keyboard can scroll it.
        await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
        await expect(region.tabIndex).toBe(0);
        region.scrollTop = 40;
        await expect(region.scrollTop).toBeGreaterThan(0);
      });
      await viewerAt(canvasElement, th, "business-core", async ({ fields, asked }) => {
        await expect(asked).not.toBeNull();
        // One column: the questions come under the fields, from the same start edge.
        const a = (asked as HTMLElement).getBoundingClientRect();
        const f = fields.getBoundingClientRect();
        await expect(Math.abs(a.left - f.left)).toBeLessThanOrEqual(0.5);
        await expect(a.top).toBeGreaterThanOrEqual(f.bottom);
      });
    });
  },
};

// ----- skipped (row 24) -----

async function skippedPlay(canvasElement: HTMLElement, m: Messages) {
  await boardReady(canvasElement);
  const canvas = within(canvasElement);
  const state = (id: BusinessNodeId) =>
    textOf(nodeEl(canvasElement, id).querySelector("[data-node-state]") as HTMLElement);
  for (const [i, id] of BUSINESS_NODES.entries()) {
    const shown = ["empty", "proposed", "skipped", "skipped", "skipped"] as const;
    await expectStateLine(
      nodeEl(canvasElement, id).querySelector(".ds-node") as HTMLElement,
      m,
      shown[i] as (typeof shown)[number],
    );
  }
  await expect(BUSINESS_NODES.map(state)).toEqual([
    m.business.state.empty,
    m.business.state.proposed,
    m.business.state.skipped,
    m.business.state.skipped,
    m.business.state.skipped,
  ]);
  // Positioning keeps its gate line on the card, and only Positioning.
  await expect(canvas.getAllByText(m.business.state.gate)).toHaveLength(1);
  await expect(
    nodeEl(canvasElement, "positioning").querySelector(".ds-node")?.textContent,
  ).toContain(m.business.state.gate);
  // In the viewer their fields say skipped, and the questions come in the engine's order.
  for (const id of BUSINESS_NODES) await readNode(canvasElement, m, SKIPPED_VIEW, id);
  await userEvent.click(nodeEl(canvasElement, "audience"));
  const audience = await dialogNamed(nodeTitle(m, "audience"));
  await expect([...audience.querySelectorAll("ul li")].map(textOf)).toEqual([
    m.business.question.bestCustomer,
    m.business.question.problem,
  ]);
  await closeViewer(canvasElement, "audience");
  // No industry and no website given: no label for them.
  await userEvent.click(nodeEl(canvasElement, "situation"));
  const situation = await dialogNamed(nodeTitle(m, "situation"));
  await expect(within(situation).queryByText(m.business.industry.awaitingTaxonomy)).toBeNull();
  await expect(within(situation).queryByText(m.business.website.notRead)).toBeNull();
  await closeViewer(canvasElement, "situation");
}

/** A project that gave only a name and an idea: Audience, Competitive frame and Positioning skipped (row 24). */
export const Skipped: Story = {
  args: { view: SKIPPED_VIEW },
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, th);
  },
};

export const SkippedEnglish: Story = {
  args: { view: SKIPPED_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, en);
  },
};

// ----- untrusted text (row 16) -----

async function untrustedPlay(canvasElement: HTMLElement, m: Messages) {
  await boardReady(canvasElement);
  // The name is the page's h1 as literal text, and the board holds no answer at rest.
  await expect(textOf(canvasElement.querySelector("h1") as HTMLElement)).toBe("<b>Project</b>");
  await expect(canvasElement.querySelector("h1 b")).toBeNull();
  const bdis: Array<string | null> = [];
  for (const id of BUSINESS_NODES) {
    await userEvent.click(nodeEl(canvasElement, id));
    const dialog = await dialogNamed(nodeTitle(m, id));
    bdis.push(...[...dialog.querySelectorAll("bdi")].map((b) => b.textContent));
    await expect(dialog.querySelectorAll("a, img, script, b")).toHaveLength(0);
    await closeViewer(canvasElement, id);
  }
  // Markup is literal text, each value inside its own bdi.
  await expect(bdis).toContain(UNTRUSTED.idea);
  await expect(bdis).toContain(UNTRUSTED.website);
  await expect(bdis).toContain("<a href=https://evil.example>click</a>");
  // No image, script, bold or anchor was made from it, and the website is not a link.
  await expect(canvasElement.querySelector("img")).toBeNull();
  await expect(canvasElement.querySelector("script")).toBeNull();
  await expect(canvasElement.querySelector("b")).toBeNull();
  // The only links are the way back and React Flow's own attribution; none comes from an answer.
  await expect(
    [...canvasElement.querySelectorAll("a:not(.react-flow__attribution a)")].map((a) =>
      a.getAttribute("href"),
    ),
  ).toEqual(["/business"]);
}

/** An idea of `<img ... onerror>`, a website ending in `"><script>`, a name of `<b>` tags: all literal text. */
export const UntrustedText: Story = {
  args: { view: UNTRUSTED_VIEW },
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, th);
  },
};

export const UntrustedTextEnglish: Story = {
  args: { view: UNTRUSTED_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, en);
  },
};

// ----- narrow (rows 20, 25) -----

const narrow = (view: BusinessView) => (
  <div data-narrow="" className="w-[360px] max-w-full">
    <BusinessBoardScreen access="ready" view={view} signInHref="/account" listHref="/business" />
  </div>
);

async function narrowPlay(canvasElement: HTMLElement, m: Messages) {
  await boardReady(canvasElement);
  await expectFitsAt360(canvasElement);
  // The 120-character Thai name is on the page whole, and the board sits inside the 312 px column.
  await expect(textOf(canvasElement.querySelector("h1") as HTMLElement)).toBe(LONG_NAME);
  await expect(LONG_NAME).toHaveLength(120);
  const region = within(canvasElement).getByRole("region", { name: m.business.board.label });
  await expect(region.getBoundingClientRect().width).toBeLessThanOrEqual(312.5);
  await expect(region.getBoundingClientRect().height).toBeGreaterThanOrEqual(480);
  // The map fits whole: every card inside the board, at the zoom floor or above it.
  const box = region.getBoundingClientRect();
  for (const id of BUSINESS_NODES) {
    const r = nodeEl(canvasElement, id).getBoundingClientRect();
    await expect(r.left).toBeGreaterThanOrEqual(box.left - 0.5);
    await expect(r.right).toBeLessThanOrEqual(box.right + 0.5);
    await expect(r.top).toBeGreaterThanOrEqual(box.top - 0.5);
    await expect(r.bottom).toBeLessThanOrEqual(box.bottom + 0.5);
  }
  // Keyboard only: each node in fill order, with a visible focus.
  await expectTabOrder(canvasElement);
}

export const NarrowLight: Story = {
  render: () => (
    <Under profile="neutral" mode="light">
      {narrow(NARROW_VIEW)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

export const NarrowDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      {narrow(NARROW_VIEW)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

export const NarrowEnglish: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <Under profile="neutral" mode="light">
        {narrow(NARROW_VIEW)}
      </Under>
    </LocaleProvider>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, en);
  },
};

/** The skipped project at 360 px: three skipped nodes still fit the map. */
export const NarrowSkipped: Story = {
  render: () => narrow(SKIPPED_VIEW),
  play: async ({ canvasElement }) => {
    await boardReady(canvasElement);
    await expectFitsAt360(canvasElement);
    await expect(within(canvasElement).getAllByText(th.business.state.skipped)).toHaveLength(3);
    await expect(within(canvasElement).getAllByText(th.business.state.gate)).toHaveLength(1);
  },
};

// ----- profiles and modes -----

/** One board under a profile and mode, checked by the a11y addon: one board per page keeps its name unique. */
const under = (profile: "neutral" | "professional" | "friendly", mode: "light" | "dark") => ({
  render: () => (
    <Under profile={profile} mode={mode}>
      <BusinessBoardScreen
        access="ready"
        view={THAI_VIEW}
        signInHref="/account"
        listHref="/business"
      />
    </Under>
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    await boardReady(canvasElement);
    await expect(within(canvasElement).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await userEvent.click(nodeEl(canvasElement, "positioning"));
    await dialogNamed(th.business.node.positioning);
    await closeViewer(canvasElement, "positioning");
  },
});

export const BoardDark: Story = under("neutral", "dark");
export const BoardProfessional: Story = under("professional", "light");
export const BoardFriendlyDark: Story = under("friendly", "dark");

// ----- readings and the AI labels (ORV-283, rows 31 and 33) -----

const localeOf = (m: Messages): Locale => (m === th ? "th" : "en");
/** The rect of an element's text ink: where the words start, not where the box does. */
const inkLeft = (el: Element) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().left;
};
const near = (a: number, b: number, tolerance = 1) => Math.abs(a - b) <= tolerance;

/**
 * Row 33 for one node: under each field the person's words with their label, then one list item per
 * reading, in the view's order. Each item is, top to bottom: the below-floor line when it applies,
 * the value as text in `bdi` followed by the pill that opens its quote, "Read by AI (model id)",
 * "Not confirmed yet", the confidence, and a list of the other quotes when the reading rests on more
 * than one. One "confidence numbers come from fixed rules" note ends the view, and only when a
 * reading is there.
 */
async function expectReadings(
  dialog: HTMLElement,
  m: Messages,
  view: BusinessView,
  id: BusinessNodeId,
) {
  const locale = localeOf(m);
  const node = viewNode(view, id);
  const all = node.fields.flatMap((f) => f.readings);
  await expect(dialog.querySelectorAll("[data-reading]")).toHaveLength(all.length);
  await expect(d(dialog).queryAllByText(m.business.label.confidence)).toHaveLength(
    all.length === 0 ? 0 : 1,
  );
  await expect(dialog.querySelector(".ds-badge")).toBeNull();
  await expect(dialog.querySelector("[data-ai-line]")).toBeNull();
  for (const f of node.fields) {
    const el = fieldOf(dialog, f.field);
    const items = [...el.querySelectorAll<HTMLElement>("li[data-reading]")];
    await expect(items.map((li) => li.dataset["reading"])).toEqual(
      f.readings.map((r) => r.item.id),
    );
    const label = el.querySelector("h3") as HTMLElement;
    // A reading with no answer of the person's: no "skipped" or "nothing given" beside it, no words.
    if (f.answer === null && f.readings.length > 0) {
      await expect(textOf(el)).not.toContain(m.business.state.empty);
      await expect(textOf(el)).not.toContain(m.business.state.skipped);
      await expect(textOf(el)).not.toContain(m.business.label.yourWords);
    }
    for (const [i, r] of f.readings.entries()) {
      const li = items[i] as HTMLElement;
      // The value is a text node in bdi, whatever it holds.
      await expect(li.querySelector("bdi")?.textContent).toBe(r.value);
      await expect(li.querySelector("bdi")?.children).toHaveLength(0);
      // Children, in order: the below-floor line, the fact with its pill, then three lines, then the quotes.
      const below = `${m.brandReport.engine["evidence.belowFloor"].replace("{reason}", r.quality.map((k) => m.brandReport.engine[k]).join(", "))}`;
      const lines = [
        ...(r.belowFloor ? [below] : []),
        fromModelNote(locale, r.modelId),
        m.business.state.proposed,
        fill(m.business.reading.confidence, { value: formatNumber(r.confidence, locale) }),
      ];
      await expect([...li.querySelectorAll(":scope > p")].map(textOf)).toEqual(lines);
      const order = [...li.children].map((c) =>
        c.tagName === "P" ? "p" : c.classList.contains("ds-evidence-span") ? "span" : "list",
      );
      await expect(order).toEqual([
        ...(r.belowFloor ? ["p"] : []),
        "span",
        "p",
        "p",
        "p",
        ...(r.spans.length > 1 ? ["list"] : []),
      ]);
      await expect(li.querySelectorAll(".ds-evidence-list")).toHaveLength(
        r.spans.length > 1 ? 1 : 0,
      );
      // The fact has its own pill that names the fact.
      const pill = li.querySelector<HTMLElement>(".ds-evidence-span button") as HTMLElement;
      await expect(pill).toHaveAccessibleName(`${m.evidence.trigger} ${r.value}`);
      // The saved model id is in the line, and the pill reads it as a reading by a model.
      await expect(r.modelId).toBe("anthropic/claude-sonnet-5.5");
      // One start edge: every line of a reading starts where its field's label starts.
      await expect(near(li.getBoundingClientRect().left, label.getBoundingClientRect().left)).toBe(
        true,
      );
      for (const line of li.querySelectorAll(":scope > p")) {
        await expect(near(inkLeft(line), inkLeft(label))).toBe(true);
      }
      // Readings 16 px apart.
      if (i > 0) {
        const gap =
          li.getBoundingClientRect().top -
          (items[i - 1] as HTMLElement).getBoundingClientRect().bottom;
        await expect(near(gap, 16)).toBe(true);
      }
    }
    // 12 px under the person's words and their label, never before them.
    if (f.answer !== null && f.readings.length > 0) {
      const note = [...el.querySelectorAll<HTMLElement>("p")].find(
        (p) => textOf(p) === m.business.label.yourWords,
      ) as HTMLElement;
      const list = el.querySelector("ul") as HTMLElement;
      await expect(
        near(list.getBoundingClientRect().top - note.getBoundingClientRect().bottom, 12),
      ).toBe(true);
    }
  }
  // The confidence note is the last thing of the first column, after the last field.
  if (all.length > 0) {
    const note = d(dialog).getByText(m.business.label.confidence);
    const last = [...dialog.querySelectorAll("[data-field]")].at(-1) as HTMLElement;
    await expect(
      last.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
  // Nothing from a person or a model became a link, an image or markup.
  await expect(dialog.querySelectorAll("a, img, script, b")).toHaveLength(0);
}

const d = (el: HTMLElement) => within(el);

/** The pill of a reading opens the exact words, and Escape closes them with focus back on the pill. */
async function expectQuoteCard(dialog: HTMLElement, m: Messages, view: BusinessView) {
  const reading = viewNode(view, "audience")
    .fields.flatMap((f) => f.readings)
    .find((r) => r.spans.length > 1);
  if (reading === undefined) throw new Error("fixture: a reading on two spans in Audience");
  const li = dialog.querySelector(`[data-reading="${reading.item.id}"]`) as HTMLElement;
  const pill = li.querySelector<HTMLElement>(".ds-evidence-span button") as HTMLElement;
  await userEvent.click(pill);
  const card = await within(document.body).findByRole("dialog", { name: m.evidence.cardLabel });
  // The quote is the words of the answer, as text, and the card says an AI model read it.
  await expect(card.querySelector("blockquote")?.textContent).toBe(reading.item.observation.quote);
  await expect(textOf(card)).toContain(m.evidence.sourceByModel);
  await expect(card.querySelectorAll("a, img, script")).toHaveLength(0);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(document.activeElement).toBe(pill));
  // Two spans: the list holds a count, closed, and opens to both quotes.
  const trigger = within(li).getByRole("button", {
    name: fill(m.evidence.count, { count: reading.spans.length }),
  });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect([...li.querySelectorAll(".ds-evidence-list blockquote")].map(textOf)).toEqual(
    reading.spans.map((s) => s.observation.quote),
  );
  await userEvent.click(trigger);
}

/** Opens each node of a project with readings and reads it; opens the pills on Audience. */
async function readingsPlay(canvasElement: HTMLElement, m: Messages, view: BusinessView) {
  await boardReady(canvasElement);
  // No reading is shown on the board's cards, and no Alert: the record is a model reading.
  await expect(canvasElement.querySelector(".ds-alert")).toBeNull();
  for (const r of view.nodes.flatMap((n) => n.fields).flatMap((f) => f.readings)) {
    await expect(textOf(canvasElement.querySelector(".react-flow") as HTMLElement)).not.toContain(
      r.value,
    );
  }
  for (const id of BUSINESS_NODES) {
    await userEvent.click(nodeEl(canvasElement, id));
    const dialog = await dialogNamed(nodeTitle(m, id));
    await expectStateLine(dialog, m, viewNode(view, id).state);
    await expectReadings(dialog, m, view, id);
    if (id === "audience") await expectQuoteCard(dialog, m, view);
    await closeViewer(canvasElement, id);
  }
  // A fixture value with markup shows as text, in the viewer of its node.
  const markup = MARKUP_READINGS[localeOf(m)];
  await userEvent.click(nodeEl(canvasElement, "competitive-frame"));
  const frame = await dialogNamed(nodeTitle(m, "competitive-frame"));
  await expect(fieldOf(frame, "competitive-frame.alternatives").textContent).toContain(markup);
  await expect(
    [...frame.querySelectorAll("bdi")].some(
      (b) => b.textContent === markup && b.children.length === 0,
    ),
  ).toBe(true);
  await closeViewer(canvasElement, "competitive-frame");
}

/**
 * A saved Thai project with a model reading, fixture data: the readings under Audience with the
 * person's words, one above the floor on two quotes, one below it, and a model value that holds
 * markup and shows as text. Nobody gave these answers and no model read them.
 */
export const Readings: Story = {
  args: { view: THAI_READ_VIEW },
  play: async ({ canvasElement }) => {
    await readingsPlay(canvasElement, th, THAI_READ_VIEW);
  },
};

export const ReadingsEnglish: Story = {
  args: { view: ENGLISH_READ_VIEW },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await readingsPlay(canvasElement, en, ENGLISH_READ_VIEW);
  },
};

/**
 * Row 31: a result with no reading. The Alert under the header says AI did not read, and why; the
 * viewer says it again under the state line, and shows the person's words alone.
 */
async function aiUnavailablePlay(
  canvasElement: HTMLElement,
  m: Messages,
  view: BusinessView,
  reason: BusinessReadReason,
) {
  await boardReady(canvasElement);
  const alert = canvasElement.querySelector<HTMLElement>(".ds-alert") as HTMLElement;
  await expect(alert).toBeVisible();
  await expect(alert.dataset["variant"]).toBe("info");
  await expect(alert.getAttribute("role")).toBeNull();
  await expect(alert.querySelector(".ds-alert__title")?.textContent).toBe(
    m.business.label.aiUnavailable,
  );
  await expect(alert.querySelector(".ds-alert__description")?.textContent).toBe(
    readReasonLine(m, reason),
  );
  // Row 31's lines, one per reason, in the language of the story.
  await expect(readReasonLine(m, reason)).toBe(
    {
      "ai-not-configured": m.business.errors.aiNotConfigured,
      "ai-failed": m.business.errors.aiFailed,
      "ai-rate-limited": m.business.errors.aiRateLimited,
      "ai-spend-cap": m.business.errors.aiSpendCap,
    }[reason],
  );
  // 24 px under the header, and before the board.
  const header = canvasElement.querySelector(".ds-page-header") as HTMLElement;
  await expect(
    near(alert.getBoundingClientRect().top - header.getBoundingClientRect().bottom, 24),
  ).toBe(true);
  const region = within(canvasElement).getByRole("region", { name: m.business.board.label });
  await expect(
    alert.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  // No reading anywhere on the screen, and nothing that says AI read.
  await expect(canvasElement.querySelector("[data-reading]")).toBeNull();
  for (const id of BUSINESS_NODES) {
    const node = viewNode(view, id);
    await userEvent.click(nodeEl(canvasElement, id));
    const dialog = await dialogNamed(nodeTitle(m, id));
    const state = dialog.querySelector("[data-node-state]") as HTMLElement;
    const line = dialog.querySelector<HTMLElement>("[data-ai-line]") as HTMLElement;
    await expect(textOf(line)).toBe(m.business.label.aiUnavailable);
    await expect(line.dataset["aiLine"]).toBe(reason);
    await expect(d(dialog).getAllByText(m.business.label.aiUnavailable)).toHaveLength(1);
    // Under the state line, 8 px apart, in one group; 24 px to the first field; one start edge.
    await expect(state.nextElementSibling).toBe(line);
    await expect(
      near(line.getBoundingClientRect().top - state.getBoundingClientRect().bottom, 8),
    ).toBe(true);
    const first = dialog.querySelector("[data-field]") as HTMLElement;
    await expect(
      near(first.getBoundingClientRect().top - line.getBoundingClientRect().bottom, 24),
    ).toBe(true);
    await expect(near(inkLeft(line), inkLeft(state))).toBe(true);
    // The person's words alone, each with its label; nothing read.
    await expect(dialog.querySelectorAll("[data-reading]")).toHaveLength(0);
    await expect(d(dialog).queryAllByText(m.business.label.confidence)).toHaveLength(0);
    await expect(textOf(dialog)).not.toContain(
      fromModelNote(localeOf(m), "anthropic/claude-sonnet-5.5"),
    );
    await expect(dialog.querySelector(".ds-badge")).toBeNull();
    const given = node.fields.filter((f) => f.answer !== null);
    await expect(d(dialog).queryAllByText(m.business.label.yourWords)).toHaveLength(given.length);
    for (const f of given) {
      await expect(fieldOf(dialog, f.field).querySelector("bdi")?.textContent).toBe(f.answer?.text);
    }
    await closeViewer(canvasElement, id);
  }
}

export const AiUnavailable: Story = {
  args: { view: aiUnavailableView("th", "ai-failed") },
  play: async ({ canvasElement, args }) => {
    await aiUnavailablePlay(canvasElement, th, args.view as BusinessView, "ai-failed");
  },
};

export const AiUnavailableEnglish: Story = {
  args: { view: aiUnavailableView("en", "ai-failed") },
  decorators: [inEnglish],
  play: async ({ canvasElement, args }) => {
    await aiUnavailablePlay(canvasElement, en, args.view as BusinessView, "ai-failed");
  },
};

export const AiNotConfigured: Story = {
  args: { view: aiUnavailableView("th", "ai-not-configured") },
  play: async ({ canvasElement, args }) => {
    await aiUnavailablePlay(canvasElement, th, args.view as BusinessView, "ai-not-configured");
  },
};

export const AiRateLimitedEnglish: Story = {
  args: { view: aiUnavailableView("en", "ai-rate-limited") },
  decorators: [inEnglish],
  play: async ({ canvasElement, args }) => {
    await aiUnavailablePlay(canvasElement, en, args.view as BusinessView, "ai-rate-limited");
  },
};

export const AiSpendCap: Story = {
  args: { view: aiUnavailableView("th", "ai-spend-cap") },
  play: async ({ canvasElement, args }) => {
    await aiUnavailablePlay(canvasElement, th, args.view as BusinessView, "ai-spend-cap");
  },
};
