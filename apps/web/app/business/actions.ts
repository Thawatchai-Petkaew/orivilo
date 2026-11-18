"use server";

import {
  atBoundary,
  businessService,
  Denied,
  type Ended,
  type ErrorCode,
  failureFields,
  LIMITS,
  requestIdOf,
} from "@orivilo/auth";
import { MissingEnvError } from "@orivilo/db";
import { checkIntake, type IntakeProblem } from "@orivilo/intent-engine";
import { headers } from "next/headers";
import { accessDeps, auth } from "../../server/auth";
import { limiter, subjectFromHeaders } from "../../server/rate-limit";
import { mayRead } from "../../server/read-access";
import type { Failed, Outcome } from "../directions/actions";

/**
 * Saves a business project from the intake (ORV-281 tech notes section 6.1, slice 1): steps 1 to 5
 * of `business-door-1` in one boundary. The order is fixed and nothing is saved before the session,
 * the approved list, the `write` limit and the intake check have passed. The person's answers, the
 * project name and the website never reach a log line or a refusal: the boundary line carries closed
 * words only, and a problem names a field and a kind.
 */

/**
 * A refusal at step 4. It is a `Failed` with `invalid-input` that also says which field failed and
 * why, so the form can show it on the field. `problems` holds field names and kinds, never values.
 */
export type IntakeRefused = {
  ok: false;
  error: "invalid-input";
  code: "INVALID_INPUT";
  requestId: string;
  retryable: false;
  problems: IntakeProblem[];
};

/** The `satisfies` makes a new reason without a code fail `pnpm typecheck`. */
const CODE_OF = {
  "signed-out": "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
  "workspace-not-found": "NOT_FOUND",
  "invalid-input": "INVALID_INPUT",
  "not-configured": "INTERNAL_ERROR",
  failed: "INTERNAL_ERROR",
} satisfies Partial<Record<Failed["error"], ErrorCode>>;

/** `Denied` maps by its status alone; a new status without a row fails `pnpm typecheck`. */
const ERROR_OF_DENIED = {
  401: "signed-out",
  403: "forbidden",
  404: "workspace-not-found",
} as const satisfies Record<Denied["status"], keyof typeof CODE_OF>;

export async function createProject(
  input: unknown,
): Promise<Outcome<{ projectId: string }> | IntakeRefused> {
  const h = await headers();
  const requestId = requestIdOf(h);
  const fail = (error: keyof typeof CODE_OF, code: ErrorCode = CODE_OF[error]): Failed => ({
    ok: false,
    error,
    ...failureFields(code, requestId),
  });
  const refused = (error: keyof typeof CODE_OF): Ended<Outcome<{ projectId: string }>> => ({
    value: fail(error),
    ending: { level: "info", outcome: "refused", reason: error },
  });

  return atBoundary({ requestId, route: "business/createProject" }, async () => {
    try {
      // 1. The session, read on the server.
      const session = await auth().api.getSession({ headers: h });
      // 2. The approved list, before anything is counted, parsed or opened. A person with no
      // session never reaches it.
      if (session && !mayRead(session.user.email)) return refused("forbidden");
      // 3. The `write` limit; with no session, the `signed-out` limit by IP. A store that cannot
      // count fails closed.
      const counted = session
        ? await limiter().consume(LIMITS.write, { user: session.user.id })
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

      // 4. The intake check. Nothing is saved on a refusal.
      const checked = checkIntake(input);
      if (!checked.ok) {
        const value: IntakeRefused = {
          ok: false,
          error: "invalid-input",
          ...failureFields("INVALID_INPUT", requestId),
          problems: checked.problems,
        };
        return { value, ending: { level: "info", outcome: "refused", reason: "invalid-input" } };
      }

      // 5. The save: one project and its intake in the session's active workspace, never one the
      // client names.
      const { projectId } = await businessService(accessDeps()).create(
        h,
        session.session.activeOrganizationId ?? "",
        checked.intake,
      );
      return {
        value: { ok: true, value: { projectId } },
        ending: { level: "info", outcome: "ok" },
      };
    } catch (error) {
      if (error instanceof Denied) return refused(ERROR_OF_DENIED[error.status]);
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
