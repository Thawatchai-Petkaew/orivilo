import { GUIDEBOOK_NOT_HELD, type Guidebook, type GuidebookItem } from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";
import {
  expectFocusBorderForm,
  expectLinesClear,
  expectNoGlyphClip,
  inVitest,
} from "../testing/visual-asserts";
import {
  atWindow,
  en,
  expectAccessScreen,
  expectFitsAt360,
  FixtureNote,
  inEnglish,
  textOf,
  th,
} from "./business-story-helpers";
import {
  decisionRule,
  formatSavedAt,
  licenceLine,
  provisionalLines,
  uncheckedLine,
} from "./business-text";
import { GuidebookScreen } from "./guidebook";
import {
  awaitingChoice,
  DRAFT_MODEL,
  done,
  draftTexts,
  edited,
  everyState,
  long,
  open,
  openAsks,
  picked,
  skipped,
  skippedSteps,
  stale,
  untrusted,
  visualOpen,
} from "./guidebook-fixtures";
import { guidebookStateLine, itemTitle, notHeldLines, questionLine } from "./guidebook-text";

const BOARD = "/business/fixture";

const meta = {
  title: "Examples/Application: Brand guidebook",
  component: GuidebookScreen,
  args: { access: "ready", guidebook: done("th"), boardHref: BOARD, signInHref: "/account" },
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
          "The brand guidebook of one project (ORV-302): a draft document read top to bottom, put together by fixed rules from what is on the board, with no AI. It holds the keys and values of `guidebookOf` and looks every line up in the catalog, so a language switch redraws the same data. Every project here is a labelled fixture; nobody gave these answers. The page that renders it owns the one `main`.",
      },
    },
  },
} satisfies Meta<typeof GuidebookScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

// ----- helpers -----

const screen = (g: Guidebook) => (
  <GuidebookScreen access="ready" guidebook={g} boardHref={BOARD} signInHref="/account" />
);

/** A 360 px frame: it clips sideways, so a line that spills past it is caught by the glyph check. */
const narrow = (g: Guidebook) => (
  <div data-narrow="" className="w-[360px] max-w-full overflow-x-clip">
    {screen(g)}
  </div>
);

const localeOf = (m: Messages): Locale => (m === th ? "th" : "en");
const must = <T extends Element>(el: T | null, what: string): T => {
  if (el === null) throw new Error(`no ${what}`);
  return el;
};
const rootOf = (canvasElement: HTMLElement) =>
  must(canvasElement.querySelector<HTMLElement>("[data-guidebook]"), "[data-guidebook]");
const itemEl = (root: ParentNode, id: string) =>
  must(root.querySelector<HTMLElement>(`[data-item="${id}"]`), `[data-item=${id}]`);
const sectionEl = (root: ParentNode, id: string) =>
  must(root.querySelector<HTMLElement>(`[data-section="${id}"]`), `[data-section=${id}]`);
const items = (g: Guidebook): GuidebookItem[] => [...g.foundation, ...g.visual];
const itemOf = (g: Guidebook, id: GuidebookItem["id"]): GuidebookItem => {
  const found = items(g).find((i) => i.id === id);
  if (found === undefined) throw new Error(`no item ${id}`);
  return found;
};
const rect = (el: Element) => el.getBoundingClientRect();
/** Within half a pixel, the bound of the design's measured numbers. */
const near = (actual: number, want: number, what: string) =>
  expect(Math.abs(actual - want), `${what}: ${actual} against ${want}`).toBeLessThanOrEqual(0.5);
const px = (el: Element) => getComputedStyle(el).fontSize;
const thaiText = /[฀-๿]/;

/** The content left of the screen's column (design 16, `L`): 16 inside its padding. */
const leftOf = (root: HTMLElement) =>
  rect(root).left + parseFloat(getComputedStyle(root).paddingLeft);

/** P1: every block of text starts at `L`, or at `L + 332` in the lead block's second column. */
async function expectOneStartEdge(root: HTMLElement) {
  const left = leftOf(root);
  const column = rect(root).width - 2 * parseFloat(getComputedStyle(root).paddingLeft);
  const second = left + (column - 24) / 2 + 24;
  const back = must(root.querySelector<HTMLElement>("[data-back]"), "[data-back]");
  near(rect(back).left, left, "the back link");
  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    if (el === back || back.contains(el)) continue;
    if (["inline", "none", "contents"].includes(getComputedStyle(el).display)) continue;
    const own = [...el.childNodes].find(
      (n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "",
    );
    if (own === undefined) continue;
    const range = document.createRange();
    range.selectNodeContents(own);
    const first = range.getClientRects()[0];
    if (first === undefined) continue;
    if (el.closest("[data-lead]") !== null) {
      const ok = Math.abs(first.left - left) <= 0.5 || Math.abs(first.left - second) <= 0.5;
      await expect(ok, `"${textOf(el)}" starts at ${first.left}, not ${left} or ${second}`).toBe(
        true,
      );
    } else {
      near(first.left, left, `"${textOf(el)}"`);
    }
  }
}

/** One line box of a run of text: where its glyph box starts and the element that sets its line height. */
interface LineBox {
  top: number;
  host: Element;
}

/**
 * The line boxes of the text under `el`, top to bottom, read from the rendered text (a range per text
 * node), never from a class: a wrapped paragraph gives one entry per line, and a block of several
 * paragraphs gives the lines of all of them.
 */
function lineBoxes(el: Element): LineBox[] {
  const found: LineBox[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if ((node.textContent ?? "").trim() === "" || node.parentElement === null) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width > 0) found.push({ top: r.top, host: node.parentElement });
    }
  }
  found.sort((a, b) => a.top - b.top);
  const lines: LineBox[] = [];
  for (const box of found) {
    const last = lines.at(-1);
    if (last === undefined || box.top - last.top > 4) lines.push(box);
  }
  return lines;
}

/** The families of stack `expectPeerLinesApart` measures, named as the design's survey rows. */
type PeerFamily = "ask" | "step" | "notes" | "labels" | "head" | "colour";

/**
 * P25 (design 6.1): two peer lines of one stack, a question, a note, a label, a reason, a rule line,
 * start apart by more than the pitch inside one entry. For every two adjacent children A and B of
 * each stack the page holds: B's first line starts at least 1.3 line heights below A's last line
 * (31.8 measured, 27.8 on the 4 gap, a line height of 23.8), and B's box starts at least 7.5 below A's
 * box. It reads rendered line boxes, so it holds at any line count. Returns the pairs measured per
 * family; a story names the families its fixture must reach, so a selector that matches nothing fails.
 */
function expectPeerLinesApart(root: HTMLElement, reach: readonly PeerFamily[]) {
  const pairs: Record<PeerFamily, number> = {
    ask: 0,
    step: 0,
    notes: 0,
    labels: 0,
    head: 0,
    colour: 0,
  };
  const apart = (family: PeerFamily, a: Element, b: Element) => {
    const linesA = lineBoxes(a);
    const linesB = lineBoxes(b);
    const lastA = linesA.at(-1);
    const firstB = linesB[0];
    if (lastA === undefined || firstB === undefined) return;
    const lineHeight = parseFloat(getComputedStyle(lastA.host).lineHeight);
    const what = `${family}: "${textOf(a).slice(0, 40)}" then "${textOf(b).slice(0, 40)}"`;
    expect(Number.isFinite(lineHeight), `${what}: line height`).toBe(true);
    const pitch = firstB.top - lastA.top;
    expect(pitch, `${what}: last line to next first line is ${pitch}`).toBeGreaterThanOrEqual(
      1.3 * lineHeight,
    );
    const gap = rect(b).top - rect(a).bottom;
    expect(gap, `${what}: box gap is ${gap}`).toBeGreaterThanOrEqual(7.5);
    pairs[family] += 1;
  };
  const stacks = (family: PeerFamily, selector: string) => {
    for (const stack of root.querySelectorAll(selector)) {
      const children = [...stack.children];
      for (let i = 1; i < children.length; i++) {
        apart(family, must(children[i - 1] ?? null, "A"), must(children[i] ?? null, "B"));
      }
    }
  };
  stacks("ask", "[data-ask] > ul");
  stacks("step", "[data-step] > ul:not([data-rests])");
  stacks("notes", "[data-notes]");
  stacks("labels", "[data-labels]");
  // A head from its state line on: the title above it changes size and weight, so it is not a peer.
  for (const head of root.querySelectorAll("[data-head]")) {
    const children = [...head.children];
    const from = children.findIndex((c) => c.hasAttribute("data-state"));
    for (let i = from + 1; from >= 0 && i < children.length; i++) {
      apart("head", must(children[i - 1] ?? null, "A"), must(children[i] ?? null, "B"));
    }
  }
  // A colour field's reason, then its rule.
  for (const rule of root.querySelectorAll("[data-field] > dd[data-rule]")) {
    apart("colour", must(rule.previousElementSibling, "the reason"), rule);
  }
  for (const family of reach)
    expect(pairs[family], `pairs measured in ${family}`).toBeGreaterThan(0);
}

