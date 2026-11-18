import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webMessages } from "../../../i18n/messages";

/**
 * ORV-281 tech notes T24 (spec rows 10 and 19). There is no DOM in this project's tests, so the
 * hooks `IntakeForm` uses are given a store, as `ReadForm.test.tsx` does: `useState` for its one
 * outcome (the only state that starts as null), `useTransition` that runs the async function and
 * holds `pending` until it settles, `useMessages` for the locale and `useRouter` for a spy. The
 * screen is the real one, wrapped to record the props it was given. Row 8's first three cases (no
 * name, no idea, an answer over its bound make no server call) are the screen's own check, proven
 * by the `Invalid` and `Pending` stories of `business-intake.stories.tsx`, which spy on `onSubmit`.
 */
const seed = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  last: null as unknown,
  pending: false,
  running: Promise.resolve() as Promise<unknown>,
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) =>
      initial === null
        ? ([
            seed.last,
            (next: unknown) => {
              seed.last = next;
            },
          ] as const)
        : react.useState(initial),
    useTransition: () =>
      [
        seed.pending,
        (run: () => Promise<void>) => {
          seed.pending = true;
          seed.running = run().finally(() => {
            seed.pending = false;
          });
        },
      ] as const,
  };
});
vi.mock("@orivilo/design-system", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@orivilo/design-system")>()),
  useMessages: () => messagesFor(seed.locale),
}));
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const createProject = vi.hoisted(() => vi.fn());
vi.mock("../actions", () => ({ createProject }));

const { IntakeForm } = await import("./IntakeForm");

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";
const PROJECT = "9a8b7c6d-1111-4222-8333-444455556666";
const INTAKE = { projectName: "ร้านกาแฟคั่วเอง", idea: "ขายกาแฟคั่วสด" };
const failed = (extra: Record<string, unknown>) => ({
  ok: false,
  requestId: ID,
  retryable: false,
  ...extra,
});

const labelsOf = (locale: "en" | "th") => ({
  errors: webMessages[locale].saved.errors,
  wait: webMessages[locale].wait,
  failure: webMessages[locale].failure,
});
/** The element `IntakeForm` returns, with the hooks above: its props are what it asks the screen for. */
const elementOf = (locale: "en" | "th"): ReactElement<Record<string, unknown>> => {
  seed.locale = locale;
  return IntakeForm(labelsOf(locale)) as ReactElement<Record<string, unknown>>;
};
const markupOf = (locale: "en" | "th") => {
  seed.locale = locale;
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>
      <IntakeForm {...labelsOf(locale)} />
    </LocaleProvider>,
  );
};
const submit = (locale: "en" | "th", intake: unknown = INTAKE) =>
  (elementOf(locale).props["onSubmit"] as (i: unknown) => void)(intake);
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");
const submitButton = (html: string) => /<button[^>]*type="submit"[^>]*>/.exec(html)?.[0] ?? "";
const alertOf = (html: string) => /<div role="alert"[^>]*>(.*?)<\/div>/s.exec(html)?.[1] ?? "";

beforeEach(() => {
  seed.locale = "en";
  seed.last = null;
  seed.pending = false;
  seed.running = Promise.resolve();
  createProject.mockReset();
  push.mockReset();
});

// Row 10: while the call runs the button is disabled and the status line shows; one call.
describe("a save that is running", () => {
  it.each(["en", "th"] as const)(
    "disables the button, shows the pending line and calls once in %s",
    async (locale) => {
      let finish: (outcome: unknown) => void = () => {};
      createProject.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      submit(locale);
      const html = markupOf(locale);
      expect(submitButton(html)).toContain("disabled");
      expect(text(html)).toContain(messagesFor(locale).business.intake.pending);
      expect(createProject).toHaveBeenCalledExactlyOnceWith(INTAKE);
      expect(push).not.toHaveBeenCalled();
      finish(failed({ error: "failed", code: "INTERNAL_ERROR" }));
      await seed.running;
      expect(submitButton(markupOf(locale))).not.toContain("disabled");
    },
  );
});

// Row 9: a saved project goes to its board once, and the button stays off until the page changes.
describe("a project that was saved", () => {
  it("goes to its board once and keeps the button disabled, so a second press saves nothing", async () => {
    createProject.mockResolvedValue({ ok: true, value: { projectId: PROJECT } });
    submit("en");
    await seed.running;
    expect(push).toHaveBeenCalledExactlyOnceWith(`/business/${PROJECT}`);
    expect(submitButton(markupOf("en"))).toContain("disabled");
    expect(elementOf("en").props["failure"]).toBeUndefined();
    expect(createProject).toHaveBeenCalledTimes(1);
  });
});

