import type { BusinessView, EntryProblem, EntryRequest, StoredEntry } from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useMemo, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import {
  expectInkClearsAbove,
  expectNoGlyphClip,
  expectSameHeight,
  inVitest,
} from "../testing/visual-asserts";
import { BusinessBoardScreen } from "./business-board";
import { foundationProject } from "./business-fixtures";
import { atWindow, en, expectFitsAt360, FixtureNote, textOf, th } from "./business-story-helpers";
import { nodeTitle } from "./business-text";
import {
  CORE_IDEA_TEXT,
  coreIdeaEntry,
  coreIdeaSkippedEntry,
  entryOf,
  givenEntry,
  LONG_CORE_IDEA,
  PERSONALITY_ANSWERS,
  skippedEntry,
} from "./foundation-fixtures";

type Lang = "th" | "en";
type Gate = "open" | "skipped" | "agreed" | "stale";

/** One saved project of a story: where Positioning stands and the foundation entries it holds. */
type Project = { gate: Gate; entries: StoredEntry[] };

/** What the stub action answers: saved, or a line the page would have resolved from `saved.errors.*`. */
type StubResult = { ok: true } | { ok: false; failure: string; problems?: EntryProblem[] };
/** Shared by every story below; each play resets it first. */
const enter = fn<(request: EntryRequest) => Promise<StubResult>>();

/** Story-only copy: the lines `saved.errors.rate-limited` gives for a 20 minute wait (apps/web catalog). */
const RATE_LIMITED = {
  th: "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที",
  en: "Too many requests in a short time, so this was not done. Try again in 20 minutes.",
} as const;

/**
 * What the page does around the board, with a stub action in place of the server: it holds the
 * entries of each project it was given, runs the action while `pending` is set, and builds the view
 * again from the same engine function once the action has saved. Nothing is saved anywhere. With
 * several projects, a button outside the board (and outside the viewer) picks the one the board
 * shows, so one mounted board reads each fixture in turn.
 */
function BoardHost({ locale, projects }: { locale: Lang; projects: Project[] }) {
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState(() => projects.map((p) => p.entries));
  const [pending, setPending] = useState<"saving" | null>(null);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [problems, setProblems] = useState<EntryProblem[] | undefined>(undefined);
  const project = projects[index] as Project;
  const held = entries[index] as StoredEntry[];
  const view: BusinessView = useMemo(
    () => foundationProject(locale, project.gate, held),
    [locale, project.gate, held],
  );
  const onEnter = (request: EntryRequest) => {
    setPending("saving");
    setFailure(undefined);
    void enter(request).then((result) => {
      if (result.ok) {
        setEntries((now) => now.map((e, i) => (i === index ? [...e, entryOf(request)] : e)));
      } else {
        setFailure(result.failure);
        setProblems(result.problems);
      }
      setPending(null);
    });
  };
  return (
    <>
      {projects.length > 1 ? (
        <div className="flex gap-2 p-4">
          {projects.map((_, i) => (
            <button key={i} type="button" data-fixture={i} onClick={() => setIndex(i)}>
              {i + 1}
            </button>
          ))}
        </div>
      ) : null}
      <BusinessBoardScreen
        access="ready"
        view={view}
        signInHref="/account"
        listHref="/business"
        foundation={{
          pending,
          problems,
          failure,
          onEnter,
          onDismiss: () => setFailure(undefined),
        }}
      />
    </>
  );
}

const meta = {
  title: "Examples/Application: Core idea",
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
          "The Core idea node of the business board (ORV-291 PR 3, ORV-296): the second gate. The card shows its state and a gate line; its view holds the one thing to remember and the core idea, both in the person's own words, and the controls to write one's own and agree, or to skip for now. Nothing builds on the core idea until the person agrees to it. Everything here is rule-based: no model drafts, picks or edits these words and nothing is sent anywhere. Every project is a labelled fixture; nobody wrote these words.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ----- helpers -----

const nodeEl = (root: ParentNode, id: string) =>
  root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
const cardOf = (root: ParentNode) =>
  nodeEl(root, "core-idea").querySelector(".ds-node") as HTMLElement;
const focusedIs = (el: Element) => waitFor(() => expect(document.activeElement).toBe(el));

/** React Flow keeps a node hidden until it is measured and draws edges after: wait for all of it. */
const boardReady = (root: HTMLElement) =>
  waitFor(() => {
    expect(root.querySelectorAll(".react-flow__node")).toHaveLength(9);
    expect(root.querySelectorAll(".react-flow__edge")).toHaveLength(13);
    for (const n of root.querySelectorAll<HTMLElement>(".react-flow__node")) {
      expect(n.style.visibility).not.toBe("hidden");
    }
  });

/** The viewer is portaled to the body, so it is looked up there. */
const dialogNamed = (name: string) => within(document.body).findByRole("dialog", { name });
const noDialog = () =>
  waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());