/** The person question of Brand personality wraps at 360, so the bound is proven at a wrapped count. */
function expectPersonQuestionWraps(root: HTMLElement, m: Messages) {
  // Outside the browser runner the window is the reader's own, so a wrap is not promised.
  if (!inVitest) return;
  const person = [
    ...root.querySelectorAll(
      "[data-item=identity-frame] [data-ask] li, [data-step=identity-frame] li",
    ),
  ].filter((li) => textOf(li) === m.business.question.person);
  expect(person.length, "the person question of Brand personality").toBeGreaterThan(0);
  for (const li of person) expect(lineBoxes(li).length).toBeGreaterThanOrEqual(2);
}

/** The lines an item shows are the lines the data gives (rows 1 to 7, 17 to 19 and 23). */
async function expectItemsMatchData(root: HTMLElement, m: Messages, g: Guidebook) {
  const locale = localeOf(m);
  for (const item of items(g)) {
    const el = itemEl(root, item.id);
    await expect(textOf(must(el.querySelector("h3"), "h3"))).toBe(itemTitle(m, item.id));
    await expect(textOf(must(el.querySelector("[data-state]"), "[data-state]"))).toBe(
      guidebookStateLine(m, locale, item),
    );
    await expect(el.dataset["done"]).toBe(String(item.status === "done"));
    await expect(el.querySelectorAll("[data-value]").length, `${item.id} values`).toBe(
      item.status === "done" ? 1 : 0,
    );
    const ask = el.querySelectorAll("[data-ask]");
    await expect(ask.length, `${item.id} asks`).toBe(item.questions.length === 0 ? 0 : 1);
    if (item.questions.length > 0) {
      await expect(
        [...must(ask[0] ?? null, "[data-ask]").querySelectorAll("li")].map(textOf),
      ).toEqual(item.questions.map((key) => questionLine(m, key)));
      await expect(textOf(must(ask[0] ?? null, "[data-ask]").querySelector("p") as Element)).toBe(
        m.business.stillToAsk,
      );
    }
    const provisional = provisionalLines(m, locale, item);
    const marks = el.querySelector("[data-marks=provisional]");
    await expect(marks === null).toBe(provisional === null);
    if (provisional !== null && marks !== null) {
      await expect([...marks.querySelectorAll("p")].map(textOf)).toEqual([
        provisional.provisional,
        provisional.restsOn,
      ]);
    }
    const unchecked = uncheckedLine(m, locale, item);
    const line = el.querySelector("[data-marks=unchecked]");
    await expect(line === null ? null : textOf(line)).toBe(unchecked);
  }
  // No control on the page: its one interactive element is the back link.
  await expect(root.querySelectorAll("button, input, textarea, select, form")).toHaveLength(0);
  await expect([...root.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([BOARD]);
}

/** Not yet confirmed: the steps, in order, with what rests on each (rows 5, 6, 19). */
async function expectSteps(root: HTMLElement, m: Messages, g: Guidebook) {
  const section = sectionEl(root, "unconfirmed");
  if (g.unconfirmed.length === 0) {
    await expect(textOf(must(section.querySelector("[data-unconfirmed-none]"), "none"))).toBe(
      m.business.guidebook.unconfirmed.none,
    );
    await expect(section.querySelectorAll("[data-unconfirmed]")).toHaveLength(0);
    return;
  }
  await expect(section.querySelectorAll("[data-unconfirmed-none]")).toHaveLength(0);
  const steps = [...section.querySelectorAll<HTMLElement>("[data-step]")];
  await expect(steps.map((s) => s.dataset["step"])).toEqual(g.unconfirmed.map((s) => s.id));
  for (const [i, step] of g.unconfirmed.entries()) {
    const el = must(steps[i] ?? null, `step ${step.id}`);
    await expect(textOf(must(el.querySelector("h3"), "h3"))).toBe(itemTitle(m, step.id));
    await expect([...el.querySelectorAll(":scope > ul > li")].map(textOf)).toEqual(
      step.questions.map((key) => questionLine(m, key)),
    );
    const rests = el.querySelectorAll("[data-rests] > li");
    if (step.restingOn.length === 0) {
      await expect(el.querySelectorAll("[data-rests]")).toHaveLength(0);
      await expect(textOf(el)).not.toContain(m.business.guidebook.unconfirmed.restsOnIt);
      await expect(textOf(el)).toContain(m.business.guidebook.unconfirmed.nothing);
    } else {
      await expect(textOf(el)).toContain(m.business.guidebook.unconfirmed.restsOnIt);
      await expect(textOf(el)).not.toContain(m.business.guidebook.unconfirmed.nothing);
      await expect([...rests].map((li) => li.getAttribute("data-rests-item"))).toEqual(
        step.restingOn.map((r) => r.id),
      );
      const title = itemTitle(m, step.id);
      for (const [j, r] of step.restingOn.entries()) {
        const li = must(rests[j] ?? null, "rest");
        const line = fill(
          r.mark === "restsOn" ? m.business.marks.restsOn : m.business.marks.unchecked,
          { nodes: title },
        );
        await expect([...li.querySelectorAll("span")].map(textOf)).toEqual([
          itemTitle(m, r.id),
          line,
        ]);
      }
    }
  }
}

/** Not in this guidebook: eight lines in the order of `guidebook-not-held-1`, 16 apart (P11). */
async function expectNotHeld(root: HTMLElement, m: Messages) {
  const list = must(root.querySelector("[data-not-held]"), "[data-not-held]");
  const entries = [...list.children] as HTMLElement[];
  await expect(entries).toHaveLength(8);
  for (const [i, id] of GUIDEBOOK_NOT_HELD.entries()) {
    const { title, reason } = notHeldLines(m, id);
    const entry = must(entries[i] ?? null, id);
    await expect([...entry.children].map(textOf)).toEqual([title, reason]);
    if (i > 0) near(rect(entry).top - rect(must(entries[i - 1] ?? null, "prev")).bottom, 16, id);
  }
}

/** The heading levels of the page, in order (design 15). */
const headings = (root: ParentNode) =>
  [...root.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) => h.tagName);

/** The cover (P3) and the section titles in order (row 1). */
async function expectCover(root: HTMLElement, m: Messages, g: Guidebook) {
  const locale = localeOf(m);
  const gb = m.business.guidebook;
  const h1s = root.querySelectorAll("h1");
  await expect(h1s).toHaveLength(1);
  await expect(textOf(must(h1s[0] ?? null, "h1"))).toBe(gb.title);
  const cover = must(root.querySelector("[data-cover]"), "[data-cover]");
  await expect(textOf(cover)).toContain(g.projectName);
  await expect(textOf(cover)).toContain(
    fill(m.business.board.savedAt, { date: formatSavedAt(g.savedAt, locale) }),
  );
  const preface = must(root.querySelector<HTMLElement>("[data-preface]"), "[data-preface]");
  await expect([...preface.querySelectorAll("p")].map(textOf)).toEqual([gb.byRule, gb.draftNote]);
  for (const p of preface.querySelectorAll("p")) await expect(px(p)).toBe("16px");
  // Each once on the whole page (guidebook-honest-1).
  await expect(textOf(root).split(gb.byRule)).toHaveLength(2);
  await expect(textOf(root).split(gb.draftNote)).toHaveLength(2);
  await expect([...root.querySelectorAll("h2")].map(textOf)).toEqual([
    gb.section.business,
    gb.section.foundation,
    gb.section.visual,
    gb.section.unconfirmed,
    gb.section.notHeld,
  ]);
  const sections = [...root.querySelectorAll<HTMLElement>("[data-section]")];
  await expect(sections.map((s) => s.dataset["section"])).toEqual([
    "business",
    "foundation",
    "visual",
    "unconfirmed",
    "notHeld",
  ]);
  for (const s of sections) {
    await expect(s.getAttribute("aria-labelledby")).toBe(
      must(s.querySelector("h2"), "h2").getAttribute("id"),
    );
  }
}

/** P4: the lead block names four steps with their state line only. */
async function expectLead(root: HTMLElement, m: Messages, g: Guidebook, columns: 1 | 2) {
  const locale = localeOf(m);
  const lead = must(root.querySelector("[data-lead]"), "[data-lead]");
  await expect([...lead.querySelectorAll("dt")].map(textOf)).toEqual(
    ["situation", "business-core", "audience", "competitive-frame"].map((id) =>
      itemTitle(m, id as "situation"),
    ),
  );
  await expect([...lead.querySelectorAll("dd")].map(textOf)).toEqual(
    g.lead.map((l) => guidebookStateLine(m, locale, l)),
  );
  await expect(lead.children).toHaveLength(4);
  const lefts = new Set([...lead.children].map((c) => Math.round(rect(c).left)));
  await expect(lefts.size).toBe(columns);
  await expect(textOf(sectionEl(root, "business"))).toContain(m.business.guidebook.businessNote);
}

/** P2: the measured rhythm of the page, 48, 32, 24 and 12 (design 3). */
async function expectRhythm(root: HTMLElement) {
  const cover = must(root.querySelector("[data-cover]"), "[data-cover]");
  const blocks = [cover, ...root.querySelectorAll("[data-section]")];
  for (let i = 1; i < blocks.length; i++) {
    near(
      rect(must(blocks[i] ?? null, "block")).top -
        rect(must(blocks[i - 1] ?? null, "block")).bottom,
      48,
      `block ${i}`,
    );
  }
  const back = must(root.querySelector("[data-back]"), "[data-back]").parentElement as HTMLElement;
  near(rect(back).top - rect(must(blocks.at(-1) ?? null, "last")).bottom, 48, "the back link");
  for (const section of root.querySelectorAll("[data-section]")) {
    const [header, first] = section.children;
    near(
      rect(must(first ?? null, "first child")).top - rect(must(header ?? null, "header")).bottom,
      24,
      "section header",
    );
  }
  for (const id of ["foundation", "visual"]) {
    const list = [...sectionEl(root, id).querySelectorAll("[data-item]")];
    for (let i = 1; i < list.length; i++) {
      near(
        rect(must(list[i] ?? null, "item")).top - rect(must(list[i - 1] ?? null, "item")).bottom,
        32,
        `${id} item ${i}`,
      );
    }
  }
  for (const item of root.querySelectorAll<HTMLElement>("[data-item][data-done=true]")) {
    const head = must(item.querySelector("[data-head]"), "[data-head]");
    near(
      rect(must(head.nextElementSibling, "after the head")).top - rect(head).bottom,
      12,
      `${item.dataset["item"]} head`,
    );
  }
}

/** P5 and row 2: the done foundation items, as the spec lists them. */
async function expectDoneFoundation(root: HTMLElement, m: Messages, g: Guidebook) {
  const gb = m.business;
  const one = (id: string) =>
    must(itemEl(root, id).querySelector<HTMLElement>("[data-value]"), `${id} value`);
  const stateOf = (id: string) =>
    textOf(must(itemEl(root, id).querySelector("[data-state]"), "state"));
  // Positioning.
  await expect(stateOf("positioning")).toBe(gb.state.agreed);
  const statement = (id: string) => must(one(id).querySelector("p"), `${id} statement`);
  await expect(px(statement("positioning"))).toBe("20px");
  await expect([...one("positioning").querySelectorAll("p")].map(textOf)).toEqual([
    textOf(statement("positioning")),
    gb.positioning.by.own,
    gb.positioning.gatePassed,
  ]);
  // Brand personality: the answers at 16 px, the five points as words, the hypothesis once.
  await expect(stateOf("identity-frame")).toBe(gb.state.given);
  const identity = one("identity-frame");
  await expect(px(must(identity.querySelector("[data-field=person] dd"), "person"))).toBe("16px");
  await expect(
    [...must(identity.querySelector("[data-field=never]"), "never").children].map(textOf),
  ).toEqual([gb.field.never, gb.state.empty]);
  await expect(textOf(identity)).toContain(gb.label.yourWords);
  const points = [...identity.querySelectorAll("[data-field=personality] dl dd")].map(textOf);
  await expect(points).toEqual(Array.from({ length: 5 }, () => fill(gb.identity.point, { n: 4 })));
  await expect(textOf(itemEl(root, "identity-frame")).split(gb.identity.hypothesis)).toHaveLength(
    2,
  );
  // Brand architecture: the single brand, why, and its rule.
  await expect(stateOf("architecture")).toBe(gb.state.derived);
  // The reason and the rule sit in one notes block after the value line (design 6.1, R1-7).
  const architecture = [...one("architecture").children];
  await expect(architecture.map((el) => el.hasAttribute("data-notes"))).toEqual([false, true]);
  await expect(
    [...architecture.slice(0, 1), ...(architecture[1]?.children ?? [])].map(textOf),
  ).toEqual([
    gb.architecture.single,
    gb.architecture.because,
    decisionRule(m, "architecture-derive-1"),
  ]);
  await expect(px(statement("architecture"))).toBe("20px");
  // Name and core idea.
  await expect(stateOf("name")).toBe(gb.state.given);
  await expect([...one("name").children].map(textOf)).toEqual(["ORIVILO", gb.name.notScreened]);
  await expect(px(statement("name"))).toBe("20px");
  await expect(stateOf("core-idea")).toBe(gb.state.agreed);
  await expect(px(statement("core-idea"))).toBe("20px");
  await expect(textOf(one("core-idea"))).toContain(gb.coreIdea.gatePassed);
  await expect(textOf(one("core-idea"))).toContain(gb.label.yourWords);
  // Among the foundation items, the rule is the architecture's alone.
  const rules = [...sectionEl(root, "foundation").querySelectorAll("[data-rule]")];
  await expect(rules).toHaveLength(1);
  await expect(rules[0]?.closest("[data-item]")?.getAttribute("data-item")).toBe("architecture");
  // No mark line on any item of the done project.
  await expect(root.querySelectorAll("[data-marks]")).toHaveLength(0);
  await expect(g.unconfirmed).toHaveLength(0);
}

/** P19, row 17: the three visual items, their decisions, rules and labels, and Logo mark. */
async function expectVisualDone(root: HTMLElement, m: Messages, g: Guidebook) {
  const gb = m.business;
  const logoType = itemOf(g, "logo-type");
  const color = itemOf(g, "color");
  const typography = itemOf(g, "typography");
  await expect(itemOf(g, "logo-mark")).toMatchObject({ state: "notInVersion", status: "open" });
  for (const id of ["logo-type", "color", "typography"]) {
    const el = itemEl(root, id);
    await expect(el.querySelectorAll("[data-value]")).toHaveLength(1);
    await expect(el.querySelectorAll("[data-labels]")).toHaveLength(1);
  }
  const rulesOf = (id: string) => [...itemEl(root, id).querySelectorAll("[data-rule]")].map(textOf);
  await expect(rulesOf("logo-type")).toEqual([decisionRule(m, "logo-type-1")]);
  await expect(rulesOf("color")).toEqual(color.rules.map((r) => decisionRule(m, r)));
  await expect(rulesOf("color")[0]).toBe(decisionRule(m, "color.signature.lime-warm"));
  await expect(rulesOf("typography")).toEqual([decisionRule(m, "typography-node-1")]);
  const labelsOf = (id: string) =>
    [...must(itemEl(root, id).querySelector("[data-labels]"), "labels").children].map(textOf);
  await expect(labelsOf("logo-type")).toEqual([
    gb.logoType.hypothesis,
    gb.logoType.crowdingNotChecked,
    gb.logoType.otherTypes,
  ]);
  await expect(labelsOf("color")).toEqual([gb.color.hypothesis, gb.color.familyOnly]);
  await expect(labelsOf("typography")).toEqual([
    gb.typography.oneChoice,
    gb.typography.noPersonalityLink,
  ]);
  // Logo type: the decision at 20 px, its reason, the name length line with the working name.
  const lt = itemEl(root, "logo-type");
  await expect(px(must(lt.querySelector("[data-value] p"), "decision"))).toBe("20px");
  await expect(textOf(must(lt.querySelector("[data-name-length]"), "length"))).toContain("ORIVILO");
  await expect(lt.querySelector("[data-name-length] bdi")?.textContent).toBe("ORIVILO");
  await expect(logoType.status).toBe("done");
  // Colour: the three decisions in order, each with its reason and rule, and no colour value.
  const col = itemEl(root, "color");
  await expect(
    [...col.querySelectorAll("[data-value] > [data-field]")].map((f) =>
      f.getAttribute("data-field"),
    ),
  ).toEqual(["signature", "neutral", "canvas"]);
  await expect([...col.querySelectorAll("[data-value] dd.text-body-lg")].map(textOf)).toEqual([
    gb.color.family.lime,
    gb.color.neutral.warm,
    gb.color.canvas.soft,
  ]);
  // Typography: the families as written, per role, with style, licence and the pairing line.
  const ty = itemEl(root, "typography");
  const families = (field: string) =>
    [...ty.querySelectorAll(`[data-field=${field}] [data-face] > p:first-child`)].map(textOf);
  await expect(families("readingFace")).toEqual(["Sarabun", "Inter"]);
  await expect(families("displayFace")).toEqual(["Anuphan", "Inter"]);
  await expect(textOf(ty)).toContain(
    fill(gb.typography.licence, { licence: "SIL Open Font License 1.1" }),
  );
  await expect(typography.status).toBe("done");
  if (typography.status === "done" && typography.value.id === "typography") {
    for (const face of [...typography.value.faces.reading, ...typography.value.faces.display]) {
      await expect(textOf(ty)).toContain(licenceLine(m, face));
      await expect(textOf(ty)).toContain(face.family);
    }
  }
  await expect(textOf(ty)).toContain(gb.typography.because.pairing);
  await expectNoColourValue(root);
}

/** No colour value and no swatch: the guidebook names a family and draws nothing (row 17, 23). */
async function expectNoColourValue(root: HTMLElement) {
  await expect(textOf(root)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  await expect(root.querySelectorAll("img, svg, canvas, picture")).toHaveLength(0);
  await expect(root.querySelectorAll("[style*='background']")).toHaveLength(0);
}

/** P6: an open item holds no line over 14 px and no value; each question is under its item. */
async function expectOpenQuiet(root: HTMLElement) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-item][data-done=false]")) {
    await expect(el.querySelectorAll("[data-value]")).toHaveLength(0);
    for (const inner of [el, ...el.querySelectorAll("*")]) {
      // Only an element that carries text of its own sets a line's size; a container only passes it down.
      const own = [...inner.childNodes].some(
        (n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "",
      );
      if (!own) continue;
      await expect(
        parseFloat(px(inner)),
        `${el.dataset["item"]}: ${textOf(inner)}`,
      ).toBeLessThanOrEqual(14);
    }
  }
}

