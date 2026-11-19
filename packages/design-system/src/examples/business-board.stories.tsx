import {
  BUSINESS_FIELDS,
  BUSINESS_NODES,
  type BusinessNodeId,
  type BusinessReadReason,
  type BusinessView,
} from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Under } from "../components/matrix";
import {
  expectFocusBorderForm,
  expectInkClearsAbove,
  expectNoGlyphClip,
  expectPortPillsClear,
  expectSameHeight,
  inVitest,
} from "../testing/visual-asserts";
import { formatNumber } from "../i18n/format";
import { LocaleProvider } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";
import { BusinessBoardScreen } from "./business-board";
import type { ChoiceRequest } from "./business-node-view";
import {
  aiUnavailableView,
  ENGLISH_READ_VIEW,
  ENGLISH_VIEW,
  LONG_NAME,
  NARROW_VIEW,
  HOSTILE_STATEMENT,
  MARKUP_READINGS,
  POSITIONING_STATEMENTS,
  POSITIONING_VIEWS,
  positioningAfter,
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
  FIXTURE_NOTES,
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
    (Story, { parameters }) => (
      <>
        <FixtureNote readings={parameters["fixtureReadings"] === true} />
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
  // These views have no controls and no statement, so Positioning has no statement section (row F1-a).
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

/** Row D8: one fixture note at the top of the story, of the kind the story is. */
async function expectFixtureNote(root: HTMLElement, kind: "answers" | "readings") {
  const notes = root.querySelectorAll("[data-fixture-note]");
  await expect(notes).toHaveLength(1);
  const note = notes[0] as HTMLElement;
  await expect(note.dataset["fixtureNote"]).toBe(kind);
  await expect(Object.values(FIXTURE_NOTES[kind])).toContain(textOf(note));
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
  await expectFixtureNote(canvasElement, "answers");
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
    await expect([...card.querySelectorAll(".ds-node__body ul li")].map(textOf)).toEqual([
      ...BUSINESS_FIELDS.filter((f) => f.node === id).map((f) => fieldLabel(m, f.id)),
      ...(id === "positioning" ? [m.business.field.statement] : []),
    ]);
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
  await expectPortPills(canvasElement, BUSINESS_NODES);
  await userEvent.click(
    canvasElement.querySelector('[data-command="board.zoom-100"]') as HTMLElement,
  );
  await waitFor(() => expect(zoomOf(canvasElement)).toBeCloseTo(1, 3));
  await expectCardsClear(canvasElement);
  await expectStateAlignment(canvasElement);
  await expectPortPills(canvasElement, ["positioning"]);
  await userEvent.click(
    canvasElement.querySelector('[data-command="board.zoom-to-fit"]') as HTMLElement,
  );
  // The fit animates; the gestures below start from where it comes to rest.
  await settled(canvasElement);
  // Nothing can be dragged or connected.
  await expect(canvasElement.querySelectorAll(".react-flow__node.draggable")).toHaveLength(0);
  await expect(canvasElement.querySelectorAll(".react-flow__handle.connectable")).toHaveLength(0);
}

/**
 * Row D4: each node, focused in turn (the way `NodePort` `PresentNames` does), shows its port name
 * pills, and they keep clear of one another and of every other node. Measured at the zoom the board
 * is at. A pill outside the board's frame is not read, and at zoom 1 the board shows only part of the
 * world, so `whole` names the nodes whose every pill must be read: all five at the fit zoom, and at
 * zoom 1 Positioning, the node with three pills on one edge.
 */
async function expectPortPills(root: HTMLElement, whole: readonly BusinessNodeId[]) {
  for (const id of BUSINESS_NODES) {
    const el = nodeEl(root, id);
    await waitFor(() => {
      el.focus({ preventScroll: true });
      expect(el).toHaveFocus();
      expect(el.matches(":focus-visible"), `${id} has a keyboard focus`).toBe(true);
      const pills = [...el.querySelectorAll<HTMLElement>(".ds-port__label")];
      expect(pills.length).toBeGreaterThan(0);
      for (const pill of pills) expect(getComputedStyle(pill).visibility).toBe("visible");
    });
    await settled(root);
    const read = expectPortPillsClear(el);
    if (whole.includes(id)) {
      await expect(read, `every port pill of ${id} is read`).toBe(
        el.querySelectorAll(".ds-port__label").length,
      );
    }
    el.blur();
  }
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
  // Row 25 (R1 of ORV-282-pr216-review-1): Tab goes on to the dock. React Flow's attribution link may
  // come first, so Tab is pressed until focus is inside the dock, and a broken order fails at the bound.
  const dock = canvasElement.querySelector(".ds-controls") as HTMLElement;
  let reached: HTMLElement | null = null;
  for (let presses = 0; presses < 6 && reached === null; presses++) {
    await userEvent.tab();
    const active = document.activeElement as HTMLElement;
    if (dock.contains(active)) reached = active;
  }
  await expect(
    reached,
    "Tab reaches the dock within 6 presses after the five nodes",
  ).not.toBeNull();
  await expect((reached as HTMLElement).matches(".ds-controls button")).toBe(true);
  await expect((reached as HTMLElement).matches(":focus-visible")).toBe(true);
}

/**
 * Row F1-a (state S0): a board with no controls and no statement shows the Positioning viewer as
 * develop does, with no statement section and no bare heading.
 */
async function expectNoStatementSection(root: HTMLElement, m: Messages) {
  await userEvent.click(nodeEl(root, "positioning"));
  const dialog = await dialogNamed(nodeTitle(m, "positioning"));
  await expect(dialog.querySelector('[data-field="positioning.statement"]')).toBeNull();
  await expect(
    [...dialog.querySelectorAll("*")].filter((el) => textOf(el) === m.business.field.statement),
  ).toHaveLength(0);
  await closeViewer(root, "positioning");
}

const SAVED_TH = /บันทึกเมื่อ .*2569.*10:15/;
const SAVED_EN = /Saved .*Nov 18, 2026.*10:15/;

/** A saved Thai project on the present board: five nodes, six edges, the dock, the gestures (rows 22, 23, 25). */
export const Board: Story = {
  play: async ({ canvasElement }) => {
    await expectBoard(canvasElement, th, THAI_VIEW, SAVED_TH);
    await expectGestures(canvasElement, th, THAI_VIEW);
    await expectTabOrder(canvasElement);
    await expectNoStatementSection(canvasElement, th);
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
    await expectNoStatementSection(canvasElement, en);
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

/**
 * Row D3: Radix draws the vertical bar over the viewport, so the view keeps an end gutter of the bar
 * plus 8. The text's ink is at least 4 from the bar's left edge and the view's box at least 8.
 */
async function expectClearOfBar(dialog: HTMLElement, region: HTMLElement) {
  // Radix mounts the bar after it has measured the overflow.
  let bar: HTMLElement | null | undefined = null;
  await waitFor(() => {
    bar = region.parentElement?.querySelector<HTMLElement>(
      '.ds-scroll__bar[data-orientation="vertical"]',
    );
    expect(bar).not.toBeNull();
  });
  const barBox = (bar as unknown as HTMLElement).getBoundingClientRect();
  await expect(barBox.width).toBeGreaterThan(0);
  const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
  let inked = 0;
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) {
      inked++;
      await expect(rect.right).toBeLessThanOrEqual(barBox.left - 4 + 0.5);
    }
  }
  await expect(inked).toBeGreaterThan(0);
  const view = dialog.querySelector<HTMLElement>("[data-node]") as HTMLElement;
  await expect(view.getBoundingClientRect().right).toBeLessThanOrEqual(barBox.left - 8 + 0.5);
}

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
        region.scrollTop = 0;
        await expectClearOfBar(dialog, region);
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
 * Row D7: in every field with readings, each of the field's own lines (the person's words, their
 * label, the notes) comes before the readings list; the list sits 12 under the last of them when
 * there is one; a note is never after a reading and sits 4 under the `yourWords` line when there is
 * an answer. The note wraps to two lines in English at 360, and the gap holds at every line count.
 */
async function expectNoteBeforeReadings(
  dialog: HTMLElement,
  m: Messages,
  view: BusinessView,
  id: BusinessNodeId,
) {
  const node = viewNode(view, id);
  for (const f of node.fields) {
    if (f.readings.length === 0) continue;
    const el = fieldOf(dialog, f.field);
    const list = el.querySelector("ul") as HTMLElement;
    const lines = [...el.querySelectorAll<HTMLElement>(":scope > p")];
    for (const p of lines) {
      await expect(p.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    const last = lines.at(-1);
    if (last !== undefined) {
      await expect(
        near(list.getBoundingClientRect().top - last.getBoundingClientRect().bottom, 12),
      ).toBe(true);
    }
    const hasNote = lines.some((p) => node.notes.some((note) => textOf(p) === noteLine(m, note)));
    await expect(f.answer !== null || hasNote).toBe(last !== undefined);
  }
  for (const note of node.notes) {
    const line = [...dialog.querySelectorAll<HTMLElement>("[data-field] p")].find(
      (p) => textOf(p) === noteLine(m, note),
    );
    const field = line?.closest<HTMLElement>("[data-field]");
    if (line === undefined || field === null || field === undefined) continue;
    const items = [...field.querySelectorAll<HTMLElement>("li[data-reading]")];
    if (items.length === 0) continue;
    for (const li of items) {
      await expect(
        line.compareDocumentPosition(li) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    const words = [...field.querySelectorAll<HTMLElement>(":scope > p")].find(
      (p) => textOf(p) === m.business.label.yourWords,
    );
    if (words !== undefined) {
      await expect(
        near(line.getBoundingClientRect().top - words.getBoundingClientRect().bottom, 4),
      ).toBe(true);
    }
    // The note's ink starts where the field's label does.
    await expect(near(inkLeft(line), inkLeft(field.querySelector("h3") as HTMLElement))).toBe(true);
  }
}

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
    // Row D7: the field's notes before its readings, the list 12 under the line above it.
    await expectNoteBeforeReadings(dialog, m, view, id);
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
  // Row D6: each quote row of the list says what the pill card says, an AI model read it.
  await expect(
    [...li.querySelectorAll(".ds-evidence-list .ds-evidence-quote__meta")].map(textOf),
  ).toEqual(reading.spans.map(() => m.evidence.sourceByModel));
  await userEvent.click(trigger);
}

/** Opens each node of a project with readings and reads it; opens the pills on Audience. */
async function readingsPlay(canvasElement: HTMLElement, m: Messages, view: BusinessView) {
  await boardReady(canvasElement);
  await expectFixtureNote(canvasElement, "readings");
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
  parameters: { fixtureReadings: true },
  play: async ({ canvasElement }) => {
    await readingsPlay(canvasElement, th, THAI_READ_VIEW);
  },
};

export const ReadingsEnglish: Story = {
  args: { view: ENGLISH_READ_VIEW },
  parameters: { fixtureReadings: true },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await readingsPlay(canvasElement, en, ENGLISH_READ_VIEW);
  },
};

/**
 * Row D3 for the readings: at a 360 window every node of a project with readings keeps its text
 * (values, quotes, the below-floor line, the evidence list opened) clear of the scroll bar, and the
 * region does not run sideways. The 760 window is the story size; at 480 the viewer is the shortest
 * the layout allows, so every node with a reading scrolls and has a bar to clear.
 */
async function readingsAt360Play(canvasElement: HTMLElement, m: Messages, view: BusinessView) {
  await expectFixtureNote(canvasElement, "readings");
  for (const height of [760, 480]) {
    await atWindow(360, height, async () => {
      let barred = 0;
      for (const id of BUSINESS_NODES) {
        await viewerAt(canvasElement, m, id, async ({ dialog, region }) => {
          const readings = viewNode(view, id).fields.flatMap((f) => f.readings);
          // Open every evidence list so the quotes of a reading on two spans are in the view too.
          for (const trigger of dialog.querySelectorAll<HTMLElement>(
            ".ds-evidence-list button[aria-expanded='false']",
          )) {
            await userEvent.click(trigger);
          }
          // Row D7: the order and the gap hold where the note wraps to a second line.
          await expectNoteBeforeReadings(dialog, m, view, id);
          // Row D6: every quote row of an opened list says an AI model read it, none says rules did.
          const sources = [
            ...dialog.querySelectorAll("li[data-reading] .ds-evidence-quote__meta"),
          ].map(textOf);
          await expect(sources.filter((t) => t === m.evidence.sourceByRule)).toHaveLength(0);
          await expect(sources.filter((t) => t === m.evidence.sourceByModel)).toHaveLength(
            readings.filter((r) => r.spans.length > 1).reduce((n, r) => n + r.spans.length, 0),
          );
          await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
          await expect(dialog.querySelectorAll("[data-reading]")).toHaveLength(readings.length);
          // A node that fits the window has no bar to clear; a node with readings must scroll at 480.
          if (region.scrollHeight > region.clientHeight) {
            await expectClearOfBar(dialog, region);
            barred++;
          } else {
            await expect(height === 480 && readings.length > 0).toBe(false);
          }
          for (const el of dialog.querySelectorAll<HTMLElement>(
            "[data-reading], blockquote, bdi",
          )) {
            await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(
              dialog.getBoundingClientRect().right + 0.5,
            );
          }
        });
      }
      await expect(barred).toBeGreaterThan(0);
    });
  }
  // The project holds a reading below the floor and one on two quotes, so the probe saw them.
  const all = view.nodes.flatMap((n) => n.fields).flatMap((f) => f.readings);
  await expect(all.some((r) => r.belowFloor)).toBe(true);
  await expect(all.some((r) => r.spans.length > 1)).toBe(true);
}

export const ReadingsAt360: Story = {
  args: { view: THAI_READ_VIEW },
  parameters: { fixtureReadings: true },
  play: async ({ canvasElement }) => {
    await readingsAt360Play(canvasElement, th, THAI_READ_VIEW);
  },
};

export const ReadingsAt360English: Story = {
  args: { view: ENGLISH_READ_VIEW },
  parameters: { fixtureReadings: true },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await readingsAt360Play(canvasElement, en, ENGLISH_READ_VIEW);
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

// ----- the positioning gate (ORV-285, PR 1, rows 2 to 5, 7, 8 and 10) -----

/** What the stub action answers: saved, or a line the page would have resolved from `saved.errors.*`. */
type StubResult = { ok: true } | { ok: false; failure: string };
/** Shared by every story below; each play resets it first. */
const choose = fn<(choice: ChoiceRequest) => Promise<StubResult>>();

/** Story-only copy: the lines `saved.errors.rate-limited` gives for a 20 minute wait (apps/web catalog). */
const RATE_LIMITED = {
  th: "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที",
  en: "Too many requests in a short time, so this was not done. Try again in 20 minutes.",
} as const;

/**
 * What the page does around the screen, with a stub action in place of the server: it holds the
 * view, runs the action while `pending` is set, and builds the view again from the same engine
 * function once the action has saved. Nothing is saved anywhere.
 */
function GateHost({ locale, initial }: { locale: Lang; initial: BusinessView }) {
  const [view, setView] = useState(initial);
  const [pending, setPending] = useState<"saving" | null>(null);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const onChoose = (choice: ChoiceRequest) => {
    if (choice.kind !== "written" && choice.kind !== "skipped") return;
    setPending("saving");
    setFailure(undefined);
    void choose(choice).then((result) => {
      if (result.ok) setView(positioningAfter(locale, choice));
      else setFailure(result.failure);
      setPending(null);
    });
  };
  return (
    <BusinessBoardScreen
      access="ready"
      view={view}
      signInHref="/account"
      listHref="/business"
      positioning={{ pending, failure, onChoose, onDismiss: () => setFailure(undefined) }}
    />
  );
}

const hosted = (locale: Lang, initial: BusinessView) => () => (
  <GateHost locale={locale} initial={initial} />
);

const positioningOf = (root: HTMLElement, m: Messages) =>
  (async () => {
    await boardReady(root);
    await userEvent.click(nodeEl(root, "positioning"));
    return dialogNamed(nodeTitle(m, "positioning"));
  })();
const sectionOf = (dialog: HTMLElement) => fieldOf(dialog, "positioning.statement");
const sectionButtons = (section: HTMLElement) => [
  ...section.querySelectorAll<HTMLButtonElement>("button"),
];
const stateLineOf = (dialog: HTMLElement) =>
  dialog.querySelector<HTMLElement>("[data-node-state]") as HTMLElement;
/** The statement and the line under it, the two paragraphs of the person's decision. */
const statementOf = (section: HTMLElement) =>
  section.querySelector<HTMLElement>("p.whitespace-pre-wrap");
/** The line of failure under the controls, empty when nothing failed. */
const alertOf = (section: HTMLElement) => section.querySelector('[role="alert"]') as HTMLElement;
const buttonOf = (section: HTMLElement, name: string) =>
  within(section).getByRole("button", { name });
const textbox = (section: HTMLElement, name: string) =>
  within(section).getByRole("textbox", { name }) as HTMLTextAreaElement;
const focusedIs = (el: Element) => waitFor(() => expect(document.activeElement).toBe(el));

/** Resets the stub to answer saved, and returns the ready `choose` spy. */
function stubSaves() {
  choose.mockReset();
  choose.mockImplementation(async () => ({ ok: true }));
}

// ----- row 5: the four states on the card and in the view -----

type StateKind = "open" | "valueEmpty" | "skipped" | "agreed";

/** The card and the view for each stored state (`positioning-gate-1`), and the card's measured height. */
const STATES: Record<
  StateKind,
  {
    state: "proposed" | "skipped" | "agreed";
    line: "gate" | "gatePassed";
    buttons: string[];
    height: number;
  }
> = {
  open: { state: "proposed", line: "gate", buttons: ["writeOwn", "skip"], height: 172.98 },
  valueEmpty: { state: "skipped", line: "gate", buttons: ["writeOwn", "skip"], height: 172.98 },
  skipped: { state: "skipped", line: "gate", buttons: ["writeOwn"], height: 172.98 },
  agreed: { state: "agreed", line: "gatePassed", buttons: [], height: 149.19 },
};

async function statesPlay(canvasElement: HTMLElement, m: Messages, kind: StateKind) {
  const want = STATES[kind];
  const lang = langOf(m);
  const view = POSITIONING_VIEWS[lang][kind];
  await boardReady(canvasElement);
  // The card: the state line, the statement label as the last field, the gate line last.
  const card = nodeEl(canvasElement, "positioning").querySelector(".ds-node") as HTMLElement;
  await expectStateLine(card, m, want.state);
  const lines = [...card.querySelectorAll<HTMLElement>(".ds-node__body p")].map(textOf);
  await expect(lines.at(-1)).toBe(
    want.line === "gate" ? m.business.state.gate : m.business.positioning.gatePassed,
  );
  await expect(textOf(card.querySelector(".ds-node__body ul li:last-child") as HTMLElement)).toBe(
    m.business.field.statement,
  );
  await expect(card.querySelector("bdi")).toBeNull();
  await expect(
    Math.abs(card.getBoundingClientRect().height / zoomOf(canvasElement) - want.height),
  ).toBeLessThanOrEqual(1);
  // The other four cards keep their states (node-state-1).
  for (const id of BUSINESS_NODES.filter((n) => n !== "positioning")) {
    const node = viewNode(view, id);
    await expectStateLine(
      nodeEl(canvasElement, id).querySelector(".ds-node") as HTMLElement,
      m,
      node.state,
    );
  }
  // The view: the state line, the dialog's description, the controls the gate offers.
  const dialog = await positioningOf(canvasElement, m);
  await expectStateLine(dialog, m, want.state);
  await expect(dialog).toHaveAccessibleDescription(
    want.line === "gate" ? m.business.state.gate : m.business.positioning.gatePassed,
  );
  const section = sectionOf(dialog);
  // Row F1-a: a statement keeps the section, here A3 with the fixture's words.
  if (kind === "agreed")
    await expect(statementOf(section)?.textContent).toBe(POSITIONING_STATEMENTS[lang]);
  await expect(sectionButtons(section).map((b) => b.dataset["choice"])).toEqual(want.buttons);
  await expect(
    within(section).getByRole("heading", { level: 3, name: m.business.field.statement }),
  ).toBeVisible();
  // P1 and P2: one start edge for the state, the value field, the section heading and the statement,
  // and the section 24 under the value field.
  const edge = inkLeft(stateLineOf(dialog));
  const parts = [
    fieldOf(dialog, "positioning.value").querySelector("h3"),
    section.querySelector("h3"),
    statementOf(section),
  ].flatMap((el) => (el === null ? [] : [el]));
  for (const el of parts) await expect(Math.abs(inkLeft(el) - edge)).toBeLessThanOrEqual(0.5);
  await expect(
    Math.abs(
      section.getBoundingClientRect().top -
        fieldOf(dialog, "positioning.value").getBoundingClientRect().bottom -
        24,
    ),
  ).toBeLessThanOrEqual(0.5);
  // Every button of the row is 40 tall (`md`).
  const buttons = sectionButtons(section);
  for (const b of buttons) await expect(b.getBoundingClientRect().height).toBeCloseTo(40, 0);
  if (buttons.length > 1) expectSameHeight(buttons[0] as HTMLElement, ...buttons.slice(1));
  // No AI label anywhere: nothing was drafted (row 24's PR 1 half).
  await expect(textOf(dialog)).not.toMatch(/AI \(|AI ร่าง/);
  await closeViewer(canvasElement, "positioning");
}

/** The value answer given and no choice: not confirmed, the gate line, "Write my own" and "Skip for now". */
export const PositioningStates: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.open),
  play: ({ canvasElement }) => statesPlay(canvasElement, th, "open"),
};
export const PositioningStatesEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.open),
  decorators: [inEnglish],
  play: ({ canvasElement }) => statesPlay(canvasElement, en, "open"),
};
/** The value answer empty: skipped for now, the gate line, both controls. */
export const PositioningStatesValueEmpty: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.valueEmpty),
  play: ({ canvasElement }) => statesPlay(canvasElement, th, "valueEmpty"),
};
export const PositioningStatesValueEmptyEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.valueEmpty),
  decorators: [inEnglish],
  play: ({ canvasElement }) => statesPlay(canvasElement, en, "valueEmpty"),
};
/** The newest choice a skip: skipped for now, the gate line, only "Write my own". */
export const PositioningStatesSkipped: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.skipped),
  play: ({ canvasElement }) => statesPlay(canvasElement, th, "skipped"),
};
export const PositioningStatesSkippedEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.skipped),
  decorators: [inEnglish],
  play: ({ canvasElement }) => statesPlay(canvasElement, en, "skipped"),
};
/** The newest choice written: agreed, the gate passed, no control. */
export const PositioningStatesAgreed: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.agreed),
  play: ({ canvasElement }) => statesPlay(canvasElement, th, "agreed"),
};
export const PositioningStatesAgreedEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.agreed),
  decorators: [inEnglish],
  play: ({ canvasElement }) => statesPlay(canvasElement, en, "agreed"),
};