/** Opens Core idea from the keyboard, as `expectFoundationCard` does, and returns its view. */
async function openCore(root: HTMLElement, m: Messages) {
  await boardReady(root);
  const el = nodeEl(root, "core-idea");
  el.focus({ preventScroll: true });
  await waitFor(() => expect(el).toHaveFocus());
  await userEvent.keyboard("{Enter}");
  const dialog = await dialogNamed(nodeTitle(m, "core-idea"));
  return { dialog, v: dialog.querySelector<HTMLElement>('[data-node="core-idea"]') as HTMLElement };
}

/** Escape closes the viewer; focus lands back on the card that opened it. */
async function closeViewer(root: HTMLElement) {
  await userEvent.keyboard("{Escape}");
  await noDialog();
  await waitFor(() => expect(document.activeElement).toBe(nodeEl(root, "core-idea")));
}

const stateLineOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>("[data-node-state]") as HTMLElement;
const fieldOf = (v: HTMLElement, field: "remember" | "coreIdea") =>
  v.querySelector<HTMLElement>(`[data-field="${field}"]`) as HTMLElement;
/** The lines of one field, as text, heading first. */
const linesOf = (field: HTMLElement) => [...field.children].map((c) => textOf(c));
const buttonsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLButtonElement>("button")];
const choicesOf = (v: HTMLElement) => buttonsOf(v).map((b) => b.dataset["choice"]);
const choiceOf = (v: HTMLElement, choice: string) =>
  v.querySelector<HTMLElement>(`[data-choice="${choice}"]`) as HTMLElement;
const textareasOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLTextAreaElement>("textarea")];
/** The failure line under the controls: the live region that follows the row of buttons. */
const failureRegionOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>("[data-row] + [role=alert]") as HTMLElement;

const waitsFor = (m: Messages, ...ids: Parameters<typeof nodeTitle>[1][]) =>
  fill(m.business.state.waiting, {
    nodes: new Intl.ListFormat(m === th ? "th" : "en", { type: "conjunction" }).format(
      ids.map((id) => nodeTitle(m, id)),
    ),
  });

/** The state line as a status, with the state it names, in words and no badge. */
async function expectState(v: HTMLElement, key: string, line: string) {
  const el = stateLineOf(v);
  await expect(el).toHaveAttribute("role", "status");
  await expect(el.dataset["nodeState"]).toBe(key);
  await expect(textOf(el)).toBe(line);
  await expect(v.querySelector(".ds-badge")).toBeNull();
}

/** The card at rest: its state line, then the gate line as the last paragraph (design 3). */
async function expectCard(root: HTMLElement, key: string, line: string, gate: string) {
  const card = cardOf(root);
  await expect(card.querySelector<HTMLElement>("[data-node-state]")?.dataset["nodeState"]).toBe(
    key,
  );
  await expect([...card.querySelectorAll<HTMLElement>(".ds-node__body p")].map(textOf)).toEqual([
    line,
    gate,
  ]);
  await expect(card.querySelector("bdi")).toBeNull();
}

/** The fallback in both fields: neither holds words. */
async function expectFallbacks(v: HTMLElement, text: string) {
  for (const field of [fieldOf(v, "remember"), fieldOf(v, "coreIdea")]) {
    await expect(field.children).toHaveLength(2);
    await expect((field.children[0] as HTMLElement).tagName).toBe("H3");
    await expect(textOf(field.children[1] as HTMLElement)).toBe(text);
    await expect(field.querySelector("bdi")).toBeNull();
  }
}

