import "server-only";
import { type AccessDeps, createAuth, settingsFromEnv } from "@orivilo/auth";
import { appDb } from "@orivilo/db/client";
import { nextCookies } from "better-auth/next-js";

let shared: ReturnType<typeof build> | undefined;
const build = () => createAuth({ ...settingsFromEnv(appDb()), plugins: [nextCookies()] });

/** Better Auth for the app, built on first use so a build without secrets still succeeds. */
export function auth() {
  shared ??= build();
  return shared;
}

/** What `withWorkspace` needs: the app role's database and the server-side session. */
export function accessDeps(): AccessDeps {
  return { db: appDb(), getSession: (headers) => auth().api.getSession({ headers }) };
}
