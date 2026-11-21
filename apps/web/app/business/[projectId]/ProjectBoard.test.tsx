import { messagesFor } from "@orivilo/design-system";
import {
  ANSWER_MAX_CHARS,
  CORE_IDEA_MAX,
  INTAKE_VERSION,
  POSITIONING_STATEMENT_MAX,
  toBusinessView,
} from "@orivilo/intent-engine";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webMessages } from "../../../i18n/messages";

/**
 * ORV-285 tech notes T18 (spec rows 2, 3, 4, 7, 8 and 9 at the wrapper) and, from ORV-292, the draft
 * request and row 29 (a late failure after the viewer closed). There is no DOM in this project's
 * tests, so the hooks `ProjectBoard` uses are given a store, as `IntakeForm.test.tsx` does:
 * `useState` for its one outcome (the only state that starts as null), `useRef` for the count of
 * viewer closings, `useTransition` that runs the async function and holds `pending` until it
 * settles, `useMessages` for the locale and `useRouter` for a spy. The wrapper is called as a
 * function and its element's props are what it asks the screen for. What the screen draws from
 * those props is the stories' proof (`business-board.stories.tsx`, the `Positioning` plays).
 * ORV-291 T22: the wrapper holds a second outcome and a second transition for the foundation
 * entries; the hooks are given two slots, in the order the wrapper calls them (the positioning
 * slot first), and a render starts at slot one.
 */