/** The page runs from the top to the back link, and Tab goes to the back link first (P12). */
async function expectBackLink(root: HTMLElement, m: Messages) {
  const back = must(root.querySelector<HTMLElement>("[data-back]"), "[data-back]");
  await expect(textOf(back)).toBe(m.business.guidebook.backToBoard);
  await expect(back.getAttribute("href")).toBe(BOARD);
  await expect(rect(back).height).toBe(40);
  (document.activeElement as HTMLElement | null)?.blur();
  await userEvent.tab();
  await expect(document.activeElement).toBe(back);
  await expectFocusBorderForm(back);
  // Nothing else in the page body takes focus.
  await expect(root.querySelectorAll("[tabindex]:not([tabindex='-1'])")).toHaveLength(0);
}

const DONE_HEADINGS = [
  "H1",
  "H2",
  "H2",
  "H3",
  "H3",
  "H3",
  "H3",
  "H3",
  "H2",
  "H3",
  "H3",
  "H3",
  "H3",
  "H2",
  "H2",
];

// ----- done (rows 1, 2, 8, 13, 17) -----

async function donePlay(canvasElement: HTMLElement, m: Messages) {
  const root = rootOf(canvasElement);
  const g = done(localeOf(m));
  await expectCover(root, m, g);
  await expectLead(root, m, g, 2);
  await expectItemsMatchData(root, m, g);
  await expectDoneFoundation(root, m, g);
  await expectVisualDone(root, m, g);
  await expectSteps(root, m, g);
  await expectNotHeld(root, m);
  await expect(headings(root)).toEqual(DONE_HEADINGS);
  await expectOneStartEdge(root);
  await expectRhythm(root);
  await expectBackLink(root, m);
  // Logo mark: not in this version, with its own line and no value (section 7.3).
  const mark = itemEl(root, "logo-mark");
  await expect(textOf(must(mark.querySelector("[data-state]"), "state"))).toBe(
    m.business.state.notInVersion,
  );
  await expect(textOf(mark)).toContain(m.business.guidebook.notYet.logoMark);
  await expect(mark.querySelectorAll("[data-value], [data-ask]")).toHaveLength(0);
}

