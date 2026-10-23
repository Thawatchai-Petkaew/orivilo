import { type Db } from "@orivilo/db/client";
import { eq, member, organization, requireEnv } from "@orivilo/db";
import * as schema from "@orivilo/db";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy, organization as organizationPlugin } from "better-auth/plugins";
import { randomUUID } from "node:crypto";

export interface AuthSettings {
  db: Db;
  secret: string;
  baseURL: string;
  /** The production origin; a preview's Google sign-in goes through it and back (oAuthProxy). */
  productionURL?: string | undefined;
  google: { clientId: string; clientSecret: string };
  /** Extra plugins, for tests only (`testUtils`). */
  plugins?: BetterAuthPlugin[];
}

const slugOf = (id: string) => `ws-${id.slice(0, 12).toLowerCase()}`;

/**
 * Better Auth for ORIVILO (ADR 0002, spec ORV-38): Google sign-in only, workspaces through the
 * organization plugin. The first sign-in creates the person's own workspace with them as owner,
 * and every new session starts in a workspace they belong to.
 */
export function createAuth(settings: AuthSettings) {
  const { db } = settings;
  return betterAuth({
    secret: settings.secret,
    baseURL: settings.baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: false },
    socialProviders: { google: settings.google },
    rateLimit: { enabled: true },
    plugins: [
      organizationPlugin(),
      oAuthProxy(settings.productionURL ? { productionURL: settings.productionURL } : {}),
      ...(settings.plugins ?? []),
    ],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const id = randomUUID();
            const now = new Date();
            await db.transaction(async (tx) => {
              await tx
                .insert(organization)
                .values({ id, name: user.name || user.email, slug: slugOf(id), createdAt: now });
              await tx.insert(member).values({
                id: randomUUID(),
                organizationId: id,
                userId: user.id,
                role: "owner",
                createdAt: now,
              });
            });
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const [first] = await db
              .select({ id: member.organizationId })
              .from(member)
              .where(eq(member.userId, session.userId))
              .orderBy(member.createdAt)
              .limit(1);
            return { data: { ...session, activeOrganizationId: first?.id ?? null } };
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Settings from the environment; names a missing variable, never prints a value. */
export function settingsFromEnv(db: Db, env: Record<string, string | undefined> = process.env) {
  const vercel = env["VERCEL_URL"] && `https://${env["VERCEL_URL"]}`;
  const production =
    env["VERCEL_PROJECT_PRODUCTION_URL"] && `https://${env["VERCEL_PROJECT_PRODUCTION_URL"]}`;
  // A preview signs in on its own origin. Production signs in on the project's domain, never on
  // the deployment's own URL (`VERCEL_URL`), or the person lands on that URL after signing in.
  const baseURL =
    (env["VERCEL_ENV"] === "preview" && vercel) ||
    env["BETTER_AUTH_URL"] ||
    (env["VERCEL_ENV"] === "production" && production) ||
    vercel ||
    requireEnv("BETTER_AUTH_URL", env);
  return {
    db,
    secret: requireEnv("BETTER_AUTH_SECRET", env),
    baseURL,
    productionURL: production || env["BETTER_AUTH_URL"],
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID", env),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET", env),
    },
  } satisfies AuthSettings;
}