const seed = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  last: null as unknown,
  pending: false,
  running: Promise.resolve() as Promise<unknown>,
  entered: null as unknown,
  entering: false,
  enteringRun: Promise.resolve() as Promise<unknown>,
  /** Which `useState(null)` and `useTransition` of the current render comes next. */
  states: 0,
  transitions: 0,
  ref: null as { current: unknown } | null,
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) => {
      if (initial !== null) return react.useState(initial);
      return seed.states++ === 0
        ? ([
            seed.last,
            (next: unknown) => {
              seed.last = next;
            },
          ] as const)
        : ([
            seed.entered,
            (next: unknown) => {
              seed.entered = next;
            },
          ] as const);
    },
    useRef: (initial: unknown) => (seed.ref ??= { current: initial }),
    useTransition: () =>
      seed.transitions++ === 0
        ? ([
            seed.pending,
            (run: () => Promise<void>) => {
              seed.pending = true;
              seed.running = run().finally(() => {
                seed.pending = false;
              });
            },
          ] as const)
        : ([
            seed.entering,
            (run: () => Promise<void>) => {
              seed.entering = true;
              seed.enteringRun = run().finally(() => {
                seed.entering = false;
              });
            },
          ] as const),
  };
});
vi.mock("@orivilo/design-system", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@orivilo/design-system")>()),
  useMessages: () => messagesFor(seed.locale),
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const choosePositioning = vi.hoisted(() => vi.fn());
const draftPositioning = vi.hoisted(() => vi.fn());
vi.mock("../positioning-actions", () => ({ choosePositioning, draftPositioning }));
const enterFoundation = vi.hoisted(() => vi.fn());
vi.mock("../foundation-actions", () => ({ enterFoundation }));

const { ProjectBoard } = await import("./ProjectBoard");

const PROJECT = "9a8b7c6d-1111-4222-8333-444455556666";
const GUIDEBOOK = `/business/${PROJECT}/guidebook`;
const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";
const VIEW = toBusinessView({
  project: { id: PROJECT, name: "ร้านกาแฟคั่วเอง", createdAt: "2026-11-18T03:15:00.000Z" },
  intake: { version: INTAKE_VERSION, idea: "ขายกาแฟคั่วสด" },
});
const STATEMENT = "กาแฟคั่วสดทุกเช้าสำหรับคนทำงานย่านเมืองเก่า";
const failed = (extra: Record<string, unknown>) => ({
  ok: false,
  requestId: ID,
  retryable: false,
  ...extra,
});

type Controls = {
  pending: "saving" | "drafting" | null;
  problem: "required" | "too-long" | null;
  failure: string | undefined;
  stopped: string | undefined;
  onChoose: (request: unknown) => void;
  onDraft: () => void;
  onDismiss: () => void;
};
type FoundationControls = {
  pending: "saving" | null;
  problems: { path: string; kind: string }[] | null;
  failure: string | undefined;
  onEnter: (request: unknown) => void;
  onDismiss: () => void;
};
/** The element `ProjectBoard` returns, with the hooks above: its props are what it asks the screen for. */
const elementOf = (locale: "en" | "th") => {
  seed.locale = locale;
  seed.states = 0;
  seed.transitions = 0;
  const element = ProjectBoard({
    view: VIEW,
    projectId: PROJECT,
    guidebookHref: GUIDEBOOK,
    errors: webMessages[locale].saved.errors,
    wait: webMessages[locale].wait,
    failure: webMessages[locale].failure,
  }) as ReactElement<{
    view: unknown;
    guidebookHref: string;
    positioning: Controls;
    foundation: FoundationControls;
  }>;
  expect(element.props.view).toBe(VIEW);
  // ORV-302: the wrapper passes the address of the guidebook to the screen as it is given.
  expect(element.props.guidebookHref).toBe(GUIDEBOOK);
  return element.props;
};
const controlsOf = (locale: "en" | "th"): Controls => elementOf(locale).positioning;
const press = (locale: "en" | "th", request: unknown) => controlsOf(locale).onChoose(request);

beforeEach(() => {
  seed.locale = "en";
  seed.last = null;
  seed.pending = false;
  seed.running = Promise.resolve();
  seed.entered = null;
  seed.entering = false;
  seed.enteringRun = Promise.resolve();
  seed.ref = null;
  choosePositioning.mockReset();
  draftPositioning.mockReset();
  enterFoundation.mockReset();
  refresh.mockReset();
});

// Row 3 (the check before the call): an empty statement and one past its bound make no server call.
describe("a statement the wrapper refuses before any call", () => {
  it.each([
    ["empty", "", "required"],
    ["only spaces", "   \n ", "required"],
    ["one past its bound", "ก".repeat(POSITIONING_STATEMENT_MAX + 1), "too-long"],
  ] as const)("%s makes no call and shows the field's problem", (_name, statement, problem) => {
    press("en", { kind: "written", statement });
    expect(choosePositioning).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    const next = controlsOf("en");
    expect(next.problem).toBe(problem);
    expect(next.failure).toBeUndefined();
    expect(next.pending).toBeNull();
  });

  it("calls once for a statement at its bound", async () => {
    choosePositioning.mockResolvedValue({ ok: true, value: { kind: "written" } });
    press("en", { kind: "written", statement: "ก".repeat(POSITIONING_STATEMENT_MAX) });
    await seed.running;
    expect(choosePositioning).toHaveBeenCalledTimes(1);
  });
});

// Row 3: while the call runs the screen is told it is saving; a second press is ignored.
describe("a save that is running", () => {
  it("is pending, and a second press makes no second call", async () => {
    let finish: (outcome: unknown) => void = () => {};
    choosePositioning.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    press("en", { kind: "written", statement: STATEMENT });
    expect(controlsOf("en").pending).toBe("saving");
    press("en", { kind: "written", statement: STATEMENT });
    press("en", { kind: "skipped" });
    expect(choosePositioning).toHaveBeenCalledTimes(1);
    expect(choosePositioning).toHaveBeenCalledWith({
      kind: "written",
      projectId: PROJECT,
      statement: STATEMENT,
    });
    expect(refresh).not.toHaveBeenCalled();
    finish({ ok: true, value: { kind: "written" } });
    await seed.running;
    expect(controlsOf("en").pending).toBeNull();
  });

  it("asks for the skip with the project id and nothing else", async () => {
    choosePositioning.mockResolvedValue({ ok: true, value: { kind: "skipped" } });
    press("th", { kind: "skipped" });
    await seed.running;
    expect(choosePositioning).toHaveBeenCalledExactlyOnceWith({
      kind: "skipped",
      projectId: PROJECT,
    });
  });
});

// Row 2: a saved choice asks the page to build the view again, once, with no line of failure.
describe("a choice that was saved", () => {
  it("refreshes the page once and shows no failure", async () => {
    choosePositioning.mockResolvedValue({ ok: true, value: { kind: "written" } });
    press("en", { kind: "written", statement: STATEMENT });
    await seed.running;
    expect(refresh).toHaveBeenCalledTimes(1);
    const next = controlsOf("en");
    expect(next.failure).toBeUndefined();
    expect(next.problem).toBeNull();
  });
});

// Row 3: a refusal keeps the person's text (the screen holds it) and says what went wrong, once.
describe("a choice that was refused", () => {
  it.each(["en", "th"] as const)(
    "rate-limited shows the line with the wait in %s and refreshes nothing",
    async (locale) => {
      choosePositioning.mockResolvedValue(
        failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200, retryable: true }),
      );
      press(locale, { kind: "written", statement: STATEMENT });
      await seed.running;
      const next = controlsOf(locale);
      expect(next.failure).toBe(
        webMessages[locale].saved.errors["rate-limited"].replace(
          "{wait}",
          locale === "en" ? "20 minutes" : "20 นาที",
        ),
      );
      expect(next.problem).toBeNull();
      expect(next.pending).toBeNull();
      expect(refresh).not.toHaveBeenCalled();
      expect(choosePositioning).toHaveBeenCalledTimes(1);
    },
  );

  it("a refusal of the statement shows on the field and has no line of its own", async () => {
    choosePositioning.mockResolvedValue(
      failed({
        error: "invalid-input",
        code: "INVALID_INPUT",
        problems: [{ path: "statement", kind: "too-long" }],
      }),
    );
    press("en", { kind: "written", statement: STATEMENT });
    await seed.running;
    const next = controlsOf("en");
    expect(next.problem).toBe("too-long");
    expect(next.failure).toBeUndefined();
  });

  it.each(["en", "th"] as const)(
    "a rejected call is saved.errors.failed in %s, never retried",
    async (locale) => {
      choosePositioning.mockRejectedValue(new Error("network"));
      press(locale, { kind: "written", statement: STATEMENT });
      await seed.running;
      const next = controlsOf(locale);
      expect(next.failure).toBe(webMessages[locale].saved.errors.failed);
      expect(next.pending).toBeNull();
      expect(choosePositioning).toHaveBeenCalledTimes(1);
      expect(refresh).not.toHaveBeenCalled();
    },
  );
});