// A rejected call is `failed`, shown at once, and the form works again.
describe("a call that is rejected", () => {
  it.each(["en", "th"] as const)(
    "shows saved.errors.failed and enables the button in %s",
    async (locale) => {
      createProject.mockRejectedValue(new Error("network"));
      submit(locale);
      await seed.running;
      const html = markupOf(locale);
      expect(text(alertOf(html))).toContain(webMessages[locale].saved.errors.failed);
      expect(submitButton(html)).not.toContain("disabled");
      expect(createProject).toHaveBeenCalledTimes(1);
      expect(push).not.toHaveBeenCalled();
    },
  );
});

// Rows 8, 11 and 12: each outcome that did not save has its own line, or its field.
describe("the line of each outcome that did not save", () => {
  const cases: Array<[string, Record<string, unknown>, (l: "en" | "th") => string]> = [
    [
      "signed-out is saved.errors.signed-out",
      failed({ error: "signed-out", code: "UNAUTHENTICATED" }),
      (l) => webMessages[l].saved.errors["signed-out"],
    ],
    [
      "forbidden is business.notAllowed, never saved.errors.forbidden",
      failed({ error: "forbidden", code: "FORBIDDEN" }),
      (l) => messagesFor(l).business.notAllowed,
    ],
    [
      "not-configured is business.notConfigured",
      failed({ error: "not-configured", code: "INTERNAL_ERROR" }),
      (l) => messagesFor(l).business.notConfigured,
    ],
    [
      "invalid-input with no field to point at is saved.errors.failed",
      failed({ error: "invalid-input", code: "INVALID_INPUT" }),
      (l) => webMessages[l].saved.errors.failed,
    ],
    [
      "failed with an internal error is saved.errors.failed and the reference",
      failed({ error: "failed", code: "INTERNAL_ERROR" }),
      (l) =>
        `${webMessages[l].saved.errors.failed} ${webMessages[l].failure.reference.replace("{requestId}", ID)}`,
    ],
  ];

  it.each(cases)("%s", (_name, outcome, line) => {
    for (const locale of ["en", "th"] as const) {
      seed.last = { kind: "answer", outcome };
      expect(elementOf(locale).props["failure"]).toBe(line(locale));
    }
  });

  it("puts the wait of a rate limit in words", () => {
    seed.last = {
      kind: "answer",
      outcome: failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200 }),
    };
    expect(elementOf("en").props["failure"]).toBe(
      "Too many requests in a short time, so this was not done. Try again in 20 minutes.",
    );
    expect(elementOf("th").props["failure"]).toBe(
      "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที",
    );
  });

  it("a refusal of the intake gives its problems to the screen and no line of its own", () => {
    const problems = [{ field: "website", kind: "website" }];
    seed.last = {
      kind: "answer",
      outcome: failed({ error: "invalid-input", code: "INVALID_INPUT", problems }),
    };
    const props = elementOf("en").props;
    expect(props["problems"]).toBe(problems);
    expect(props["failure"]).toBeUndefined();
    expect(text(markupOf("en"))).toContain(messagesFor("en").business.intake.websiteInvalid);
  });

  it("gives no problems and no failure before any call", () => {
    const props = elementOf("en").props;
    expect(props["problems"]).toBeUndefined();
    expect(props["failure"]).toBeUndefined();
  });
});

// Row 19: a language switch redraws the field line and the failure line from the state, with no
// second call.
describe("the other language", () => {
  it("redraws a field problem with one call", async () => {
    createProject.mockResolvedValue(
      failed({
        error: "invalid-input",
        code: "INVALID_INPUT",
        problems: [{ field: "website", kind: "website" }],
      }),
    );
    submit("en", { ...INTAKE, website: "ftp://example.com/" });
    await seed.running;
    expect(text(markupOf("en"))).toContain(messagesFor("en").business.intake.websiteInvalid);
    const th = text(markupOf("th"));
    expect(th).toContain(messagesFor("th").business.intake.websiteInvalid);
    expect(th).not.toContain(messagesFor("en").business.intake.websiteInvalid);
    expect(createProject).toHaveBeenCalledTimes(1);
  });

  it("redraws the failure line with one call", async () => {
    createProject.mockResolvedValue(failed({ error: "signed-out", code: "UNAUTHENTICATED" }));
    submit("en");
    await seed.running;
    expect(text(alertOf(markupOf("en")))).toContain(webMessages.en.saved.errors["signed-out"]);
    expect(text(alertOf(markupOf("th")))).toContain(webMessages.th.saved.errors["signed-out"]);
    expect(createProject).toHaveBeenCalledTimes(1);
  });
});
