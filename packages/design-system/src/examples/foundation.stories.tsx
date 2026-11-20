import {
  type BusinessView,
  type EntryProblem,
  type EntryRequest,
  type FoundationNode,
  PERSONALITY_AXES,
  type PersonalityAxis,
} from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Under } from "../components/matrix";
import { LocaleProvider } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import {
  expectFocusBorderForm,
  expectInkClearsAbove,
  expectNoGlyphClip,
  expectSameHeight,
  inVitest,
} from "../testing/visual-asserts";
import { foundationProject } from "./business-fixtures";
import { en, expectFitsAt360, FixtureNote, textOf, th } from "./business-story-helpers";
import { nodeTitle } from "./business-text";
import {
  afterEntry,
  afterEntryOn,
  answeredEntry,
  FIXTURE_NAME,
  FIXTURE_POINTS,
  given,
  givenEntry,
  givenUnchecked,
  HOSTILE_ANSWERS,
  HOSTILE_NAME,
  LONG_PERSONALITY_ANSWER,
  LONG_WORKING_NAME,
  nameEntry,
  open,
  PERSONALITY_ANSWERS,
  waiting,
} from "./foundation-fixtures";
import { type FoundationEditor, FoundationNodeView } from "./foundation-view";

type Lang = "th" | "en";

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
 * What the page does around the view, with a stub action in place of the server: it holds the view
 * and the editor, runs the action while `pending` is set, and builds the view again from the same
 * engine function once the action has saved. Nothing is saved anywhere. `narrow` puts the view in
 * the 282 px column the viewer gives it at 360, with the viewer's own 33 px start edge.
 */
function Host({
  locale,
  initial,
  readOnly = false,
  narrow = false,
  heading = false,
  node: nodeId = "identity-frame",
  after = (request) => afterEntry(locale, request),
  frame = true,
  companion,
}: {
  locale: Lang;
  initial: BusinessView;
  readOnly?: boolean;
  narrow?: boolean;
  heading?: boolean;
  /** The node the view shows; Brand personality unless a PR 2 story names another. */
  node?: FoundationNode["id"];
  /** The view the page would build again once the stub action has saved: the project the story is on. */
  after?: (request: EntryRequest) => BusinessView;
  /** False inside a story that holds several views in one frame of its own. */
  frame?: boolean;
  /** A second node of the same project, read-only under the first: where a story reads its state line. */
  companion?: FoundationNode["id"];
}) {
  const [view, setView] = useState(initial);
  const [pending, setPending] = useState<"saving" | null>(null);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [problems, setProblems] = useState<EntryProblem[] | undefined>(undefined);
  const [editor, setEditor] = useState<FoundationEditor>(null);
  const node = view.foundation.find((n) => n.id === nodeId) as FoundationNode;
  const other = view.foundation.find((n) => n.id === companion);
  const onEnter = (request: EntryRequest) => {
    setPending("saving");
    setFailure(undefined);
    void enter(request).then((result) => {
      if (result.ok) setView(after(request));
      else {
        setFailure(result.failure);
        setProblems(result.problems);
      }
      setPending(null);
    });
  };
  const shown = (
    <>
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
      {other === undefined ? null : (
        <div className="mt-6" data-companion={other.id}>
          <FoundationNodeView node={other} heading />
        </div>
      )}
    </>
  );
  if (!frame) return shown;
  return (
    <div
      {...(narrow ? { "data-narrow": "" } : {})}
      className={
        narrow ? "w-[360px] max-w-full overflow-hidden ps-[33px] pe-[45px]" : "overflow-hidden p-4"
      }
    >
      {shown}
    </div>
  );
}

const meta = {
  title: "Examples/Application: Brand personality",
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
          "The views of the brand foundation nodes. PR 2 (ORV-295) adds Brand architecture, one question with two choices and no Cancel, whose value is worked out by a fixed rule, and Name, a working name the person gives that is not screened for trademarks; their stories follow Brand personality's. Brand personality (ORV-291, PR 1): its state line, the mark line when it was not checked against Positioning, two optional answers in the person's own words and five scales of five points, each named by its two ends. The editor opens with no point chosen; a point is a value only when the person chose it. Everything here is rule-based: no model reads these answers and nothing is sent anywhere. Every project is a labelled fixture; nobody gave these answers.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ----- helpers -----

const nodeViewOf = (root: HTMLElement, id: FoundationNode["id"]) =>
  root.querySelector<HTMLElement>(`[data-node="${id}"]`) as HTMLElement;
const viewOf = (root: HTMLElement) => nodeViewOf(root, "identity-frame");
const stateLineOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>("[data-node-state]") as HTMLElement;
const fieldsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLElement>("[data-field]")];
const buttonsOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLButtonElement>("button")];
const buttonOf = (v: HTMLElement, name: string) => within(v).getByRole("button", { name });
const scaleOf = (v: HTMLElement, axis: PersonalityAxis) =>
  v.querySelector<HTMLElement>(`[data-scale="${axis}"]`) as HTMLElement;
const radiosOf = (scale: HTMLElement) => [...scale.querySelectorAll<HTMLElement>('[role="radio"]')];
const checkedIn = (scope: ParentNode) => scope.querySelectorAll('[aria-checked="true"]').length;
const focusedIs = (el: Element) => waitFor(() => expect(document.activeElement).toBe(el));
const waitingLine = (m: Messages) =>
  fill(m.business.state.waiting, { nodes: nodeTitle(m, "positioning") });
const pointLine = (m: Messages, n: number) => fill(m.business.identity.point, { n });
const legendLine = (m: Messages, axis: PersonalityAxis) =>
  fill(m.business.identity.axisLegend, {
    low: m.business.axis[axis].low,
    high: m.business.axis[axis].high,
  });
const textareasOf = (v: HTMLElement) => [...v.querySelectorAll<HTMLTextAreaElement>("textarea")];

/** The failure line under the controls: the live region that follows the row of buttons. */
const failureRegionOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>("[data-row] + [role=alert]") as HTMLElement;

/** The state line as a status, with the state it names. */
async function expectState(v: HTMLElement, key: FoundationNode["state"], line: string) {
  const el = stateLineOf(v);
  await expect(el).toHaveAttribute("role", "status");
  await expect(el.dataset["nodeState"]).toBe(key);
  await expect(textOf(el)).toBe(line);
  await expect(v.querySelector(".ds-badge")).toBeNull();
}

/** Each of the three fields has its heading and one paragraph with `text`, and no answer. */
async function expectFallbacks(v: HTMLElement, text: string) {
  const fields = fieldsOf(v);
  await expect(fields.map((f) => f.dataset["field"])).toEqual(["person", "never", "personality"]);
  for (const field of fields) {
    const [heading, line] = [field.children[0], field.children[1]] as HTMLElement[];
    await expect(heading?.tagName).toBe("H3");
    await expect(line?.tagName).toBe("P");
    await expect(textOf(line as HTMLElement)).toBe(text);
    await expect(field.children).toHaveLength(2);
    await expect(field.querySelector("bdi")).toBeNull();
  }
}

/** What a story gives the host beyond the project: read-only, a PR 2 node, the stub's project, a companion. */
type HostOptions = Partial<
  Pick<Parameters<typeof Host>[0], "readOnly" | "node" | "after" | "companion">
>;

const hosted =
  (locale: Lang, initial: BusinessView, options: HostOptions = {}) =>
  () => <Host locale={locale} initial={initial} {...options} />;
const hostedEnglish =
  (initial: BusinessView, options: HostOptions = {}) =>
  () => (
    <LocaleProvider locale="en">
      <Host locale="en" initial={initial} {...options} />
    </LocaleProvider>
  );

// ----- waiting (spec row 5) -----

/** Spec row 5: Positioning is not agreed, so Brand personality waits for it, with no control. */
async function waitsPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  await expectState(v, "waiting", waitingLine(m));
  await expectFallbacks(v, m.business.state.empty);
  await expect(buttonsOf(v)).toHaveLength(0);
  await expect(v.querySelector("[data-marks]")).toBeNull();
  await expect(v.querySelector("[data-row]")).toBeNull();
}

export const IdentityWaits: Story = {
  render: hosted("th", waiting("th")),
  play: async ({ canvasElement }) => {
    await waitsPlay(canvasElement, th);
  },
};