/** The done project in Thai, nothing skipped (rows 1, 2, 8, 17). */
export const GuidebookDone: Story = {
  play: async ({ canvasElement }) => {
    await donePlay(canvasElement, th);
  },
};

export const GuidebookDoneEnglish: Story = {
  args: { guidebook: done("en") },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await donePlay(canvasElement, en);
  },
};

// ----- open (row 4) -----

async function openPlay(canvasElement: HTMLElement, m: Messages) {
  const root = rootOf(canvasElement);
  const g = open(localeOf(m));
  await expectItemsMatchData(root, m, g);
  await expectOpenQuiet(root);
  // Positioning asks its question and shows no statement; the rest wait for it.
  const positioning = itemEl(root, "positioning");
  await expect(textOf(must(positioning.querySelector("[data-state]"), "state"))).toBe(
    m.business.state.proposed,
  );
  await expect([...positioning.querySelectorAll("[data-ask] li")].map(textOf)).toEqual([
    m.business.question.only,
  ]);
  const waits = fill(m.business.state.waiting, { nodes: m.business.node.positioning });
  for (const id of [
    "identity-frame",
    "architecture",
    "core-idea",
    "logo-type",
    "color",
    "typography",
  ]) {
    await expect(textOf(must(itemEl(root, id).querySelector("[data-state]"), "state"))).toBe(waits);
  }
  // The waiting architecture shows no answer; the name is given and not yet checked (row 4, second project).
  await expect(itemEl(root, "architecture").querySelectorAll("[data-value]")).toHaveLength(0);
  await expect(textOf(itemEl(root, "architecture"))).not.toContain(m.business.architecture.single);
  const name = itemEl(root, "name");
  await expect(name.dataset["done"]).toBe("true");
  await expect(textOf(name)).toContain("ORIVILO");
  await expect(textOf(must(name.querySelector("[data-marks=unchecked]"), "unchecked"))).toBe(
    fill(m.business.marks.unchecked, { nodes: m.business.node.positioning }),
  );
  await expectSteps(root, m, g);
  await expectOneStartEdge(root);
}