// Row 9: the outcome is kept, not its text, so the other language redraws with no second call.
describe("a language switch after a refusal", () => {
  it("redraws the line in the other language and makes no second call", async () => {
    choosePositioning.mockResolvedValue(
      failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200, retryable: true }),
    );
    press("en", { kind: "written", statement: STATEMENT });
    await seed.running;
    const english = controlsOf("en").failure;
    const thai = controlsOf("th").failure;
    expect(english).toContain("20 minutes");
    expect(thai).toContain("20 นาที");
    expect(thai).not.toBe(english);
    expect(choosePositioning).toHaveBeenCalledTimes(1);
  });
});

// Cancel and closing the viewer both call `onDismiss`: the last outcome goes, so no failure line
// outlives the editor it came from (spec row 3, positioning-choice-1 "The editors").
describe("leaving the gate without deciding", () => {
  it("drops the failure of a refused save", async () => {
    choosePositioning.mockResolvedValue(
      failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200, retryable: true }),
    );
    press("en", { kind: "written", statement: STATEMENT });
    await seed.running;
    expect(controlsOf("en").failure).toBeDefined();
    controlsOf("en").onDismiss();
    expect(controlsOf("en").failure).toBeUndefined();
    expect(choosePositioning).toHaveBeenCalledTimes(1);
  });

  it("drops the failure of a rejected call", async () => {
    choosePositioning.mockRejectedValue(new Error("network"));
    press("en", { kind: "skipped" });
    await seed.running;
    expect(controlsOf("en").failure).toBe(webMessages.en.saved.errors.failed);
    controlsOf("en").onDismiss();
    expect(controlsOf("en").failure).toBeUndefined();
  });

  it("drops the field's problem too", () => {
    press("en", { kind: "written", statement: "" });
    expect(controlsOf("en").problem).toBe("required");
    controlsOf("en").onDismiss();
    expect(controlsOf("en").problem).toBeNull();
  });

  it("changes nothing when there was nothing to drop", () => {
    controlsOf("en").onDismiss();
    const next = controlsOf("en");
    expect(next.failure).toBeUndefined();
    expect(next.problem).toBeNull();
    expect(choosePositioning).not.toHaveBeenCalled();
  });
});

