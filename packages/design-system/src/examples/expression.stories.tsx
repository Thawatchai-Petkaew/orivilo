import {
  type BusinessView,
  type EntryProblem,
  type EntryRequest,
  type FoundationNode,
  TYPOGRAPHY_SCRIPTS,
  type TypographyScripts as ScriptsAnswer,
} from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button, ScrollArea } from "../components/index";
import { Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { pick } from "../i18n/locale";
import { fill, type Messages } from "../i18n/messages/index";
import {
  expectFocusBorderForm,
  expectInkClearsAbove,
  expectNoGlyphClip,
  expectSameHeight,
  inVitest,
  resolvedColor,
} from "../testing/visual-asserts";
import { en, expectFitsAt360, FixtureNote, textOf, th } from "./business-story-helpers";
import { nodeTitle, scriptsWord, styleWord } from "./business-text";
import {
  asksPersonality,
  asksScripts,
  bothCrowded,
  decided,
  fallback,
  HOSTILE_COMPETITOR,
  hostile,
  NARROW_LINEUP,
  partly,
  POINT_4,
  provisional,
  provisionalPartly,
  STAND_IN,
  typographyDecided,
  typographyProvisional,
  typographyUnchecked,
  typographyWaitsAndAsks,
  typographyWaitsForPersonality,
  typographyWaitsForPositioning,
  unchecked,
  waitsForPersonality,
  waitsForPositioning,
} from "./expression-fixtures";
import { afterEntryOn, givenEntry } from "./foundation-fixtures";
import { type FoundationEditor, FoundationNodeView } from "./foundation-view";

type Lang = "th" | "en";
type Color = Extract<FoundationNode, { id: "color" }>;

/** What the stub action answers: saved, or a line the page would have resolved from `saved.errors.*`. */
type StubResult =
  | { ok: true }
  // A refusal naming a field has `problems` and no line, as the page answers it (design F2).
  | { ok: false; failure?: string; problems?: EntryProblem[] };
/** Shared by every story below; each play resets it first. */
const enter = fn<(request: EntryRequest) => Promise<StubResult>>();

/** Story-only copy: the lines `saved.errors.rate-limited` gives for a 20 minute wait (apps/web catalog). */
const RATE_LIMITED = {
  th: "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที",
  en: "Too many requests in a short time, so this was not done. Try again in 20 minutes.",
} as const;

/** The project the stub saves on: Positioning agreed and a personality at point 4 (`partly`). */
const stubAfter = (locale: Lang) => afterEntryOn(locale, "agreed", [givenEntry({}, POINT_4)]);

/**
 * What the page does around the view, with a stub action in place of the server: it holds the view
 * and the editor, runs the action while `pending` is set, and builds the view again from the same
 * engine function once the action has saved. Nothing is saved anywhere. `narrow` puts the view in
 * the 282 px column the viewer gives it at 360, with the viewer's own 33 px start edge; `scroll`
 * puts it in the viewer's scroll region, which a save returns focus to.
 */
function Host({
  locale,
  initial,
  readOnly = false,
  narrow = false,
  scroll = false,
  heading = false,
  nodeId = "color",
}: {
  locale: Lang;
  initial: BusinessView;
  readOnly?: boolean;
  narrow?: boolean;
  scroll?: boolean;
  heading?: boolean;
  /** The node the host shows: Colour (PR 1) or Typography (PR 2). */
  nodeId?: "color" | "typography";
}) {
  const [view, setView] = useState(initial);
  const [pending, setPending] = useState<"saving" | null>(null);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [problems, setProblems] = useState<EntryProblem[] | undefined>(undefined);
  const [editor, setEditor] = useState<FoundationEditor>(null);
  const node = view.foundation.find((n) => n.id === nodeId) as FoundationNode;
  const onEnter = (request: EntryRequest) => {
    setPending("saving");
    setFailure(undefined);
    void enter(request).then((result) => {
      if (result.ok) setView(stubAfter(locale)(request));
      else {
        setFailure(result.failure);
        // A new array each time, so a second refusal of the same fields is a new outcome.
        setProblems(result.problems === undefined ? undefined : [...result.problems]);
      }
      setPending(null);
    });
  };
  const shown = (
    <FoundationNodeView
      node={node}
      heading={heading}
      controls={
        readOnly
          ? undefined
          : {
              pending,
              problems,
              failure,
              onEnter,
              onDismiss: () => setFailure(undefined),
              editor,
              onEditor: setEditor,
            }
      }
    />
  );
  const framed = scroll ? (
    <div className="flex h-[560px] flex-col p-4">
      <ScrollArea label={nodeTitle(locale === "th" ? th : en, nodeId)} className="min-h-0 flex-1">
        <div className="pe-3">{shown}</div>
      </ScrollArea>
    </div>
  ) : (
    <div
      {...(narrow ? { "data-narrow": "" } : {})}
      className={
        narrow ? "w-[360px] max-w-full overflow-hidden ps-[33px] pe-[45px]" : "overflow-hidden p-4"
      }
    >
      {shown}
    </div>
  );
  return framed;
}

const meta = {
  title: "Examples/Application: Brand expression",
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
          "The brand expression nodes of the brand board (ORV-298): Colour (PR 1) and Typography (PR 2). The Typography view asks which scripts the brand writes in, with nothing chosen, and then shows the families that follow from the answer for reading text and for headlines, each with its style and its licence. It is rule-based: every brand gets the same three families in this version, no model picks them and the personality does not choose them. The Colour node: its view shows three decisions worked out by fixed rules from the brand personality and the competitors' main colours the person gave: the signature colour family, the greys and the background. Each shows its reason and its rule. The person gives the competitors' colours in an editor of up to twenty brands; the view lists them as text and names the colour families that are crowded among them. Everything here is rule-based: no model decides these and nothing is sent anywhere, and a colour family is not a final colour value. Every project is a labelled fixture; nobody gave these answers.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ----- helpers -----

const viewOf = (root: ParentNode, id: "color" | "typography" = "color") =>
  root.querySelector<HTMLElement>(`[data-node="${id}"]`) as HTMLElement;
const stateLineOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>("[data-node-state]") as HTMLElement;
const fieldOf = (v: HTMLElement, key: string) =>
  v.querySelector<HTMLElement>(`[data-field="${key}"]`) as HTMLElement;
const fieldKeys = (v: HTMLElement) =>
  [...v.querySelectorAll<HTMLElement>("[data-field]")].map((f) => f.dataset["field"]);
const linesOf = (el: HTMLElement) => [...el.children].map((c) => textOf(c));
const buttonsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLButtonElement>("button")];
const giveOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-choice="give"]') as HTMLElement;
const saveOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-choice="save"]') as HTMLElement;
const cancelOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-choice="cancel"]') as HTMLElement;
const addOf = (v: HTMLElement, m: Messages) =>
  within(v).queryByRole("button", { name: m.business.color.add });
const rowsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLElement>("[data-rows] > li")];
const inputsOf = (row: HTMLElement) =>
  [...row.querySelectorAll<HTMLInputElement>("input")] as [HTMLInputElement, HTMLInputElement];
const removeOf = (row: HTMLElement) => row.querySelector<HTMLElement>("[data-row-head] button");
const errorsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLElement>(".ds-field__error")];
const failureRegionOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>("[data-row] + [role=alert]") as HTMLElement;
const focusedIs = (el: Element) => waitFor(() => expect(document.activeElement).toBe(el));
const regionOf = (root: ParentNode) =>
  root.querySelector<HTMLElement>('[role="region"]') as HTMLElement;
const dataOf = (view: BusinessView) => view.foundation.find((n) => n.id === "color") as Color;

/** The word of a family or a decision as the catalog gives it. */
const familyOf = (m: Messages, family: keyof Messages["business"]["color"]["family"]) =>
  m.business.color.family[family];

/** The state line as a status, with the state it names. */
async function expectState(v: HTMLElement, key: FoundationNode["state"], line: string) {
  const el = stateLineOf(v);
  await expect(el).toHaveAttribute("role", "status");
  await expect(el.dataset["nodeState"]).toBe(key);
  await expect(textOf(el)).toBe(line);
  await expect(v.querySelector(".ds-badge")).toBeNull();
}

/** Every text block of the view draws with normal letter spacing, read from the rendered elements. */
async function expectNoLetterSpacing(v: HTMLElement) {
  const blocks = [v, ...v.querySelectorAll<HTMLElement>("*")].filter((el) =>
    [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim()),
  );
  await expect(blocks.length).toBeGreaterThan(8);
  for (const block of blocks) {
    await expect(["normal", "0px"], textOf(block)).toContain(getComputedStyle(block).letterSpacing);
  }
}

/**
 * The border form of focus on an input: under keyboard focus its own border is `focus.ring` on all
 * four sides, 1 px wide. `expectFocusBorderForm` reads the ring through a probe span appended to the
 * element, which an input cannot hold, so the ring is read at the input's parent.
 */
async function expectInputFocusBorder(input: HTMLInputElement) {
  const ring = resolvedColor(input.parentElement as Element, "--ds-focus-ring");
  input.focus();
  await expect(input.matches(":focus-visible")).toBe(true);
  await Promise.all(input.getAnimations().map((a) => a.finished));
  const style = getComputedStyle(input);
  for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
    await expect(style[`border${side}Color`], `border ${side} is focus.ring`).toBe(ring);
    await expect(parseFloat(style[`border${side}Width`])).toBe(1);
  }
}

/** Paste a text into an input, replacing what it holds. */
async function put(input: HTMLInputElement, text: string) {
  await userEvent.click(input);
  await userEvent.clear(input);
  if (text !== "") await userEvent.paste(text);
  await waitFor(() => expect(input.value).toBe(text));
}

