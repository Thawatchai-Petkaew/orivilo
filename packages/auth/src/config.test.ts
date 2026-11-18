import { type Db } from "@orivilo/db/client";
import { describe, expect, it } from "vitest";
import { createAuth, settingsFromEnv } from "./config.ts";

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

// ORV-286 rows 1 and 3 (signin-failure-1): where a failure of the callback and Better Auth's
// `/error` endpoint land. Nothing here reaches Google or a database: the shared limiter's store is
// a stub that counts every request as allowed, and every answer is a redirect before any query.
describe("a failed sign-in lands on /account", () => {
  const allowAll = { execute: async () => [{ count: 1 }] };
  const limiterDb = {
    ...allowAll,
    transaction: async (run: (tx: typeof allowAll) => Promise<unknown>) => run(allowAll),
  } as unknown as Db;
  const settings = () => ({
    db: limiterDb,
    secret: "test-secret-that-is-long-enough-0123456789",
    baseURL: "http://localhost:3000",
    google: { clientId: "test", clientSecret: "test" },
  });
  const landing = (response: Response) => {
    const location = response.headers.get("location") ?? "";
    const url = new URL(location, "http://localhost:3000");
    return { status: response.status, path: url.pathname, search: url.search, location };
  };

  it("callback failure lands on /account", async () => {
    const response = await createAuth(settings()).handler(
      new Request("http://localhost:3000/api/auth/callback/google"),
    );
    expect(landing(response)).toMatchObject({
      status: 302,
      path: "/account",
      search: "?error=state_not_found",
    });
    expect(response.headers.get("location")).not.toContain("/api/auth/error");
  });

  it("the error endpoint forwards to /account", async () => {
    // Better Auth reads `NODE_ENV` once, at its own import, so this runs in the test's mode; the
    // errorURL branch of its `/error` endpoint comes before the production branch (error.mjs 372
    // to 380), so a production build lands the same way.
    const response = await createAuth(settings()).handler(
      new Request("http://localhost:3000/api/auth/error?error=state_mismatch&error_description=x"),
    );
    const where = landing(response);
    expect(where.status).toBe(302);
    expect(where.path).toBe("/account");
    expect(new URLSearchParams(where.search).get("error")).toBe("state_mismatch");
    expect(where.location).not.toMatch(/^\/\?error=/);
    expect(response.headers.get("content-type") ?? "").not.toContain("text/html");
  });
});
