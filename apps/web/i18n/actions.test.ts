import { captureLines, expectLineShape } from "@orivilo/auth/log-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  set: vi.fn(),
  revalidatePath: vi.fn(),
  requestId: null as string | null,
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(state.requestId === null ? {} : { "x-request-id": state.requestId }),
  cookies: async () => ({ set: state.set }),
}));
vi.mock("next/cache", () => ({ revalidatePath: state.revalidatePath }));

const { LOCALE_COOKIE } = await import("./locale");
const { setLocale } = await import("./actions");

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let capture: ReturnType<typeof captureLines>;
/** Every captured line, each checked against the line shape (ORV-142 row 15). */
const written = () => capture.lines.map((line) => expectLineShape(line));

const form = (locale: string) => {
  const data = new FormData();
  data.set("locale", locale);
  return data;
};

beforeEach(() => {
  state.set.mockReset();
  state.revalidatePath.mockReset();
  state.requestId = null;
  capture = captureLines();
});

afterEach(() => {
  capture.restore();
  vi.restoreAllMocks();
});

// ORV-142 row 11.
describe("setLocale", () => {
  it("the locale action writes one line", async () => {
    state.requestId = "2f6c0b1e-5a3d-4c7e-8b9a-0d1e2f3a4b5c";
    await setLocale(form("th"));
    expect(state.set).toHaveBeenCalledOnce();
    expect(state.set.mock.calls[0]?.slice(0, 2)).toEqual([LOCALE_COOKIE, "th"]);
    expect(state.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(written()).toEqual([
      expect.objectContaining({
        level: "info",
        requestId: state.requestId,
        route: "i18n/setLocale",
        outcome: "ok",
      }),
    ]);

    state.set.mockClear();
    state.revalidatePath.mockClear();
    capture.lines.length = 0;
    await setLocale(form("xx"));
    expect(state.set).not.toHaveBeenCalled();
    expect(state.revalidatePath).not.toHaveBeenCalled();
    expect(written()).toEqual([
      expect.objectContaining({
        level: "info",
        route: "i18n/setLocale",
        outcome: "refused",
        reason: "invalid-input",
      }),
    ]);
  });

  it("a missing field is refused like an unknown value", async () => {
    await setLocale(new FormData());
    expect(state.set).not.toHaveBeenCalled();
    expect(written()).toEqual([
      expect.objectContaining({ outcome: "refused", reason: "invalid-input" }),
    ]);
  });

  // ORV-141 orv141-request-id: the id is the request's, never a client's.
  it("the line never carries the client's id", async () => {
    state.requestId = "client-chosen-id";
    await setLocale(form("th"));
    const [line] = written();
    expect(line?.["requestId"]).toMatch(UUID_V4);
    expect(line?.["requestId"]).not.toBe("client-chosen-id");
  });
});
