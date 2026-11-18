import { readFileSync } from "node:fs";
import { type Db } from "@orivilo/db/client";
import { describe, expect, it } from "vitest";
import { configuredAddress } from "./configured-address.ts";
import { settingsFromEnv } from "./config.ts";

// ORV-286 configured-address-1: the origin of the baseURL that settingsFromEnv picks when
// VERCEL_ENV is production. Hosts are stand-ins.
const db = {} as Db;
const required = { BETTER_AUTH_SECRET: "s", GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "x" };
const own = "orivilo.example";
const production = "orivilo-production.example";
const deployment = "orivilo-8z7v18mw2.example";

describe("configuredAddress", () => {
  it("reads BETTER_AUTH_URL first", () => {
    expect(
      configuredAddress({
        BETTER_AUTH_URL: `https://${own}`,
        VERCEL_PROJECT_PRODUCTION_URL: production,
        VERCEL_URL: deployment,
      }),
    ).toBe(`https://${own}`);
  });

  it("reads the project's production domain second, with https://", () => {
    expect(
      configuredAddress({ VERCEL_PROJECT_PRODUCTION_URL: production, VERCEL_URL: deployment }),
    ).toBe(`https://${production}`);
  });

  it("reads the deployment's own URL last, with https://", () => {
    expect(configuredAddress({ VERCEL_URL: deployment })).toBe(`https://${deployment}`);
  });

  it("is undefined when none is set, and an empty value counts as not set", () => {
    expect(configuredAddress({})).toBeUndefined();
    expect(
      configuredAddress({
        BETTER_AUTH_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "",
        VERCEL_URL: "",
      }),
    ).toBeUndefined();
  });

  it("skips an empty BETTER_AUTH_URL and reads the next variable", () => {
    expect(
      configuredAddress({ BETTER_AUTH_URL: "", VERCEL_PROJECT_PRODUCTION_URL: production }),
    ).toBe(`https://${production}`);
  });

  it("is the origin only: path, query and trailing slash are dropped", () => {
    expect(configuredAddress({ BETTER_AUTH_URL: `https://${own}:8443/app/?x=1` })).toBe(
      `https://${own}:8443`,
    );
  });

  it("is undefined, and never throws, for a value that is not a URL", () => {
    expect(configuredAddress({ BETTER_AUTH_URL: "not a url" })).toBeUndefined();
  });

  it("is the production pick whatever VERCEL_ENV says", () => {
    for (const VERCEL_ENV of ["preview", "development", undefined]) {
      expect(
        configuredAddress({
          VERCEL_ENV,
          VERCEL_URL: deployment,
          VERCEL_PROJECT_PRODUCTION_URL: production,
        }),
      ).toBe(`https://${production}`);
    }
  });
});

describe("same as settingsFromEnv", () => {
  const cases = [
    { name: "BETTER_AUTH_URL set", env: { BETTER_AUTH_URL: `https://${own}` } },
    {
      name: "BETTER_AUTH_URL beats the Vercel pair",
      env: {
        BETTER_AUTH_URL: `https://${own}`,
        VERCEL_PROJECT_PRODUCTION_URL: production,
        VERCEL_URL: deployment,
      },
    },
    {
      name: "only VERCEL_PROJECT_PRODUCTION_URL",
      env: { VERCEL_PROJECT_PRODUCTION_URL: production },
    },
    {
      name: "production domain beats the deployment URL",
      env: { VERCEL_PROJECT_PRODUCTION_URL: production, VERCEL_URL: deployment },
    },
    { name: "only VERCEL_URL", env: { VERCEL_URL: deployment } },
  ];

  it.each(cases)("production, $name", ({ env }) => {
    const all = { ...required, ...env, VERCEL_ENV: "production" };
    expect(configuredAddress(all)).toBe(new URL(settingsFromEnv(db, all).baseURL).origin);
  });
});

// The pure module is what the request proxy imports; any import here could pull Better Auth or the
// database client into the proxy bundle. The scan blocks a single-line import, a multi-line
// import, a side-effect import, a dynamic import() and an export ... from.
describe("the module the proxy imports", () => {
  it("imports nothing", () => {
    const source = readFileSync(new URL("./configured-address.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/\b(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']/);
    expect(source).not.toMatch(/\bimport\s*\(/);
  });
});
