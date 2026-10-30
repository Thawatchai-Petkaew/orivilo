import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";
import type { SignInState } from "./actions";
import { SignInForm } from "./SignInForm";

// A refused action state: React's `useActionState` has no server-side way to run the action, so
// the hook is given the state the form would hold after a refusal.
const refused = vi.hoisted(() => ({ state: null as SignInState }));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useActionState: () => [refused.state, () => {}, false] as const,
  };
});

const labels = (m: typeof webMessages.en) => ({
  account: m.account,
  wait: m.wait,
  failure: m.failure,
});
const render = (m: typeof webMessages.en, state: SignInState) => {
  refused.state = state;
  return renderToStaticMarkup(<SignInForm action={async () => null} labels={labels(m)} />);
};
const statusOf = (html: string) => /<div role="status"[^>]*>(.*)<\/div>/.exec(html)?.[1] ?? "";
const text = (markup: string) => markup.replace(/<[^>]*>/g, "");
const occurrences = (haystack: string, needle: string) => haystack.split(needle).length - 1;

// ORV-122 row 11 and design D2: the word and the line inside role="status", the button enabled.
describe("SignInForm", () => {
  it.each([
    [
      "en",
      webMessages.en,
      "Not done",
      "Too many sign-in attempts from this network. Try again in 3 minutes.",
    ],
    [
      "th",
      webMessages.th,
      "ทำไม่สำเร็จ",
      "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก 3 นาที",
    ],
  ] as const)("shows the word and the wait line in %s, button enabled", (_l, m, word, line) => {
    const html = render(m, {
      error: "rate-limited",
      code: "RATE_LIMITED",
      requestId: "r1",
      retryAfter: 180,
      retryable: true,
    });
    const status = statusOf(html);
    expect(text(status)).toContain(word);
    const paragraph = /<p class="[^"]*">(.*?)<\/p>/.exec(status);
    expect(paragraph?.[0]).toContain("text-pretty");
    expect(text(paragraph?.[1] ?? "")).toBe(line);
    const button = /<button[^>]*>/.exec(html)?.[0] ?? "";
    expect(button).not.toContain("disabled");
    expect(button).not.toContain("aria-busy");
  });

  // ORV-123 row 5, design R1: the badge word once, then the line that does not repeat it.
  it.each([
    ["en", webMessages.en, "Not done", "You cannot sign in right now. Try again."],
    ["th", webMessages.th, "ทำไม่สำเร็จ", "ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้ ลองใหม่อีกครั้ง"],
  ] as const)("shows the failure word once, then the line, in %s", (l, m, word, line) => {
    const html = render(m, {
      error: "failed",
      code: "SERVICE_UNAVAILABLE",
      requestId: "r1",
      retryable: true,
    });
    const status = statusOf(html);
    expect(text(status)).toContain(word);
    expect(occurrences(text(status), word)).toBe(1);
    const paragraph = /<p class="[^"]*">(.*?)<\/p>/.exec(status);
    expect(text(paragraph?.[1] ?? "")).toBe(line);
    expect(paragraph?.[1]).not.toContain("<span");
    if (l === "th") expect(occurrences(text(status), "ทำไม่สำเร็จ")).toBe(1);
    const button = /<button[^>]*>/.exec(html)?.[0] ?? "";
    expect(button).not.toContain("disabled");
    expect(button).not.toContain("aria-busy");
  });

  // ORV-123 row 6, design R2: the retry sentence is its own inline-block box inside the paragraph.
  it.each([
    [
      "th",
      webMessages.th,
      "ลองใหม่ได้ในอีก 7 นาที",
      "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป ลองใหม่ได้ในอีก 7 นาที",
    ],
    [
      "en",
      webMessages.en,
      "Try again in 7 minutes.",
      "Too many sign-in attempts from this network. Try again in 7 minutes.",
    ],
  ] as const)("keeps the wait phrase together in %s", (_l, m, retry, full) => {
    const status = statusOf(
      render(m, {
        error: "rate-limited",
        code: "RATE_LIMITED",
        requestId: "r1",
        retryAfter: 420,
        retryable: true,
      }),
    );
    const paragraph = /<p class="text-body-md text-pretty">(.*?)<\/p>/.exec(status)?.[1] ?? "";
    const spans = [...paragraph.matchAll(/<span class="inline-block">(.*?)<\/span>/g)];
    expect(spans).toHaveLength(1);
    expect(spans[0]?.[1]).toBe(retry);
    expect(text(paragraph)).toBe(full);
    // The reason, one plain space, then the span.
    expect(paragraph.endsWith(` <span class="inline-block">${retry}</span>`)).toBe(true);
  });

  // ORV-144 row 15 (person half): the reference line is a second paragraph in the same live region,
  // for INTERNAL_ERROR only.
  it.each([
    ["en", webMessages.en, "You cannot sign in right now. Try again.", "Reference: req-77"],
    ["th", webMessages.th, "ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้ ลองใหม่อีกครั้ง", "รหัสอ้างอิง: req-77"],
  ] as const)("shows the reference line after the failure line in %s", (_l, m, line, reference) => {
    const status = statusOf(
      render(m, { error: "failed", code: "INTERNAL_ERROR", requestId: "req-77", retryable: false }),
    );
    const paragraphs = [...status.matchAll(/<p class="[^"]*">(.*?)<\/p>/g)].map((p) =>
      text(p[1] ?? ""),
    );
    expect(paragraphs).toEqual([line, reference]);
  });

  it.each([
    ["SERVICE_UNAVAILABLE", "failed"],
    ["RATE_LIMITED", "rate-limited"],
  ] as const)("shows no reference line for %s", (code, error) => {
    const state: SignInState =
      error === "failed"
        ? { error, code: "SERVICE_UNAVAILABLE", requestId: "req-77", retryable: true }
        : { error, code: "RATE_LIMITED", requestId: "req-77", retryAfter: 60, retryable: true };
    expect(code).toBe(state?.code);
    const status = statusOf(render(webMessages.en, state));
    expect(text(status)).not.toContain("Reference");
    expect(text(status)).not.toContain("req-77");
    expect(occurrences(status, "<p ")).toBe(1);
  });

  it("keeps the status region mounted and empty before any refusal", () => {
    const html = render(webMessages.en, null);
    expect(/<div role="status"[^>]*><\/div>/.test(html)).toBe(true);
  });
});