/** The labels block holds exactly the three honesty lines of a colour decision, once each. */
async function expectLabels(v: HTMLElement, m: Messages) {
  const labels = v.querySelectorAll("[data-labels]");
  await expect(labels).toHaveLength(1);
  await expect([...(labels[0] as HTMLElement).children].map(textOf)).toEqual([
    m.business.label.byRule,
    m.business.color.hypothesis,
    m.business.color.familyOnly,
  ]);
  await expect(textOf(v).split(m.business.label.byRule)).toHaveLength(2);
}

/** What a decision line holds: the field name, the value word, the reason and the rule. */
async function expectDecision(
  v: HTMLElement,
  m: Messages,
  key: "signature" | "neutral" | "canvas",
  value: string,
  reason: string,
  rule: string,
) {
  const field = fieldOf(v, key);
  await expect(field.children[0]?.tagName).toBe("H3");
  await expect(linesOf(field)).toEqual([
    m.business.field[key],
    value,
    reason,
    fill(m.business.decision.rule, { rule }),
  ]);
  await expect(field.querySelector("[data-value]")).toBe(field.children[1]);
  await expect(field.querySelector("[data-rule]")).toBe(field.children[3]);
}

/** One open editor with its rows, as the rows are typed. */
async function fillRows(
  v: HTMLElement,
  m: Messages,
  lineup: ReadonlyArray<{ name: string; hex: string }>,
) {
  for (const [i, entry] of lineup.entries()) {
    if (i > 0) {
      await userEvent.click(addOf(v, m) as HTMLElement);
      await waitFor(() => expect(rowsOf(v)).toHaveLength(i + 1));
      await focusedIs(inputsOf(rowsOf(v)[i] as HTMLElement)[0]);
    }
    const [name, hex] = inputsOf(rowsOf(v)[i] as HTMLElement);
    await put(name, entry.name);
    await put(hex, entry.hex);
  }
}

const hosted =
  (
    locale: Lang,
    initial: BusinessView,
    options: { readOnly?: boolean; scroll?: boolean; nodeId?: "color" | "typography" } = {},
  ) =>
  () =>
    locale === "en" ? (
      <LocaleProvider locale="en">
        <Host locale="en" initial={initial} {...options} />
      </LocaleProvider>
    ) : (
      <Host locale="th" initial={initial} {...options} />
    );

// ----- partly worked out (spec row 2) -----

/**
 * Spec row 2: Positioning agreed, a personality at point 4 and no lineup. The signature waits for the
 * competitors' colours; the greys and the background are decided, each with its reason and its rule;
 * the labels say once that fixed rules worked them out; the one control is the primary opener.
 */
async function partlyPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  const node = dataOf(partly("th"));
  await expectState(v, "partly", m.business.state.partly);
  await expect(fieldKeys(v)).toEqual(["signature", "neutral", "canvas", "lineup"]);
  await expect(linesOf(fieldOf(v, "signature"))).toEqual([
    m.business.field.signature,
    m.business.color.waitsForLineup,
  ]);
  await expectDecision(
    v,
    m,
    "neutral",
    m.business.color.neutral.warm,
    fill(m.business.color.because.neutral, { warm: "4" }),
    "color.neutral.warm",
  );
  await expectDecision(
    v,
    m,
    "canvas",
    m.business.color.canvas.soft,
    fill(m.business.color.because.canvas, { premium: "4" }),
    node.decisions?.canvas?.rule ?? "",
  );
  await expectLabels(v, m);
  await expect(linesOf(fieldOf(v, "lineup"))).toEqual([
    m.business.field.lineup,
    m.business.state.empty,
  ]);
  await expect(v.querySelector("[data-marks], [data-ask]")).toBeNull();
  const buttons = buttonsOf(v);
  await expect(buttons.map(textOf)).toEqual([m.business.color.give]);
  await expect(buttons[0]?.dataset["variant"]).toBe("primary");
  const neutral = fieldOf(v, "neutral");
  if (inVitest) {
    await expectInkClearsAbove(
      neutral.children[2] as HTMLElement,
      neutral.children[1] as HTMLElement,
      2,
    );
  }
  // The Thai reason sits whole inside the frame that clips it, through the story's own frame.
  expectNoGlyphClip(neutral.children[2] as HTMLElement, canvasElement);
  expectNoGlyphClip(stateLineOf(v), canvasElement);
}

export const ColorPartly: Story = {
  render: hosted("th", partly("th")),
  play: async ({ canvasElement }) => {
    await partlyPlay(canvasElement, th);
    await expectNoLetterSpacing(viewOf(canvasElement));
  },
};

export const ColorPartlyEnglish: Story = {
  render: hosted("en", partly("en")),
  play: async ({ canvasElement }) => {
    await partlyPlay(canvasElement, en);
  },
};

/** The read-only arm (C14): the same fields with the same fallbacks, no button row, no failure region. */
async function readOnlyPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  await expectState(v, "partly", m.business.state.partly);
  await expect(fieldKeys(v)).toEqual(["signature", "neutral", "canvas", "lineup"]);
  await expect(v.querySelector("[data-row]")).toBeNull();
  await expect(v.querySelector("[role=alert]")).toBeNull();
  await expect(buttonsOf(v)).toHaveLength(0);
}

export const ColorReadOnly: Story = {
  render: hosted("th", partly("th"), { readOnly: true }),
  play: async ({ canvasElement }) => {
    await readOnlyPlay(canvasElement, th);
  },
};

export const ColorReadOnlyEnglish: Story = {
  render: hosted("en", partly("en"), { readOnly: true }),
  play: async ({ canvasElement }) => {
    await readOnlyPlay(canvasElement, en);
  },
};

// ----- decided, after the person gives the lineup (spec row 3) -----

const CROWDED = {
  th: "เกือบดำ ส้ม และม่วง",
  en: "Near black, Orange, and Violet",
} as const;

/** The decided view of the stand-in lineup, in one language (spec row 3). */
async function expectDecided(v: HTMLElement, m: Messages, locale: Lang) {
  await expectState(v, "derived", m.business.state.derived);
  await expect(fieldKeys(v)).toEqual(["signature", "neutral", "canvas", "lineup", "crowded"]);
  await expectDecision(
    v,
    m,
    "signature",
    familyOf(m, "lime"),
    fill(m.business.color.because.signature, {
      expressive: "4",
      warm: "4",
      family: familyOf(m, "lime"),
    }),
    "color.signature.lime-warm",
  );
  await expectDecision(
    v,
    m,
    "neutral",
    m.business.color.neutral.warm,
    fill(m.business.color.because.neutral, { warm: "4" }),
    "color.neutral.warm",
  );
  await expect(textOf(fieldOf(v, "canvas").children[1] as HTMLElement)).toBe(
    m.business.color.canvas.soft,
  );
  await expectLabels(v, m);
  // The lineup as text, in the stored order: a name, then its colour, as the person gave them.
  const lineup = fieldOf(v, "lineup");
  await expect([...lineup.querySelectorAll("dt bdi")].map((b) => b.textContent)).toEqual(
    STAND_IN.map((row) => row.name),
  );
  await expect([...lineup.querySelectorAll("dd bdi")].map((b) => b.textContent)).toEqual(
    STAND_IN.map((row) => row.hex.toUpperCase()),
  );
  await expect(lineup.lastElementChild?.textContent).toBe(m.business.color.givenByYou);
  await expect(linesOf(fieldOf(v, "crowded"))).toEqual([
    m.business.field.crowded,
    CROWDED[locale],
    m.business.color.crowdRule,
  ]);
  await expect(buttonsOf(v)).toHaveLength(0);
}

/**
 * Spec row 3: Give opens the editor with one row and no Remove, focus on row 1's brand name; the
 * seven stand-in brands go in with Add a brand (focus on each new row's name); Save makes one call
 * with the checked request, and the view is then the decided colour with the lineup as text, the
 * crowded families, no control, and focus on the scroll region, scrolled to its top.
 */
async function decidedPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = viewOf(canvasElement);
  await userEvent.click(giveOf(v));
  await waitFor(() => expect(rowsOf(v)).toHaveLength(1));
  await focusedIs(inputsOf(rowsOf(v)[0] as HTMLElement)[0]);
  await expect(removeOf(rowsOf(v)[0] as HTMLElement)).toBeNull();
  await expect(within(v).getByRole("group", { name: m.business.question.lineup })).toBeVisible();
  await expect(textOf(v.querySelector("[data-editor]") as HTMLElement)).toContain(
    m.business.color.crowdRule,
  );
  await fillRows(v, m, STAND_IN);
  await expect(rowsOf(v)).toHaveLength(7);
  await expect(enter).toHaveBeenCalledTimes(0);
  const region = regionOf(canvasElement);
  region.scrollTop = region.scrollHeight;
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("derived"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "competitive-frame",
    kind: "lineup",
    payload: { lineup: STAND_IN.map((row) => ({ name: row.name, hex: row.hex.toUpperCase() })) },
  });
  await expectDecided(v, m, locale);
  await expect(v.querySelector("[data-editor]")).toBeNull();
  await focusedIs(region);
  await waitFor(() => expect(region.scrollTop).toBe(0));
}

export const ColorDecided: Story = {
  render: hosted("th", partly("th"), { scroll: true }),
  play: async ({ canvasElement }) => {
    await decidedPlay(canvasElement, th, "th");
    // The top of the view is in the scroll region's window: the state line and the first decision.
    expectNoGlyphClip(stateLineOf(viewOf(canvasElement)), canvasElement);
    expectNoGlyphClip(fieldOf(viewOf(canvasElement), "signature"), canvasElement);
  },
};