const hosted = (locale: Lang, projects: Project[]) => () => (
  <BoardHost locale={locale} projects={projects} />
);
const hostedEnglish = (projects: Project[]) => () => (
  <LocaleProvider locale="en">
    <BoardHost locale="en" projects={projects} />
  </LocaleProvider>
);

/** Positioning agreed and a given personality: the gate of the first rows is open (spec rows 26, 27, 28). */
const agreedWithPersonality = (locale: Lang): Project => ({
  gate: "agreed",
  entries: [givenEntry(PERSONALITY_ANSWERS[locale])],
});

// ----- the four states, on the card and in the view (spec row 31) -----

type StateKind = "waiting" | "open" | "skipped" | "agreed";

const STATE_PROJECT = (locale: Lang): Record<StateKind, Project> => ({
  waiting: { gate: "open", entries: [] },
  open: agreedWithPersonality(locale),
  skipped: {
    gate: "agreed",
    entries: [givenEntry(PERSONALITY_ANSWERS[locale]), coreIdeaSkippedEntry],
  },
  agreed: {
    gate: "agreed",
    entries: [
      givenEntry(PERSONALITY_ANSWERS[locale]),
      coreIdeaEntry(CORE_IDEA_TEXT[locale].statement, CORE_IDEA_TEXT[locale].remember),
    ],
  },
});

/** The state key, state line, gate line and buttons each row of `core-idea-gate-1` shows. */
const STATES = (m: Messages): Record<StateKind, [string, string, string, string[]]> => ({
  waiting: ["waiting", waitsFor(m, "positioning"), m.business.state.gate, []],
  open: ["empty", m.business.state.empty, m.business.state.gate, ["writeOwn", "skip"]],
  skipped: ["skipped", m.business.state.skipped, m.business.state.gate, ["writeOwn"]],
  agreed: ["agreed", m.business.state.agreed, m.business.coreIdea.gatePassed, []],
});

/**
 * Spec row 31: on the card and in the view, in order, the state and the gate line of one row of
 * `core-idea-gate-1`; the view's description is the same gate line, and only the controls the row
 * gives are there, in one height.
 */
async function statesPlay(canvasElement: HTMLElement, m: Messages, kind: StateKind) {
  const [key, line, gate, buttons] = STATES(m)[kind];
  await boardReady(canvasElement);
  await expectCard(canvasElement, key, line, gate);
  const { dialog, v } = await openCore(canvasElement, m);
  await expectState(v, key, line);
  await expect(dialog).toHaveAccessibleDescription(gate);
  await expect(choicesOf(v)).toEqual(buttons);
  // The gate line is the dialog's description, so the view does not repeat it.
  await expect(textOf(v)).not.toContain(gate);
  const all = buttonsOf(v);
  for (const b of all) await expect(b.getBoundingClientRect().height).toBeCloseTo(40, 0);
  if (all.length > 1) expectSameHeight(all[0] as HTMLElement, ...all.slice(1));
  await closeViewer(canvasElement);
}

const stateStory = (kind: StateKind, locale: Lang): Story => ({
  render:
    locale === "th"
      ? hosted("th", [STATE_PROJECT("th")[kind]])
      : hostedEnglish([STATE_PROJECT("en")[kind]]),
  play: async ({ canvasElement }) => {
    await statesPlay(canvasElement, locale === "th" ? th : en, kind);
  },
});

/** Positioning not agreed: the node waits for it, the gate line stays, no control. */
export const CoreIdeaStates: Story = stateStory("waiting", "th");
export const CoreIdeaStatesEnglish: Story = stateStory("waiting", "en");
/** No entry and nothing in the way: "Nothing given yet", the gate line, Write my own and Skip for now. */
export const CoreIdeaStatesOpen: Story = stateStory("open", "th");
export const CoreIdeaStatesOpenEnglish: Story = stateStory("open", "en");
/** The newest entry a skip: "Skipped for now", the gate line, only Write my own. */
export const CoreIdeaStatesSkipped: Story = stateStory("skipped", "th");
export const CoreIdeaStatesSkippedEnglish: Story = stateStory("skipped", "en");
/** A written core idea: "Agreed", the gate passed, no control. */
export const CoreIdeaStatesAgreed: Story = stateStory("agreed", "th");
export const CoreIdeaStatesAgreedEnglish: Story = stateStory("agreed", "en");

