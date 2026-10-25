import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("ZodJitless", () => {
  it("turns zod's compiled parsers off once its module loads (no eval under the CSP)", async () => {
    expect(z.config().jitless).not.toBe(true);
    await import("./app/ZodJitless");
    expect(z.config().jitless).toBe(true);
  });
});