export const ColorDecidedEnglish: Story = {
  render: hosted("en", partly("en"), { scroll: true }),
  play: async ({ canvasElement }) => {
    await decidedPlay(canvasElement, en, "en");
  },
};

// ----- a lineup that cannot be saved (spec row 4) -----

/** One alert line under exactly one field, naming it invalid, with focus on it. */
async function expectOneProblem(v: HTMLElement, input: HTMLInputElement, line: string) {
  await waitFor(() => expect(errorsOf(v)).toHaveLength(1));
  await expect(textOf(errorsOf(v)[0] as HTMLElement)).toBe(line);
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await focusedIs(input);
  await expect(v.querySelectorAll('[aria-invalid="true"]')).toHaveLength(1);
  await expect(enter).toHaveBeenCalledTimes(0);
}

/** Every row's head is 40 high, with a Remove button or without one. */
async function expectRowHeads(v: HTMLElement) {
  for (const head of v.querySelectorAll<HTMLElement>("[data-row-head]")) {
    await expect(Math.abs(head.getBoundingClientRect().height - 40)).toBeLessThanOrEqual(0.5);
  }
}

/**
 * Spec row 4: each save of the row's inputs shows exactly one line, the first problem in the
 * design's order, under its own field with focus on it, and makes no call; typing in that field
 * takes the line away. A rate limited answer keeps every row; a double press makes one call, and
 * Cancel, Add a brand and Remove are inert meanwhile. At twenty rows Add a brand gives way to its
 * limit line; removing one brings it back. Cancel goes back to the opener.
 */
async function invalidPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  const v = viewOf(canvasElement);
  await userEvent.click(giveOf(v));
  await waitFor(() => expect(rowsOf(v)).toHaveLength(1));
  await expectRowHeads(v);
  const [name1, hex1] = inputsOf(rowsOf(v)[0] as HTMLElement);

  // Nothing given: the lineup is required, under the first row's brand name.
  await userEvent.click(saveOf(v));
  await expectOneProblem(v, name1, m.business.color.lineupRequired);

  // A name with no colour: the row is incomplete, under the colour.
  await put(name1, "Brand A");
  await expect(errorsOf(v)).toHaveLength(0);
  await userEvent.click(saveOf(v));
  await expectOneProblem(v, hex1, m.business.color.rowIncomplete);

  // Typing in the field that holds the line takes it away; a colour not in the form is the next line.
  await userEvent.click(hex1);
  await userEvent.paste("red");
  await expect(errorsOf(v)).toHaveLength(0);
  await userEvent.click(saveOf(v));
  await expectOneProblem(v, hex1, m.business.color.hexInvalid);
  await put(hex1, "#5B3FD9");

  // The same brand twice: the line is under the later row's name.
  await userEvent.click(addOf(v, m) as HTMLElement);
  await waitFor(() => expect(rowsOf(v)).toHaveLength(2));
  const [name2, hex2] = inputsOf(rowsOf(v)[1] as HTMLElement);
  await focusedIs(name2);
  await put(name2, "Brand A");
  await put(hex2, "#00C8E0");
  await userEvent.click(saveOf(v));
  await expectOneProblem(v, name2, m.business.color.nameRepeated);

  // A name past 60 characters: the bound, under the name.
  await put(name2, "x".repeat(61));
  await userEvent.click(saveOf(v));
  await expectOneProblem(v, name2, fill(m.business.intake.tooLong, { max: "60" }));
  await userEvent.click(name2);
  await userEvent.keyboard("{Backspace}");
  await expect(errorsOf(v)).toHaveLength(0);
  await put(name2, "Brand B");
  await expect(enter).toHaveBeenCalledTimes(0);
  await expectRowHeads(v);

  // A rate limited answer, and a double press: one call, Save inert and named, everything else inert.
  let release: (result: StubResult) => void = () => {};
  enter.mockImplementation(
    () =>
      new Promise<StubResult>((done) => {
        release = done;
      }),
  );
  await userEvent.click(saveOf(v));
  await userEvent.click(saveOf(v));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(saveOf(v)).toHaveAttribute("aria-disabled", "true");
  await expect(textOf(saveOf(v))).toContain(m.business.positioning.saving);
  await expect(cancelOf(v)).toHaveAttribute("aria-disabled", "true");
  await expect(addOf(v, m)).toHaveAttribute("aria-disabled", "true");
  for (const row of rowsOf(v)) {
    await expect(removeOf(row)).toHaveAttribute("aria-disabled", "true");
  }
  await userEvent.click(cancelOf(v));
  await userEvent.click(addOf(v, m) as HTMLElement);
  await expect(rowsOf(v)).toHaveLength(2);
  release({ ok: false, failure: RATE_LIMITED[locale] });
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
  await expect(cancelOf(v)).not.toHaveAttribute("aria-disabled");
  await expect([name1.value, hex1.value, name2.value, hex2.value]).toEqual([
    "Brand A",
    "#5B3FD9",
    "Brand B",
    "#00C8E0",
  ]);
  await expect(saveOf(v)).not.toHaveAttribute("aria-disabled");
  expectSameHeight(saveOf(v), cancelOf(v));
  await expect(enter).toHaveBeenCalledTimes(1);

  // Twenty rows: Add a brand gives way to its limit line, once; removing a row brings it back.
  while (rowsOf(v).length < 20) {
    await userEvent.click(addOf(v, m) as HTMLElement);
  }
  await waitFor(() => expect(rowsOf(v)).toHaveLength(20));
  await expect(addOf(v, m)).toBeNull();
  await expect(textOf(v.querySelector("[data-add]") as HTMLElement)).toBe(
    m.business.color.lineupMax,
  );
  await expect(v.querySelectorAll("[data-add] [role=status]")).toHaveLength(1);
  await expectRowHeads(v);
  const fifth = rowsOf(v)[4] as HTMLElement;
  await userEvent.click(removeOf(fifth) as HTMLElement);
  await waitFor(() => expect(rowsOf(v)).toHaveLength(19));
  await expect(addOf(v, m)).not.toBeNull();
  await focusedIs(inputsOf(rowsOf(v)[4] as HTMLElement)[0]);
  // The row numbers close up: "Brand 1" to "Brand 19".
  await expect(
    rowsOf(v).map((row) => textOf(row.querySelector("[data-row-head] p") as HTMLElement)),
  ).toEqual(Array.from({ length: 19 }, (_, i) => fill(m.business.color.row, { n: i + 1 })));

  // Cancel saves nothing, returns focus to the opener, and the next editor opens with one empty row.
  await userEvent.click(cancelOf(v));
  await waitFor(() => expect(v.querySelector("[data-editor]")).toBeNull());
  await focusedIs(giveOf(v));
  await expect(enter).toHaveBeenCalledTimes(1);
  await userEvent.click(giveOf(v));
  await waitFor(() => expect(rowsOf(v)).toHaveLength(1));
  await expect(inputsOf(rowsOf(v)[0] as HTMLElement).map((i) => i.value)).toEqual(["", ""]);
}

export const ColorLineupInvalid: Story = {
  render: hosted("th", partly("th")),
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, th, "th");
  },
};

export const ColorLineupInvalidEnglish: Story = {
  render: hosted("en", partly("en")),
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, en, "en");
  },
};

// ----- the fallback and both candidates crowded (spec rows 5 and 6) -----

/** Spec row 5: lime is crowded among the colours given, so cyan is the signature, by the fallback reason. */
async function fallbackPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  const node = dataOf(fallback("th"));
  await expectState(v, "derived", m.business.state.derived);
  await expectDecision(
    v,
    m,
    "signature",
    familyOf(m, "cyan"),
    fill(m.business.color.because.fallback, {
      expressive: "4",
      warm: "4",
      preferred: familyOf(m, "lime"),
      family: familyOf(m, "cyan"),
    }),
    node.decisions?.signature?.rule ?? "",
  );
  await expect(fieldOf(v, "crowded").textContent).toContain(familyOf(m, "lime"));
  expectNoGlyphClip(fieldOf(v, "signature"), canvasElement);
}

export const ColorFallback: Story = {
  render: hosted("th", fallback("th")),
  play: async ({ canvasElement }) => {
    await fallbackPlay(canvasElement, th);
  },
};

export const ColorFallbackEnglish: Story = {
  render: hosted("en", fallback("en")),
  play: async ({ canvasElement }) => {
    await fallbackPlay(canvasElement, en);
  },
};

/** Spec row 6: both candidate families are crowded, so no signature is chosen and no control shows. */
async function bothCrowdedPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  await expectState(v, "partly", m.business.state.partly);
  await expect(linesOf(fieldOf(v, "signature"))).toEqual([
    m.business.field.signature,
    fill(m.business.color.bothCrowded, {
      first: familyOf(m, "lime"),
      second: familyOf(m, "cyan"),
    }),
  ]);
  await expect(fieldOf(v, "neutral").querySelector("[data-value]")).not.toBeNull();
  await expect(fieldOf(v, "canvas").querySelector("[data-value]")).not.toBeNull();
  await expectLabels(v, m);
  await expect(buttonsOf(v)).toHaveLength(0);
  expectNoGlyphClip(fieldOf(v, "signature"), canvasElement);
}

export const ColorBothCrowded: Story = {
  render: hosted("th", bothCrowded("th")),
  play: async ({ canvasElement }) => {
    await bothCrowdedPlay(canvasElement, th);
  },
};

export const ColorBothCrowdedEnglish: Story = {
  render: hosted("en", bothCrowded("en")),
  play: async ({ canvasElement }) => {
    await bothCrowdedPlay(canvasElement, en);
  },
};

// ----- waiting and asking (spec row 7) -----

