import { LocaleProvider, messagesFor } from "@orivilo/design-system";
import type { ReportView } from "@orivilo/intent-engine";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";
import type { Outcome } from "../directions/actions";

/**
 * There is no DOM in this project's tests, so the three hooks `ReadForm` uses are given a store:
 * `useState` for its one outcome (the only state that starts as null), `useTransition` that runs
 * the async function and holds `pending` until it settles, and `useMessages` for the locale. The
 * screen is the real one, wrapped to record the props it was given.
 */
const seed = vi.hoisted(() => ({
  locale: "en" as "en" | "th",
  last: null as unknown,
  pending: false,
  running: Promise.resolve() as Promise<unknown>,
  props: undefined as undefined | Record<string, unknown>,
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
vi.mock("@orivilo/design-system/examples", async (importOriginal) => {
  const examples = await importOriginal<typeof import("@orivilo/design-system/examples")>();
  return {
    ...examples,
    BrandReportScreen: (props: Parameters<typeof examples.BrandReportScreen>[0]) => {
      seed.props = { ...props };
      return examples.BrandReportScreen(props);
    },
  };
});
const analysePage = vi.hoisted(() => vi.fn());
vi.mock("./actions", () => ({ analysePage }));

const { ReadForm } = await import("./ReadForm");

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";
const failed = (extra: Record<string, unknown>) => ({
  ok: false,
  requestId: ID,
  retryable: false,
  ...extra,
});
const analysed: ReportView = {
  status: "analysed",
  url: "https://clinic.example/",
  readAt: "2026-11-07T03:00:00.000Z",
  role: "own",
  incomplete: false,
  thin: false,
  sheets: [],
  colours: [],
  coloursTotal: 0,
  fonts: [],
  fontsTotal: 0,
  text: [],
  personality: [],
  notMeasured: [],
  lines: [],
};

const labelsOf = (locale: "en" | "th") => ({
  errors: webMessages[locale].saved.errors,
  wait: webMessages[locale].wait,
  failure: webMessages[locale].failure,
});
/** The element `ReadForm` returns, with the hooks above: its type, key and props are what it asks for. */
const elementOf = (locale: "en" | "th"): ReactElement<Record<string, unknown>> => {
  seed.locale = locale;
  return ReadForm(labelsOf(locale)) as ReactElement<Record<string, unknown>>;
};
const markupOf = (locale: "en" | "th") => {
  seed.locale = locale;
  return renderToStaticMarkup(
    <LocaleProvider locale={locale}>
      <ReadForm {...labelsOf(locale)} />
    </LocaleProvider>,
  );
};
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");
const submitButton = (html: string) => /<button[^>]*type="submit"[^>]*>/.exec(html)?.[0] ?? "";
const alertOf = (html: string) => /<div role="alert"[^>]*>(.*?)<\/div>/s.exec(html)?.[1] ?? "";

beforeEach(() => {
  seed.locale = "en";
  seed.last = null;
  seed.pending = false;
  seed.running = Promise.resolve();
  seed.props = undefined;
  analysePage.mockReset();
});

// ORV-267 row 16 and ORV-266 test G4: while the call runs the button is disabled and the status
// line shows; the action is called once.
describe("a read that is running", () => {
  it.each(["en", "th"] as const)(
    "disables the button and shows the wait line in %s",
    async (locale) => {
      let finish: (outcome: Outcome<ReportView>) => void = () => {};
      analysePage.mockReturnValue(new Promise((resolve) => (finish = resolve)));
      (elementOf(locale).props["onRead"] as (i: unknown) => void)({
        url: "example.com",
        role: "own",
      });
      const html = markupOf(locale);
      expect(submitButton(html)).toContain("disabled");
      expect(text(html)).toContain(messagesFor(locale).brandReport.pending);
      expect(analysePage).toHaveBeenCalledExactlyOnceWith({ url: "example.com", role: "own" });
      finish({ ok: true, value: analysed });
      await seed.running;
      expect(submitButton(markupOf(locale))).not.toContain("disabled");
    },
  );
});

// ORV-267 rows 12, 29 and 15, test G4: a rejected call is shown as `failed` and the form works again.
describe("a call that is rejected", () => {
  it.each(["en", "th"] as const)(
    "shows saved.errors.failed and enables the button in %s",
    async (locale) => {
      analysePage.mockRejectedValue(new Error("network"));
      (elementOf(locale).props["onRead"] as (i: unknown) => void)({ url: "a.test", role: "own" });
      await seed.running;
      const html = markupOf(locale);
      expect(text(alertOf(html))).toContain(webMessages[locale].saved.errors.failed);
      expect(submitButton(html)).not.toContain("disabled");
      expect(analysePage).toHaveBeenCalledTimes(1);
    },
  );

  it("says the failed line the spec quotes", () => {
    expect(webMessages.en.saved.errors.failed).toBe("That did not work. Try again.");
    expect(webMessages.th.saved.errors.failed).toBe("ทำไม่สำเร็จ ลองอีกครั้ง");
  });
});

// ORV-267 rows 12, 28, 29 and 22: each failed outcome becomes its own line.
describe("the line of each failed outcome", () => {
  const cases: Array<[string, Record<string, unknown>, (m: "en" | "th") => string]> = [
    [
      "invalid-input is read.refused.address",
      failed({ error: "invalid-input", code: "INVALID_INPUT" }),
      (l) => messagesFor(l).brandReport.engine["read.refused.address"],
    ],
    [
      "a store that is down is brandReport.unavailable",
      failed({ error: "failed", code: "SERVICE_UNAVAILABLE", retryable: true }),
      (l) => messagesFor(l).brandReport.unavailable,
    ],
    [
      "signed-out is saved.errors.signed-out",
      failed({ error: "signed-out", code: "UNAUTHENTICATED" }),
      (l) => webMessages[l].saved.errors["signed-out"],
    ],
    [
      "not-configured is brandReport.notConfigured",
      failed({ error: "not-configured", code: "INTERNAL_ERROR" }),
      (l) => messagesFor(l).brandReport.notConfigured,
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
    const outcome = failed({ error: "rate-limited", code: "RATE_LIMITED", retryAfter: 1200 });
    seed.last = { kind: "answer", outcome };
    expect(elementOf("en").props["failure"]).toBe(
      "Too many requests in a short time, so this was not done. Try again in 20 minutes.",
    );
    expect(elementOf("th").props["failure"]).toBe(
      "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก 20 นาที",
    );
  });

  it("gives no failure and the view when the call gave a report", () => {
    seed.last = { kind: "answer", outcome: { ok: true, value: analysed } };
    const props = elementOf("en").props;
    expect(props["failure"]).toBeUndefined();
    expect(props["view"]).toBe(analysed);
  });

  it("gives no view when the call failed", () => {
    seed.last = {
      kind: "answer",
      outcome: failed({ error: "failed", code: "SERVICE_UNAVAILABLE" }),
    };
    expect(elementOf("en").props["view"]).toBeNull();
  });
});

// ORV-267 row 14 and test G4: the field text lives in the screen, so it stays only while the screen
// stays mounted. The same component with no key, whatever the outcome, keeps it.
describe("the field keeps its text", () => {
  it("renders the same screen with no key after every kind of outcome", () => {
    const outcomes: unknown[] = [
      null,
      { kind: "rejected" },
      { kind: "answer", outcome: failed({ error: "invalid-input", code: "INVALID_INPUT" }) },
      { kind: "answer", outcome: { ok: true, value: analysed } },
    ];
    const first = elementOf("en").type;
    for (const last of outcomes) {
      seed.last = last;
      const element = elementOf("en");
      expect(element.type).toBe(first);
      expect(element.key).toBeNull();
    }
  });
});

// ORV-267 row 33 and ORV-266 test G5: a language switch redraws the report and the failure line
// from the outcome in state, with no second call.
describe("the other language", () => {
  it("redraws the headings of a report with one call", async () => {
    analysePage.mockResolvedValue({ ok: true, value: analysed });
    (elementOf("en").props["onRead"] as (i: unknown) => void)({ url: "a.test", role: "own" });
    await seed.running;
    const en = text(markupOf("en"));
    const th = text(markupOf("th"));
    expect(en).toContain(messagesFor("en").brandReport.coloursHeading);
    expect(th).toContain(messagesFor("th").brandReport.coloursHeading);
    expect(th).not.toContain(messagesFor("en").brandReport.coloursHeading);
    expect(analysePage).toHaveBeenCalledTimes(1);
  });

  it("redraws the failure line with one call", async () => {
    analysePage.mockResolvedValue(failed({ error: "invalid-input", code: "INVALID_INPUT" }));
    (elementOf("en").props["onRead"] as (i: unknown) => void)({ url: "a.test", role: "own" });
    await seed.running;
    expect(text(alertOf(markupOf("en")))).toContain(
      messagesFor("en").brandReport.engine["read.refused.address"],
    );
    expect(text(alertOf(markupOf("th")))).toContain(
      messagesFor("th").brandReport.engine["read.refused.address"],
    );
    expect(analysePage).toHaveBeenCalledTimes(1);
  });
});