export const IdentityWaitsEnglish: Story = {
  render: hostedEnglish(waiting("en")),
  play: async ({ canvasElement }) => {
    await waitsPlay(canvasElement, en);
  },
};

/** The read-only variant (I11): no controls given, so no row and no failure region, in the state's own line. */
async function readOnlyPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  await expectState(v, "empty", m.business.state.empty);
  await expectFallbacks(v, m.business.state.empty);
  await expect(v.querySelector("[data-row]")).toBeNull();
  await expect(v.querySelector("[role=alert]")).toBeNull();
  await expect(buttonsOf(v)).toHaveLength(0);
}

export const IdentityReadOnly: Story = {
  render: hosted("th", open("th"), { readOnly: true }),
  play: async ({ canvasElement }) => {
    await readOnlyPlay(canvasElement, th);
  },
};

export const IdentityReadOnlyEnglish: Story = {
  render: hostedEnglish(open("en"), { readOnly: true }),
  play: async ({ canvasElement }) => {
    await readOnlyPlay(canvasElement, en);
  },
};

// ----- skipped (spec row 4) -----

/**
 * Spec row 4: with no entry the row holds Describe (primary) and Skip (ghost), 40 high. Skip saves a
 * skipped entry; the view then says "skipped" in each field and keeps one button, with focus on it.
 */
async function skippedPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = viewOf(canvasElement);
  await expectState(v, "empty", m.business.state.empty);
  await expectFallbacks(v, m.business.state.empty);
  const describe = buttonOf(v, m.business.identity.describe);
  const skip = buttonOf(v, m.strategy.skip);
  await expect(buttonsOf(v)).toEqual([describe, skip]);
  await expect(describe.dataset["variant"]).toBe("primary");
  await expect(skip.dataset["variant"]).toBe("ghost");
  expectSameHeight(describe, skip);
  await expect(Math.abs(describe.getBoundingClientRect().height - 40)).toBeLessThanOrEqual(0.5);
  await userEvent.click(skip);
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("skipped"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "identity-frame",
    kind: "skipped",
    payload: {},
  });
  await expectState(v, "skipped", m.business.state.skipped);
  await expectFallbacks(v, m.business.state.skipped);
  await expect(buttonsOf(v)).toEqual([buttonOf(v, m.business.identity.describe)]);
  await focusedIs(buttonOf(v, m.business.identity.describe));
}

export const IdentitySkipped: Story = {
  render: hosted("th", open("th")),
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, th);
  },
};

export const IdentitySkippedEnglish: Story = {
  render: hostedEnglish(open("en")),
  play: async ({ canvasElement }) => {
    await skippedPlay(canvasElement, en);
  },
};

// ----- the editor (spec row 3) -----

/** One point on one scale, by a click on its radio. */
async function choosePoint(v: HTMLElement, axis: PersonalityAxis, point: number) {
  await userEvent.click(radiosOf(scaleOf(v, axis))[point - 1] as HTMLElement);
}

/** The editor as it opens: focus on the first answer, no scale holding a point, the hypothesis once. */
async function expectOpenEditor(v: HTMLElement, m: Messages) {
  const editor = v.querySelector<HTMLElement>("[data-editor]") as HTMLElement;
  await expect(editor).not.toBeNull();
  await focusedIs(textareasOf(v)[0] as HTMLElement);
  await expect(editor.querySelectorAll('[role="radiogroup"]')).toHaveLength(5);
  for (const axis of PERSONALITY_AXES) {
    const scale = scaleOf(v, axis);
    await expect(radiosOf(scale)).toHaveLength(5);
    await expect(checkedIn(scale)).toBe(0);
    await expect(textOf(scale)).toContain(legendLine(m, axis));
  }
  await expect(editor.querySelectorAll("[data-hypothesis]")).toHaveLength(1);
  await expect(textOf(editor.querySelector("[data-hypothesis]") as HTMLElement)).toBe(
    m.business.identity.hypothesis,
  );
  await expect(textareasOf(v)).toHaveLength(2);
  await expect(buttonsOf(v).map(textOf).slice(-2)).toEqual([
    m.business.identity.save,
    m.business.positioning.cancel,
  ]);
}

/**
 * Spec row 3: nothing is chosen when the editor opens; a save with a scale unchosen, or an answer
 * past 2,000, makes no call and moves focus to the first failing control; a double press makes one
 * call, while Cancel is inert and answers no press until the save has come back; a rate limited
 * answer keeps the points and the text; a saved personality shows its points
 * as words, with focus on the Personality heading.
 */
async function invalidPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  const v = viewOf(canvasElement);
  await userEvent.click(buttonOf(v, m.business.identity.describe));
  await expectOpenEditor(v, m);
  // A loading button takes the saving label as its name, so the two are found by their hook.
  const save = () => v.querySelector<HTMLElement>('[data-choice="save"]') as HTMLElement;
  const cancel = () => v.querySelector<HTMLElement>('[data-choice="cancel"]') as HTMLElement;

  // Four scales chosen, one not: the save makes no call and says which.
  await choosePoint(v, "playful", 2);
  await choosePoint(v, "expressive", 4);
  await choosePoint(v, "structured", 3);
  await choosePoint(v, "premium", 5);
  await userEvent.click(save());
  const warm = scaleOf(v, "warm");
  await waitFor(() =>
    expect(within(warm).getByText(m.business.identity.axesRequired)).toBeVisible(),
  );
  await expect(warm.querySelector('[role="radiogroup"]')).toHaveAttribute("aria-invalid", "true");
  await focusedIs(radiosOf(warm)[0] as HTMLElement);
  await expect(checkedIn(warm)).toBe(0);
  for (const axis of PERSONALITY_AXES.filter((a) => a !== "warm")) {
    await expect(scaleOf(v, axis).querySelector("[aria-invalid]")).toBeNull();
  }
  await expect(enter).toHaveBeenCalledTimes(0);

  // Choosing the point takes the error away; 2,001 characters in `never` fail with the bound.
  await choosePoint(v, "warm", 1);
  await expect(within(warm).queryByText(m.business.identity.axesRequired)).toBeNull();
  const [person, never] = textareasOf(v) as [HTMLTextAreaElement, HTMLTextAreaElement];
  await userEvent.click(never);
  await userEvent.paste("ก".repeat(2001));
  await userEvent.click(save());
  const tooLong = fill(m.business.intake.tooLong, { max: "2000" });
  await waitFor(() => expect(within(v).getByText(tooLong)).toBeVisible());
  await focusedIs(never);
  await expect(never).toHaveAttribute("aria-invalid", "true");
  await expect(enter).toHaveBeenCalledTimes(0);

  // A rate limited answer, and a double press: one call, Save inert and named, Cancel inert, text
  // and points kept. The stub answers when the play releases it, so every assert below runs inside
  // the window where the save is still running.
  await userEvent.clear(never);
  await userEvent.click(person);
  await userEvent.paste(PERSONALITY_ANSWERS[locale].person);
  let release: (result: StubResult) => void = () => {};
  enter.mockImplementation(
    () =>
      new Promise<StubResult>((done) => {
        release = done;
      }),
  );
  await userEvent.click(save());
  await userEvent.click(save());
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(save()).toHaveAttribute("aria-disabled", "true");
  await expect(textOf(save())).toContain(m.business.positioning.saving);
  // Cancel is disabled in the form the Button gives a disabled control: inert, still in the order.
  await expect(cancel()).toHaveAttribute("aria-disabled", "true");
  await userEvent.click(cancel());
  await expect(v.querySelector("[data-editor]")).not.toBeNull();
  await expect(person.value).toBe(PERSONALITY_ANSWERS[locale].person);
  await expect(enter).toHaveBeenCalledTimes(1);
  release({ ok: false, failure: RATE_LIMITED[locale] });
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
  await expect(cancel()).not.toHaveAttribute("aria-disabled");
  await expect(person.value).toBe(PERSONALITY_ANSWERS[locale].person);
  await expect(never.value).toBe("");
  const chosen = [2, 4, 3, 1, 5];
  for (const [i, axis] of PERSONALITY_AXES.entries()) {
    const checked = radiosOf(scaleOf(v, axis)).findIndex(
      (r) => r.getAttribute("aria-checked") === "true",
    );
    await expect(checked + 1).toBe(chosen[i]);
  }
  await expect(save()).not.toHaveAttribute("aria-disabled");
  expectSameHeight(save(), cancel());

  // The same press again goes through: the view is the given personality, focus on its heading.
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  await userEvent.click(save());
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("given"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "identity-frame",
    kind: "given",
    payload: {
      axes: { playful: 25, expressive: 75, structured: 50, warm: 0, premium: 100 },
      person: PERSONALITY_ANSWERS[locale].person,
    },
  });
  await expectState(v, "given", m.business.state.given);
  await focusedIs(
    within(fieldsOf(v)[2] as HTMLElement).getByRole("heading", {
      name: m.business.field.personality,
    }),
  );
  await expect(v.querySelector("[data-editor]")).toBeNull();
  await expect(buttonsOf(v)).toHaveLength(0);
}