// ----- write and agree (spec row 26) -----

/**
 * Spec row 26 and design C2, C4, C8: before, "Nothing given yet" with the gate line and a row of two
 * buttons of one height; Write my own opens the editor with focus on the answer; the statement is
 * saved as typed (the server trims it) and the view shows it with "Written by you", the answer with
 * "Your words", "Agreed" and the gate passed in place of the gate line, no control, focus on the
 * Core idea heading; the card follows.
 */
async function writtenPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const text = CORE_IDEA_TEXT[locale];
  await boardReady(canvasElement);
  await expectCard(canvasElement, "empty", m.business.state.empty, m.business.state.gate);
  const { dialog, v } = await openCore(canvasElement, m);
  await expectState(v, "empty", m.business.state.empty);
  await expect(dialog).toHaveAccessibleDescription(m.business.state.gate);
  await expect(buttonsOf(v).map((b) => [textOf(b), b.dataset["variant"]])).toEqual([
    [m.business.positioning.writeOwn, "primary"],
    [m.strategy.skip, "ghost"],
  ]);
  expectSameHeight(...(buttonsOf(v) as unknown as [HTMLElement, ...HTMLElement[]]));

  await userEvent.click(choiceOf(v, "writeOwn"));
  const [remember, statement] = textareasOf(v) as [HTMLTextAreaElement, HTMLTextAreaElement];
  await focusedIs(remember);
  await expect(remember.labels?.[0]?.textContent).toContain(m.business.question.remember);
  await expect(statement.labels?.[0]?.textContent).toContain(m.business.field.coreIdea);
  await expect(statement).toHaveAttribute("aria-required", "true");
  await expect(remember).not.toHaveAttribute("aria-required", "true");
  await expect(remember.maxLength).toBe(-1);
  await expect(statement.maxLength).toBe(-1);
  await expect(
    [...v.querySelectorAll("[data-row] button")].map((b) => [
      textOf(b),
      (b as HTMLElement).dataset["variant"],
    ]),
  ).toEqual([
    [m.business.coreIdea.save, "primary"],
    [m.business.positioning.cancel, "secondary"],
  ]);
  await userEvent.click(remember);
  await userEvent.paste(text.remember);
  await userEvent.click(statement);
  await userEvent.paste(`  ${text.statement}  `);
  await userEvent.click(choiceOf(v, "save"));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("agreed"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "core-idea",
    kind: "written",
    payload: { statement: `  ${text.statement}  `, remember: text.remember },
  });

  await expectState(v, "agreed", m.business.state.agreed);
  await expect(dialog).toHaveAccessibleDescription(m.business.coreIdea.gatePassed);
  await expect(textOf(dialog)).not.toContain(m.business.state.gate);
  await expect(linesOf(fieldOf(v, "remember"))).toEqual([
    m.business.field.remember,
    text.remember,
    m.business.label.yourWords,
  ]);
  const field = fieldOf(v, "coreIdea");
  await expect(linesOf(field)).toEqual([
    m.business.field.coreIdea,
    text.statement,
    m.business.positioning.by.own,
  ]);
  await expect(field.querySelector("bdi")?.textContent).toBe(text.statement);
  await expect(buttonsOf(v)).toHaveLength(0);
  await expect(v.querySelector("[data-editor]")).toBeNull();
  await expect(v.querySelector("[data-marks]")).toBeNull();
  await focusedIs(within(field).getByRole("heading", { name: m.business.field.coreIdea }));
  // The heading's focus line reaches into the statement's box, so the ink is read with focus off.
  (document.activeElement as HTMLElement).blur();
  const [written, label] = [...field.querySelectorAll<HTMLElement>("p")] as [
    HTMLElement,
    HTMLElement,
  ];
  if (inVitest) await expectInkClearsAbove(label, written, 2);
  await closeViewer(canvasElement);
  await expectCard(
    canvasElement,
    "agreed",
    m.business.state.agreed,
    m.business.coreIdea.gatePassed,
  );
}

export const CoreIdeaWritten: Story = {
  render: hosted("th", [agreedWithPersonality("th")]),
  play: async ({ canvasElement }) => {
    await writtenPlay(canvasElement, th, "th");
  },
};