function Cases({ locale, cases }: { locale: Lang; cases: ReadonlyArray<[string, BusinessView]> }) {
  return (
    <>
      {cases.map(([name, initial]) => (
        <div key={name} data-case={name}>
          <Host locale={locale} initial={initial} />
        </div>
      ))}
    </>
  );
}

const inLocale = (locale: Lang, children: ReactNode) =>
  locale === "en" ? <LocaleProvider locale="en">{children}</LocaleProvider> : <>{children}</>;

const waitsCases = (locale: Lang): ReadonlyArray<[string, BusinessView]> => [
  ["asks", asksPersonality(locale)],
  ["waits-personality", waitsForPersonality(locale)],
  ["waits-positioning", waitsForPositioning(locale)],
];

/**
 * Spec row 7: with a skipped personality the rules ask for it (the ask line, no labels); with none
 * given Colour waits for Brand personality; with no Positioning choice it waits for Positioning.
 * Each says what it needs in words, decides nothing and keeps one primary button.
 */
async function waitsPlay(canvasElement: HTMLElement, m: Messages) {
  const at = (name: string) =>
    viewOf(canvasElement.querySelector(`[data-case="${name}"]`) as HTMLElement);
  const asks = at("asks");
  await expectState(asks, "needsAnswer", m.business.state.needsAnswer);
  await expect(textOf(asks.querySelector("[data-ask]") as HTMLElement)).toBe(
    m.business.color.needsPersonality,
  );
  await expect(linesOf(fieldOf(asks, "signature"))).toEqual([
    m.business.field.signature,
    m.business.color.waitsForLineup,
  ]);
  for (const [name, waitsFor] of [
    ["waits-personality", nodeTitle(m, "identity-frame")],
    ["waits-positioning", nodeTitle(m, "positioning")],
  ] as const) {
    const v = at(name);
    await expectState(v, "waiting", fill(m.business.state.waiting, { nodes: waitsFor }));
    await expect(v.querySelector("[data-ask]")).toBeNull();
    for (const key of ["signature", "neutral", "canvas", "lineup"]) {
      await expect(linesOf(fieldOf(v, key))).toEqual([
        m.business.field[key as "signature"],
        m.business.state.empty,
      ]);
    }
  }
  for (const name of ["asks", "waits-personality", "waits-positioning"]) {
    const v = at(name);
    await expect(v.querySelector("[data-labels]")).toBeNull();
    await expect(v.querySelector("[data-value]")).toBeNull();
    await expect(buttonsOf(v).map(textOf)).toEqual([m.business.color.give]);
    await expect(buttonsOf(v)[0]?.dataset["variant"]).toBe("primary");
  }
}

export const ColorWaits: Story = {
  render: () => inLocale("th", <Cases locale="th" cases={waitsCases("th")} />),
  play: async ({ canvasElement }) => {
    await waitsPlay(canvasElement, th);
  },
};

export const ColorWaitsEnglish: Story = {
  render: () => inLocale("en", <Cases locale="en" cases={waitsCases("en")} />),
  play: async ({ canvasElement }) => {
    await waitsPlay(canvasElement, en);
  },
};

// ----- marks (spec row 8) -----

const marksCases = (locale: Lang): ReadonlyArray<[string, BusinessView]> => [
  ["provisional", provisional(locale)],
  ["unchecked", unchecked(locale)],
  ["provisional-partly", provisionalPartly(locale)],
];

/**
 * Spec row 8: a decided colour that rests on a skipped Positioning says so in two lines under the
 * state line, 4 apart; one that was not checked against Positioning says that in one line; a partly
 * worked out colour carries the provisional pair too. The decisions are the same with or without a mark.
 */
async function marksPlay(canvasElement: HTMLElement, m: Messages) {
  const at = (name: string) =>
    viewOf(canvasElement.querySelector(`[data-case="${name}"]`) as HTMLElement);
  const positioning = nodeTitle(m, "positioning");
  for (const name of ["provisional", "provisional-partly"]) {
    const v = at(name);
    await expectState(
      v,
      name === "provisional" ? "derived" : "partly",
      name === "provisional" ? m.business.state.derived : m.business.state.partly,
    );
    await expect(v.querySelectorAll("[data-marks]")).toHaveLength(1);
    const marks = v.querySelector<HTMLElement>('[data-marks="provisional"]') as HTMLElement;
    await expect(marks.closest("[data-head]")).toBe(v.querySelector("[data-head]"));
    const lines = [...marks.children] as HTMLElement[];
    await expect(lines.map(textOf)).toEqual([
      m.strategy.provisional,
      fill(m.business.marks.restsOn, { nodes: positioning }),
    ]);
    const gap =
      (lines[1] as HTMLElement).getBoundingClientRect().top -
      (lines[0] as HTMLElement).getBoundingClientRect().bottom;
    await expect(Math.abs(gap - 4)).toBeLessThanOrEqual(0.5);
    await expect(
      Math.abs(marks.getBoundingClientRect().left - stateLineOf(v).getBoundingClientRect().left),
    ).toBeLessThanOrEqual(0.5);
  }
  const first = at("provisional");
  await expect(
    textOf(fieldOf(first, "signature").querySelector("[data-value]") as HTMLElement),
  ).toBe(familyOf(m, "lime"));
  await expect(buttonsOf(first)).toHaveLength(0);
  await expect(buttonsOf(at("provisional-partly")).map(textOf)).toEqual([m.business.color.give]);

  const second = at("unchecked");
  await expectState(second, "derived", m.business.state.derived);
  await expect(second.querySelectorAll("[data-marks]")).toHaveLength(1);
  await expect(textOf(second.querySelector('[data-marks="unchecked"]') as HTMLElement)).toBe(
    fill(m.business.marks.unchecked, { nodes: positioning }),
  );
  await expect(
    textOf(fieldOf(second, "signature").querySelector("[data-value]") as HTMLElement),
  ).toBe(familyOf(m, "lime"));
}

export const ColorMarks: Story = {
  render: () => inLocale("th", <Cases locale="th" cases={marksCases("th")} />),
  play: async ({ canvasElement }) => {
    await marksPlay(canvasElement, th);
  },
};

export const ColorMarksEnglish: Story = {
  render: () => inLocale("en", <Cases locale="en" cases={marksCases("en")} />),
  play: async ({ canvasElement }) => {
    await marksPlay(canvasElement, en);
  },
};

// ----- markup as text (spec row 11) -----

/**
 * Spec row 11: a competitor's name that is markup is text in a `bdi`, never an image, a link or a
 * tag, in the saved view and in the editor's Remove button name, and no colour is drawn from a value
 * the person typed: the view has no inline style.
 */
async function untrustedPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  const saved = viewOf(canvasElement.querySelector('[data-case="saved"]') as HTMLElement);
  const names = [...saved.querySelectorAll("dt bdi")];
  await expect(names[0]?.textContent).toBe(HOSTILE_COMPETITOR);
  await expect(names[0]?.children).toHaveLength(0);
  await expect(saved.querySelectorAll("a, img, script, b, svg")).toHaveLength(0);
  await expect(saved.querySelectorAll("[style]")).toHaveLength(0);
  await expect(canvasElement.querySelector("img[src='x']")).toBeNull();

  const editing = viewOf(canvasElement.querySelector('[data-case="editing"]') as HTMLElement);
  await userEvent.click(giveOf(editing));
  await waitFor(() => expect(rowsOf(editing)).toHaveLength(1));
  await userEvent.click(addOf(editing, m) as HTMLElement);
  await waitFor(() => expect(rowsOf(editing)).toHaveLength(2));
  await put(inputsOf(rowsOf(editing)[0] as HTMLElement)[0], HOSTILE_COMPETITOR);
  const remove = removeOf(rowsOf(editing)[0] as HTMLElement) as HTMLElement;
  await expect(remove).toHaveAccessibleName(
    fill(m.business.color.remove, { name: HOSTILE_COMPETITOR }),
  );
  await expect(editing.querySelectorAll("a, img, script, b")).toHaveLength(0);
  await expect(canvasElement.querySelector("img[src='x']")).toBeNull();
  await expect(editing.querySelector("[title]")).toBeNull();
  await expect(enter).toHaveBeenCalledTimes(0);
}

function UntrustedCases({ locale }: { locale: Lang }) {
  return (
    <Cases
      locale={locale}
      cases={[
        ["saved", hostile(locale)],
        ["editing", partly(locale)],
      ]}
    />
  );
}

export const ExpressionUntrustedText: Story = {
  render: () => inLocale("th", <UntrustedCases locale="th" />),
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, th);
  },
};

export const ExpressionUntrustedTextEnglish: Story = {
  render: () => inLocale("en", <UntrustedCases locale="en" />),
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, en);
  },
};

// ----- one project, the other language (spec row 13) -----

/**
 * The header's language switch, as a story needs it: one decided colour held by one mounted view,
 * and a control outside the view that changes the locale above it. The view is never keyed on the
 * locale, so a remount would show as a new element.
 */
function SwitchHost({ from }: { from: Lang }) {
  const [locale, setLocale] = useState<Lang>(from);
  const next: Lang = locale === "th" ? "en" : "th";
  return (
    <LocaleProvider locale={locale}>
      <button type="button" data-switch-locale={next} onClick={() => setLocale(next)}>
        {next.toUpperCase()}
      </button>
      <Host locale={locale} initial={decided(from)} heading />
    </LocaleProvider>
  );
}

/**
 * Spec row 13: one decided colour on one mounted view, shown in the first language and then in the
 * other with no remount: the title, the labels, the family words, the reasons, the state line and the
 * crowded families come from the other catalog, the names and colours stay exactly as typed, no
 * call is made, and the Thai text of the view, on either side of the switch, has no letter spacing.
 */
