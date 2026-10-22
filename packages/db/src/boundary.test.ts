import { Linter } from "eslint";
import { describe, expect, it } from "vitest";
// @ts-expect-error a plain ESM config module without types
import { restrictDbClient } from "../eslint-boundary.mjs";
import { MissingEnvError, requireEnv } from "./env.ts";

describe("the database client boundary (ORV-38 AC 7)", () => {
  const lint = (code: string) =>
    new Linter({ configType: "flat" }).verify(code, [
      { languageOptions: { sourceType: "module" } },
      restrictDbClient,
    ]);

  it("fails a module that imports the client", () => {
    const [error] = lint('import { appDb } from "@orivilo/db/client";');
    expect(error?.ruleId).toBe("no-restricted-imports");
    expect(error?.message).toMatch(/withWorkspace/);
  });

  it("lets a module import the schema", () => {
    expect(lint('import { project } from "@orivilo/db";')).toEqual([]);
  });
});

describe("requireEnv (ORV-38 AC 8)", () => {
  it("names the missing variable and never echoes a value", () => {
    const env = { DATABASE_URL: "", OTHER: "postgres://secret@host/db" };
    expect(() => requireEnv("DATABASE_URL", env)).toThrow(MissingEnvError);
    try {
      requireEnv("DATABASE_URL", env);
    } catch (e) {
      expect((e as Error).message).toContain("DATABASE_URL");
      expect((e as Error).message).not.toContain("secret");
    }
    expect(requireEnv("OTHER", env)).toBe("postgres://secret@host/db");
  });
});