export const IdentityInvalid: Story = {
  render: hosted("th", open("th")),
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, th, "th");
  },
};

export const IdentityInvalidEnglish: Story = {
  render: hostedEnglish(open("en")),
  play: async ({ canvasElement }) => {
    await invalidPlay(canvasElement, en, "en");
  },
};

/** Cancel saves nothing, returns focus to the opener, and the next editor opens with no point and no text. */
async function cancelPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  const v = viewOf(canvasElement);
  const describe = buttonOf(v, m.business.identity.describe);
  await userEvent.click(describe);
  await expectOpenEditor(v, m);
  await choosePoint(v, "playful", 3);
  await userEvent.paste("x");
  await userEvent.click(buttonOf(v, m.business.positioning.cancel));
  await waitFor(() => expect(v.querySelector("[data-editor]")).toBeNull());
  await focusedIs(buttonOf(v, m.business.identity.describe));
  await expect(enter).toHaveBeenCalledTimes(0);
  await expectState(v, "empty", m.business.state.empty);
  await userEvent.click(buttonOf(v, m.business.identity.describe));
  await expectOpenEditor(v, m);
  for (const area of textareasOf(v)) await expect(area.value).toBe("");
}

export const IdentityCancelled: Story = {
  render: hosted("th", open("th")),
  play: async ({ canvasElement }) => {
    await cancelPlay(canvasElement, th);
  },
};

export const IdentityCancelledEnglish: Story = {
  render: hostedEnglish(open("en")),
  play: async ({ canvasElement }) => {
    await cancelPlay(canvasElement, en);
  },
};

// ----- given (spec row 2) and marks (spec row 6) -----

/** Spec row 2: the points as words in axis order, the hypothesis once, the person's words labelled, no control. */
async function givenPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  const v = viewOf(canvasElement);
  await expectState(v, "given", m.business.state.given);
  await expect(v.querySelector("[data-marks]")).toBeNull();
  const [person, never, personality] = fieldsOf(v) as [HTMLElement, HTMLElement, HTMLElement];
  await expect(person.querySelector("bdi")?.textContent).toBe(PERSONALITY_ANSWERS[locale].person);
  await expect(never.querySelector("bdi")?.textContent).toBe(PERSONALITY_ANSWERS[locale].never);
  for (const field of [person, never])
    await expect(textOf(field)).toContain(m.business.label.yourWords);
  await expect(v.querySelectorAll("[data-hypothesis]")).toHaveLength(1);
  const terms = [...personality.querySelectorAll<HTMLElement>("dt")];
  const details = [...personality.querySelectorAll<HTMLElement>("dd")];
  await expect(terms.map(textOf)).toEqual(PERSONALITY_AXES.map((a) => legendLine(m, a)));
  await expect(details.map(textOf)).toEqual(
    PERSONALITY_AXES.map((a) => pointLine(m, FIXTURE_POINTS[a])),
  );
  await expect(buttonsOf(v)).toHaveLength(0);
  // No drawn scale: the points are words, never a bar, a dot row or a slider.
  await expect(
    v.querySelectorAll("svg, [role=slider], [role=meter], progress, meter"),
  ).toHaveLength(0);
  // The glyphs sit inside the frame that clips them: the check starts at the story's root.
  expectNoGlyphClip(canvasElement);
  for (const [i, dd] of details.entries()) {
    if (inVitest) await expectInkClearsAbove(dd, terms[i] as HTMLElement, 2);
  }
}

export const IdentityGiven: Story = {
  render: hosted("th", given("th")),
  play: async ({ canvasElement }) => {
    await givenPlay(canvasElement, th, "th");
  },
};

export const IdentityGivenEnglish: Story = {
  render: hostedEnglish(given("en")),
  play: async ({ canvasElement }) => {
    await givenPlay(canvasElement, en, "en");
  },
};

/** Spec row 6: a given personality not checked against Positioning says so, 8 under the state line. */
async function marksPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  await expectState(v, "given", m.business.state.given);
  const marks = v.querySelectorAll<HTMLElement>("[data-marks]");
  await expect(marks).toHaveLength(1);
  const line = marks[0] as HTMLElement;
  await expect(line.closest("[data-head]")).toBe(v.querySelector("[data-head]"));
  await expect(textOf(line)).toBe(
    fill(m.business.marks.unchecked, { nodes: nodeTitle(m, "positioning") }),
  );
  const gap = line.getBoundingClientRect().top - stateLineOf(v).getBoundingClientRect().bottom;
  await expect(Math.abs(gap - 8)).toBeLessThanOrEqual(0.5);
}

export const IdentityMarks: Story = {
  render: hosted("th", givenUnchecked("th")),
  play: async ({ canvasElement }) => {
    await marksPlay(canvasElement, th);
  },
};

export const IdentityMarksEnglish: Story = {
  render: hostedEnglish(givenUnchecked("en")),
  play: async ({ canvasElement }) => {
    await marksPlay(canvasElement, en);
  },
};

// ----- one project, the other language (spec row 10) -----

/**
 * The header's language switch, as a story needs it: one given personality held by one mounted
 * view, and a control outside the view that changes the locale above it. The view is never keyed
 * on the locale, so a remount would show as a new element.
 */