async function switchPlay(canvasElement: HTMLElement, from: Lang) {
  enter.mockReset();
  const first = from === "th" ? th : en;
  const second = from === "th" ? en : th;
  const v = viewOf(canvasElement);
  const signature = fieldOf(v, "signature");
  const lineupList = v.querySelector("[data-lineup]");
  await expect(
    within(v).getByRole("heading", { level: 2, name: nodeTitle(first, "color") }),
  ).toBeVisible();
  await expectDecided(v, first, from);
  if (from === "th") await expectNoLetterSpacing(v);
  await userEvent.click(canvasElement.querySelector("[data-switch-locale]") as HTMLElement);
  await waitFor(() => expect(textOf(stateLineOf(v))).toBe(second.business.state.derived));
  await expect(viewOf(canvasElement)).toBe(v);
  await expect(fieldOf(v, "signature")).toBe(signature);
  await expect(v.querySelector("[data-lineup]")).toBe(lineupList);
  await expect(
    within(v).getByRole("heading", { level: 2, name: nodeTitle(second, "color") }),
  ).toBeVisible();
  await expectDecided(v, second, from === "th" ? "en" : "th");
  if (from === "en") await expectNoLetterSpacing(v);
  await expect(enter).toHaveBeenCalledTimes(0);
}

export const ColorSwitchToEnglish: Story = {
  render: () => <SwitchHost from="th" />,
  play: async ({ canvasElement }) => {
    await switchPlay(canvasElement, "th");
  },
};

export const ColorSwitchToThai: Story = {
  render: () => <SwitchHost from="en" />,
  play: async ({ canvasElement }) => {
    await switchPlay(canvasElement, "en");
  },
};

// ----- narrow (spec row 14) -----

const narrowHost = (locale: Lang, initial: BusinessView, mode: "light" | "dark") => () => {
  const host = <Host locale={locale} initial={initial} narrow />;
  return (
    <Under profile="neutral" mode={mode}>
      {inLocale(locale, host)}
    </Under>
  );
};

/** Every block of the view starts at the state line's edge, at 360. */
async function expectOneStartEdge(v: HTMLElement) {
  const left = stateLineOf(v).getBoundingClientRect().left;
  for (const block of v.querySelectorAll<HTMLElement>(
    "[data-head] > p, [data-field] > h3, [data-field] > p, [data-field] dt, [data-labels] > p, [data-editor] > div > p, [data-row] > button:first-child",
  )) {
    await expect(
      Math.abs(block.getBoundingClientRect().left - left),
      textOf(block),
    ).toBeLessThanOrEqual(0.5);
  }
}

/**
 * Spec row 14 at 360: the editor with twenty rows of 60 Thai characters with no space fits the
 * column and keeps its Tab order (per row Remove, brand name, colour; then Add a brand, Save,
 * Cancel), each stop with the border form of focus; the saved lineup wraps inside the column, every
 * name whole, with the start edge of the head and no Thai text clipped.
 */
async function narrowPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = viewOf(canvasElement);
  await expectFitsAt360(canvasElement);
  await expectOneStartEdge(v);
  await userEvent.click(giveOf(v));
  await waitFor(() => expect(rowsOf(v)).toHaveLength(1));
  await expectFitsAt360(canvasElement);
  await expectOneStartEdge(v);

  // The Tab order over three rows.
  await userEvent.click(addOf(v, m) as HTMLElement);
  await userEvent.click(addOf(v, m) as HTMLElement);
  await waitFor(() => expect(rowsOf(v)).toHaveLength(3));
  const order: HTMLElement[] = [
    ...rowsOf(v).flatMap((row) => [removeOf(row) as HTMLElement, ...inputsOf(row)]),
    within(v).getByRole("button", { name: m.business.color.add }),
    saveOf(v),
    cancelOf(v),
  ];
  (order[0] as HTMLElement).focus();
  await focusedIs(order[0] as HTMLElement);
  for (const stop of order.slice(1)) {
    await userEvent.tab();
    await focusedIs(stop);
    await expect(stop.matches(":focus-visible")).toBe(true);
  }
  await expectFocusBorderForm(saveOf(v));
  await expectFocusBorderForm(removeOf(rowsOf(v)[1] as HTMLElement) as HTMLElement);
  await expectInputFocusBorder(inputsOf(rowsOf(v)[0] as HTMLElement)[0]);

  // Twenty rows of 60 Thai characters with no space.
  await put(inputsOf(rowsOf(v)[0] as HTMLElement)[0], (NARROW_LINEUP[0] as { name: string }).name);
  await put(inputsOf(rowsOf(v)[0] as HTMLElement)[1], (NARROW_LINEUP[0] as { hex: string }).hex);
  await put(inputsOf(rowsOf(v)[1] as HTMLElement)[0], (NARROW_LINEUP[1] as { name: string }).name);
  await put(inputsOf(rowsOf(v)[1] as HTMLElement)[1], (NARROW_LINEUP[1] as { hex: string }).hex);
  await put(inputsOf(rowsOf(v)[2] as HTMLElement)[0], (NARROW_LINEUP[2] as { name: string }).name);
  await put(inputsOf(rowsOf(v)[2] as HTMLElement)[1], (NARROW_LINEUP[2] as { hex: string }).hex);
  for (const [i, entry] of NARROW_LINEUP.entries()) {
    if (i < 3) continue;
    await userEvent.click(addOf(v, m) as HTMLElement);
    await waitFor(() => expect(rowsOf(v)).toHaveLength(i + 1));
    const [name, hex] = inputsOf(rowsOf(v)[i] as HTMLElement);
    await put(name, entry.name);
    await put(hex, entry.hex);
  }
  await expect(rowsOf(v)).toHaveLength(20);
  await expectFitsAt360(canvasElement);
  await expectRowHeads(v);
  await expect(addOf(v, m)).toBeNull();
  // A long name stays on one line inside its input, which scrolls its own text (design 5.3).
  for (const row of rowsOf(v)) {
    const [name] = inputsOf(row);
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
  }
  expectNoGlyphClip(rowsOf(v)[0] as HTMLElement, canvasElement);

  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("derived"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expectFitsAt360(canvasElement);
  await expectOneStartEdge(v);
  const names = [...v.querySelectorAll("dt bdi")];
  await expect(names).toHaveLength(20);
  for (const [i, bdi] of names.entries()) {
    await expect(bdi.textContent).toBe((NARROW_LINEUP[i] as { name: string }).name);
    await expect(bdi).toBeVisible();
  }
  expectNoGlyphClip(fieldOf(v, "lineup"), canvasElement);
}

export const ColorNarrow: Story = {
  render: narrowHost("th", partly("th"), "light"),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

export const ColorNarrowDark: Story = {
  render: narrowHost("th", partly("th"), "dark"),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement, th);
  },
};

/** English at 360: the longest lines of the editor, a problem under a colour field, and the decided view. */
export const ColorNarrowEnglish: Story = {
  render: narrowHost("en", partly("en"), "light"),
  play: async ({ canvasElement }) => {
    enter.mockReset();
    enter.mockResolvedValue({ ok: true });
    const v = viewOf(canvasElement);
    await expectFitsAt360(canvasElement);
    await userEvent.click(giveOf(v));
    await waitFor(() => expect(rowsOf(v)).toHaveLength(1));
    await put(inputsOf(rowsOf(v)[0] as HTMLElement)[0], "Brand A");
    await userEvent.click(saveOf(v));
    await waitFor(() => expect(errorsOf(v)).toHaveLength(1));
    await expect(textOf(errorsOf(v)[0] as HTMLElement)).toBe(en.business.color.rowIncomplete);
    await expectFitsAt360(canvasElement);
    await put(inputsOf(rowsOf(v)[0] as HTMLElement)[1], "red");
    await userEvent.click(saveOf(v));
    await waitFor(() =>
      expect(textOf(errorsOf(v)[0] as HTMLElement)).toBe(en.business.color.hexInvalid),
    );
    await expectFitsAt360(canvasElement);
    await expectOneStartEdge(v);
    await expect(enter).toHaveBeenCalledTimes(0);
  },
};

// ======================================================================================
// Typography (ORV-298 PR 2, `typography-node-1`)
// ======================================================================================

type Role = "reading" | "display";

const typView = (root: ParentNode) => viewOf(root, "typography");

/** A typography view held by the same host as Colour, with the stub saving on the same project. */
const typHosted =
  (locale: Lang, initial: BusinessView, options: { readOnly?: boolean; scroll?: boolean } = {}) =>
  () =>
    hosted(locale, initial, { ...options, nodeId: "typography" })();

/** The licence of the three families, as written, the same in both languages (design 6.3). */
const LICENCE = "SIL Open Font License 1.1";

/** What the three families show, by role: the name as written, its style key and the reason of its role. */
const FACES = {
  sarabun: { family: "Sarabun", style: "looped", because: "reading" },
  anuphan: { family: "Anuphan", style: "loopless", because: "display" },
  inter: { family: "Inter", style: "latinSans", because: null },
} as const;
/** W7: the families of each answer, per role, Thai first. */
const FAMILIES = {
  "thai-latin": { reading: ["sarabun", "inter"], display: ["anuphan", "inter"] },
  thai: { reading: ["sarabun"], display: ["anuphan"] },
  latin: { reading: ["inter"], display: ["inter"] },
} as const;

const scriptsGroupOf = (v: HTMLElement, m: Messages) =>
  within(v).getByRole("radiogroup", { name: m.business.question.scripts });
const scriptsRadioOf = (v: HTMLElement, m: Messages, scripts: ScriptsAnswer) =>
  within(scriptsGroupOf(v, m)).getByRole("radio", { name: scriptsWord(m, scripts) });