export const GuidebookOpen: Story = {
  args: { guidebook: open("th") },
  play: async ({ canvasElement }) => {
    await openPlay(canvasElement, th);
  },
};

export const GuidebookOpenEnglish: Story = {
  args: { guidebook: open("en") },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await openPlay(canvasElement, en);
  },
};

/** Positioning agreed and nothing else answered: each step that waits for the person asks its question (P6). */
export const GuidebookOpenAsks: Story = {
  args: { guidebook: openAsks("th") },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const g = openAsks("th");
    await expectItemsMatchData(root, th, g);
    await expectOpenQuiet(root);
    const asked = items(g).filter((i) => i.questions.length > 0);
    await expect(asked.map((i) => i.id)).toEqual(["identity-frame", "architecture"]);
    await expect(
      [...itemEl(root, "identity-frame").querySelectorAll("[data-ask] li")].map(textOf),
    ).toEqual([th.business.question.person, th.business.question.never]);
    // The name asks by the board's button, so it shows its state line only (guidebook-open-1).
    await expect(itemEl(root, "name").querySelectorAll("[data-ask]")).toHaveLength(0);
    // P25: at 360 the person question wraps, and the two questions still read as two lines apart.
    await atWindow(360, 900, async () => {
      expectPersonQuestionWraps(root, th);
      expectPeerLinesApart(root, ["ask", "head"]);
    });
  },
};

// ----- skipped (rows 5, 6, 19) -----

async function skippedPlay(canvasElement: HTMLElement, m: Messages) {
  const root = rootOf(canvasElement);
  const g = skipped(localeOf(m));
  await expectItemsMatchData(root, m, g);
  await expectSteps(root, m, g);
  await expectOpenQuiet(root);
  const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
  await expect(steps).toHaveLength(1);
  await expect(textOf(must(steps[0]?.querySelector("h3") ?? null, "h3"))).toBe(
    m.business.node.positioning,
  );
  await expect(
    [...root.querySelectorAll("[data-rests] > li")].map((li) => li.getAttribute("data-rests-item")),
  ).toEqual([
    "identity-frame",
    "architecture",
    "name",
    "core-idea",
    "logo-type",
    "color",
    "typography",
  ]);
  // The items that rest on it show the lines the board shows; "rests on" never stands without its pair.
  for (const id of ["architecture", "logo-type", "color", "typography"]) {
    const marks = must(itemEl(root, id).querySelector("[data-marks=provisional]"), `${id} marks`);
    await expect([...marks.querySelectorAll("p")].map(textOf)).toEqual([
      m.strategy.provisional,
      fill(m.business.marks.restsOn, { nodes: m.business.node.positioning }),
    ]);
  }
  for (const id of ["identity-frame", "name", "core-idea"]) {
    await expect(itemEl(root, id).querySelectorAll("[data-marks=provisional]")).toHaveLength(0);
  }
  // P8: a mark is a line to read, 14 px in primary ink, one step stronger than the state line.
  const ink = getComputedStyle(must(root.querySelector("[data-preface] p"), "preface")).color;
  for (const line of root.querySelectorAll(
    "[data-item] [data-marks] p, [data-item] p[data-marks]",
  )) {
    await expect(px(line)).toBe("14px");
    await expect(getComputedStyle(line).color).toBe(ink);
  }
  const state = must(itemEl(root, "architecture").querySelector("[data-state]"), "state");
  await expect(getComputedStyle(state).color).not.toBe(ink);
  await expectOneStartEdge(root);
}

export const GuidebookSkipped: Story = {
  args: { guidebook: skipped("th") },
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, th);
  },
};

export const GuidebookSkippedEnglish: Story = {
  args: { guidebook: skipped("en") },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, en);
  },
};

/** Row 6, W2 case B: three skipped steps in node order; two of them have nothing resting on them. */
export const GuidebookSkippedSteps: Story = {
  args: { guidebook: skippedSteps("th") },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const g = skippedSteps("th");
    await expectItemsMatchData(root, th, g);
    await expectSteps(root, th, g);
    const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")];
    await expect(steps.map((s) => s.dataset["step"])).toEqual([
      "positioning",
      "identity-frame",
      "core-idea",
    ]);
    await expect(
      [...(steps[0]?.querySelectorAll("[data-rests] > li") ?? [])].map((li) =>
        li.getAttribute("data-rests-item"),
      ),
    ).toEqual(["architecture", "name"]);
    for (const step of steps.slice(1)) {
      await expect(textOf(step)).toContain(th.business.guidebook.unconfirmed.nothing);
      await expect(textOf(step)).not.toContain(th.business.guidebook.unconfirmed.restsOnIt);
    }
    // Brand personality and Core idea are skipped in the foundation section, with their questions and no value.
    for (const id of ["identity-frame", "core-idea"]) {
      await expect(textOf(must(itemEl(root, id).querySelector("[data-state]"), "state"))).toBe(
        th.business.state.skipped,
      );
      await expect(itemEl(root, id).querySelectorAll("[data-value]")).toHaveLength(0);
    }
    // P9: the steps sit 32 apart.
    for (let i = 1; i < steps.length; i++) {
      near(
        rect(must(steps[i] ?? null, "step")).top - rect(must(steps[i - 1] ?? null, "step")).bottom,
        32,
        `step ${i}`,
      );
    }
    // P25: at 360 the person question of the skipped Brand personality step wraps, and its two questions stay apart.
    await atWindow(360, 900, async () => {
      expectPersonQuestionWraps(root, th);
      expectPeerLinesApart(root, ["ask", "step", "head"]);
    });
  },
};

// ----- stale (row 7) -----

export const GuidebookStale: Story = {
  args: { guidebook: stale("th") },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const g = stale("th");
    await expectItemsMatchData(root, th, g);
    await expectSteps(root, th, g);
    const positioning = itemEl(root, "positioning");
    await expect(positioning.querySelectorAll("[data-marks=stale]")).toHaveLength(1);
    await expect(textOf(must(positioning.querySelector("[data-marks=stale]"), "stale"))).toBe(
      th.business.positioning.stale,
    );
    await expect(positioning.querySelectorAll("[data-ask]")).toHaveLength(1);
    await expect(positioning.querySelectorAll("[data-value]")).toHaveLength(0);
    // The architecture and Logo type wait for Positioning; Colour and Typography keep their decisions, unchecked.
    const waits = fill(th.business.state.waiting, { nodes: th.business.node.positioning });
    for (const id of ["architecture", "logo-type"]) {
      await expect(textOf(must(itemEl(root, id).querySelector("[data-state]"), "state"))).toBe(
        waits,
      );
    }
    for (const id of ["color", "typography"]) {
      await expect(itemEl(root, id).dataset["done"]).toBe("true");
      await expect(
        textOf(must(itemEl(root, id).querySelector("[data-marks=unchecked]"), "unchecked")),
      ).toBe(fill(th.business.marks.unchecked, { nodes: th.business.node.positioning }));
    }
    await expect(
      sectionEl(root, "unconfirmed").querySelectorAll("[data-unconfirmed-none]"),
    ).toHaveLength(1);
  },
};

// ----- the visual items (rows 17 to 19, P19 to P21) -----

export const GuidebookVisual: Story = {
  args: { guidebook: done("th") },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await expectVisualDone(root, th, done("th"));
    await expectOneStartEdge(root);
  },
};

