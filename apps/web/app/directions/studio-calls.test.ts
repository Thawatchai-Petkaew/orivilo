import { describe, expect, it, vi } from "vitest";
import { webMessages } from "../../i18n/messages";
import type { ActionFailure } from "./actions";
import { failureNotice, runCall } from "./studio-calls";

const ID = "5f0c6f7e-2b1d-4c3a-9e8f-0a1b2c3d4e5f";
const labelsOf = (m: typeof webMessages.en) => ({
  errors: m.saved.errors,
  wait: m.wait,
  failure: m.failure,
});

describe("failureNotice", () => {
  it("is a danger notice with the failed line and no reference for a code without one", () => {
    const failure: ActionFailure = {
      ok: false,
      error: "forbidden",
      code: "FORBIDDEN",
      requestId: ID,
      retryable: false,
    };
    expect(failureNotice(labelsOf(webMessages.en), failure)).toStrictEqual({
      tone: "danger",
      lines: ["This account is not allowed to do this in this workspace."],
    });
  });

  it("puts the wait in words for a rate limit and adds no reference", () => {
    const failure: ActionFailure = {
      ok: false,
      error: "rate-limited",
      code: "RATE_LIMITED",
      requestId: ID,
      retryAfter: 600,
      retryable: true,
    };
    const { tone, lines } = failureNotice(labelsOf(webMessages.en), failure);
    expect(tone).toBe("danger");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("10 minutes");
  });
});

describe("runCall", () => {
  const ui = () => ({
    labels: labelsOf(webMessages.en),
    setNotice: vi.fn(),
    setBusy: vi.fn(),
  });

  it("runs done with the value of a successful call and clears busy", async () => {
    const u = ui();
    const done = vi.fn();
    await runCall(async () => ({ ok: true as const, value: 7 }), done, u);
    expect(done).toHaveBeenCalledExactlyOnceWith(7);
    expect(u.setNotice).not.toHaveBeenCalled();
    expect(u.setBusy.mock.calls).toStrictEqual([[true], [false]]);
  });

  it("does not run done on a failed outcome", async () => {
    const u = ui();
    const done = vi.fn();
    await runCall(
      async () => ({
        ok: false as const,
        error: "signed-out" as const,
        code: "UNAUTHENTICATED" as const,
        requestId: ID,
        retryable: false,
      }),
      done,
      u,
    );
    expect(done).not.toHaveBeenCalled();
    expect(u.setNotice).toHaveBeenCalledOnce();
  });

  it("clears busy when done itself rejects, and passes the rejection on", async () => {
    const u = ui();
    await expect(
      runCall(
        async () => ({ ok: true as const, value: 1 }),
        () => Promise.reject(new Error("done broke")),
        u,
      ),
    ).rejects.toThrow("done broke");
    expect(u.setBusy.mock.calls).toStrictEqual([[true], [false]]);
  });
});
