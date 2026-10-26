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
  failed: m.saved.errors.failed,
});
const render = (m: typeof webMessages.en, state: SignInState) => {
  refused.state = state;
  return renderToStaticMarkup(<SignInForm action={async () => null} labels={labels(m)} />);
};

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
    const html = render(m, { error: "rate-limited", retryAfter: 180 });
    const status = /<div role="status"[^>]*>(.*)<\/div>/.exec(html)?.[1] ?? "";
    expect(status).toContain(word);
    expect(status).toContain(line);
    expect(status).toContain("text-pretty");
    const button = /<button[^>]*>/.exec(html)?.[0] ?? "";
    expect(button).not.toContain("disabled");
    expect(button).not.toContain("aria-busy");
  });

  it("keeps the status region mounted and empty before any refusal", () => {
    const html = render(webMessages.en, null);
    expect(/<div role="status"[^>]*><\/div>/.test(html)).toBe(true);
  });
});
