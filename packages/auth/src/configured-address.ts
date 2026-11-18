// ORV-286 configured-address-1. Pure and import-free on purpose: the request proxy imports this
// file by its own path (`@orivilo/auth/configured-address`), and the package index would pull
// Better Auth and the database client into the proxy bundle.

type Env = Record<string, string | undefined>;

/**
 * The base URL of sign-in for an environment, or nothing when no variable gives one. A preview
 * signs in on its own origin. Production signs in on the project's domain, never on the
 * deployment's own URL (`VERCEL_URL`), or the person lands on that URL after signing in.
 * `settingsFromEnv` takes its `baseURL` from here, so the proxy and sign-in never drift.
 */
export function pickBaseURL(env: Env): string | undefined {
  const vercel = env["VERCEL_URL"] && `https://${env["VERCEL_URL"]}`;
  const production =
    env["VERCEL_PROJECT_PRODUCTION_URL"] && `https://${env["VERCEL_PROJECT_PRODUCTION_URL"]}`;
  return (
    (env["VERCEL_ENV"] === "preview" && vercel) ||
    env["BETTER_AUTH_URL"] ||
    (env["VERCEL_ENV"] === "production" && production) ||
    vercel ||
    undefined
  );
}

/**
 * The origin that sign-in uses in production: the origin of the pick when `VERCEL_ENV` is
 * `production`, whatever `env` says. Undefined when no variable gives one or the value is not a
 * URL; it never throws.
 */
export function configuredAddress(env: Env): string | undefined {
  const picked = pickBaseURL({ ...env, VERCEL_ENV: "production" });
  if (!picked) return undefined;
  try {
    return new URL(picked).origin;
  } catch {
    return undefined;
  }
}