const rateLimited = () =>
  failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200, retryable: true });
/** An action stub that answers only when the test releases it. */
const held = (action: ReturnType<typeof vi.fn>) => {
  let release: (outcome: unknown) => void = () => {};
  action.mockReturnValue(new Promise((resolve) => (release = resolve)));
  return (outcome: unknown) => release(outcome);
};

// ORV-292 row 29: a save whose answer arrives after the viewer closed leaves no failure and no
// field problem, so the reopened view is the one before the press (row 24's rule for a draft).
describe("late failure after the viewer closed", () => {
  const ANSWERS = [
    ["failed", () => failed({ error: "failed", code: "INTERNAL_ERROR" })],
    ["rate-limited", rateLimited],
  ] as const;
  const PRESSES = [
    ["Agree on a written statement", { kind: "written", statement: STATEMENT }],
    ["Skip for now", { kind: "skipped" }],
  ] as const;

  for (const [press_, request] of PRESSES) {
    for (const [name, answer] of ANSWERS) {
      it(`${press_}, then ${name} after the viewer closed: no failure on the reopened view`, async () => {
        const release = held(choosePositioning);
        press("th", request);
        expect(controlsOf("th").pending).toBe("saving");
        controlsOf("th").onDismiss(); // the viewer closes while the save runs
        release(answer());
        await seed.running;
        const reopened = controlsOf("th"); // they open Positioning again
        expect(reopened.failure).toBeUndefined();
        expect(reopened.problem).toBeNull();
        expect(reopened.stopped).toBeUndefined();
        expect(reopened.pending).toBeNull();
        expect(choosePositioning).toHaveBeenCalledTimes(1);
        expect(refresh).not.toHaveBeenCalled();
      });
    }
  }

  it("a draft still running when the viewer closes shows as drafting on the reopened view", async () => {
    const release = held(draftPositioning);
    controlsOf("th").onDraft();
    controlsOf("th").onDismiss();
    expect(controlsOf("th").pending).toBe("drafting");
    release({ ok: false, error: "ai-failed" });
    await seed.running;
    expect(controlsOf("th").pending).toBeNull();
    expect(controlsOf("th").stopped).toBeUndefined();
  });

  it("a late refusal of the statement leaves no field problem either", async () => {
    const release = held(choosePositioning);
    press("th", { kind: "written", statement: STATEMENT });
    controlsOf("th").onDismiss();
    release(
      failed({
        error: "invalid-input",
        code: "INVALID_INPUT",
        problems: [{ path: "statement", kind: "too-long" }],
      }),
    );
    await seed.running;
    const reopened = controlsOf("th");
    expect(reopened.problem).toBeNull();
    expect(reopened.failure).toBeUndefined();
  });

  it("a late rejected call leaves no failure", async () => {
    let reject: (error: Error) => void = () => {};
    choosePositioning.mockReturnValue(new Promise((_done, no) => (reject = no)));
    press("th", { kind: "skipped" });
    controlsOf("th").onDismiss();
    reject(new Error("network"));
    await seed.running;
    expect(controlsOf("th").failure).toBeUndefined();
  });

  it("a late answer that saved the choice still refreshes the page, once", async () => {
    const release = held(choosePositioning);
    press("th", { kind: "written", statement: STATEMENT });
    controlsOf("th").onDismiss();
    release({ ok: true, value: { kind: "written" } });
    await seed.running;
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(controlsOf("th").failure).toBeUndefined();
  });

  it("a failure of the next request shows, so only the closed view's answer is dropped", async () => {
    const release = held(choosePositioning);
    press("en", { kind: "skipped" });
    controlsOf("en").onDismiss();
    release(rateLimited());
    await seed.running;
    choosePositioning.mockResolvedValue(rateLimited());
    press("en", { kind: "skipped" });
    await seed.running;
    expect(controlsOf("en").failure).toContain("20 minutes");
    expect(choosePositioning).toHaveBeenCalledTimes(2);
  });

  it("a late stopped draft shows nothing on the reopened view", async () => {
    const release = held(draftPositioning);
    controlsOf("th").onDraft();
    expect(controlsOf("th").pending).toBe("drafting");
    controlsOf("th").onDismiss();
    release(failed({ error: "ai-failed", code: "UPSTREAM_FAILED" }));
    await seed.running;
    const reopened = controlsOf("th");
    expect(reopened.stopped).toBeUndefined();
    expect(reopened.failure).toBeUndefined();
    expect(reopened.pending).toBeNull();
  });
});