/** A statement and no controls (row F1-a): the section stays, as the statement and who wrote it, with no control. */
async function readOnlyPlay(canvasElement: HTMLElement, m: Messages) {
  const lang = langOf(m);
  await boardReady(canvasElement);
  await userEvent.click(nodeEl(canvasElement, "positioning"));
  const dialog = await dialogNamed(nodeTitle(m, "positioning"));
  const section = sectionOf(dialog);
  await expect(statementOf(section)?.textContent).toBe(POSITIONING_STATEMENTS[lang]);
  await expect(textOf(section)).toContain(m.business.positioning.by.own);
  await expect(sectionButtons(section)).toHaveLength(0);
  await expect(section.querySelector("textarea")).toBeNull();
  await closeViewer(canvasElement, "positioning");
}
export const PositioningReadOnly: Story = {
  args: { view: POSITIONING_VIEWS.th.agreed },
  play: ({ canvasElement }) => readOnlyPlay(canvasElement, th),
};
export const PositioningReadOnlyEnglish: Story = {
  args: { view: POSITIONING_VIEWS.en.agreed },
  decorators: [inEnglish],
  play: ({ canvasElement }) => readOnlyPlay(canvasElement, en),
};

// ----- row 2: write my own and agree -----

async function writtenPlay(canvasElement: HTMLElement, m: Messages) {
  stubSaves();
  const lang = langOf(m);
  const dialog = await positioningOf(canvasElement, m);
  const section = sectionOf(dialog);
  const write = buttonOf(section, m.business.positioning.writeOwn);
  // Write my own is the one primary button: no engine action is offered in this PR.
  await expect(write).toHaveAttribute("data-variant", "primary");
  await userEvent.click(write);
  const field = textbox(section, m.business.positioning.writeOwn);
  await focusedIs(field);
  await expect(field.value).toBe("");
  const typed = `  ${POSITIONING_STATEMENTS[lang]}  `;
  await userEvent.click(field);
  await userEvent.paste(typed);
  await userEvent.click(buttonOf(section, m.business.positioning.save));
  // The statement as the person wrote it, trimmed, with who wrote it; the gate passed; no control.
  await waitFor(() => expect(statementOf(section)?.textContent).toBe(POSITIONING_STATEMENTS[lang]));
  const by = (statementOf(section) as HTMLElement).nextElementSibling as HTMLElement;
  await expect(textOf(by)).toBe(m.business.positioning.by.own);
  await expect(textOf(stateLineOf(dialog))).toBe(m.business.state.agreed);
  await expect(dialog).toHaveAccessibleDescription(m.business.positioning.gatePassed);
  await expect(sectionButtons(section)).toHaveLength(0);
  await expect(section.querySelector("textarea")).toBeNull();
  await expect(textOf(dialog)).not.toContain(m.business.state.gate);
  await focusedIs(section.querySelector("h3") as HTMLElement);
  await expect(choose).toHaveBeenCalledTimes(1);
  await expect(choose).toHaveBeenCalledWith({ kind: "written", statement: typed });
  expectNoGlyphClip(within(dialog).getByRole("region", { name: nodeTitle(m, "positioning") }));
  // The heading's focus line reaches into the statement's box, so the ink is read with focus off.
  (document.activeElement as HTMLElement).blur();
  if (inVitest) await expectInkClearsAbove(by, statementOf(section) as HTMLElement, 4);
  await closeViewer(canvasElement, "positioning");
  // The card follows: agreed, with the gate passed in place of the gate line.
  const card = nodeEl(canvasElement, "positioning").querySelector(".ds-node") as HTMLElement;
  await expectStateLine(card, m, "agreed");
  await expect([...card.querySelectorAll(".ds-node__body p")].map(textOf).at(-1)).toBe(
    m.business.positioning.gatePassed,
  );
}