const checkedIn = (v: HTMLElement) =>
  v.querySelectorAll('[role="radio"][aria-checked="true"]').length;
/** The buttons of the view's row: the radios are buttons too, so they are not counted. */
const rowButtonsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLElement>("[data-row] button")];
const facesOf = (v: HTMLElement, field: "readingFace" | "displayFace") =>
  [...fieldOf(v, field).querySelectorAll<HTMLElement>("[data-face]")].map((face) =>
    [...face.children].map(textOf),
  );
const faceLines = (m: Messages, id: keyof typeof FACES, role: Role) => {
  const face = FACES[id];
  return [
    face.family,
    styleWord(m, face.style),
    fill(m.business.typography.licence, { licence: LICENCE }),
    ...(face.because !== null && face.because === role
      ? [m.business.typography.because[face.because]]
      : []),
  ];
};

/** The decided typography of one answer, in one language (spec rows 18 and 19, design T6 to T8). */
async function expectTypographyDecided(v: HTMLElement, m: Messages, scripts: ScriptsAnswer) {
  await expectState(v, "derived", m.business.state.derived);
  await expect(fieldKeys(v)).toEqual(["scripts", "readingFace", "displayFace"]);
  await expect(linesOf(fieldOf(v, "scripts"))).toEqual([
    m.business.field.scripts,
    scriptsWord(m, scripts),
  ]);
  await expect(textOf(fieldOf(v, "readingFace").children[0] as HTMLElement)).toBe(
    m.business.field.readingFace,
  );
  await expect(textOf(fieldOf(v, "displayFace").children[0] as HTMLElement)).toBe(
    m.business.field.displayFace,
  );
  for (const role of ["reading", "display"] as const) {
    await expect(facesOf(v, role === "reading" ? "readingFace" : "displayFace")).toEqual(
      FAMILIES[scripts][role].map((id) => faceLines(m, id, role)),
    );
  }
  // The foot: the pairing line for Thai and Latin only, then the rule line, last.
  const foot = v.querySelector<HTMLElement>("[data-decision-foot]") as HTMLElement;
  const rule = fill(m.business.decision.rule, { rule: "typography-node-1" });
  await expect([...foot.children].map(textOf)).toEqual(
    scripts === "thai-latin" ? [m.business.typography.because.pairing, rule] : [rule],
  );
  await expect(foot.querySelector("[data-rule]")).toBe(foot.lastElementChild);
  await expect(textOf(v).split(m.business.typography.because.pairing)).toHaveLength(
    scripts === "thai-latin" ? 2 : 1,
  );
  // The honesty lines, once each, after the decisions.
  const labels = v.querySelectorAll("[data-labels]");
  await expect(labels).toHaveLength(1);
  await expect([...(labels[0] as HTMLElement).children].map(textOf)).toEqual([
    m.business.label.byRule,
    m.business.typography.oneChoice,
    m.business.typography.noPersonalityLink,
  ]);
  await expect(textOf(v).split(m.business.label.byRule)).toHaveLength(2);
  await expect(v.querySelector("[role=radiogroup]")).toBeNull();
  await expect(v.querySelectorAll("[data-row] button")).toHaveLength(0);
}

/** The labels of the stacked cases (design F5): a plain fixture line over each frame. */
const CASE_LABELS: Record<string, { th: string; en: string }> = {
  thai: { th: "คำตอบ: อักษรไทยอย่างเดียว", en: "Answer: Thai only" },
  latin: { th: "คำตอบ: อักษรละตินอย่างเดียว", en: "Answer: Latin only" },
  empty: { th: "บันทึกโดยไม่เลือก", en: "Save with no choice" },
  limited: { th: "ส่งคำขอถี่เกินไป", en: "Rate limited" },
  refused: { th: "เซิร์ฟเวอร์ปฏิเสธคำตอบ", en: "The server refuses the answer" },
  provisional: { th: "บุคลิกถูกข้ามไว้", en: "Personality skipped" },
  unchecked: { th: "จุดยืนยังไม่ได้ตกลง", en: "Positioning not agreed" },
  "waits-personality": { th: "รอบุคลิกของแบรนด์", en: "Waits for Brand personality" },
  "waits-positioning": { th: "รอจุดยืน", en: "Waits for Positioning" },
  "waits-asks": { th: "รอ และยังไม่ได้ตอบ", en: "Waits, not answered" },
  "asks-readonly": { th: "ยังไม่ได้ตอบ อ่านอย่างเดียว", en: "Not answered, read only" },
  "decided-readonly": { th: "ตอบแล้ว อ่านอย่างเดียว", en: "Answered, read only" },
};

/** Cases stacked in one story, each in a labelled frame (design F5); the read-only ones get no controls. */
function TypographyCases({
  locale,
  cases,
}: {
  locale: Lang;
  cases: ReadonlyArray<[string, BusinessView]>;
}) {
  return (
    <>
      {cases.map(([name, initial]) => (
        <div key={name} data-case={name}>
          <p className="px-4 text-label-md" data-case-label>
            {pick(CASE_LABELS[name] as { th: string; en: string }, locale)}
          </p>
          <Host
            locale={locale}
            initial={initial}
            nodeId="typography"
            readOnly={name.endsWith("readonly")}
          />
        </div>
      ))}
    </>
  );
}

const typCases =
  (locale: Lang, build: (locale: Lang) => ReadonlyArray<[string, BusinessView]>) => () =>
    inLocale(locale, <TypographyCases locale={locale} cases={build(locale)} />);

const typAt = (canvasElement: HTMLElement, name: string) =>
  typView(canvasElement.querySelector(`[data-case="${name}"]`) as HTMLElement);

// ----- the question, then the decided families (spec row 18) -----

/**
 * Spec row 18: before, "Waits for your answer", the question with three answers and none checked,
 * one primary button, Reading text and Headlines holding the empty line. Choosing Thai and Latin
 * and saving makes one call with the checked request; after it the state is "Worked out by a fixed
 * rule", Reading text holds Sarabun then Inter, Headlines Anuphan then Inter, the pairing line shows
 * once with the rule line, the labels hold the three honesty lines once each, no control is left and
 * focus is on the scroll region, scrolled to its top.
 */
async function typographyDecidedPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = typView(canvasElement);
  await expectState(v, "needsAnswer", m.business.state.needsAnswer);
  const radios = within(scriptsGroupOf(v, m)).getAllByRole("radio");
  await expect(radios.map((r) => textOf(r.closest(".ds-radio") as HTMLElement))).toEqual(
    TYPOGRAPHY_SCRIPTS.map((scripts) => scriptsWord(m, scripts)),
  );
  await expect(checkedIn(v)).toBe(0);
  const row = rowButtonsOf(v);
  await expect(row.map(textOf)).toEqual([m.business.architecture.save]);
  await expect(row[0]?.dataset["variant"]).toBe("primary");
  // The question is the group's name, so the Scripts heading is not shown twice.
  await expect(v.querySelector('[data-field="scripts"] h3')).toBeNull();
  for (const field of ["readingFace", "displayFace"] as const) {
    await expect(linesOf(fieldOf(v, field))).toEqual([
      m.business.field[field],
      m.business.state.empty,
    ]);
  }
  await expect(v.querySelector("[data-labels], [data-face], [data-marks], [data-ask]")).toBeNull();

  await userEvent.click(scriptsRadioOf(v, m, "thai-latin"));
  await expect(checkedIn(v)).toBe(1);
  await expect(enter).toHaveBeenCalledTimes(0);
  const region = regionOf(canvasElement);
  region.scrollTop = region.scrollHeight;
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("derived"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "typography",
    kind: "answered",
    payload: { scripts: "thai-latin" },
  });
  await expectTypographyDecided(v, m, "thai-latin");
  await focusedIs(region);
  await waitFor(() => expect(region.scrollTop).toBe(0));
  // No heading took focus and none can: no h3 has a tabindex (design 4.4, F3).
  await expect(v.querySelectorAll("h3[tabindex]")).toHaveLength(0);
}

export const TypographyDecided: Story = {
  render: typHosted("th", asksScripts("th"), { scroll: true }),
  play: async ({ canvasElement }) => {
    await typographyDecidedPlay(canvasElement, th);
    const v = typView(canvasElement);
    // The Thai lines of the top of the view sit whole inside the frame that clips them.
    expectNoGlyphClip(stateLineOf(v), canvasElement);
    const sarabun = v.querySelector("[data-face]") as HTMLElement;
    expectNoGlyphClip(sarabun, canvasElement);
    // The four lines of one family stack 4 apart, so the Thai style and reason lines never touch the name.
    const lines = [...sarabun.children] as HTMLElement[];
    await expect(lines).toHaveLength(4);
    for (const [i, line] of lines.slice(1).entries()) {
      const gap =
        line.getBoundingClientRect().top - (lines[i] as HTMLElement).getBoundingClientRect().bottom;
      await expect(Math.abs(gap - 4), textOf(line)).toBeLessThanOrEqual(0.5);
    }
    await expectNoLetterSpacing(v);
  },
};

export const TypographyDecidedEnglish: Story = {
  render: typHosted("en", asksScripts("en"), { scroll: true }),
  play: async ({ canvasElement }) => {
    await typographyDecidedPlay(canvasElement, en);
  },
};

// ----- one family set per answer (spec row 19) -----

const scriptsCases = (locale: Lang): ReadonlyArray<[string, BusinessView]> => [
  ["thai", typographyDecided(locale, "thai")],
  ["latin", typographyDecided(locale, "latin")],
];