export const CoreIdeaWrittenEnglish: Story = {
  render: hostedEnglish([agreedWithPersonality("en")]),
  play: async ({ canvasElement }) => {
    await writtenPlay(canvasElement, en, "en");
  },
};

// ----- invalid, rate limited, cancelled, double press (spec row 27) -----

/**
 * Spec row 27 and design C5 to C7: an empty core idea, one of 301 characters and an answer of 2,001
 * make no call, each with its line, both texts kept and focus on the first field the line names; a
 * valid entry the action refuses as rate limited keeps both texts and shows the line under the row;
 * Cancel saves nothing, returns focus to Write my own and the next editor starts empty; a double
 * press makes one call, the save button inert and named, Cancel inert, the two buttons of one height.
 */
async function invalidPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const text = CORE_IDEA_TEXT[locale];
  const { v } = await openCore(canvasElement, m);
  const cancel = () => choiceOf(v, "cancel");
  const fields = () => textareasOf(v) as [HTMLTextAreaElement, HTMLTextAreaElement];
  await userEvent.click(choiceOf(v, "writeOwn"));
  await focusedIs(fields()[0]);

  // Empty: the line, focus on the core idea, no call.
  await userEvent.click(choiceOf(v, "save"));
  await waitFor(() =>
    expect(within(v).getByText(m.business.coreIdea.statementRequired)).toBeVisible(),
  );
  await focusedIs(fields()[1]);
  await expect(fields()[1]).toHaveAttribute("aria-invalid", "true");
  await expect(enter).toHaveBeenCalledTimes(0);

  // 301 characters: the bound, the text kept, focus on the core idea, no call.
  await userEvent.click(fields()[1]);
  await userEvent.paste("ก".repeat(301));
  await expect(within(v).queryByText(m.business.coreIdea.statementRequired)).toBeNull();
  await userEvent.click(choiceOf(v, "save"));
  const tooLong300 = fill(m.business.intake.tooLong, { max: "300" });
  await waitFor(() => expect(within(v).getByText(tooLong300)).toBeVisible());
  await expect(fields()[1].value).toBe("ก".repeat(301));
  await focusedIs(fields()[1]);
  await expect(enter).toHaveBeenCalledTimes(0);

  // An answer of 2,001: its own bound, first in the order of the fields, and focus on it.
  await userEvent.click(fields()[0]);
  await userEvent.paste("ก".repeat(2001));
  await userEvent.click(choiceOf(v, "save"));
  const tooLong2000 = fill(m.business.intake.tooLong, { max: "2000" });
  await waitFor(() => expect(within(v).getByText(tooLong2000)).toBeVisible());
  await expect(within(v).getByText(tooLong300)).toBeVisible();
  await expect(fields()[0].value).toBe("ก".repeat(2001));
  await focusedIs(fields()[0]);
  await expect(enter).toHaveBeenCalledTimes(0);

  // Valid, and the action answers rate limited: one call, both texts kept, the line under the row.
  await userEvent.clear(fields()[0]);
  await userEvent.paste(text.remember);
  await userEvent.clear(fields()[1]);
  await userEvent.paste(text.statement);
  enter.mockResolvedValue({ ok: false, failure: RATE_LIMITED[locale] });
  await userEvent.click(choiceOf(v, "save"));
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(fields()[0].value).toBe(text.remember);
  await expect(fields()[1].value).toBe(text.statement);
  await expect(choiceOf(v, "save")).not.toHaveAttribute("aria-disabled");

  // Cancel: no call, focus on Write my own, and the next editor starts empty with no line left.
  await userEvent.click(cancel());
  await waitFor(() => expect(v.querySelector("[data-editor]")).toBeNull());
  await focusedIs(choiceOf(v, "writeOwn"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await userEvent.click(choiceOf(v, "writeOwn"));
  await expect(fields()[0].value).toBe("");
  await expect(fields()[1].value).toBe("");
  await expect(failureRegionOf(v).children).toHaveLength(0);

  // A double press while a save runs: one call, both buttons inert, the save button named.
  await userEvent.click(fields()[1]);
  await userEvent.paste(text.statement);
  enter.mockReset();
  let release: (result: StubResult) => void = () => {};
  enter.mockImplementation(
    () =>
      new Promise<StubResult>((done) => {
        release = done;
      }),
  );
  await userEvent.click(choiceOf(v, "save"));
  await userEvent.click(choiceOf(v, "save"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(choiceOf(v, "save")).toHaveAttribute("aria-disabled", "true");
  await expect(textOf(choiceOf(v, "save"))).toContain(m.business.positioning.saving);
  await expect(cancel()).toHaveAttribute("aria-disabled", "true");
  await userEvent.click(cancel());
  await expect(v.querySelector("[data-editor]")).not.toBeNull();
  release({ ok: false, failure: RATE_LIMITED[locale] });
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
  await expect(fields()[1].value).toBe(text.statement);
  await expect(choiceOf(v, "save")).not.toHaveAttribute("aria-disabled");
  expectSameHeight(choiceOf(v, "save"), cancel());
}

export const CoreIdeaInvalid: Story = {
  render: hosted("th", [agreedWithPersonality("th")]),
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, th, "th");
  },
};

export const CoreIdeaInvalidEnglish: Story = {
  render: hostedEnglish([agreedWithPersonality("en")]),
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, en, "en");
  },
};