/** A saved project, no choice: write one's own statement and agree (row 2). */
export const PositioningWritten: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.open),
  play: ({ canvasElement }) => writtenPlay(canvasElement, th),
};
export const PositioningWrittenEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.open),
  decorators: [inEnglish],
  play: ({ canvasElement }) => writtenPlay(canvasElement, en),
};

// ----- row 3: the editor's checks, its failure, cancel and the double press -----

async function invalidPlay(canvasElement: HTMLElement, m: Messages) {
  stubSaves();
  const lang = langOf(m);
  let dialog = await positioningOf(canvasElement, m);
  let section = sectionOf(dialog);
  await userEvent.click(buttonOf(section, m.business.positioning.writeOwn));
  const field = textbox(section, m.business.positioning.writeOwn);
  await focusedIs(field);
  // An empty field: the line of the editor, `aria-invalid`, focus on the field, no call.
  // Busy, the button's name takes its status line too, so it is found by its own mark.
  const agree = () => section.querySelector<HTMLElement>('[data-choice="save"]') as HTMLElement;
  await userEvent.click(agree());
  await waitFor(() => expect(textOf(section)).toContain(m.business.positioning.statementRequired));
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await focusedIs(field);
  await expect(choose).not.toHaveBeenCalled();
  // 301 characters: the bound, with 300 in it; typing clears the line.
  await userEvent.click(field);
  await userEvent.paste("ก".repeat(301));
  await expect(textOf(section)).not.toContain(m.business.positioning.statementRequired);
  await userEvent.click(agree());
  await waitFor(() =>
    expect(textOf(section)).toContain(fill(m.business.intake.tooLong, { max: "300" })),
  );
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(choose).not.toHaveBeenCalled();
  // A valid statement while the action answers rate-limited: the line under the controls, the text kept.
  const valid = POSITIONING_STATEMENTS[lang];
  await userEvent.clear(field);
  await userEvent.paste(valid);
  choose.mockImplementation(async () => ({ ok: false, failure: RATE_LIMITED[lang] }));
  await userEvent.click(agree());
  await waitFor(() => expect(textOf(alertOf(section))).toBe(RATE_LIMITED[lang]));
  await expect(field.value).toBe(valid);
  await expect(choose).toHaveBeenCalledTimes(1);
  await expect(agree()).not.toHaveAttribute("data-loading");
  // Cancel: the editor closes, the view is as before it opened, focus is on Write my own, no call.
  await userEvent.click(buttonOf(section, m.business.positioning.cancel));
  await expect(section.querySelector("textarea")).toBeNull();
  let write = buttonOf(section, m.business.positioning.writeOwn);
  await focusedIs(write);
  await expect(textOf(stateLineOf(dialog))).toBe(m.business.state.proposed);
  // The failure line is gone with the editor (positioning-choice-1, "The editors").
  await expect(textOf(alertOf(section))).toBe("");
  await expect(choose).toHaveBeenCalledTimes(1);
  // Closing the viewer after a refusal drops the line too: reopened, the region is empty and the
  // text the person wrote is still in the editor.
  await userEvent.click(write);
  await userEvent.click(textbox(section, m.business.positioning.writeOwn));
  await userEvent.paste(valid);
  await userEvent.click(agree());
  await waitFor(() => expect(textOf(alertOf(section))).toBe(RATE_LIMITED[lang]));
  await expect(choose).toHaveBeenCalledTimes(2);
  await closeViewer(canvasElement, "positioning");
  dialog = await positioningOf(canvasElement, m);
  section = sectionOf(dialog);
  await expect(textOf(alertOf(section))).toBe("");
  await expect(textbox(section, m.business.positioning.writeOwn).value).toBe(valid);
  await userEvent.click(buttonOf(section, m.business.positioning.cancel));
  write = buttonOf(section, m.business.positioning.writeOwn);
  // Opened again it is empty: nothing typed was kept.
  await userEvent.click(write);
  await expect(textbox(section, m.business.positioning.writeOwn).value).toBe("");
  // Two presses while a save runs: one call, the button busy, Cancel inert, both 40 tall.
  let finish: (result: StubResult) => void = () => {};
  choose.mockImplementation(() => new Promise<StubResult>((done) => (finish = done)));
  await userEvent.click(textbox(section, m.business.positioning.writeOwn));
  await userEvent.paste(valid);
  await userEvent.click(agree());
  await waitFor(() => expect(agree()).toHaveAttribute("data-loading"));
  await userEvent.click(agree());
  await expect(choose).toHaveBeenCalledTimes(3);
  await expect(agree()).toHaveAttribute("aria-disabled", "true");
  await expect(buttonOf(section, m.business.positioning.cancel)).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expectSameHeight(agree(), buttonOf(section, m.business.positioning.cancel));
  await expect(within(section).getByRole("status")).toHaveTextContent(
    m.business.positioning.saving,
  );
  finish({ ok: true });
  await waitFor(() => expect(statementOf(section)?.textContent).toBe(valid));
}