/**
 * Spec row 19: "Thai only" gives Sarabun for reading and Anuphan for headlines, no Inter and no
 * pairing line; "Latin only" gives Inter for both, one family per role, and no Thai family.
 */
async function typographyScriptsPlay(canvasElement: HTMLElement, m: Messages) {
  const thai = typAt(canvasElement, "thai");
  await expectTypographyDecided(thai, m, "thai");
  await expect(textOf(thai)).not.toContain("Inter");
  await expect(thai.querySelectorAll("[data-face]")).toHaveLength(2);
  // The style and reason lines of a Thai family stack under its name and are not clipped.
  const sarabun = thai.querySelector("[data-face]") as HTMLElement;
  if (inVitest) {
    await expectInkClearsAbove(
      sarabun.children[1] as HTMLElement,
      sarabun.children[0] as HTMLElement,
      2,
    );
  }
  expectNoGlyphClip(sarabun.children[1] as HTMLElement, canvasElement);
  expectNoGlyphClip(sarabun.children[3] as HTMLElement, canvasElement);
  const latin = typAt(canvasElement, "latin");
  await expectTypographyDecided(latin, m, "latin");
  await expect(latin.querySelectorAll("[data-face]")).toHaveLength(2);
  await expect(facesOf(latin, "readingFace")).toHaveLength(1);
  await expect(facesOf(latin, "displayFace")).toHaveLength(1);
  await expect(textOf(latin)).not.toContain("Sarabun");
  await expect(textOf(latin)).not.toContain("Anuphan");
  await expect(textOf(latin)).not.toContain(m.business.typography.style.looped);
  await expect(textOf(latin)).not.toContain(m.business.typography.because.reading);
}

export const TypographyScripts: Story = {
  render: typCases("th", scriptsCases),
  play: async ({ canvasElement }) => {
    await typographyScriptsPlay(canvasElement, th);
  },
};

export const TypographyScriptsEnglish: Story = {
  render: typCases("en", scriptsCases),
  play: async ({ canvasElement }) => {
    await typographyScriptsPlay(canvasElement, en);
  },
};

// ----- a choice that cannot be saved (spec row 20) -----

const invalidCases = (locale: Lang): ReadonlyArray<[string, BusinessView]> => [
  ["empty", asksScripts(locale)],
  ["limited", asksScripts(locale)],
  ["refused", asksScripts(locale)],
];

/**
 * Spec row 20 and design T2 to T5, one case each. Saving with no choice shows `choiceRequired` under
 * the group, focuses the first radio, checks nothing and makes no call. A rate limited answer keeps
 * the choice and shows only the notice; a double press makes one call, with Save inert and named.
 * A refusal naming `payload.scripts` clears the choice, shows the error again and no notice, and
 * focuses the first radio (F2).
 */
async function typographyInvalidPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  const empty = typAt(canvasElement, "empty");
  await userEvent.click(saveOf(empty));
  await waitFor(() => expect(errorsOf(empty)).toHaveLength(1));
  await expect(textOf(errorsOf(empty)[0] as HTMLElement)).toBe(
    m.business.architecture.choiceRequired,
  );
  await expect(scriptsGroupOf(empty, m)).toHaveAttribute("aria-invalid", "true");
  await focusedIs(within(scriptsGroupOf(empty, m)).getAllByRole("radio")[0] as HTMLElement);
  await expect(checkedIn(empty)).toBe(0);
  await expect(enter).toHaveBeenCalledTimes(0);
  // Choosing takes the error away and still makes no call.
  await userEvent.click(scriptsRadioOf(empty, m, "thai"));
  await expect(errorsOf(empty)).toHaveLength(0);
  await expect(enter).toHaveBeenCalledTimes(0);

  // Rate limited, with a double press.
  const limited = typAt(canvasElement, "limited");
  await userEvent.click(scriptsRadioOf(limited, m, "thai"));
  let release: (result: StubResult) => void = () => {};
  enter.mockImplementation(
    () =>
      new Promise<StubResult>((done) => {
        release = done;
      }),
  );
  await userEvent.click(saveOf(limited));
  await userEvent.click(saveOf(limited));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(saveOf(limited)).toHaveAttribute("aria-disabled", "true");
  await expect(textOf(saveOf(limited))).toContain(m.business.positioning.saving);
  release({ ok: false, failure: RATE_LIMITED[locale] });
  await waitFor(() => expect(textOf(failureRegionOf(limited))).toContain(RATE_LIMITED[locale]));
  await expect(saveOf(limited)).not.toHaveAttribute("aria-disabled");
  await expect(checkedIn(limited)).toBe(1);
  await expect(scriptsRadioOf(limited, m, "thai")).toHaveAttribute("aria-checked", "true");
  await expect(errorsOf(limited)).toHaveLength(0);
  await expect(enter).toHaveBeenCalledTimes(1);

  // A refusal naming the field: nothing checked, the error, no notice, focus on the first radio.
  const refused = typAt(canvasElement, "refused");
  enter.mockReset();
  enter.mockResolvedValue({ ok: false, problems: [{ path: "payload.scripts", kind: "invalid" }] });
  await userEvent.click(scriptsRadioOf(refused, m, "latin"));
  await expect(checkedIn(refused)).toBe(1);
  await userEvent.click(saveOf(refused));
  await waitFor(() => expect(errorsOf(refused)).toHaveLength(1));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(textOf(errorsOf(refused)[0] as HTMLElement)).toBe(
    m.business.architecture.choiceRequired,
  );
  await expect(checkedIn(refused)).toBe(0);
  await expect(textOf(failureRegionOf(refused))).toBe("");
  await focusedIs(within(scriptsGroupOf(refused, m)).getAllByRole("radio")[0] as HTMLElement);
}

export const TypographyInvalid: Story = {
  render: typCases("th", invalidCases),
  play: async ({ canvasElement }) => {
    await typographyInvalidPlay(canvasElement, th, "th");
  },
};

export const TypographyInvalidEnglish: Story = {
  render: typCases("en", invalidCases),
  play: async ({ canvasElement }) => {
    await typographyInvalidPlay(canvasElement, en, "en");
  },
};

// ----- marks and waiting (spec row 21) -----

const typographyMarksCases = (locale: Lang): ReadonlyArray<[string, BusinessView]> => [
  ["provisional", typographyProvisional(locale)],
  ["unchecked", typographyUnchecked(locale)],
  ["waits-personality", typographyWaitsForPersonality(locale)],
  ["waits-positioning", typographyWaitsForPositioning(locale)],
];

/**
 * Spec row 21: families that rest on a skipped personality say so in two lines under the state line,
 * 4 apart; families decided before Positioning was agreed carry the one unchecked line; with no
 * personality or no Positioning choice the node waits for it, keeps the saved answer and shows no
 * family and no label.
 */
async function typographyMarksPlay(canvasElement: HTMLElement, m: Messages) {
  const provisional = typAt(canvasElement, "provisional");
  await expectState(provisional, "derived", m.business.state.derived);
  await expect(provisional.querySelectorAll("[data-marks]")).toHaveLength(1);
  const marks = provisional.querySelector<HTMLElement>('[data-marks="provisional"]') as HTMLElement;
  await expect(marks.closest("[data-head]")).toBe(provisional.querySelector("[data-head]"));
  const lines = [...marks.children] as HTMLElement[];
  await expect(lines.map(textOf)).toEqual([
    m.strategy.provisional,
    fill(m.business.marks.restsOn, { nodes: nodeTitle(m, "identity-frame") }),
  ]);
  const gap =
    (lines[1] as HTMLElement).getBoundingClientRect().top -
    (lines[0] as HTMLElement).getBoundingClientRect().bottom;
  await expect(Math.abs(gap - 4)).toBeLessThanOrEqual(0.5);
  if (inVitest) await expectInkClearsAbove(lines[1] as HTMLElement, lines[0] as HTMLElement, 2);
  expectNoGlyphClip(lines[1] as HTMLElement, canvasElement);
  await expect(
    Math.abs(
      marks.getBoundingClientRect().left - stateLineOf(provisional).getBoundingClientRect().left,
    ),
  ).toBeLessThanOrEqual(0.5);
  await expect(facesOf(provisional, "readingFace")).toHaveLength(2);
  await expect(provisional.querySelectorAll("[data-row] button")).toHaveLength(0);

  const unchecked = typAt(canvasElement, "unchecked");
  await expectState(unchecked, "derived", m.business.state.derived);
  await expect(unchecked.querySelectorAll("[data-marks]")).toHaveLength(1);
  await expect(textOf(unchecked.querySelector('[data-marks="unchecked"]') as HTMLElement)).toBe(
    fill(m.business.marks.unchecked, { nodes: nodeTitle(m, "positioning") }),
  );
  await expect(facesOf(unchecked, "displayFace")).toHaveLength(2);

  for (const [name, waitsFor] of [
    ["waits-personality", nodeTitle(m, "identity-frame")],
    ["waits-positioning", nodeTitle(m, "positioning")],
  ] as const) {
    const v = typAt(canvasElement, name);
    await expectState(v, "waiting", fill(m.business.state.waiting, { nodes: waitsFor }));
    // The saved answer shows; no family, no label, no question, no control.
    await expect(linesOf(fieldOf(v, "scripts"))).toEqual([
      m.business.field.scripts,
      scriptsWord(m, "thai-latin"),
    ]);
    for (const field of ["readingFace", "displayFace"] as const) {
      await expect(linesOf(fieldOf(v, field))).toEqual([
        m.business.field[field],
        m.business.state.empty,
      ]);
    }
    await expect(
      v.querySelector("[data-labels], [data-face], [data-marks], [data-ask]"),
    ).toBeNull();
    await expect(v.querySelector("[role=radiogroup]")).toBeNull();
    await expect(v.querySelectorAll("[data-row] button")).toHaveLength(0);
  }
}