// ----- skip, then write (spec row 28) -----

/**
 * Spec row 28 and design C3: Skip for now shows "Skipped for now" with the gate line, both fields
 * "Skipped for now", Write my own still offered and Skip for now gone, focus on Write my own; later
 * the person writes their own and agrees, and the view is the agreed one.
 */
async function skippedPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const text = CORE_IDEA_TEXT[locale];
  const { dialog, v } = await openCore(canvasElement, m);
  await userEvent.click(choiceOf(v, "skip"));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("skipped"));
  await expect(enter).toHaveBeenCalledWith({ node: "core-idea", kind: "skipped", payload: {} });
  await expectState(v, "skipped", m.business.state.skipped);
  await expect(dialog).toHaveAccessibleDescription(m.business.state.gate);
  await expectFallbacks(v, m.business.state.skipped);
  await expect(choicesOf(v)).toEqual(["writeOwn"]);
  await focusedIs(choiceOf(v, "writeOwn"));

  await userEvent.click(choiceOf(v, "writeOwn"));
  await userEvent.click(textareasOf(v)[1] as HTMLElement);
  await userEvent.paste(text.statement);
  await userEvent.click(choiceOf(v, "save"));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("agreed"));
  await expect(enter).toHaveBeenCalledTimes(2);
  await expectState(v, "agreed", m.business.state.agreed);
  await expect(dialog).toHaveAccessibleDescription(m.business.coreIdea.gatePassed);
  // No answer to the question was typed, so the field says nothing was given.
  await expect(linesOf(fieldOf(v, "remember"))).toEqual([
    m.business.field.remember,
    m.business.state.empty,
  ]);
  await expect(linesOf(fieldOf(v, "coreIdea"))).toEqual([
    m.business.field.coreIdea,
    text.statement,
    m.business.positioning.by.own,
  ]);
  await expect(buttonsOf(v)).toHaveLength(0);
}

export const CoreIdeaSkipped: Story = {
  render: hosted("th", [agreedWithPersonality("th")]),
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, th, "th");
  },
};

export const CoreIdeaSkippedEnglish: Story = {
  render: hostedEnglish([agreedWithPersonality("en")]),
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, en, "en");
  },
};

// ----- waits (spec row 29) -----

/** Spec row 29: no entry, and a block cause: Brand personality is not given, or Positioning is not agreed. */
const waitProjects = (locale: Lang): Project[] => [
  { gate: "agreed", entries: [] },
  { gate: "open", entries: [] },
  { gate: "stale", entries: [givenEntry(PERSONALITY_ANSWERS[locale])] },
];

