"use server";

import {
  atBoundary,
  type Ended,
  type ErrorCode,
  failureFields,
  LIMITS,
  logStep,
  requestIdOf,
} from "@orivilo/auth";
import { MissingEnvError } from "@orivilo/db";
import {
  INPUT_ROLES,
  readUrlInput,
  reportOf,
  toReportView,
  URL_MAX_CHARS,
  type ReportView,
} from "@orivilo/intent-engine";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "../../server/auth";
import { limiter, subjectFromHeaders } from "../../server/rate-limit";
import { mayRead } from "../../server/read-access";
import { createReadPorts } from "../../server/read-ports";
import type { Failed, Outcome } from "../directions/actions";

/**
 * Reads one page the signed-in person names and returns a bounded view of the report (ORV-266 tech
 * notes section 5). The order is `read-door-1` (ORV-268): session, allow-list, limit, input, ports.
 * Nothing is saved and no model is called. The URL, the host, the page body and
 * the person's data never reach a log line: the boundary line and the `page-read` step line carry
 * only closed words.
 */

/** The `satisfies` makes a new reason without a code fail `pnpm typecheck`. */
const CODE_OF = {
  "signed-out": "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
  "invalid-input": "INVALID_INPUT",
  "not-configured": "INTERNAL_ERROR",
  failed: "INTERNAL_ERROR",
} satisfies Partial<Record<Failed["error"], ErrorCode>>;

const inputSchema = z.strictObject({
  url: z.string().trim().min(1).max(URL_MAX_CHARS),
  role: z.enum(INPUT_ROLES),
});

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/** True when the URL parser reads a username or a password in the text. Text it rejects has none. */
function hasCredentials(text: string): boolean {
  try {
    const parsed = new URL(text);
    return parsed.username !== "" || parsed.password !== "";
  } catch {
    return false;
  }
}

/**
 * `url-input-1`: text with no scheme and `://` gets `https://` in front. Nothing else changes. Text
 * the parser reads with a username or a password is checked first and stays as written, so the
 * prefix never turns credentials into a path that no later check sees (row 37, SEC-266-9).
 */
const urlOf = (text: string): string =>
  hasCredentials(text) || HAS_SCHEME.test(text) ? text : `https://${text}`;

/** The step outcome of a read that gave a report (`STEP_OUTCOMES["page-read"]`). */
const STEP_OF = {
  "read.refused.address": "refused-address",
  "read.refused.robots": "refused-robots",
  "read.failed.timeout": "timeout",
  "read.failed.network": "network",
  "read.failed.redirects": "redirects",
  "read.failed.notHtml": "not-html",
} as const;

export async function analysePage(input: unknown): Promise<Outcome<ReportView>> {
  const h = await headers();
  const requestId = requestIdOf(h);
  const fail = (error: keyof typeof CODE_OF, code: ErrorCode = CODE_OF[error]): Failed => ({
    ok: false,
    error,
    ...failureFields(code, requestId),
  });
  const refused = (error: keyof typeof CODE_OF): Ended<Outcome<ReportView>> => ({
    value: fail(error),
    ending: { level: "info", outcome: "refused", reason: error },
  });

  return atBoundary({ requestId, route: "read/analysePage" }, async () => {
    try {
      const session = await auth().api.getSession({ headers: h });
      // read-door-1: the allow-list comes right after the session and before anything is counted,
      // parsed or opened. A person with no session never reaches it.
      if (session && !mayRead(session.user.email)) return refused("forbidden");
      // Every call from an approved person counts, whatever its result (page-read-limit-1).
      const counted = session
        ? await limiter().consume(LIMITS["page-read"], { user: session.user.id })
        : await limiter().consume(LIMITS["signed-out"], { ip: subjectFromHeaders(h) });
      if (!counted.ok) {
        if (counted.reason === "unavailable") {
          return {
            value: fail("failed", "SERVICE_UNAVAILABLE"),
            ending: { level: "error", outcome: "unavailable", reason: "rate-limit" },
          };
        }
        return {
          value: {
            ok: false,
            error: "rate-limited",
            ...failureFields("RATE_LIMITED", requestId),
            retryAfter: counted.retryAfter,
          },
          ending: { level: "warn", outcome: "limited", reason: "rate-limited" },
        };
      }
      if (!session) return refused("signed-out");

      const parsed = inputSchema.safeParse(input);
      if (!parsed.success) return refused("invalid-input");
      const { url: given, role } = parsed.data;

      const started = performance.now();
      const text = urlOf(given);
      const read = await readUrlInput({ url: text, role }, createReadPorts());
      const retrievedAt = new Date().toISOString();
      const built = reportOf(text, read, null, { role, retrievedAt, notRendered: "no-renderer" });
      if (!built.ok) {
        return {
          value: fail("failed"),
          ending: { level: "error", outcome: "failed", reason: "failed" },
        };
      }
      const { report } = built;
      logStep({
        step: "page-read",
        outcome:
          report.status === "analysed"
            ? "read"
            : report.status === "not-read"
              ? "not-read"
              : STEP_OF[report.line],
        durationMs: performance.now() - started,
      });
      return {
        value: { ok: true, value: toReportView(report, { role, retrievedAt }) },
        ending: { level: "info", outcome: "ok" },
      };
    } catch (error) {
      if (error instanceof MissingEnvError) {
        return {
          value: fail("not-configured"),
          ending: { level: "error", outcome: "failed", reason: "not-configured" },
        };
      }
      return {
        value: fail("failed"),
        ending: {
          level: "error",
          outcome: "failed",
          reason: "unexpected",
          errorName: error instanceof Error ? error.name : "unknown",
        },
      };
    }
  });
}