/** The empty field, 301 characters, a rate limit, cancel and the double press (row 3). */
export const PositioningInvalid: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.open),
  play: ({ canvasElement }) => invalidPlay(canvasElement, th),
};
export const PositioningInvalidEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.open),
  decorators: [inEnglish],
  play: ({ canvasElement }) => invalidPlay(canvasElement, en),
};

// ----- row 4: skip, then write -----

async function skippedFlowPlay(canvasElement: HTMLElement, m: Messages) {
  stubSaves();
  const lang = langOf(m);
  const dialog = await positioningOf(canvasElement, m);
  const section = sectionOf(dialog);
  await userEvent.click(buttonOf(section, m.strategy.skip));
  // Skipped for now, the gate line, Skip gone, focus on Write my own.
  await waitFor(() => expect(textOf(stateLineOf(dialog))).toBe(m.business.state.skipped));
  await expect(dialog).toHaveAccessibleDescription(m.business.state.gate);
  await expect(within(section).queryByRole("button", { name: m.strategy.skip })).toBeNull();
  const write = buttonOf(section, m.business.positioning.writeOwn);
  await focusedIs(write);
  await expect(write).toHaveAttribute("data-variant", "primary");
  await expect(choose).toHaveBeenCalledTimes(1);
  await expect(choose).toHaveBeenCalledWith({ kind: "skipped" });
  // Then write and agree: the view of row 2.
  await userEvent.click(write);
  await userEvent.click(textbox(section, m.business.positioning.writeOwn));
  await userEvent.paste(POSITIONING_STATEMENTS[lang]);
  await userEvent.click(buttonOf(section, m.business.positioning.save));
  await waitFor(() => expect(textOf(stateLineOf(dialog))).toBe(m.business.state.agreed));
  await expect(statementOf(section)?.textContent).toBe(POSITIONING_STATEMENTS[lang]);
  await expect(sectionButtons(section)).toHaveLength(0);
  await expect(choose).toHaveBeenCalledTimes(2);
}

