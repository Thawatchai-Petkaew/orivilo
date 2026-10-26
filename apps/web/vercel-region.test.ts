import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("vercel.json", () => {
  it("runs the functions in sin1, beside the Supabase Singapore database (ORV-124)", () => {
    const config = JSON.parse(readFileSync(new URL("./vercel.json", import.meta.url), "utf8"));
    expect(config.regions).toEqual(["sin1"]);
  });
});