export const TypographyMarks: Story = {
  render: typCases("th", typographyMarksCases),
  play: async ({ canvasElement }) => {
    await typographyMarksPlay(canvasElement, th);
  },
};

export const TypographyMarksEnglish: Story = {
  render: typCases("en", typographyMarksCases),
  play: async ({ canvasElement }) => {
    await typographyMarksPlay(canvasElement, en);
  },
};

// ----- waiting and not answered, and the read-only arm (design T12, T13) -----

const typographyWaitsCases = (locale: Lang): ReadonlyArray<[string, BusinessView]> => [
  ["waits-asks", typographyWaitsAndAsks(locale)],
  ["asks-readonly", asksScripts(locale)],
  ["decided-readonly", typographyDecided(locale)],
];

/**
 * Design T12: the question is offered whatever the marks, so a node that waits and has no answer
 * shows the waiting line with the question and one primary button. T13: with no `controls` the same
 * fields show with the same fallbacks, no question, no button row and no failure region.
 */
async function typographyWaitsPlay(canvasElement: HTMLElement, m: Messages) {
  const asks = typAt(canvasElement, "waits-asks");
  await expectState(
    asks,
    "waiting",
    fill(m.business.state.waiting, { nodes: nodeTitle(m, "identity-frame") }),
  );
  await expect(within(scriptsGroupOf(asks, m)).getAllByRole("radio")).toHaveLength(3);
  await expect(checkedIn(asks)).toBe(0);
  await expect(rowButtonsOf(asks).map(textOf)).toEqual([m.business.architecture.save]);
  await expect(rowButtonsOf(asks)[0]?.dataset["variant"]).toBe("primary");

  const unanswered = typAt(canvasElement, "asks-readonly");
  await expectState(unanswered, "needsAnswer", m.business.state.needsAnswer);
  await expect(linesOf(fieldOf(unanswered, "scripts"))).toEqual([
    m.business.field.scripts,
    m.business.state.empty,
  ]);
  const decided = typAt(canvasElement, "decided-readonly");
  await expectState(decided, "derived", m.business.state.derived);
  await expect(facesOf(decided, "readingFace")).toHaveLength(2);
  for (const v of [unanswered, decided]) {
    await expect(v.querySelector("[data-row]")).toBeNull();
    await expect(v.querySelector("[role=alert]")).toBeNull();
    await expect(v.querySelector("[role=radiogroup]")).toBeNull();
    await expect(v.querySelectorAll("button")).toHaveLength(0);
  }
}

export const TypographyWaits: Story = {
  render: typCases("th", typographyWaitsCases),
  play: async ({ canvasElement }) => {
    await typographyWaitsPlay(canvasElement, th);
  },
};

export const TypographyWaitsEnglish: Story = {
  render: typCases("en", typographyWaitsCases),
  play: async ({ canvasElement }) => {
    await typographyWaitsPlay(canvasElement, en);
  },
};

// ----- one project, the other language (spec row 24) -----

/**
 * The header's language switch for Typography, as `SwitchHost` does for Colour: one decided view
 * held by one mounted host, and the catalog `Button` (secondary, sm) outside it that changes the
 * locale above it, inside a padded frame (F4).
 */
function TypographySwitchHost({ from }: { from: Lang }) {
  const [locale, setLocale] = useState<Lang>(from);
  const next: Lang = locale === "th" ? "en" : "th";
  return (
    <LocaleProvider locale={locale}>
      <div className="p-4">
        <Button
          variant="secondary"
          size="sm"
          data-switch-locale={next}
          onClick={() => setLocale(next)}
        >
          {next.toUpperCase()}
        </Button>
      </div>
      <Host locale={locale} initial={typographyDecided(from)} nodeId="typography" heading />
    </LocaleProvider>
  );
}

/**
 * Spec row 24: one decided typography on one mounted view, shown in one language and then the
 * other with no remount: the title, the state line, the style words, the reasons and the labels come
 * from the other catalog, the family and licence names stay exactly as written, and no call is made.
 */
async function typographySwitchPlay(canvasElement: HTMLElement, from: Lang) {
  enter.mockReset();
  const first = from === "th" ? th : en;
  const second = from === "th" ? en : th;
  const v = typView(canvasElement);
  const names = (el: HTMLElement) =>
    [...el.querySelectorAll("[data-face] [data-value]")].map(textOf);
  const licences = (el: HTMLElement) =>
    [...el.querySelectorAll("[data-face] [data-value] + p + p")].map((p) =>
      textOf(p).includes(LICENCE),
    );
  const reading = fieldOf(v, "readingFace");
  await expect(
    within(v).getByRole("heading", { level: 2, name: nodeTitle(first, "typography") }),
  ).toBeVisible();
  await expectTypographyDecided(v, first, "thai-latin");
  const before = names(v);
  await expect(before).toEqual(["Sarabun", "Inter", "Anuphan", "Inter"]);
  await expect(licences(v).every(Boolean)).toBe(true);
  if (from === "th") await expectNoLetterSpacing(v);
  await userEvent.click(canvasElement.querySelector("[data-switch-locale]") as HTMLElement);
  await waitFor(() => expect(textOf(stateLineOf(v))).toBe(second.business.state.derived));
  await expect(typView(canvasElement)).toBe(v);
  await expect(fieldOf(v, "readingFace")).toBe(reading);
  await expect(
    within(v).getByRole("heading", { level: 2, name: nodeTitle(second, "typography") }),
  ).toBeVisible();
  await expectTypographyDecided(v, second, "thai-latin");
  await expect(names(v)).toEqual(before);
  await expect(licences(v).every(Boolean)).toBe(true);
  if (from === "en") await expectNoLetterSpacing(v);
  await expect(enter).toHaveBeenCalledTimes(0);
}

export const TypographySwitchToEnglish: Story = {
  render: () => <TypographySwitchHost from="th" />,
  play: async ({ canvasElement }) => {
    await typographySwitchPlay(canvasElement, "th");
  },
};

export const TypographySwitchToThai: Story = {
  render: () => <TypographySwitchHost from="en" />,
  play: async ({ canvasElement }) => {
    await typographySwitchPlay(canvasElement, "en");
  },
};

// ----- narrow (spec row 24) -----

const typNarrowHost = (locale: Lang, initial: BusinessView, mode: "light" | "dark") => () => (
  <Under profile="neutral" mode={mode}>
    {inLocale(locale, <Host locale={locale} initial={initial} nodeId="typography" narrow />)}
  </Under>
);

/** Every block of the Typography view starts at the state line's edge, at 360 (design 4.5). */
async function expectTypographyStartEdge(v: HTMLElement) {
  const left = stateLineOf(v).getBoundingClientRect().left;
  for (const block of v.querySelectorAll<HTMLElement>(
    "[data-head] > p, [data-field] > h3, [data-field] > p, [data-face] > p, [data-decision-foot] > p, [data-labels] > p, .ds-field__label, [data-row] > button:first-child",
  )) {
    await expect(
      Math.abs(block.getBoundingClientRect().left - left),
      textOf(block),
    ).toBeLessThanOrEqual(0.5);
  }
}

/**
 * Spec row 24 at 360: the question with its three answers and Save fit the column and keep their
 * Tab order (the first radio while none is checked, then Save), each stop with the border form of
 * focus; the error under the group fits; the decided view fits, starts at one edge, and no Thai
 * text is clipped, the answer names and the reasons included.
 */
async function typographyNarrowPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = typView(canvasElement);
  await expectFitsAt360(canvasElement);
  await expectTypographyStartEdge(v);
  expectNoGlyphClip(scriptsGroupOf(v, m), canvasElement);
  expectNoGlyphClip(stateLineOf(v), canvasElement);

  const first = within(scriptsGroupOf(v, m)).getAllByRole("radio")[0] as HTMLElement;
  first.focus();
  await focusedIs(first);
  await userEvent.tab();
  await focusedIs(saveOf(v));
  await expect(saveOf(v).matches(":focus-visible")).toBe(true);
  await expectFocusBorderForm(saveOf(v));
  await expectFocusBorderForm(first);

  // The error under the group at 360.
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(errorsOf(v)).toHaveLength(1));
  await expect(textOf(errorsOf(v)[0] as HTMLElement)).toBe(m.business.architecture.choiceRequired);
  await expectFitsAt360(canvasElement);
  await expectTypographyStartEdge(v);
  expectNoGlyphClip(errorsOf(v)[0] as HTMLElement, canvasElement);

  await userEvent.click(scriptsRadioOf(v, m, "thai-latin"));
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("derived"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expectFitsAt360(canvasElement);
  await expectTypographyStartEdge(v);
  await expectTypographyDecided(v, m, "thai-latin");
  expectNoGlyphClip(v, canvasElement);
  for (const line of v.querySelectorAll<HTMLElement>("[data-face] > p")) {
    expectNoGlyphClip(line, canvasElement);
  }
}

export const TypographyNarrow: Story = {
  render: typNarrowHost("th", asksScripts("th"), "light"),
  play: async ({ canvasElement }) => {
    await typographyNarrowPlay(canvasElement, th);
  },
};

export const TypographyNarrowDark: Story = {
  render: typNarrowHost("th", asksScripts("th"), "dark"),
  play: async ({ canvasElement }) => {
    await typographyNarrowPlay(canvasElement, th);
  },
};

/** English at 360: the longest lines of the question and of the decided view. */
export const TypographyNarrowEnglish: Story = {
  render: typNarrowHost("en", asksScripts("en"), "light"),
  play: async ({ canvasElement }) => {
    await typographyNarrowPlay(canvasElement, en);
  },
};