/** Reads each fixture on the one board: the node waits, shows the gate line, and offers no control. */
async function waitsPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  const lines = [
    waitsFor(m, "identity-frame"),
    waitsFor(m, "positioning"),
    waitsFor(m, "positioning"),
  ];
  for (const [i, line] of lines.entries()) {
    await boardReady(canvasElement);
    await userEvent.click(canvasElement.querySelector(`[data-fixture="${i}"]`) as HTMLElement);
    await expectCard(canvasElement, "waiting", line, m.business.state.gate);
    const { dialog, v } = await openCore(canvasElement, m);
    await expectState(v, "waiting", line);
    await expect(dialog).toHaveAccessibleDescription(m.business.state.gate);
    await expectFallbacks(v, m.business.state.empty);
    await expect(buttonsOf(v)).toHaveLength(0);
    await expect(v.querySelector("[data-row]")).toBeNull();
    await closeViewer(canvasElement);
  }
  await expect(enter).toHaveBeenCalledTimes(0);
}

export const CoreIdeaWaits: Story = {
  render: hosted("th", waitProjects("th")),
  play: async ({ canvasElement }) => {
    await waitsPlay(canvasElement, th);
  },
};

export const CoreIdeaWaitsEnglish: Story = {
  render: hostedEnglish(waitProjects("en")),
  play: async ({ canvasElement }) => {
    await waitsPlay(canvasElement, en);
  },
};

// ----- marks (spec row 30) -----

/** Spec row 30: a written core idea, and what it was not checked against (W4 cases 2, 4 and 5). */
const markProjects = (locale: Lang): Project[] => {
  const written = coreIdeaEntry(CORE_IDEA_TEXT[locale].statement, CORE_IDEA_TEXT[locale].remember);
  const personality = givenEntry(PERSONALITY_ANSWERS[locale]);
  return [
    { gate: "skipped", entries: [personality, written] },
    { gate: "agreed", entries: [skippedEntry, written] },
    { gate: "stale", entries: [personality, written] },
  ];
};

/** Each fixture is still agreed with the gate passed, and names the one step it was not checked against. */
async function marksPlay(canvasElement: HTMLElement, m: Messages) {
  const names = ["positioning", "identity-frame", "positioning"] as const;
  for (const [i, node] of names.entries()) {
    await boardReady(canvasElement);
    await userEvent.click(canvasElement.querySelector(`[data-fixture="${i}"]`) as HTMLElement);
    const { dialog, v } = await openCore(canvasElement, m);
    await expectState(v, "agreed", m.business.state.agreed);
    await expect(dialog).toHaveAccessibleDescription(m.business.coreIdea.gatePassed);
    const marks = v.querySelectorAll<HTMLElement>("[data-marks]");
    await expect(marks).toHaveLength(1);
    await expect((marks[0] as HTMLElement).dataset["marks"]).toBe("unchecked");
    await expect(textOf(marks[0] as HTMLElement)).toBe(
      fill(m.business.marks.unchecked, { nodes: nodeTitle(m, node) }),
    );
    await expect(buttonsOf(v)).toHaveLength(0);
    await closeViewer(canvasElement);
  }
}

export const CoreIdeaMarks: Story = {
  render: hosted("th", markProjects("th")),
  play: async ({ canvasElement }) => {
    await marksPlay(canvasElement, th);
  },
};

export const CoreIdeaMarksEnglish: Story = {
  render: hostedEnglish(markProjects("en")),
  play: async ({ canvasElement }) => {
    await marksPlay(canvasElement, en);
  },
};

// ----- narrow, keyboard only, and the other language (spec row 34) -----

const longProject = (locale: Lang): Project => ({
  gate: "agreed",
  entries: [givenEntry(PERSONALITY_ANSWERS[locale]), coreIdeaEntry(LONG_CORE_IDEA)],
});

/**
 * The language switch as a story needs it: a control outside the board and its viewer that changes
 * the locale above them, so one mounted board reads in the other language.
 */
function SwitchHost({
  from,
  mode,
  children,
}: {
  from: Lang;
  mode: "light" | "dark";
  children: (locale: Lang) => ReactNode;
}) {
  const [locale, setLocale] = useState<Lang>(from);
  const next: Lang = locale === "th" ? "en" : "th";
  return (
    <Under profile="neutral" mode={mode}>
      <LocaleProvider locale={locale}>
        <div data-narrow="" className="w-[360px] max-w-full">
          <button type="button" data-switch-locale={next} onClick={() => setLocale(next)}>
            {next.toUpperCase()}
          </button>
          {children(locale)}
        </div>
      </LocaleProvider>
    </Under>
  );
}

