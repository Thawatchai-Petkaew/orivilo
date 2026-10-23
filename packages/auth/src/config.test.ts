import { type Db } from "@orivilo/db/client";
import { describe, expect, it } from "vitest";
import { settingsFromEnv } from "./config.ts";

const db = {} as Db;
const base = {
  BETTER_AUTH_SECRET: "s",
  GOOGLE_CLIENT_ID: "id",
  GOOGLE_CLIENT_SECRET: "secret",
  VERCEL_URL: "orivilo-8z7v18mw2-team.vercel.app",
  VERCEL_PROJECT_PRODUCTION_URL: "orivilo.vercel.app",
};

describe("settingsFromEnv origin", () => {
  it("signs in on the project's domain in production, not on the deployment's own URL", () => {
    const settings = settingsFromEnv(db, { ...base, VERCEL_ENV: "production" });
    expect(settings.baseURL).toBe("https://orivilo.vercel.app");
    expect(settings.productionURL).toBe("https://orivilo.vercel.app");
  });

  it("keeps a set BETTER_AUTH_URL in production", () => {
    const settings = settingsFromEnv(db, {
      ...base,
      VERCEL_ENV: "production",
      BETTER_AUTH_URL: "https://orivilo.example",
    });
    expect(settings.baseURL).toBe("https://orivilo.example");
  });

  it("signs in on a preview's own URL", () => {
    const settings = settingsFromEnv(db, {
      ...base,
      VERCEL_ENV: "preview",
      BETTER_AUTH_URL: "https://orivilo.example",
    });
    expect(settings.baseURL).toBe("https://orivilo-8z7v18mw2-team.vercel.app");
  });

  it("uses BETTER_AUTH_URL off Vercel and names it when it is missing", () => {
    const local = { BETTER_AUTH_SECRET: "s", GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "x" };
    expect(
      settingsFromEnv(db, { ...local, BETTER_AUTH_URL: "http://localhost:3000" }).baseURL,
    ).toBe("http://localhost:3000");
    expect(() => settingsFromEnv(db, local)).toThrow("BETTER_AUTH_URL");
  });
});
