import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";
import type { ActionFailure, Listing, Outcome } from "./actions";
import { SavedStudio } from "./SavedStudio";
import { type Notice, refreshList, runCall } from "./studio-calls";

// The real actions reach the database; the component only needs their names.
vi.mock("./actions", () => ({
  approveDirection: vi.fn(),
  exportVersion: vi.fn(),
  importDirection: vi.fn(),
  listDirections: vi.fn(),
  openVersion: vi.fn(),
  readBriefWithAi: vi.fn(),
  saveDirection: vi.fn(),
}));

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";
const LANGS = [
  ["en", webMessages.en],
  ["th", webMessages.th],
] as const;
type Messages = typeof webMessages.en;

const labelsOf = (m: Messages) => ({ errors: m.saved.errors, wait: m.wait, failure: m.failure });
const unavailable: ActionFailure = {
  ok: false,
  error: "failed",
  code: "SERVICE_UNAVAILABLE",
  requestId: ID,
  retryable: true,
};
const internal: ActionFailure = {
  ok: false,
  error: "failed",
  code: "INTERNAL_ERROR",
  requestId: ID,
  retryable: false,
};
const calls = (m: Messages) => ({
  labels: labelsOf(m),
  setNotice: vi.fn<(n: Notice) => void>(),
  setBusy: vi.fn<(on: boolean) => void>(),
});
const statusOf = (html: string) => /<div role="status"[^>]*>(.*?)<\/div>/.exec(html)?.[1] ?? "";
const paragraphs = (markup: string) =>
  [...markup.matchAll(/<p [^>]*>(.*?)<\/p>/g)].map((p) => p[1] ?? "");
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");

// ORV-144 row 8: a write that fails is said once and never tried again.
describe("a failed write is shown and not retried", () => {
  it.each(LANGS)("says the failed line, no reference, call once, in %s", async (_l, m) => {
    const call = vi.fn(async (): Promise<Outcome<never>> => unavailable);
    const u = calls(m);
    await runCall(call, vi.fn(), u);
    expect(call).toHaveBeenCalledTimes(1);
    expect(u.setNotice).toHaveBeenCalledExactlyOnceWith({
      tone: "danger",
      lines: [m.saved.errors.failed],
    });
    expect(u.setBusy.mock.calls).toStrictEqual([[true], [false]]);
  });

  it("is the line the spec quotes", () => {
    expect(webMessages.en.saved.errors.failed).toBe("That did not work. Try again.");
    expect(webMessages.th.saved.errors.failed).toBe("ทำไม่สำเร็จ ลองอีกครั้ง");
  });
});

// ORV-144 row 9: an INTERNAL_ERROR gives the person an id to quote.
describe("an INTERNAL_ERROR notice shows the reference", () => {
  it.each([
    ["en", webMessages.en, `Reference: ${ID}`],
    ["th", webMessages.th, `รหัสอ้างอิง: ${ID}`],
  ] as const)("is the failed line then the reference in %s", async (_l, m, reference) => {
    const u = calls(m);
    await runCall(async () => internal, vi.fn(), u);
    expect(u.setNotice).toHaveBeenCalledExactlyOnceWith({
      tone: "danger",
      lines: [m.saved.errors.failed, reference],
    });
  });
});

// ORV-144 row 12: the page's own first notice keeps the reference, inside the live region.
describe("the first notice from the page keeps the reference", () => {
  it.each([
    ["en", webMessages.en, "Not done", `Reference: ${ID}`],
    ["th", webMessages.th, "ทำไม่สำเร็จ", `รหัสอ้างอิง: ${ID}`],
  ] as const)("holds the word, the failed line and the id in %s", (_l, m, word, reference) => {
    const html = renderToStaticMarkup(
      <SavedStudio
        view={{ kind: "error", failure: internal }}
        m={m.saved}
        wait={m.wait}
        failure={m.failure}
        defaultBrief=""
        preview={null}
      />,
    );
    const status = statusOf(html);
    expect(text(status)).toContain(word);
    expect(paragraphs(status).map(text)).toStrictEqual([m.saved.errors.failed, reference]);
  });

  it("shows no reference for a code without one", () => {
    const m = webMessages.en;
    const html = renderToStaticMarkup(
      <SavedStudio
        view={{ kind: "error", failure: unavailable }}
        m={m.saved}
        wait={m.wait}
        failure={m.failure}
        defaultBrief=""
        preview={null}
      />,
    );
    expect(paragraphs(statusOf(html)).map(text)).toStrictEqual([m.saved.errors.failed]);
  });
});

// ORV-144 row 13: no answer at all.
describe("a call with no answer shows the network line and is not retried", () => {
  it.each(LANGS)("says the network line in %s and leaves busy", async (_l, m) => {
    const call = vi.fn(async (): Promise<Outcome<never>> => {
      throw new TypeError("Failed to fetch");
    });
    const done = vi.fn();
    const u = calls(m);
    await runCall(call, done, u);
    expect(call).toHaveBeenCalledTimes(1);
    expect(done).not.toHaveBeenCalled();
    expect(u.setNotice).toHaveBeenCalledExactlyOnceWith({
      tone: "danger",
      lines: [m.failure.network],
    });
    expect(u.setBusy.mock.calls).toStrictEqual([[true], [false]]);
  });
});

// ORV-144 row 14: a refresh that fails keeps the list and the saved notice.
describe("a failed refresh keeps the saved notice", () => {
  it.each(LANGS)("keeps the list and the notice in %s", async (_l, m) => {
    const saved: Notice = { tone: "info", lines: ["Saved the draft"] };
    const u = calls(m);
    const setListing = vi.fn<(l: Listing) => void>();
    const failing = vi.fn(async (): Promise<Outcome<Listing>> => {
      throw new TypeError("Failed to fetch");
    });
    await runCall(
      async () => ({ ok: true as const, value: null }),
      async () => {
        u.setNotice(saved);
        await refreshList(failing, setListing);
      },
      u,
    );
    expect(setListing).not.toHaveBeenCalled();
    expect(u.setNotice.mock.calls).toStrictEqual([[saved]]);
    expect(u.setBusy.mock.calls).toStrictEqual([[true], [false]]);
  });

  it("keeps the list when the refresh answers a failure", async () => {
    const setListing = vi.fn<(l: Listing) => void>();
    await refreshList(async () => unavailable, setListing);
    expect(setListing).not.toHaveBeenCalled();
  });

  it("sets the list when the refresh succeeds", async () => {
    const listing: Listing = { role: "owner", directions: [] };
    const setListing = vi.fn<(l: Listing) => void>();
    await refreshList(async () => ({ ok: true, value: listing }), setListing);
    expect(setListing).toHaveBeenCalledExactlyOnceWith(listing);
  });
});
