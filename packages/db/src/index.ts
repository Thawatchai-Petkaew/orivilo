// Schema and types only; the client lives in `@orivilo/db/client` for the authorization helper.
export * from "./schema/index.ts";
export { MissingEnvError, requireEnv } from "./env.ts";
// The query operators, so callers use this package's drizzle instance and its types.
export { and, asc, desc, eq, sql } from "drizzle-orm";
