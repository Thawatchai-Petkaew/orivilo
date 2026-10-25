import { describe, expect, it } from "vitest";
import { assertNested, LIMITS } from "./rate-limit.ts";

// The numbers decided at G1 (spec ORV-112 v1.3). A change is a spec bump, so it is a test change.
describe("LIMITS", () => {
  it("sign-in is 10 per 10 minutes", () => {
    expect(LIMITS["sign-in"].windows).toEqual([{ seconds: 600, max: 10 }]);
  });
  it("ai-read is 50 per Bangkok day and 10 per hour", () => {
    expect(LIMITS["ai-read"].windows).toEqual([
      { seconds: 86_400, max: 50, offsetSeconds: 25_200 },
      { seconds: 3_600, max: 10 },
    ]);
  });
  it("write is 60 per 10 minutes", () => {
    expect(LIMITS.write.windows).toEqual([{ seconds: 600, max: 60 }]);
  });
  it("import is 10 per hour", () => {
    expect(LIMITS.import.windows).toEqual([{ seconds: 3_600, max: 10 }]);
  });
  it("signed-out is 30 per 10 minutes", () => {
    expect(LIMITS["signed-out"].windows).toEqual([{ seconds: 600, max: 30 }]);
  });
  it("every limit nests its windows and names itself", () => {
    for (const [name, limit] of Object.entries(LIMITS)) {
      expect(limit.name).toBe(name);
      expect(() => assertNested(limit)).not.toThrow();
    }
  });
});