/** What the viewer says about the long core idea, in one language: it wraps inside the 360 px window. */
async function expectNarrowView(root: HTMLElement, m: Messages) {
  const { dialog, v } = await openCore(root, m);
  const region = within(dialog).getByRole("region", { name: nodeTitle(m, "core-idea") });
  await expectState(v, "agreed", m.business.state.agreed);
  await expect(dialog).toHaveAccessibleDescription(m.business.coreIdea.gatePassed);
  const box = dialog.getBoundingClientRect();
  await expect(box.left).toBeGreaterThanOrEqual(0);
  await expect(box.right).toBeLessThanOrEqual(360);
  await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
  const bdi = v.querySelector<HTMLElement>('[data-field="coreIdea"] bdi') as HTMLElement;
  // The statement as typed, 300 Thai characters with no space, whole in the 282 px column.
  await expect(textOf(bdi)).toBe(LONG_CORE_IDEA);
  await expect(LONG_CORE_IDEA).toHaveLength(300);
  for (const el of dialog.querySelectorAll<HTMLElement>("[data-field], bdi")) {
    await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
  }
  // Every block starts at the state line's edge.
  const left = stateLineOf(v).getBoundingClientRect().left;
  for (const block of v.querySelectorAll<HTMLElement>(
    "[data-head] > p, [data-field] > h3, [data-field] > p",
  )) {
    await expect(Math.abs(block.getBoundingClientRect().left - left)).toBeLessThanOrEqual(0.5);
  }
  expectNoGlyphClip(region);
  await closeViewer(root);
}

/**
 * Spec row 34, keyboard only: at 360 px the board fits its frame; Tab from Name lands on Core idea
 * with a visible focus (it is the last card); Enter opens its view at a 360 px window, which wraps
 * the 300-character statement with no sideways scroll; after the language switch the titles, state
 * and gate line are the other catalog's and the statement is the same text.
 */
async function narrowPlay(canvasElement: HTMLElement, from: Lang) {
  const first = from === "th" ? th : en;
  const second = from === "th" ? en : th;
  await boardReady(canvasElement);
  await expectFitsAt360(canvasElement);
  await expectCard(
    canvasElement,
    "agreed",
    first.business.state.agreed,
    first.business.coreIdea.gatePassed,
  );
  nodeEl(canvasElement, "name").focus({ preventScroll: true });
  await waitFor(() => expect(nodeEl(canvasElement, "name")).toHaveFocus());
  await userEvent.tab();
  await waitFor(() => expect(nodeEl(canvasElement, "core-idea")).toHaveFocus());
  await expect(nodeEl(canvasElement, "core-idea").matches(":focus-visible")).toBe(true);
  await atWindow(360, 760, async () => {
    await expectNarrowView(canvasElement, first);
  });
  await userEvent.click(canvasElement.querySelector("[data-switch-locale]") as HTMLElement);
  await waitFor(() =>
    expect(
      textOf(nodeEl(canvasElement, "core-idea").querySelector("[data-node-state]") as Element),
    ).toBe(second.business.state.agreed),
  );
  await expectCard(
    canvasElement,
    "agreed",
    second.business.state.agreed,
    second.business.coreIdea.gatePassed,
  );
  await atWindow(360, 760, async () => {
    await expectNarrowView(canvasElement, second);
  });
  await expect(enter).toHaveBeenCalledTimes(0);
}

const narrowHost = (from: Lang, mode: "light" | "dark") => () => (
  <SwitchHost from={from} mode={mode}>
    {(locale) => <BoardHost locale={locale} projects={[longProject(locale)]} />}
  </SwitchHost>
);

export const CoreIdeaNarrow: Story = {
  render: narrowHost("th", "light"),
  play: async ({ canvasElement }) => {
    enter.mockReset();
    await narrowPlay(canvasElement, "th");
  },
};

export const CoreIdeaNarrowDark: Story = {
  render: narrowHost("th", "dark"),
  play: async ({ canvasElement }) => {
    enter.mockReset();
    await narrowPlay(canvasElement, "th");
  },
};

export const CoreIdeaNarrowEnglish: Story = {
  render: narrowHost("en", "light"),
  play: async ({ canvasElement }) => {
    enter.mockReset();
    await narrowPlay(canvasElement, "en");
  },
};