function SwitchHost({ from, initial }: { from: Lang; initial: BusinessView }) {
  const [locale, setLocale] = useState<Lang>(from);
  const next: Lang = locale === "th" ? "en" : "th";
  return (
    <LocaleProvider locale={locale}>
      <button type="button" data-switch-locale={next} onClick={() => setLocale(next)}>
        {next.toUpperCase()}
      </button>
      <Host locale={locale} initial={initial} heading />
    </LocaleProvider>
  );
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

/** What the view says in one language about a given personality, from the catalog, answers as typed. */
async function expectGivenIn(
  v: HTMLElement,
  m: Messages,
  typed: { person: string; never: string },
) {
  await expect(
    within(v).getByRole("heading", { level: 2, name: nodeTitle(m, "identity-frame") }),
  ).toBeVisible();
  await expectState(v, "given", m.business.state.given);
  const [person, never, personality] = fieldsOf(v) as [HTMLElement, HTMLElement, HTMLElement];
  await expect(fieldsOf(v).map((f) => textOf(f.children[0] as HTMLElement))).toEqual([
    m.business.field.person,
    m.business.field.never,
    m.business.field.personality,
  ]);
  await expect(person.querySelector("bdi")?.textContent).toBe(typed.person);
  await expect(never.querySelector("bdi")?.textContent).toBe(typed.never);
  for (const field of [person, never])
    await expect(textOf(field)).toContain(m.business.label.yourWords);
  await expect(textOf(personality)).toContain(m.business.identity.hypothesis);
  const terms = [...personality.querySelectorAll<HTMLElement>("dt")];
  await expect(terms.map(textOf)).toEqual(PERSONALITY_AXES.map((a) => legendLine(m, a)));
  for (const [i, axis] of PERSONALITY_AXES.entries()) {
    await expect(textOf(terms[i] as HTMLElement)).toContain(m.business.axis[axis].low);
    await expect(textOf(terms[i] as HTMLElement)).toContain(m.business.axis[axis].high);
  }
  await expect([...personality.querySelectorAll<HTMLElement>("dd")].map(textOf)).toEqual(
    PERSONALITY_AXES.map((a) => pointLine(m, FIXTURE_POINTS[a])),
  );
  await expect(buttonsOf(v)).toHaveLength(0);
}

/**
 * Spec row 10: one given personality on one mounted view, shown in the first language and then in
 * the other with no remount: the node title, the labels, both ends of each scale, the points and the
 * state line come from the other catalog, the two answers stay exactly as typed, no call is made,
 * and the Thai text of the view, whichever side of the switch it is on, has no letter spacing.
 */
async function switchPlay(canvasElement: HTMLElement, from: Lang) {
  enter.mockReset();
  const first = from === "th" ? th : en;
  const second = from === "th" ? en : th;
  const answers = PERSONALITY_ANSWERS[from];
  const v = viewOf(canvasElement);
  const field = fieldsOf(v)[2] as HTMLElement;
  await expectGivenIn(v, first, answers);
  if (from === "th") await expectNoLetterSpacing(v);
  await userEvent.click(canvasElement.querySelector("[data-switch-locale]") as HTMLElement);
  await waitFor(() => expect(textOf(stateLineOf(v))).toBe(second.business.state.given));
  await expect(viewOf(canvasElement)).toBe(v);
  await expect(fieldsOf(v)[2]).toBe(field);
  await expectGivenIn(v, second, answers);
  if (from === "en") await expectNoLetterSpacing(v);
  await expect(enter).toHaveBeenCalledTimes(0);
}

export const IdentitySwitchToEnglish: Story = {
  render: () => <SwitchHost from="th" initial={given("th")} />,
  play: async ({ canvasElement }) => {
    await switchPlay(canvasElement, "th");
  },
};

export const IdentitySwitchToThai: Story = {
  render: () => <SwitchHost from="en" initial={given("en")} />,
  play: async ({ canvasElement }) => {
    await switchPlay(canvasElement, "en");
  },
};

// ----- markup as text (spec row 8) -----

/** Spec row 8: markup in an answer is text in a `bdi`, never an image, a link or a tag. */
async function untrustedPlay(canvasElement: HTMLElement, m: Messages) {
  const v = viewOf(canvasElement);
  await expectState(v, "given", m.business.state.given);
  const [person, never] = fieldsOf(v) as [HTMLElement, HTMLElement];
  await expect(person.querySelector("bdi")?.textContent).toBe(HOSTILE_ANSWERS.person);
  await expect(never.querySelector("bdi")?.textContent).toBe(HOSTILE_ANSWERS.never);
  await expect(v.querySelectorAll("a, img, script, b")).toHaveLength(0);
  await expect(canvasElement.querySelector("img[src='x']")).toBeNull();
}

const untrusted = (locale: Lang) =>
  foundationProject(locale, "agreed", [
    givenEntry(HOSTILE_ANSWERS),
    answeredEntry(false),
    nameEntry(HOSTILE_NAME),
  ]);

/** Spec row 22: markup as a working name is text in a `bdi`, never an image, a link, a script or a tag. */
async function untrustedNamePlay(canvasElement: HTMLElement, m: Messages) {
  const v = nodeViewOf(canvasElement, "name");
  await expectState(v, "given", m.business.state.given);
  const name = v.querySelector<HTMLElement>('[data-field="workingName"] bdi') as HTMLElement;
  await expect(name.textContent).toBe(HOSTILE_NAME);
  await expect(name.children).toHaveLength(0);
  await expect(v.querySelectorAll("a, img, script, b")).toHaveLength(0);
  await expect(textOf(v)).toContain(m.business.name.notScreened);
}

/** Both nodes with text the person typed: the answers of Brand personality and the working name. */
const untrustedHosts = (locale: Lang) => (
  <>
    <Host locale={locale} initial={untrusted(locale)} />
    <Host locale={locale} initial={untrusted(locale)} node="name" />
  </>
);

export const FoundationUntrustedText: Story = {
  render: () => untrustedHosts("th"),
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, th);
    await untrustedNamePlay(canvasElement, th);
  },
};

export const FoundationUntrustedTextEnglish: Story = {
  render: () => <LocaleProvider locale="en">{untrustedHosts("en")}</LocaleProvider>,
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, en);
    await untrustedNamePlay(canvasElement, en);
  },
};

// ----- narrow (spec row 11) -----

const longAnswers = () =>
  foundationProject("th", "agreed", [
    givenEntry({ person: LONG_PERSONALITY_ANSWER, never: LONG_PERSONALITY_ANSWER }),
  ]);

const narrowHost = (locale: Lang, initial: BusinessView, mode: "light" | "dark") => () => {
  const host = <Host locale={locale} initial={initial} narrow />;
  return (
    <Under profile="neutral" mode={mode}>
      {locale === "en" ? <LocaleProvider locale="en">{host}</LocaleProvider> : host}
    </Under>
  );
};

/** Spec row 11: 2,000 Thai characters with no space wrap inside the 282 px column; every block starts at the state line's edge. */
async function narrowPlay(canvasElement: HTMLElement) {
  const v = viewOf(canvasElement);
  await expectFitsAt360(canvasElement);
  const left = stateLineOf(v).getBoundingClientRect().left;
  for (const block of v.querySelectorAll<HTMLElement>(
    "[data-head] > p, [data-field] > h3, [data-field] > p, [data-field] dt, [data-field] dd",
  )) {
    await expect(Math.abs(block.getBoundingClientRect().left - left)).toBeLessThanOrEqual(0.5);
  }
  for (const bdi of v.querySelectorAll("bdi")) {
    await expect(textOf(bdi).length).toBe(LONG_PERSONALITY_ANSWER.length);
  }
  expectNoGlyphClip(canvasElement);
}

export const IdentityNarrow: Story = {
  render: narrowHost("th", longAnswers(), "light"),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement);
  },
};

export const IdentityNarrowDark: Story = {
  render: narrowHost("th", longAnswers(), "dark"),
  play: async ({ canvasElement }) => {
    await narrowPlay(canvasElement);
  },
};

export const IdentityNarrowEnglish: Story = {
  render: narrowHost("en", given("en"), "light"),
  play: async ({ canvasElement }) => {
    await expectFitsAt360(canvasElement);
  },
};

type Arrow = "ArrowDown" | "ArrowUp" | "ArrowLeft" | "ArrowRight";

/**
 * Radix moves focus in a timeout after the keydown and checks the radio only while the arrow key is
 * still held, so the key is held until the focus has arrived, as a finger would (RadioGroup stories).
 */
async function pressArrow(key: Arrow, reached: HTMLElement) {
  await userEvent.keyboard(`{${key}>}`);
  await focusedIs(reached);
  await userEvent.keyboard(`{/${key}}`);
}

/** The point a scale holds, or 0 when none is chosen. */
const pointOf = (scale: HTMLElement) =>
  radiosOf(scale).findIndex((r) => r.getAttribute("aria-checked") === "true") + 1;

/** The radio a Tab or a Shift+Tab stops on in a scale: the chosen point, or the first one. */
const stopOf = (scale: HTMLElement) =>
  radiosOf(scale)[Math.max(pointOf(scale), 1) - 1] as HTMLElement;

/**
 * The editor at 360: one column that fits, Tab goes person, never, one stop per scale, Save, Cancel,
 * and each focused control draws the focus form of the catalog. Then keyboard alone: the arrow keys
 * move between the points of a scale and check the one reached, a 2,000-character Thai answer with
 * no space pasted into the open editor wraps inside the field, and one Enter on Save makes one call
 * with the chosen points and the typed answers, after which the given view fits at 360.
 */