// ORV-292 rows 15, 16 and 24 at the wrapper: the draft request runs as the choice does, one action
// call per press, in a transition, the outcome kept in state; a stopped request names its reason.
describe("a draft request", () => {
  it("is pending as drafting, calls once with the project id alone, and refreshes once when drafted", async () => {
    const release = held(draftPositioning);
    controlsOf("en").onDraft();
    expect(controlsOf("en").pending).toBe("drafting");
    controlsOf("en").onDraft();
    press("en", { kind: "skipped" });
    expect(draftPositioning).toHaveBeenCalledExactlyOnceWith({ projectId: PROJECT });
    expect(choosePositioning).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    release({ ok: true, value: { draftId: ID } });
    await seed.running;
    expect(refresh).toHaveBeenCalledTimes(1);
    const next = controlsOf("en");
    expect(next.pending).toBeNull();
    expect(next.stopped).toBeUndefined();
    expect(next.failure).toBeUndefined();
  });

  it.each([
    ["ai-not-configured", failed({ error: "ai-not-configured", code: "INTERNAL_ERROR" })],
    ["ai-failed", failed({ error: "ai-failed", code: "UPSTREAM_FAILED" })],
    [
      "ai-rate-limited",
      failed({ error: "ai-rate-limited", code: "RATE_LIMITED", retryAfter: 60, retryable: true }),
    ],
    ["ai-spend-cap", failed({ error: "ai-spend-cap", code: "AI_SPEND_CAP" })],
  ] as const)(
    "%s is kept as the stopped reason, with no refresh and no line of failure",
    async (reason, outcome) => {
      draftPositioning.mockResolvedValue(outcome);
      controlsOf("th").onDraft();
      await seed.running;
      const next = controlsOf("th");
      expect(next.stopped).toBe(reason);
      expect(next.failure).toBeUndefined();
      expect(next.problem).toBeNull();
      expect(refresh).not.toHaveBeenCalled();
      expect(draftPositioning).toHaveBeenCalledTimes(1);
    },
  );

  it("a rejected call stops as ai-failed and is never retried", async () => {
    draftPositioning.mockRejectedValue(new Error("network"));
    controlsOf("en").onDraft();
    await seed.running;
    expect(controlsOf("en").stopped).toBe("ai-failed");
    expect(draftPositioning).toHaveBeenCalledTimes(1);
  });

  it("an answer that is not a stopped draft shows as the page's line of failure", async () => {
    draftPositioning.mockResolvedValue(failed({ error: "signed-out", code: "UNAUTHENTICATED" }));
    controlsOf("en").onDraft();
    await seed.running;
    const next = controlsOf("en");
    expect(next.stopped).toBeUndefined();
    expect(next.failure).toBe(webMessages.en.saved.errors["signed-out"]);
  });

  it("the stopped request's error does not outlive the viewer (row 24)", async () => {
    draftPositioning.mockResolvedValue(failed({ error: "ai-failed", code: "UPSTREAM_FAILED" }));
    controlsOf("en").onDraft();
    await seed.running;
    expect(controlsOf("en").stopped).toBe("ai-failed");
    controlsOf("en").onDismiss();
    expect(controlsOf("en").stopped).toBeUndefined();
  });

  it("a language switch keeps the same stopped reason, so the screen redraws its line with no second call", async () => {
    draftPositioning.mockResolvedValue(failed({ error: "ai-spend-cap", code: "AI_SPEND_CAP" }));
    controlsOf("en").onDraft();
    await seed.running;
    expect(controlsOf("th").stopped).toBe("ai-spend-cap");
    expect(draftPositioning).toHaveBeenCalledTimes(1);
  });
});