export const PositioningSkipped: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.open),
  play: ({ canvasElement }) => skippedFlowPlay(canvasElement, th),
};
export const PositioningSkippedEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.open),
  decorators: [inEnglish],
  play: ({ canvasElement }) => skippedFlowPlay(canvasElement, en),
};

// ----- row 7: a choice on older answers -----

async function stalePlay(canvasElement: HTMLElement, m: Messages) {
  const lang = langOf(m);
  const dialog = await positioningOf(canvasElement, m);
  const section = sectionOf(dialog);
  const line = within(section).getByText(m.business.positioning.stale);
  const statement = statementOf(section) as HTMLElement;
  // The old statement as text, the note above it, from one start edge.
  await expect(statement.textContent).toBe(POSITIONING_STATEMENTS[lang]);
  await expect(line.getBoundingClientRect().bottom).toBeLessThan(
    statement.getBoundingClientRect().top,
  );
  await expect(Math.abs(inkLeft(line) - inkLeft(statement))).toBeLessThanOrEqual(0.5);
  // Not agreed: no `by` line, no agreed state and no gate passed anywhere, the gate line instead.
  await expect(textOf(section)).not.toContain(m.business.positioning.by.own);
  await expect(textOf(dialog)).not.toContain(m.business.state.agreed);
  await expect(textOf(dialog)).not.toContain(m.business.positioning.gatePassed);
  await expect(textOf(stateLineOf(dialog))).toBe(m.business.state.proposed);
  await expect(dialog).toHaveAccessibleDescription(m.business.state.gate);
  // The gate is open again: the person can write their own or skip.
  await expect(sectionButtons(section).map((b) => b.dataset["choice"])).toEqual([
    "writeOwn",
    "skip",
  ]);
  await closeViewer(canvasElement, "positioning");
  const card = nodeEl(canvasElement, "positioning").querySelector(".ds-node") as HTMLElement;
  await expectStateLine(card, m, "proposed");
  await expect(textOf(card)).not.toContain(m.business.positioning.gatePassed);
}