async function narrowEditorPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = viewOf(canvasElement);
  await userEvent.click(buttonOf(v, m.business.identity.describe));
  await expectOpenEditor(v, m);
  await expectFitsAt360(canvasElement);
  const [person, never] = textareasOf(v) as [HTMLTextAreaElement, HTMLTextAreaElement];
  const order: Element[] = [
    person,
    never,
    ...PERSONALITY_AXES.map((axis) => radiosOf(scaleOf(v, axis))[0] as HTMLElement),
    buttonOf(v, m.business.identity.save),
    buttonOf(v, m.business.positioning.cancel),
  ];
  await focusedIs(person);
  for (const stop of order.slice(1)) {
    await userEvent.tab();
    await focusedIs(stop);
    await expect((stop as HTMLElement).matches(":focus-visible")).toBe(true);
    // Focus on a point is not a choice.
    await expect(checkedIn(v)).toBe(0);
    if (stop.getAttribute("role") === "radio") await expectFocusBorderForm(stop as HTMLElement);
  }
  await expectFocusBorderForm(buttonOf(v, m.business.identity.save));
  await expectFocusBorderForm(buttonOf(v, m.business.positioning.cancel));

  // Back through Cancel and Save to the last scale, then the arrow keys: each of the four moves to
  // the point beside it and checks it, with focus visible on the point reached.
  const premium = scaleOf(v, "premium");
  await userEvent.tab({ shift: true });
  await focusedIs(buttonOf(v, m.business.identity.save));
  await userEvent.tab({ shift: true });
  await focusedIs(radiosOf(premium)[0] as HTMLElement);
  const arrows: [Arrow, number][] = [
    ["ArrowDown", 2],
    ["ArrowRight", 3],
    ["ArrowUp", 2],
    ["ArrowLeft", 1],
    ["ArrowRight", 2],
    ["ArrowDown", 3],
    ["ArrowDown", 4],
  ];
  for (const [key, point] of arrows) {
    const reached = radiosOf(premium)[point - 1] as HTMLElement;
    await pressArrow(key, reached);
    await waitFor(() => expect(pointOf(premium)).toBe(point));
    await expect(reached.matches(":focus-visible")).toBe(true);
    await expectFocusBorderForm(reached);
    await expect(checkedIn(v)).toBe(1);
  }

  // The other four scales by keyboard, backwards: Space takes the first point, an arrow the next ones.
  const wanted: Record<PersonalityAxis, number> = {
    playful: 2,
    expressive: 4,
    structured: 3,
    warm: 1,
    premium: 4,
  };
  for (const axis of [...PERSONALITY_AXES].reverse().slice(1)) {
    const scale = scaleOf(v, axis);
    await userEvent.tab({ shift: true });
    await focusedIs(radiosOf(scale)[0] as HTMLElement);
    if (wanted[axis] === 1) await userEvent.keyboard(" ");
    for (let point = 2; point <= wanted[axis]; point++) {
      await pressArrow("ArrowDown", radiosOf(scale)[point - 1] as HTMLElement);
    }
    await waitFor(() => expect(pointOf(scale)).toBe(wanted[axis]));
  }

  // The 2,000-character Thai answer with no space goes into the open editor and wraps inside it.
  await userEvent.tab({ shift: true });
  await focusedIs(never);
  await userEvent.paste(LONG_PERSONALITY_ANSWER);
  await waitFor(() => expect(never.value).toBe(LONG_PERSONALITY_ANSWER));
  await userEvent.tab({ shift: true });
  await focusedIs(person);
  await userEvent.paste(PERSONALITY_ANSWERS[locale].person);
  await expectFitsAt360(canvasElement);
  for (const area of [person, never]) {
    await expect(area.scrollWidth).toBeLessThanOrEqual(area.clientWidth);
  }

  // Forward again, one stop per control, to Save; one Enter makes one call and no other key does.
  const forward = [
    never,
    ...PERSONALITY_AXES.map((axis) => stopOf(scaleOf(v, axis))),
    buttonOf(v, m.business.identity.save),
  ];
  for (const stop of forward) {
    await userEvent.tab();
    await focusedIs(stop);
  }
  await expect(enter).toHaveBeenCalledTimes(0);
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("given"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "identity-frame",
    kind: "given",
    payload: {
      axes: { playful: 25, expressive: 75, structured: 50, warm: 0, premium: 75 },
      person: PERSONALITY_ANSWERS[locale].person,
      never: LONG_PERSONALITY_ANSWER,
    },
  });
  await expectState(v, "given", m.business.state.given);
  await expect(v.querySelector("[data-editor]")).toBeNull();
  await expectFitsAt360(canvasElement);
  for (const bdi of v.querySelectorAll("bdi")) await expect(bdi).toBeVisible();
  await expect(v.querySelectorAll("bdi")).toHaveLength(2);
}

export const IdentityNarrowEditor: Story = {
  render: narrowHost("th", open("th"), "light"),
  play: async ({ canvasElement }) => {
    await narrowEditorPlay(canvasElement, th, "th");
  },
};

export const IdentityNarrowEditorDark: Story = {
  render: narrowHost("th", open("th"), "dark"),
  play: async ({ canvasElement }) => {
    await narrowEditorPlay(canvasElement, th, "th");
  },
};

export const IdentityNarrowEditorEnglish: Story = {
  render: narrowHost("en", open("en"), "light"),
  play: async ({ canvasElement }) => {
    await narrowEditorPlay(canvasElement, en, "en");
  },
};

// ----- Brand architecture (ORV-295, spec rows 15 to 17) -----

type Gate = "open" | "skipped" | "agreed";
const architectureOn = (locale: Lang, gate: Gate) => ({
  node: "architecture" as const,
  after: afterEntryOn(locale, gate),
});

const choiceOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-field="subBrands"]') as HTMLElement;
const answerField = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-field="architecture"]') as HTMLElement;
const saveOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-choice="save"]') as HTMLElement;
const groupOf = (v: HTMLElement, m: Messages) =>
  within(v).getByRole("radiogroup", { name: m.business.question.subBrands });
const choiceRadio = (v: HTMLElement, m: Messages, which: "no" | "yes") =>
  within(groupOf(v, m)).getByRole("radio", { name: m.business.architecture[which] });
/** The lines of one field, as text, heading first. */
const linesOf = (field: HTMLElement) => [...field.children].map((c) => textOf(c));
/** The fixed-rule architecture, with its "because" line under it. */
const expectDerived = async (v: HTMLElement, m: Messages) => {
  await expectState(v, "derived", m.business.state.derived);
  await expect(linesOf(choiceOf(v))).toEqual([
    m.business.field.subBrands,
    m.business.architecture.no,
  ]);
  await expect(linesOf(answerField(v))).toEqual([
    m.business.field.architecture,
    m.business.architecture.single,
    m.business.architecture.because,
  ]);
  await expect(v.querySelector("[data-editor], [role=radiogroup], [data-row]")).toBeNull();
  await expect(buttonsOf(v)).toHaveLength(0);
};

/**
 * Spec row 15 and design A1, A4 to A6: the question with two choices and nothing checked, one button
 * in the row. A rate limited save keeps the choice and says so under the row; a double press makes
 * one call. Choosing No and saving shows "Worked out by a fixed rule", "Single brand, one unit" with
 * the line that says where it came from, no control, and focus on the Architecture heading.
 */
async function derivedPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  const v = nodeViewOf(canvasElement, "architecture");
  await expectState(v, "empty", m.business.state.empty);
  await expect(within(groupOf(v, m)).getAllByRole("radio")).toHaveLength(2);
  await expect(checkedIn(v)).toBe(0);
  await expect([...v.querySelectorAll("[data-row] button")].map(textOf)).toEqual([
    m.business.architecture.save,
  ]);
  await expect(saveOf(v).dataset["variant"]).toBe("primary");
  // The question is the group's name: the field's own heading would say it twice.
  await expect(within(choiceOf(v)).queryByRole("heading")).toBeNull();
  await expect(linesOf(answerField(v))).toEqual([
    m.business.field.architecture,
    m.business.state.empty,
  ]);

  await userEvent.click(choiceRadio(v, m, "no"));
  await expect(checkedIn(v)).toBe(1);
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
  release({ ok: false, failure: RATE_LIMITED[locale] });
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
  await expect(checkedIn(v)).toBe(1);
  await expect(choiceRadio(v, m, "no")).toHaveAttribute("aria-checked", "true");
  await expect(saveOf(v)).not.toHaveAttribute("aria-disabled");

  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("derived"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "architecture",
    kind: "answered",
    payload: { subBrands: false },
  });
  await expectDerived(v, m);
  await expect(v.querySelector("[data-marks]")).toBeNull();
  const [value, because] = [...answerField(v).querySelectorAll<HTMLElement>("p")] as [
    HTMLElement,
    HTMLElement,
  ];
  if (inVitest) await expectInkClearsAbove(because, value, 2);
  await focusedIs(
    within(answerField(v)).getByRole("heading", { name: m.business.field.architecture }),
  );
}

export const ArchitectureDerived: Story = {
  render: hosted("th", open("th"), architectureOn("th", "agreed")),
  play: async ({ canvasElement }) => {
    await derivedPlay(canvasElement, th, "th");
  },
};

export const ArchitectureDerivedEnglish: Story = {
  render: hostedEnglish(open("en"), architectureOn("en", "agreed")),
  play: async ({ canvasElement }) => {
    await derivedPlay(canvasElement, en, "en");
  },
};