// A pick and an edit go through the same one door as a write: the check, then one call.
describe("a pick or an edit", () => {
  it.each([
    [{ kind: "picked", draftId: ID, option: 2 }],
    [{ kind: "edited", draftId: ID, option: 1, statement: STATEMENT }],
  ] as const)("%o makes one call with the project id and refreshes once", async (request) => {
    choosePositioning.mockResolvedValue({ ok: true, value: { kind: request.kind } });
    press("en", request);
    await seed.running;
    expect(choosePositioning).toHaveBeenCalledExactlyOnceWith({ ...request, projectId: PROJECT });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("an edit past its bound makes no call and shows the field's problem", () => {
    press("en", {
      kind: "edited",
      draftId: ID,
      option: 1,
      statement: "ก".repeat(POSITIONING_STATEMENT_MAX + 1),
    });
    expect(choosePositioning).not.toHaveBeenCalled();
    expect(controlsOf("en").problem).toBe("too-long");
  });
});

// ORV-291 T22 (spec rows 3 and 10): the foundation entries at the wrapper.
const foundationOf = (locale: "en" | "th"): FoundationControls => elementOf(locale).foundation;
const AXES = { playful: 25, expressive: 75, structured: 50, warm: 0, premium: 100 };
const given = (payload: Record<string, unknown> = {}) => ({
  node: "identity-frame",
  kind: "given",
  payload: { axes: AXES, ...payload },
});
const enter = (locale: "en" | "th", request: unknown) => foundationOf(locale).onEnter(request);

describe("a foundation entry the wrapper refuses before any call", () => {
  it("a scale with no point makes no call and names that scale", () => {
    const four = { ...AXES, warm: undefined };
    enter("en", given({ axes: four }));
    expect(enterFoundation).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    const next = foundationOf("en");
    expect(next.problems?.map((p) => p.path)).toEqual(["payload.axes.warm"]);
    expect(next.failure).toBeUndefined();
    expect(next.pending).toBeNull();
  });

  it("an answer one past its bound makes no call and names that answer", () => {
    enter("en", given({ never: "ก".repeat(ANSWER_MAX_CHARS + 1) }));
    expect(enterFoundation).not.toHaveBeenCalled();
    expect(foundationOf("en").problems).toEqual([{ path: "payload.never", kind: "too-long" }]);
  });

  it("calls once for an answer at its bound, with the project id", async () => {
    enterFoundation.mockResolvedValue({
      ok: true,
      value: { node: "identity-frame", kind: "given" },
    });
    enter("en", given({ person: "ก".repeat(ANSWER_MAX_CHARS) }));
    await seed.enteringRun;
    expect(enterFoundation).toHaveBeenCalledExactlyOnceWith({
      projectId: PROJECT,
      ...given({ person: "ก".repeat(ANSWER_MAX_CHARS) }),
    });
  });
});

describe("a foundation entry that is running", () => {
  it("is pending; a second press, and a Positioning press, make no second call", async () => {
    let finish: (outcome: unknown) => void = () => {};
    enterFoundation.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    enter("en", given());
    expect(foundationOf("en").pending).toBe("saving");
    enter("en", given());
    enter("en", { node: "identity-frame", kind: "skipped", payload: {} });
    controlsOf("en").onChoose({ kind: "skipped" });
    expect(enterFoundation).toHaveBeenCalledTimes(1);
    expect(choosePositioning).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    finish({ ok: true, value: { node: "identity-frame", kind: "given" } });
    await seed.enteringRun;
    expect(foundationOf("en").pending).toBeNull();
  });

  it("a Positioning save that is running blocks an entry", async () => {
    let finish: (outcome: unknown) => void = () => {};
    choosePositioning.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    controlsOf("en").onChoose({ kind: "skipped" });
    enter("en", given());
    expect(enterFoundation).not.toHaveBeenCalled();
    finish({ ok: true, value: { kind: "skipped" } });
    await seed.running;
  });

  it("asks for the skip with the project id and nothing else", async () => {
    enterFoundation.mockResolvedValue({
      ok: true,
      value: { node: "identity-frame", kind: "skipped" },
    });
    enter("th", { node: "identity-frame", kind: "skipped", payload: {} });
    await seed.enteringRun;
    expect(enterFoundation).toHaveBeenCalledExactlyOnceWith({
      projectId: PROJECT,
      node: "identity-frame",
      kind: "skipped",
      payload: {},
    });
  });
});

// ORV-291 T43 (spec rows 26 and 27, at the wrapper): the core idea entry, written or skipped.
const written = (payload: Record<string, unknown>) => ({
  node: "core-idea",
  kind: "written",
  payload,
});

describe("a core idea entry", () => {
  it("an empty core idea makes no call and names the statement", () => {
    enter("en", written({ statement: "   " }));
    expect(enterFoundation).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(foundationOf("en").problems).toEqual([{ path: "payload.statement", kind: "required" }]);
    expect(foundationOf("en").pending).toBeNull();
  });

  it("a core idea one past its bound makes no call and names the statement", () => {
    enter("en", written({ statement: "ก".repeat(CORE_IDEA_MAX + 1) }));
    expect(enterFoundation).not.toHaveBeenCalled();
    expect(foundationOf("en").problems).toEqual([{ path: "payload.statement", kind: "too-long" }]);
  });

  it("an answer one past its bound makes no call and names the answer", () => {
    enter("en", written({ statement: STATEMENT, remember: "ก".repeat(ANSWER_MAX_CHARS + 1) }));
    expect(enterFoundation).not.toHaveBeenCalled();
    expect(foundationOf("en").problems).toEqual([{ path: "payload.remember", kind: "too-long" }]);
  });

  it("calls once for a core idea and an answer at their bounds, with the project id", async () => {
    enterFoundation.mockResolvedValue({ ok: true, value: { node: "core-idea", kind: "written" } });
    const payload = {
      statement: "ก".repeat(CORE_IDEA_MAX),
      remember: "ก".repeat(ANSWER_MAX_CHARS),
    };
    enter("en", written(payload));
    await seed.enteringRun;
    expect(enterFoundation).toHaveBeenCalledExactlyOnceWith({
      projectId: PROJECT,
      ...written(payload),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("a double press makes one call", async () => {
    let finish: (outcome: unknown) => void = () => {};
    enterFoundation.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    enter("en", written({ statement: STATEMENT }));
    expect(foundationOf("en").pending).toBe("saving");
    enter("en", written({ statement: STATEMENT }));
    expect(enterFoundation).toHaveBeenCalledTimes(1);
    finish({ ok: true, value: { node: "core-idea", kind: "written" } });
    await seed.enteringRun;
    expect(foundationOf("en").pending).toBeNull();
  });

  it("asks for the skip with the project id and nothing else", async () => {
    enterFoundation.mockResolvedValue({ ok: true, value: { node: "core-idea", kind: "skipped" } });
    enter("th", { node: "core-idea", kind: "skipped", payload: {} });
    await seed.enteringRun;
    expect(enterFoundation).toHaveBeenCalledExactlyOnceWith({
      projectId: PROJECT,
      node: "core-idea",
      kind: "skipped",
      payload: {},
    });
  });
});

describe("a foundation entry that was saved or refused", () => {
  it("a saved entry refreshes the page once and shows no failure", async () => {
    enterFoundation.mockResolvedValue({
      ok: true,
      value: { node: "identity-frame", kind: "given" },
    });
    enter("en", given());
    await seed.enteringRun;
    expect(refresh).toHaveBeenCalledTimes(1);
    const next = foundationOf("en");
    expect(next.failure).toBeUndefined();
    expect(next.problems).toBeNull();
  });

  it.each(["en", "th"] as const)(
    "rate-limited shows the line with the wait in %s, names no field and refreshes nothing",
    async (locale) => {
      enterFoundation.mockResolvedValue(
        failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200, retryable: true }),
      );
      enter(locale, given());
      await seed.enteringRun;
      const next = foundationOf(locale);
      expect(next.failure).toBe(
        webMessages[locale].saved.errors["rate-limited"].replace(
          "{wait}",
          locale === "en" ? "20 minutes" : "20 นาที",
        ),
      );
      expect(next.problems).toBeNull();
      expect(next.pending).toBeNull();
      expect(refresh).not.toHaveBeenCalled();
      expect(enterFoundation).toHaveBeenCalledTimes(1);
    },
  );

  it("a refusal that names a field shows on the field and has no line of its own", async () => {
    const problems = [{ path: "payload.person", kind: "too-long" }];
    enterFoundation.mockResolvedValue(
      failed({ error: "invalid-input", code: "INVALID_INPUT", problems }),
    );
    enter("en", given());
    await seed.enteringRun;
    const next = foundationOf("en");
    expect(next.problems).toEqual(problems);
    expect(next.failure).toBeUndefined();
  });

  it("an entry the node does not allow, with no field named, says saved.errors.failed", async () => {
    enterFoundation.mockResolvedValue(failed({ error: "invalid-input", code: "INVALID_INPUT" }));
    enter("en", given());
    await seed.enteringRun;
    const next = foundationOf("en");
    expect(next.failure).toBe(webMessages.en.saved.errors.failed);
    expect(next.problems).toBeNull();
  });

  it("a rejected call is saved.errors.failed, never retried", async () => {
    enterFoundation.mockRejectedValue(new Error("network"));
    enter("en", given());
    await seed.enteringRun;
    const next = foundationOf("en");
    expect(next.failure).toBe(webMessages.en.saved.errors.failed);
    expect(next.pending).toBeNull();
    expect(enterFoundation).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("a language switch redraws the line and makes no second call", async () => {
    enterFoundation.mockResolvedValue(
      failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200, retryable: true }),
    );
    enter("en", given());
    await seed.enteringRun;
    const english = foundationOf("en").failure;
    const thai = foundationOf("th").failure;
    expect(english).toContain("20 minutes");
    expect(thai).toContain("20 นาที");
    expect(enterFoundation).toHaveBeenCalledTimes(1);
  });

  // Row 10 at the wrapper: the saved given personality is kept as an outcome, so each language reads
  // it back with no second call and no second refresh. A render that asked the page to refresh again
  // would show here, after the extra renders; the test above counts the refresh before its render.
  it("a language switch after a saved personality makes no second call and no second refresh", async () => {
    enterFoundation.mockResolvedValue({
      ok: true,
      value: { node: "identity-frame", kind: "given" },
    });
    enter("th", given({ person: STATEMENT }));
    await seed.enteringRun;
    for (const locale of ["en", "th", "en"] as const) {
      const next = foundationOf(locale);
      expect(next.failure).toBeUndefined();
      expect(next.problems).toBeNull();
      expect(next.pending).toBeNull();
    }
    expect(enterFoundation).toHaveBeenCalledExactlyOnceWith({
      projectId: PROJECT,
      ...given({ person: STATEMENT }),
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("onDismiss drops the failure and the named fields, and nothing else", async () => {
    enterFoundation.mockRejectedValue(new Error("network"));
    enter("en", given());
    await seed.enteringRun;
    expect(foundationOf("en").failure).toBeDefined();
    foundationOf("en").onDismiss();
    expect(foundationOf("en").failure).toBeUndefined();
    const four = { ...AXES, warm: undefined };
    enter("en", given({ axes: four }));
    expect(foundationOf("en").problems).not.toBeNull();
    foundationOf("en").onDismiss();
    expect(foundationOf("en").problems).toBeNull();
    expect(enterFoundation).toHaveBeenCalledTimes(1);
  });
});
