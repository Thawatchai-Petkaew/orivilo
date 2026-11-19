import {
  type BusinessView,
  type EntryRequest,
  type FoundationNode,
  PERSONALITY_AXES,
  type PersonalityAxis,
} from "@orivilo/intent-engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
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
  FIXTURE_POINTS,
  given,
  givenEntry,
  givenUnchecked,
  HOSTILE_ANSWERS,
  LONG_PERSONALITY_ANSWER,
  open,
  PERSONALITY_ANSWERS,
  waiting,
} from "./foundation-fixtures";
import { type FoundationEditor, FoundationNodeView } from "./foundation-view";

type Lang = "th" | "en";

/** What the stub action answers: saved, or a line the page would have resolved from `saved.errors.*`. */
type StubResult = { ok: true } | { ok: false; failure: string };
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
}: {
  locale: Lang;
  initial: BusinessView;
  readOnly?: boolean;
  narrow?: boolean;
}) {
  const [view, setView] = useState(initial);
  const [pending, setPending] = useState<"saving" | null>(null);
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [editor, setEditor] = useState<FoundationEditor>(null);
  const node = view.foundation[0] as FoundationNode;
  const onEnter = (request: EntryRequest) => {
    setPending("saving");
    setFailure(undefined);
    void enter(request).then((result) => {
      if (result.ok) setView(afterEntry(locale, request));
      else setFailure(result.failure);
      setPending(null);
    });
  };
  return (
    <div
      {...(narrow ? { "data-narrow": "" } : {})}
      className={
        narrow ? "w-[360px] max-w-full overflow-hidden ps-[33px] pe-[45px]" : "overflow-hidden p-4"
      }
    >
      <FoundationNodeView
        node={node}
        heading={false}
        controls={
          readOnly
            ? undefined
            : {
                pending,
                failure,
                onEnter,
                onDismiss: () => setFailure(undefined),
                editor,
                onEditor: setEditor,
              }
        }
      />
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
          "The Brand personality node's view (ORV-291, PR 1): its state line, the mark line when it was not checked against Positioning, two optional answers in the person's own words and five scales of five points, each named by its two ends. The editor opens with no point chosen; a point is a value only when the person chose it. Everything here is rule-based: no model reads these answers and nothing is sent anywhere. Every project is a labelled fixture; nobody gave these answers.",
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ----- helpers -----

const viewOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-node="identity-frame"]') as HTMLElement;
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

const hosted =
  (locale: Lang, initial: BusinessView, options: { readOnly?: boolean } = {}) =>
  () => <Host locale={locale} initial={initial} {...options} />;
const hostedEnglish =
  (initial: BusinessView, options: { readOnly?: boolean } = {}) =>
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
 * call; a rate limited answer keeps the points and the text; a saved personality shows its points
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

  // A rate limited answer, and a double press: one call, Save inert and named, text and points kept.
  await userEvent.clear(never);
  await userEvent.click(person);
  await userEvent.paste(PERSONALITY_ANSWERS[locale].person);
  enter.mockImplementation(
    () =>
      new Promise((done) =>
        setTimeout(() => done({ ok: false, failure: RATE_LIMITED[locale] }), 300),
      ),
  );
  await userEvent.click(save());
  await userEvent.click(save());
  await expect(enter).toHaveBeenCalledTimes(1);
  await expect(save()).toHaveAttribute("aria-disabled", "true");
  await expect(textOf(save())).toContain(m.business.positioning.saving);
  await waitFor(() => expect(textOf(failureRegionOf(v))).toContain(RATE_LIMITED[locale]));
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
  foundationProject(locale, "agreed", [givenEntry(HOSTILE_ANSWERS)]);

export const FoundationUntrustedText: Story = {
  render: hosted("th", untrusted("th")),
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, th);
  },
};

export const FoundationUntrustedTextEnglish: Story = {
  render: hostedEnglish(untrusted("en")),
  play: async ({ canvasElement }) => {
    await untrustedPlay(canvasElement, en);
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

/**
 * The editor at 360: one column that fits, Tab goes person, never, one stop per scale, Save, Cancel,
 * and each focused control draws the focus form of the catalog.
 */
async function narrowEditorPlay(canvasElement: HTMLElement, m: Messages) {
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
}

export const IdentityNarrowEditor: Story = {
  render: narrowHost("th", open("th"), "light"),
  play: async ({ canvasElement }) => {
    await narrowEditorPlay(canvasElement, th);
  },
};

export const IdentityNarrowEditorDark: Story = {
  render: narrowHost("th", open("th"), "dark"),
  play: async ({ canvasElement }) => {
    await narrowEditorPlay(canvasElement, th);
  },
};

export const IdentityNarrowEditorEnglish: Story = {
  render: narrowHost("en", open("en"), "light"),
  play: async ({ canvasElement }) => {
    await narrowEditorPlay(canvasElement, en);
  },
};