export const PositioningStale: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.stale),
  play: ({ canvasElement }) => stalePlay(canvasElement, th),
};
export const PositioningStaleEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.stale),
  decorators: [inEnglish],
  play: ({ canvasElement }) => stalePlay(canvasElement, en),
};

// ----- row 8: a statement that is markup -----

async function hostilePlay(canvasElement: HTMLElement, m: Messages) {
  const dialog = await positioningOf(canvasElement, m);
  const section = sectionOf(dialog);
  const statement = statementOf(section) as HTMLElement;
  await expect(statement.textContent).toBe(HOSTILE_STATEMENT);
  await expect(statement.querySelector("bdi")?.textContent).toBe(HOSTILE_STATEMENT);
  await expect(section.querySelectorAll("img, script, a, b")).toHaveLength(0);
  await expect(dialog.querySelectorAll("img, script, a")).toHaveLength(0);
  await closeViewer(canvasElement, "positioning");
  await expect(canvasElement.querySelector("img")).toBeNull();
  await expect(textOf(canvasElement)).not.toContain(HOSTILE_STATEMENT);
}

export const PositioningUntrustedText: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.hostile),
  play: ({ canvasElement }) => hostilePlay(canvasElement, th),
};
export const PositioningUntrustedTextEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.hostile),
  decorators: [inEnglish],
  play: ({ canvasElement }) => hostilePlay(canvasElement, en),
};