export const GuidebookVisualEnglish: Story = {
  args: { guidebook: done("en") },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    await expectVisualDone(root, en, done("en"));
    // In English the reasons, styles and labels are English; the family and licence names stay as written.
    await expect(textOf(itemEl(root, "typography"))).toContain("Sarabun");
    await expect(textOf(itemEl(root, "typography"))).not.toMatch(thaiText);
    await expect(textOf(itemEl(root, "color"))).not.toMatch(thaiText);
  },
};

/** Row 18: Colour partly, Typography asks, Logo type waits for the name (P20). */
export const GuidebookVisualOpen: Story = {
  args: { guidebook: visualOpen("th") },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const g = visualOpen("th");
    await expectItemsMatchData(root, th, g);
    const color = itemEl(root, "color");
    await expect(textOf(must(color.querySelector("[data-state]"), "state"))).toBe(
      th.business.state.partly,
    );
    await expect(color.dataset["done"]).toBe("true");
    // The undecided signature keeps its place, first, with its line and its question.
    const fields = [...color.querySelectorAll("[data-value] > [data-field]")];
    await expect(fields.map((f) => f.getAttribute("data-field"))).toEqual([
      "signature",
      "neutral",
      "canvas",
    ]);
    const signature = must(fields[0] ?? null, "signature");
    await expect(textOf(signature)).toContain(th.business.color.waitsForLineup);
    await expect([...signature.querySelectorAll("[data-ask] li")].map(textOf)).toEqual([
      th.business.question.lineup,
    ]);
    await expect(color.querySelectorAll("[data-ask]")).toHaveLength(1);
    await expect(color.querySelectorAll("[data-labels]")).toHaveLength(1);
    // Typography waits for the person's answer and shows no family; Logo type waits for Name.
    const typography = itemEl(root, "typography");
    await expect(textOf(must(typography.querySelector("[data-state]"), "state"))).toBe(
      th.business.state.needsAnswer,
    );
    await expect([...typography.querySelectorAll("[data-ask] li")].map(textOf)).toEqual([
      th.business.question.scripts,
    ]);
    await expect(typography.querySelectorAll("[data-value]")).toHaveLength(0);
    const logoType = itemEl(root, "logo-type");
    await expect(textOf(must(logoType.querySelector("[data-state]"), "state"))).toBe(
      fill(th.business.state.waiting, { nodes: th.business.node.name }),
    );
    await expect(logoType.querySelectorAll("[data-ask], [data-value]")).toHaveLength(0);
    // As P6 on the open items: nothing over 14 px outside a decided field.
    await expectOpenQuiet(root);
    await expectNoColourValue(root);
  },
};

/** Row 19: the visual items rest on the skipped positioning, and are listed under it (P21). */
export const GuidebookVisualSkipped: Story = {
  args: { guidebook: skipped("th") },
  play: async ({ canvasElement }) => {
    const root = rootOf(canvasElement);
    const g = skipped("th");
    await expectItemsMatchData(root, th, g);
    await expectSteps(root, th, g);
    const rests = [...root.querySelectorAll("[data-rests] > li")].slice(-3);
    await expect(rests.map((li) => li.getAttribute("data-rests-item"))).toEqual([
      "logo-type",
      "color",
      "typography",
    ]);
    for (const li of rests) {
      await expect(textOf(must(li.querySelector("span:last-child"), "line"))).toBe(
        fill(th.business.marks.restsOn, { nodes: th.business.node.positioning }),
      );
    }
    for (const id of ["logo-type", "color", "typography"]) {
      const marks = must(itemEl(root, id).querySelector("[data-marks=provisional]"), "marks");
      await expect([...marks.querySelectorAll("p")].map(textOf)).toEqual([
        th.strategy.provisional,
        fill(th.business.marks.restsOn, { nodes: th.business.node.positioning }),
      ]);
    }
    await expectNoColourValue(root);
  },
};

// ----- untrusted text (row 12, P14) -----

async function untrustedPlay(canvasElement: HTMLElement, m: Messages) {
  const root = rootOf(canvasElement);
  const g = untrusted(localeOf(m));
  await expectFitsAt360(canvasElement);
  const canvas = within(root);
  // Each hostile text shows as literal text; nothing is created from it.
  for (const text of [
    g.projectName,
    "<img src=x onerror=alert(1)>",
    "<script>alert(1)</script>",
    "<a href=https://evil.example>click</a>",
  ]) {
    await expect(canvas.getAllByText(text, { exact: false }).length).toBeGreaterThan(0);
  }
  await expect(root.querySelectorAll("img, script, iframe, object, embed")).toHaveLength(0);
  await expect([...root.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([BOARD]);
  // The working name is also inside Logo type's length line, as text.
  const length = must(itemEl(root, "logo-type").querySelector("[data-name-length]"), "length");
  await expect(length.querySelector("bdi")?.textContent).toBe("<img src=x onerror=alert(1)>");
  await expect(length.children).toHaveLength(1);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    Math.max(360, window.innerWidth),
  );
}

export const GuidebookUntrustedText: Story = {
  args: { guidebook: untrusted("th") },
  render: (args) => narrow(args.guidebook as Guidebook),
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, th);
  },
};

export const GuidebookUntrustedTextEnglish: Story = {
  args: { guidebook: untrusted("en") },
  render: (args) => narrow(args.guidebook as Guidebook),
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, en);
  },
};

// ----- language switch (row 14, P16) -----

function SwitchHost({ from }: { from: Locale }) {
  const [locale, setLocale] = useState<Locale>(from);
  // One load: the guidebook is held once and never rebuilt, so the switch can only redraw its lines.
  const [g] = useState(() => skipped(from));
  const next: Locale = locale === "th" ? "en" : "th";
  return (
    <LocaleProvider locale={locale}>
      <button type="button" data-switch-locale={next} onClick={() => setLocale(next)}>
        {next.toUpperCase()}
      </button>
      {screen(g)}
    </LocaleProvider>
  );
}

async function switchPlay(canvasElement: HTMLElement, from: Locale) {
  const first = from === "th" ? th : en;
  const second = from === "th" ? en : th;
  const root = rootOf(canvasElement);
  const h1 = must(root.querySelector("h1"), "h1");
  const name = must(root.querySelector("[data-cover] bdi"), "bdi");
  const sectionTitles = (m: Messages) =>
    [...root.querySelectorAll("h2")].map(textOf).join("|") ===
    [
      m.business.guidebook.section.business,
      m.business.guidebook.section.foundation,
      m.business.guidebook.section.visual,
      m.business.guidebook.section.unconfirmed,
      m.business.guidebook.section.notHeld,
    ].join("|");
  await expect(textOf(h1)).toBe(first.business.guidebook.title);
  await expect(sectionTitles(first)).toBe(true);
  await expectOneStartEdge(root);
  await userEvent.click(
    must(canvasElement.querySelector<HTMLElement>("[data-switch-locale]"), "switch"),
  );
  await waitFor(() => expect(textOf(h1)).toBe(second.business.guidebook.title));
  // No remount: the same elements, now in the other language; the typed name is as typed.
  await expect(root.querySelector("h1")).toBe(h1);
  await expect(root.querySelector("[data-cover] bdi")).toBe(name);
  await expect(sectionTitles(second)).toBe(true);
  await expect(textOf(sectionEl(root, "notHeld"))).toContain(
    notHeldLines(second, GUIDEBOOK_NOT_HELD[0]).title,
  );
  await expect(textOf(sectionEl(root, "unconfirmed"))).toContain(
    second.business.guidebook.unconfirmed.restsOnIt,
  );
  await expect(textOf(sectionEl(root, "unconfirmed"))).not.toContain(
    first.business.guidebook.unconfirmed.restsOnIt,
  );
  await expectOneStartEdge(root);
  // Thai text keeps its natural letter spacing (design 15).
  for (const el of root.querySelectorAll<HTMLElement>("*")) {
    const own = [...el.childNodes].some(
      (n) => n.nodeType === 3 && thaiText.test(n.textContent ?? ""),
    );
    if (own) await expect(["normal", "0px"]).toContain(getComputedStyle(el).letterSpacing);
  }
}