/**
 * Spec row 16 and design A3, A10: a save with no choice shows "Choose one answer first", puts focus
 * on the first option without checking it, and makes no call. Yes is saved as the answer, the node
 * says it is not in this version, the Architecture field holds that one sentence and no value, and
 * the Name card (a read-only view of the same project) now waits for Brand architecture.
 */
async function notInVersionPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = nodeViewOf(canvasElement, "architecture");
  await userEvent.click(saveOf(v));
  await waitFor(() =>
    expect(within(choiceOf(v)).getByText(m.business.architecture.choiceRequired)).toBeVisible(),
  );
  await expect(groupOf(v, m)).toHaveAttribute("aria-invalid", "true");
  await focusedIs(choiceRadio(v, m, "no"));
  await expect(checkedIn(v)).toBe(0);
  await expect(enter).toHaveBeenCalledTimes(0);

  await userEvent.click(choiceRadio(v, m, "yes"));
  await expect(within(choiceOf(v)).queryByText(m.business.architecture.choiceRequired)).toBeNull();
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("notInVersion"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "architecture",
    kind: "answered",
    payload: { subBrands: true },
  });
  await expectState(v, "notInVersion", m.business.state.notInVersion);
  await expect(linesOf(choiceOf(v))).toEqual([
    m.business.field.subBrands,
    m.business.architecture.yes,
  ]);
  // No value under Architecture: the one sentence, as a secondary line.
  await expect(linesOf(answerField(v))).toEqual([
    m.business.field.architecture,
    m.business.architecture.notInVersion,
  ]);
  await expect(textOf(v)).not.toContain(m.business.architecture.single);
  await expect(buttonsOf(v)).toHaveLength(0);
  const name = nodeViewOf(canvasElement, "name");
  await expectState(
    name,
    "waiting",
    fill(m.business.state.waiting, { nodes: nodeTitle(m, "architecture") }),
  );
}

export const ArchitectureNotInVersion: Story = {
  render: hosted("th", open("th"), { ...architectureOn("th", "agreed"), companion: "name" }),
  play: async ({ canvasElement }) => {
    await notInVersionPlay(canvasElement, th);
  },
};

export const ArchitectureNotInVersionEnglish: Story = {
  render: hostedEnglish(open("en"), { ...architectureOn("en", "agreed"), companion: "name" }),
  play: async ({ canvasElement }) => {
    await notInVersionPlay(canvasElement, en);
  },
};

/** The three projects of spec row 17, each in a frame of its own. */
function MarksCases({ locale }: { locale: Lang }) {
  const cases: [string, BusinessView][] = [
    ["answered-waiting", foundationProject(locale, "open", [answeredEntry(false)])],
    ["answered-skipped", foundationProject(locale, "skipped", [answeredEntry(false)])],
    ["unanswered-waiting", foundationProject(locale, "open")],
  ];
  return (
    <>
      {cases.map(([name, initial]) => (
        <div key={name} data-case={name}>
          <Host locale={locale} initial={initial} {...architectureOn(locale, "open")} />
        </div>
      ))}
    </>
  );
}

/**
 * Spec row 17 and design A2, A7, A9: positioning with no choice and the answer "no" waits for
 * Positioning, with the answer and no architecture value; with Positioning skipped the value shows,
 * with the provisional pair of lines (4 apart, at the state line's edge); with no answer it waits
 * and still asks the question, with its button.
 */
async function architectureMarksPlay(canvasElement: HTMLElement, m: Messages) {
  const at = (name: string) =>
    nodeViewOf(canvasElement.querySelector(`[data-case="${name}"]`) as HTMLElement, "architecture");
  const waitingLine = fill(m.business.state.waiting, { nodes: nodeTitle(m, "positioning") });

  const first = at("answered-waiting");
  await expectState(first, "waiting", waitingLine);
  await expect(linesOf(choiceOf(first))).toEqual([
    m.business.field.subBrands,
    m.business.architecture.no,
  ]);
  await expect(linesOf(answerField(first))).toEqual([
    m.business.field.architecture,
    m.business.state.empty,
  ]);
  await expect(textOf(first)).not.toContain(m.business.architecture.single);
  await expect(first.querySelector("[data-marks], [data-row], [role=radiogroup]")).toBeNull();

  const second = at("answered-skipped");
  await expect(second.querySelectorAll("[data-marks]")).toHaveLength(1);
  await expectState(second, "derived", m.business.state.derived);
  await expect(linesOf(answerField(second))).toEqual([
    m.business.field.architecture,
    m.business.architecture.single,
    m.business.architecture.because,
  ]);
  const provisional = second.querySelector<HTMLElement>(
    '[data-marks="provisional"]',
  ) as HTMLElement;
  await expect(provisional.closest("[data-head]")).toBe(second.querySelector("[data-head]"));
  const lines = [...provisional.children] as HTMLElement[];
  await expect(lines.map(textOf)).toEqual([
    m.strategy.provisional,
    fill(m.business.marks.restsOn, { nodes: nodeTitle(m, "positioning") }),
  ]);
  const gap =
    (lines[1] as HTMLElement).getBoundingClientRect().top -
    (lines[0] as HTMLElement).getBoundingClientRect().bottom;
  await expect(Math.abs(gap - 4)).toBeLessThanOrEqual(0.5);
  const state = stateLineOf(second).getBoundingClientRect();
  await expect(Math.abs(provisional.getBoundingClientRect().left - state.left)).toBeLessThanOrEqual(
    0.5,
  );
  await expect(
    Math.abs(provisional.getBoundingClientRect().top - state.bottom - 8),
  ).toBeLessThanOrEqual(0.5);

  const third = at("unanswered-waiting");
  await expectState(third, "waiting", waitingLine);
  await expect(groupOf(third, m)).toBeVisible();
  await expect(checkedIn(third)).toBe(0);
  await expect([...third.querySelectorAll("[data-row] button")].map(textOf)).toEqual([
    m.business.architecture.save,
  ]);
  await expect(textOf(third)).not.toContain(m.business.architecture.single);
}

export const ArchitectureMarks: Story = {
  render: () => <MarksCases locale="th" />,
  play: async ({ canvasElement }) => {
    await architectureMarksPlay(canvasElement, th);
  },
};

export const ArchitectureMarksEnglish: Story = {
  render: () => (
    <LocaleProvider locale="en">
      <MarksCases locale="en" />
    </LocaleProvider>
  ),
  play: async ({ canvasElement }) => {
    await architectureMarksPlay(canvasElement, en);
  },
};

// ----- Name (ORV-295, spec rows 18 to 20) -----

const nameOn = (locale: Lang, gate: Gate, before: StoredEntryList = []) => ({
  node: "name" as const,
  after: afterEntryOn(locale, gate, before),
});
type StoredEntryList = Parameters<typeof afterEntryOn>[2];

const nameField = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-field="workingName"]') as HTMLElement;
const giveOf = (v: HTMLElement) =>
  v.querySelector<HTMLElement>('[data-choice="give"]') as HTMLElement;
const nameInput = (v: HTMLElement) =>
  v.querySelector<HTMLInputElement>("input") as HTMLInputElement;

/** The Name view before anything is given: the state, one fallback line, and Give as the one button. */
async function expectNameOpen(
  v: HTMLElement,
  key: FoundationNode["state"],
  line: string,
  m: Messages,
) {
  await expectState(v, key, line);
  await expect(linesOf(nameField(v))).toEqual([
    m.business.field.workingName,
    m.business.state.empty,
  ]);
  await expect(buttonsOf(v).map(textOf)).toEqual([m.business.name.give]);
  await expect(giveOf(v).dataset["variant"]).toBe("primary");
}

/**
 * Spec row 18 and design N1, N3, N7: Give opens the editor with focus on the input; "  ORIVILO  " is
 * saved (the server trims it), and the view shows the name as text with "not screened for
 * trademarks" under it, "Given by you", no mark, no control, focus on the Working name heading.
 */