// ----- row 10: at 360 px, a 300-character Thai statement, light and dark -----

async function narrowStatementPlay(canvasElement: HTMLElement, m: Messages) {
  await atWindow(360, 760, async () => {
    const dialog = await positioningOf(canvasElement, m);
    const section = sectionOf(dialog);
    const region = within(dialog).getByRole("region", { name: nodeTitle(m, "positioning") });
    const statement = statementOf(section) as HTMLElement;
    // 300 Thai characters with no space wrap inside the column: nothing scrolls sideways.
    await expect(statement.textContent).toHaveLength(300);
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
    const view = dialog.querySelector<HTMLElement>("[data-node]") as HTMLElement;
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        await expect(rect.right).toBeLessThanOrEqual(view.getBoundingClientRect().right + 0.5);
      }
    }
    expectNoGlyphClip(region);
    await closeViewer(canvasElement, "positioning");
  });
}

async function narrowControlsPlay(canvasElement: HTMLElement, m: Messages) {
  await atWindow(360, 760, async () => {
    const dialog = await positioningOf(canvasElement, m);
    const section = sectionOf(dialog);
    const region = within(dialog).getByRole("region", { name: nodeTitle(m, "positioning") });
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(360);
    // Keyboard only: Tab goes to Write my own, then Skip, in reading order; each focus is the line and halo.
    const buttons = sectionButtons(section);
    const write = buttons[0] as HTMLElement;
    const skip = buttons[1] as HTMLElement;
    await userEvent.tab();
    await focusedIs(write);
    await expect(write.matches(":focus-visible")).toBe(true);
    await userEvent.tab();
    await focusedIs(skip);
    await expect(skip.matches(":focus-visible")).toBe(true);
    await expectFocusBorderForm(write);
    await expectFocusBorderForm(skip);
    // Both buttons on one row from the column's start edge; the editor's two buttons start there too.
    const column = section.getBoundingClientRect().left;
    await expect(Math.abs(write.getBoundingClientRect().left - column)).toBeLessThanOrEqual(0.5);
    await userEvent.click(write);
    const editor = textbox(section, m.business.positioning.writeOwn);
    await focusedIs(editor);
    await expect(Math.abs(editor.getBoundingClientRect().left - column)).toBeLessThanOrEqual(0.5);
    // Agree starts at the column; Cancel sits beside it, or under it from the same edge when the row wraps.
    const [agree, cancel] = sectionButtons(section).map((b) => b.getBoundingClientRect()) as [
      DOMRect,
      DOMRect,
    ];
    await expect(Math.abs(agree.left - column)).toBeLessThanOrEqual(0.5);
    if (cancel.top >= agree.bottom - 0.5) {
      await expect(Math.abs(cancel.left - column)).toBeLessThanOrEqual(0.5);
    } else {
      await expect(cancel.left).toBeGreaterThanOrEqual(agree.right);
    }
    for (const box of [agree, cancel]) {
      await expect(box.right).toBeLessThanOrEqual(region.getBoundingClientRect().right);
    }
    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await closeViewer(canvasElement, "positioning");
  });
}

/** Light, Thai: the long statement wraps inside the column and the controls take the keyboard in order. */
export const PositioningNarrow: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.long),
  play: async ({ canvasElement }) => {
    await narrowStatementPlay(canvasElement, th);
  },
};
export const PositioningNarrowControls: Story = {
  render: hosted("th", POSITIONING_VIEWS.th.open),
  play: async ({ canvasElement }) => {
    await narrowControlsPlay(canvasElement, th);
  },
};
export const PositioningNarrowDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      <GateHost locale="th" initial={POSITIONING_VIEWS.th.long} />
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowStatementPlay(canvasElement, th);
  },
};
export const PositioningNarrowControlsDark: Story = {
  render: () => (
    <Under profile="neutral" mode="dark">
      <GateHost locale="th" initial={POSITIONING_VIEWS.th.open} />
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowControlsPlay(canvasElement, th);
  },
};
export const PositioningNarrowEnglish: Story = {
  render: hosted("en", POSITIONING_VIEWS.en.open),
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await narrowControlsPlay(canvasElement, en);
  },
};