export const GuidebookSwitchToEnglish: Story = {
  render: () => <SwitchHost from="th" />,
  play: async ({ canvasElement }) => {
    await switchPlay(canvasElement, "th");
  },
};

export const GuidebookSwitchToThai: Story = {
  render: () => <SwitchHost from="en" />,
  play: async ({ canvasElement }) => {
    await switchPlay(canvasElement, "en");
  },
};

// ----- narrow (row 15, P13, P24) -----

async function narrowPlay(canvasElement: HTMLElement, m: Messages) {
  const root = rootOf(canvasElement);
  const g = long(localeOf(m));
  const frame = must(canvasElement.querySelector<HTMLElement>("[data-narrow]"), "[data-narrow]");
  await expectFitsAt360(canvasElement);
  expectNoGlyphClip(root, frame);
  // One start edge at 16, the lead block in one column.
  await expectOneStartEdge(root);
  await expectLead(root, m, g, 1);
  near(leftOf(root), rect(frame).left + 16, "the start edge at 360");
  near(rect(root).width, 360, "the screen's width at 360");
  // The long core idea wraps and its lines stay clear of each other.
  if (inVitest) {
    const statement = must(
      itemEl(root, "core-idea").querySelector<HTMLElement>("[data-value] p"),
      "the core idea",
    );
    await expect(statement.getBoundingClientRect().height).toBeGreaterThan(40);
    await expectLinesClear(statement);
  }
  // Focus is visible on the back link, the one control.
  await expectBackLink(root, m);
}

export const GuidebookNarrow: Story = {
  args: { guidebook: long("th") },
  render: (args) => narrow(args.guidebook as Guidebook),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
    // P25: the notes, labels and heads of the long fixture, in the 360 frame, in Thai.
    expectPeerLinesApart(rootOf(canvasElement), ["notes", "labels", "head", "colour"]);
  },
};

export const GuidebookNarrowDark: Story = {
  args: { guidebook: long("th") },
  render: (args) => (
    <Under profile="neutral" mode="dark">
      {narrow(args.guidebook as Guidebook)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

export const GuidebookNarrowEnglish: Story = {
  args: { guidebook: long("en") },
  render: (args) => narrow(args.guidebook as Guidebook),
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, en);
  },
};

/** P24: the visual items at 360 in light and in dark. */
async function visualNarrowPlay(canvasElement: HTMLElement) {
  const root = rootOf(canvasElement);
  const frame = must(canvasElement.querySelector<HTMLElement>("[data-narrow]"), "[data-narrow]");
  await expectFitsAt360(canvasElement);
  expectNoGlyphClip(root, frame);
  await expectVisualDone(root, th, done("th"));
  await expectOneStartEdge(root);
}

export const GuidebookVisualNarrow: Story = {
  args: { guidebook: done("th") },
  render: (args) => narrow(args.guidebook as Guidebook),
  play: async ({ canvasElement }) => {
    await visualNarrowPlay(canvasElement);
  },
};

export const GuidebookVisualNarrowDark: Story = {
  args: { guidebook: done("th") },
  render: (args) => (
    <Under profile="neutral" mode="dark">
      {narrow(args.guidebook as Guidebook)}
    </Under>
  ),
  play: async ({ canvasElement }) => {
    await visualNarrowPlay(canvasElement);
  },
};

// ----- the drafted positioning (row 20, P22, P23) -----

/** A statement the page must not show: none of the drafted options, the edited line or the model id. */
async function expectNoDraftText(root: HTMLElement, locale: Locale, shown: readonly string[]) {
  const { options, edited: editedText } = draftTexts(locale);
  for (const text of [...options, editedText]) {
    if (shown.includes(text)) continue;
    await expect(textOf(root), `an option on the page: ${text}`).not.toContain(text);
  }
}

/** P22: a draft that waits shows the state line only, with no option, no question and no AI label. */
async function awaitingPlay(canvasElement: HTMLElement, m: Messages) {
  const root = rootOf(canvasElement);
  const locale = localeOf(m);
  const g = awaitingChoice(locale);
  await expectItemsMatchData(root, m, g);
  await expectOpenQuiet(root);
  const positioning = itemEl(root, "positioning");
  await expect(positioning.dataset["done"]).toBe("false");
  await expect([...positioning.querySelectorAll("h3, p")].map(textOf)).toEqual([
    itemTitle(m, "positioning"),
    m.business.state.awaitingChoice,
  ]);
  await expect(positioning.querySelectorAll("[data-ask]")).toHaveLength(0);
  await expect(positioning.querySelectorAll("[data-value]")).toHaveLength(0);
  await expectNoDraftText(root, locale, []);
  await expect(textOf(root)).not.toContain(DRAFT_MODEL);
  for (const line of AI_LABELS(m)) {
    await expect(textOf(root), `the AI label "${line}"`).not.toContain(line);
  }
  // The foundation items that are not given wait for Positioning.
  const waits = fill(m.business.state.waiting, { nodes: m.business.node.positioning });
  for (const id of ["identity-frame", "architecture", "name", "core-idea"]) {
    await expect(textOf(must(itemEl(root, id).querySelector("[data-state]"), "state"))).toBe(waits);
  }
  await expectSteps(root, m, g);
  await expectOneStartEdge(root);
}

/** The colour of the `by.own` line of the done project, drawn beside the page so it resolves in the same boundary. */
function ownLabelColour(root: HTMLElement, locale: Locale, m: Messages): string {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <LocaleProvider locale={locale}>{screen(done(locale))}</LocaleProvider>,
  );
  must(root.parentElement, "the story's boundary").append(host);
  try {
    const line = [...host.querySelectorAll("[data-item=positioning] p")].find(
      (p) => textOf(p) === m.business.positioning.by.own,
    );
    return getComputedStyle(must(line ?? null, "the by.own line")).color;
  } finally {
    host.remove();
  }
}

/**
 * P23: a picked or edited positioning shows its statement, the board's label with the model id (14 px,
 * the colour of `by.own`), then the agreed line; the other statements of the draft show nowhere.
 */
async function pickedPlay(canvasElement: HTMLElement, m: Messages, kind: "picked" | "edited") {
  const root = rootOf(canvasElement);
  const locale = localeOf(m);
  const g = kind === "picked" ? picked(locale) : edited(locale);
  const texts = draftTexts(locale);
  const shown = kind === "picked" ? texts.options[1] : texts.edited;
  await expectItemsMatchData(root, m, g);
  const positioning = itemEl(root, "positioning");
  await expect(textOf(must(positioning.querySelector("[data-state]"), "state"))).toBe(
    m.business.state.agreed,
  );
  const value = must(positioning.querySelector<HTMLElement>("[data-value]"), "value");
  const line = fill(m.business.positioning.by[kind], { model: DRAFT_MODEL });
  const lines = [...value.querySelectorAll("p")];
  await expect(lines.map(textOf)).toEqual([shown, line, m.business.positioning.gatePassed]);
  await expect(px(must(lines[0] ?? null, "statement"))).toBe("20px");
  const label = must(lines[1] ?? null, "label");
  await expect(px(label)).toBe("14px");
  await expect(getComputedStyle(label).color).toBe(ownLabelColour(root, locale, m));
  // The label stands once on the page, with its model id, on Positioning.
  await expect(textOf(root).split(line)).toHaveLength(2);
  await expect(textOf(root).split(DRAFT_MODEL)).toHaveLength(2);
  await expect(textOf(positioning)).not.toContain(m.business.positioning.by.own);
  await expect(textOf(root).split(shown)).toHaveLength(2);
  await expectNoDraftText(root, locale, [shown]);
  await expectOneStartEdge(root);
  await expectRhythm(root);
}