async function nameGivenPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = nodeViewOf(canvasElement, "name");
  await expectNameOpen(v, "empty", m.business.state.empty, m);
  await userEvent.click(giveOf(v));
  await focusedIs(nameInput(v));
  await expect(nameInput(v)).toHaveAttribute("aria-required", "true");
  await expect(within(v).getByRole("textbox", { name: /./ })).toBe(nameInput(v));
  await expect(nameInput(v).labels?.[0]?.textContent).toContain(m.business.field.workingName);
  await expect(
    [...v.querySelectorAll("[data-row] button")].map((b) => [
      textOf(b),
      (b as HTMLElement).dataset["variant"],
    ]),
  ).toEqual([
    [m.business.name.save, "primary"],
    [m.business.positioning.cancel, "secondary"],
  ]);
  await userEvent.type(nameInput(v), `  ${FIXTURE_NAME}  `);
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("given"));
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(enter).toHaveBeenCalledWith({
    node: "name",
    kind: "given",
    payload: { name: `  ${FIXTURE_NAME}  ` },
  });
  await expectState(v, "given", m.business.state.given);
  const field = nameField(v);
  await expect(linesOf(field)).toEqual([
    m.business.field.workingName,
    FIXTURE_NAME,
    m.business.name.notScreened,
  ]);
  await expect(field.querySelector("bdi")?.textContent).toBe(FIXTURE_NAME);
  await expect(v.querySelector("[data-marks]")).toBeNull();
  await expect(buttonsOf(v)).toHaveLength(0);
  await expect(v.querySelector("[data-editor]")).toBeNull();
  const [name, label] = [...field.querySelectorAll<HTMLElement>("p")] as [HTMLElement, HTMLElement];
  if (inVitest) await expectInkClearsAbove(label, name, 2);
  await focusedIs(within(field).getByRole("heading", { name: m.business.field.workingName }));
}

export const NameGiven: Story = {
  render: hosted(
    "th",
    foundationProject("th", "agreed", [answeredEntry(false)]),
    nameOn("th", "agreed", [answeredEntry(false)]),
  ),
  play: async ({ canvasElement }) => {
    await nameGivenPlay(canvasElement, th);
  },
};

export const NameGivenEnglish: Story = {
  render: hostedEnglish(
    foundationProject("en", "agreed", [answeredEntry(false)]),
    nameOn("en", "agreed", [answeredEntry(false)]),
  ),
  play: async ({ canvasElement }) => {
    await nameGivenPlay(canvasElement, en);
  },
};

/**
 * Spec row 19 and design N4 to N6: an empty name and a name of 61 characters make no call and keep
 * what was typed, each with its line and focus on the input; Cancel closes the editor with focus on
 * Give and the next editor starts empty; a double press makes one call, the save button inert and
 * named, Cancel inert, the two buttons of one height; a rate limited answer keeps the text.
 */
async function nameInvalidPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = nodeViewOf(canvasElement, "name");
  const cancel = () => v.querySelector<HTMLElement>('[data-choice="cancel"]') as HTMLElement;
  await userEvent.click(giveOf(v));
  await focusedIs(nameInput(v));

  await userEvent.click(saveOf(v));
  await waitFor(() => expect(within(v).getByText(m.business.name.required)).toBeVisible());
  await focusedIs(nameInput(v));
  await expect(nameInput(v)).toHaveAttribute("aria-invalid", "true");
  await expect(enter).toHaveBeenCalledTimes(0);

  await userEvent.click(nameInput(v));
  await userEvent.paste("ก".repeat(61));
  await expect(within(v).queryByText(m.business.name.required)).toBeNull();
  await userEvent.click(saveOf(v));
  const tooLong = fill(m.business.intake.tooLong, { max: "60" });
  await waitFor(() => expect(within(v).getByText(tooLong)).toBeVisible());
  await expect(nameInput(v).value).toBe("ก".repeat(61));
  await focusedIs(nameInput(v));
  await expect(enter).toHaveBeenCalledTimes(0);

  await userEvent.click(cancel());
  await waitFor(() => expect(v.querySelector("[data-editor]")).toBeNull());
  await focusedIs(giveOf(v));
  await expect(enter).toHaveBeenCalledTimes(0);
  await userEvent.click(giveOf(v));
  await expect(nameInput(v).value).toBe("");

  await userEvent.type(nameInput(v), FIXTURE_NAME);
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
  await expect(cancel()).toHaveAttribute("aria-disabled", "true");
  await userEvent.click(cancel());
  await expect(v.querySelector("[data-editor]")).not.toBeNull();
  release({ ok: false, failure: RATE_LIMITED[locale] });
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
  await expect(nameInput(v).value).toBe(FIXTURE_NAME);
  await expect(saveOf(v)).not.toHaveAttribute("aria-disabled");
  expectSameHeight(saveOf(v), cancel());
}

export const NameInvalid: Story = {
  render: hosted(
    "th",
    foundationProject("th", "agreed", [answeredEntry(false)]),
    nameOn("th", "agreed", [answeredEntry(false)]),
  ),
  play: async ({ canvasElement }) => {
    await nameInvalidPlay(canvasElement, th, "th");
  },
};

export const NameInvalidEnglish: Story = {
  render: hostedEnglish(
    foundationProject("en", "agreed", [answeredEntry(false)]),
    nameOn("en", "agreed", [answeredEntry(false)]),
  ),
  play: async ({ canvasElement }) => {
    await nameInvalidPlay(canvasElement, en, "en");
  },
};

/**
 * Spec row 20 and design N2, N8: with Positioning not agreed the name waits for Positioning and can
 * still be given; once given it shows the name, the label, "Given by you" and one mark line that
 * names Positioning as not yet checked.
 */
async function nameAheadPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const v = nodeViewOf(canvasElement, "name");
  await expectNameOpen(
    v,
    "waiting",
    fill(m.business.state.waiting, { nodes: nodeTitle(m, "positioning") }),
    m,
  );
  await userEvent.click(giveOf(v));
  await focusedIs(nameInput(v));
  await userEvent.type(nameInput(v), FIXTURE_NAME);
  await userEvent.click(saveOf(v));
  await waitFor(() => expect(stateLineOf(v).dataset["nodeState"]).toBe("given"));
  await expect(enter).toHaveBeenCalledWith({
    node: "name",
    kind: "given",
    payload: { name: FIXTURE_NAME },
  });
  await expectState(v, "given", m.business.state.given);
  await expect(linesOf(nameField(v))).toEqual([
    m.business.field.workingName,
    FIXTURE_NAME,
    m.business.name.notScreened,
  ]);
  const marks = v.querySelectorAll<HTMLElement>("[data-marks]");
  await expect(marks).toHaveLength(1);
  await expect((marks[0] as HTMLElement).dataset["marks"]).toBe("unchecked");
  await expect(textOf(marks[0] as HTMLElement)).toBe(
    fill(m.business.marks.unchecked, { nodes: nodeTitle(m, "positioning") }),
  );
  await expect(buttonsOf(v)).toHaveLength(0);
}

export const NameAhead: Story = {
  render: hosted("th", foundationProject("th", "open"), nameOn("th", "open")),
  play: async ({ canvasElement }) => {
    await nameAheadPlay(canvasElement, th);
  },
};

export const NameAheadEnglish: Story = {
  render: hostedEnglish(foundationProject("en", "open"), nameOn("en", "open")),
  play: async ({ canvasElement }) => {
    await nameAheadPlay(canvasElement, en);
  },
};

// ----- narrow and the other language (spec row 23) -----

/**
 * One 360 px frame holding both views of the PR 2 head's project: Brand architecture with its
 * question open, Name with 60 Thai characters with no space given. `answered` is the project after
 * the answer "no": the architecture view is then the derived one.
 */
function PairHost({ locale, mode }: { locale: Lang; mode: "light" | "dark" }) {
  const entries = [answeredEntry(false), nameEntry(LONG_WORKING_NAME)];
  const asked = foundationProject(locale, "agreed", [nameEntry(LONG_WORKING_NAME)]);
  const pair = (
    <div
      data-narrow=""
      className="flex w-[360px] max-w-full flex-col gap-6 overflow-hidden ps-[33px] pe-[45px]"
    >
      <Host
        locale={locale}
        initial={asked}
        node="architecture"
        frame={false}
        after={afterEntryOn(locale, "agreed", [nameEntry(LONG_WORKING_NAME)])}
      />
      <Host
        locale={locale}
        initial={foundationProject(locale, "agreed", entries)}
        node="name"
        frame={false}
      />
    </div>
  );
  return (
    <Under profile="neutral" mode={mode}>
      {locale === "en" ? <LocaleProvider locale="en">{pair}</LocaleProvider> : pair}
    </Under>
  );
}

/**
 * Spec row 23, design N9 and 8.3: at 360 px nothing scrolls sideways with the question open or
 * answered; the Thai choice labels and the 60-character name wrap with no glyph clipped; the name
 * starts where its heading starts; Save takes the focus form of the catalog.
 */
async function pairNarrowPlay(canvasElement: HTMLElement, m: Messages) {
  enter.mockReset();
  enter.mockResolvedValue({ ok: true });
  const arch = nodeViewOf(canvasElement, "architecture");
  const name = nodeViewOf(canvasElement, "name");
  await expectFitsAt360(canvasElement);
  expectNoGlyphClip(canvasElement);
  const field = nameField(name);
  const heading = field.children[0] as HTMLElement;
  const bdi = field.querySelector("bdi") as HTMLElement;
  await expect(textOf(bdi)).toBe(LONG_WORKING_NAME);
  await expect(
    Math.abs(
      (field.children[1] as HTMLElement).getBoundingClientRect().left -
        heading.getBoundingClientRect().left,
    ),
  ).toBeLessThanOrEqual(0.5);
  await expect(bdi.getBoundingClientRect().height).toBeGreaterThan(0);

  // Tab goes to the first option (checking none), then Save, with the catalog's focus form.
  await userEvent.click(canvasElement);
  await userEvent.tab();
  await focusedIs(within(groupOf(arch, m)).getAllByRole("radio")[0] as HTMLElement);
  await expect(checkedIn(arch)).toBe(0);
  await userEvent.tab();
  await focusedIs(saveOf(arch));
  await expectFocusBorderForm(saveOf(arch));

  await userEvent.click(choiceRadio(arch, m, "no"));
  await userEvent.click(saveOf(arch));
  await waitFor(() => expect(stateLineOf(arch).dataset["nodeState"]).toBe("derived"));
  await expectFitsAt360(canvasElement);
  expectNoGlyphClip(canvasElement);
  const left = stateLineOf(arch).getBoundingClientRect().left;
  for (const block of arch.querySelectorAll<HTMLElement>(
    "[data-head] > p, [data-field] > h3, [data-field] > p",
  )) {
    await expect(Math.abs(block.getBoundingClientRect().left - left)).toBeLessThanOrEqual(0.5);
  }
}

export const FoundationNarrow: Story = {
  render: () => <PairHost locale="th" mode="light" />,
  play: async ({ canvasElement }) => {
    await pairNarrowPlay(canvasElement, th);
  },
};

export const FoundationNarrowDark: Story = {
  render: () => <PairHost locale="th" mode="dark" />,
  play: async ({ canvasElement }) => {
    await pairNarrowPlay(canvasElement, th);
  },
};

export const FoundationNarrowEnglish: Story = {
  render: () => <PairHost locale="en" mode="light" />,
  play: async ({ canvasElement }) => {
    await pairNarrowPlay(canvasElement, en);
  },
};

/**
 * The header's language switch on the two PR 2 views: one project with the answer "no" and a Thai
 * name, one mounted pair of views, and a control outside them that changes the locale. The titles,
 * state lines and labels come from the other catalog; the name stays as typed, in the same element.
 */
function PairSwitchHost({ from }: { from: Lang }) {
  const [locale, setLocale] = useState<Lang>(from);
  const next: Lang = locale === "th" ? "en" : "th";
  const project = foundationProject(locale, "agreed", [
    answeredEntry(false),
    nameEntry(LONG_WORKING_NAME),
  ]);
  const views: ReactNode = (
    <>
      <Host locale={locale} initial={project} node="architecture" heading />
      <Host locale={locale} initial={project} node="name" heading />
    </>
  );
  return (
    <LocaleProvider locale={locale}>
      <button type="button" data-switch-locale={next} onClick={() => setLocale(next)}>
        {next.toUpperCase()}
      </button>
      {views}
    </LocaleProvider>
  );
}

async function pairSwitchPlay(canvasElement: HTMLElement, from: Lang) {
  const first = from === "th" ? th : en;
  const second = from === "th" ? en : th;
  const read = async (m: Messages) => {
    const arch = nodeViewOf(canvasElement, "architecture");
    const name = nodeViewOf(canvasElement, "name");
    await expect(
      within(arch).getByRole("heading", { level: 2, name: m.business.node.architecture }),
    ).toBeVisible();
    await expect(
      within(name).getByRole("heading", { level: 2, name: m.business.node.name }),
    ).toBeVisible();
    await expectState(arch, "derived", m.business.state.derived);
    await expect(linesOf(answerField(arch))).toEqual([
      m.business.field.architecture,
      m.business.architecture.single,
      m.business.architecture.because,
    ]);
    // The project was made in the first language; the derived values are the other catalog's words.
    await expectState(name, "given", m.business.state.given);
    await expect(linesOf(nameField(name))).toEqual([
      m.business.field.workingName,
      LONG_WORKING_NAME,
      m.business.name.notScreened,
    ]);
  };
  const bdi = nodeViewOf(canvasElement, "name").querySelector("bdi");
  await read(first);
  await userEvent.click(canvasElement.querySelector("[data-switch-locale]") as HTMLElement);
  await waitFor(() =>
    expect(textOf(stateLineOf(nodeViewOf(canvasElement, "name")))).toBe(
      second.business.state.given,
    ),
  );
  await expect(nodeViewOf(canvasElement, "name").querySelector("bdi")).toBe(bdi);
  await read(second);
  await expect(enter).toHaveBeenCalledTimes(0);
}

export const FoundationSwitchToEnglish: Story = {
  render: () => <PairSwitchHost from="th" />,
  play: async ({ canvasElement }) => {
    enter.mockReset();
    await pairSwitchPlay(canvasElement, "th");
  },
};

export const FoundationSwitchToThai: Story = {
  render: () => <PairSwitchHost from="en" />,
  play: async ({ canvasElement }) => {
    enter.mockReset();
    await pairSwitchPlay(canvasElement, "en");
  },
};

/**
 * A refusal the server's own check makes after the client's passed (the entry names a field): the
 * name shows its bound under the input and takes focus with the text kept; the architecture asks for
 * a choice again, with the choice kept and focus on the first option.
 */
async function refusedPlay(canvasElement: HTMLElement, m: Messages, locale: Lang) {
  enter.mockReset();
  const arch = nodeViewOf(canvasElement, "architecture");
  const name = nodeViewOf(canvasElement, "name");
  enter.mockResolvedValue({
    ok: false,
    failure: RATE_LIMITED[locale],
    problems: [{ path: "payload.name", kind: "too-long" }],
  });
  await userEvent.click(giveOf(name));
  await userEvent.type(nameInput(name), FIXTURE_NAME);
  await userEvent.click(saveOf(name));
  await waitFor(() =>
    expect(within(name).getByText(fill(m.business.intake.tooLong, { max: "60" }))).toBeVisible(),
  );
  await expect(nameInput(name).value).toBe(FIXTURE_NAME);
  await expect(nameInput(name)).toHaveAttribute("aria-invalid", "true");
  await focusedIs(nameInput(name));

  enter.mockResolvedValue({
    ok: false,
    failure: RATE_LIMITED[locale],
    problems: [{ path: "payload.subBrands", kind: "required" }],
  });
  await userEvent.click(choiceRadio(arch, m, "yes"));
  await userEvent.click(saveOf(arch));
  await waitFor(() =>
    expect(within(choiceOf(arch)).getByText(m.business.architecture.choiceRequired)).toBeVisible(),
  );
  await expect(choiceRadio(arch, m, "yes")).toHaveAttribute("aria-checked", "true");
  await focusedIs(choiceRadio(arch, m, "no"));
}

const refusedHosts = (locale: Lang) => (
  <>
    <Host
      locale={locale}
      initial={foundationProject(locale, "agreed")}
      {...architectureOn(locale, "agreed")}
    />
    <Host
      locale={locale}
      initial={foundationProject(locale, "agreed")}
      {...nameOn(locale, "agreed")}
    />
  </>
);

export const FoundationRefused: Story = {
  render: () => refusedHosts("th"),
  play: async ({ canvasElement }) => {
    await refusedPlay(canvasElement, th, "th");
  },
};

export const FoundationRefusedEnglish: Story = {
  render: () => <LocaleProvider locale="en">{refusedHosts("en")}</LocaleProvider>,
  play: async ({ canvasElement }) => {
    await refusedPlay(canvasElement, en, "en");
  },
};