/** A stored draft of three options and no choice: waiting for the person (row 20, first project). */
export const GuidebookAwaitingChoice: Story = {
  args: { guidebook: awaitingChoice("th") },
  play: async ({ canvasElement }) => {
    await awaitingPlay(canvasElement, th);
  },
};

export const GuidebookAwaitingChoiceEnglish: Story = {
  args: { guidebook: awaitingChoice("en") },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await awaitingPlay(canvasElement, en);
  },
};

/** Option 2 picked: the statement with the label the board shows and the saved model id (row 20, second project). */
export const GuidebookPicked: Story = {
  args: { guidebook: picked("th") },
  play: async ({ canvasElement }) => {
    await pickedPlay(canvasElement, th, "picked");
  },
};

export const GuidebookPickedEnglish: Story = {
  args: { guidebook: picked("en") },
  decorators: [inEnglish],
  play: async ({ canvasElement }) => {
    await pickedPlay(canvasElement, en, "picked");
  },
};

/** Option 2 edited by the person: the edited statement with `business.positioning.by.edited` (design 14, Edited). */
export const GuidebookEdited: Story = {
  args: { guidebook: edited("th") },
  play: async ({ canvasElement }) => {
    await pickedPlay(canvasElement, th, "edited");
  },
};

// ----- no AI, no claim (row 9, 21, 23, P15) -----

/** The lines `guidebook-honest-1` lists, where a claim word may stand because the line says a thing is not so. */
const CLAIM_LINES = (m: Messages) => [
  m.business.name.notScreened,
  m.business.identity.hypothesis,
  m.business.guidebook.draftNote,
  m.business.guidebook.notHeld["ip-screen"].reason,
  m.business.guidebook.notHeld.validation.reason,
  m.business.color.hypothesis,
  m.business.color.familyOnly,
  m.business.typography.noPersonalityLink,
  m.business.logoType.crowdingNotChecked,
];

const AI_LABEL_PATHS = [
  ["brandReport", "engine", "evidence.fromModel"],
  ["strategy", "draftedOptions"],
  ["business", "positioning", "draftedBy"],
  ["business", "positioning", "by", "picked"],
  ["business", "positioning", "by", "edited"],
  ["business", "logoMark", "draftLabel"],
] as const;

/**
 * The six AI labels of `guidebook-honest-1`, as the catalog words them, cut at a placeholder. A
 * label the catalog does not hold yet (such as ORV-126's `logoMark.draftLabel`) adds nothing; the
 * test below fails on the first one that lands and shows on the page.
 */
function AI_LABELS(m: Messages): string[] {
  const out: string[] = [];
  for (const path of AI_LABEL_PATHS) {
    let at: unknown = m;
    for (const key of path)
      at = typeof at === "object" && at !== null ? (at as Record<string, unknown>)[key] : undefined;
    if (typeof at !== "string") continue;
    const head = (at.split("{")[0] ?? "").trim();
    if (head.length >= 4) out.push(head);
  }
  return out;
}

/** The page as markup in a detached element: every state in turn without a second landmark on the story's page. */
function pageOf(g: Guidebook, locale: Locale): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <LocaleProvider locale={locale}>{screen(g)}</LocaleProvider>,
  );
  return host;
}

/**
 * `allowed` is the one exception of `guidebook-honest-1` (open question 10): the board's label of a
 * picked or edited positioning, with its model id, on the Positioning item only. It is taken out
 * of the page first, so the same label anywhere else, or its model id's digits, still fails below.
 */
async function expectNoClaims(
  host: HTMLElement,
  m: Messages,
  label: string,
  allowed: "picked" | "edited" | null = null,
) {
  const gb = m.business.guidebook;
  if (allowed !== null) {
    const line = fill(m.business.positioning.by[allowed], { model: DRAFT_MODEL });
    const own = [...host.querySelectorAll("[data-item=positioning] p")].filter(
      (p) => textOf(p) === line,
    );
    await expect(own, `${label}: the ${allowed} line on the positioning item`).toHaveLength(1);
    must(own[0] ?? null, "the label line").textContent = "";
  }
  // The honest line stands once; every other line, minus the ones that deny, holds no AI label.
  const lines = [...host.querySelectorAll("p, dd, li, dt, span, h1, h2, h3")].map(textOf);
  const text = textOf(host);
  await expect(text.split(gb.byRule), label).toHaveLength(2);
  await expect(text.split(gb.draftNote), label).toHaveLength(2);
  let rest = text.replace(gb.byRule, "");
  for (const line of CLAIM_LINES(m)) rest = rest.split(line).join(" ");
  for (const line of AI_LABELS(m)) {
    await expect(text, `${label}: the AI label "${line}"`).not.toContain(line);
  }
  await expect(rest, `${label}: a claim`).not.toMatch(
    /\b(final|verified|tested|screened|registered)\b/i,
  );
  // No colour value, and no number but the ones the nodes' views show.
  await expect(text, label).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  for (const allowed of host.querySelectorAll(
    "[data-rule], [data-name-length], [data-cover] span, [data-field=personality] dd, [data-field=signature], [data-field=neutral], [data-field=canvas]",
  )) {
    allowed.textContent = "";
  }
  // A licence is named as written ("SIL Open Font License 1.1"); the number is part of its name.
  const digit = /.{0,30}\d.{0,30}/.exec(textOf(host).split("SIL Open Font License 1.1").join(""));
  await expect(digit?.[0] ?? null, `${label}: a number`).toBeNull();
  await expect(host.querySelectorAll("button, input, textarea, select, form"), label).toHaveLength(
    0,
  );
  await expect(lines.length, label).toBeGreaterThan(0);
}

/** The states whose Positioning carries the board's label, by their name in `everyState`. */
const DRAFT_LABELLED = { picked: "picked", edited: "edited" } as const;

/**
 * Every state of rows 1, 2, 4 to 7, 17 to 20: no AI label, no claim, no colour value, no extra number
 * (rows 9, 21, 23). The picked and edited positioning hold the one exception, on Positioning only.
 */
export const GuidebookNoAi: Story = {
  play: async () => {
    for (const locale of ["th", "en"] as const) {
      const m = locale === "th" ? th : en;
      for (const [name, g] of everyState(locale)) {
        const allowed = name === "picked" || name === "edited" ? DRAFT_LABELLED[name] : null;
        await expectNoClaims(pageOf(g, locale), m, `${locale} ${name}`, allowed);
      }
    }
  },
};

// ----- access (row 11, P18) -----

/** The three notices, one after the other: the title, the notice, no section and no back link. */
export const GuidebookAccess: Story = {
  render: () => (
    <>
      {(["signed-out", "not-allowed", "not-configured"] as const).map((access) => (
        <div key={access} data-access={access}>
          <GuidebookScreen access={access} signInHref="/account" />
        </div>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    for (const access of ["signed-out", "not-allowed", "not-configured"] as const) {
      const wrapper = must(
        canvasElement.querySelector<HTMLElement>(`[data-access=${access}]`),
        access,
      );
      await expectAccessScreen(wrapper, th, th.business.guidebook.title, access);
      await expect(wrapper.querySelectorAll("[data-section], [data-back]")).toHaveLength(0);
      await expect(wrapper.querySelectorAll("h1")).toHaveLength(1);
      await expectOneStartEdgeAccess(wrapper);
    }
    const link = must(
      canvasElement.querySelector<HTMLElement>("[data-access=signed-out] a"),
      "sign-in",
    );
    await expect(rect(link).height).toBe(40);
  },
};

/** The access screen has one start edge too: the title and the notice start at the same x. */
async function expectOneStartEdgeAccess(wrapper: HTMLElement) {
  const root = rootOf(wrapper);
  const left = leftOf(root);
  for (const el of root.querySelectorAll("h1, p, a")) near(rect(el).left, left, textOf(el));
}
