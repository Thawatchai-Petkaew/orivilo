"use server";

import {
  atBoundary,
  BusinessError,
  businessService,
  Denied,
  type Ended,
  type ErrorCode,
  failureFields,
  LIMITS,
  logStep,
  positioningService,
  requestIdOf,
} from "@orivilo/auth";
import { MissingEnvError } from "@orivilo/db";
import {
  type ChoiceInput,
  type ChoiceProblem,
  checkChoice,
  givenAnswers,
  positioningGate,
} from "@orivilo/intent-engine";
import { headers } from "next/headers";
import { z } from "zod";
import { accessDeps, auth } from "../../server/auth";
import { draftFromAnswers } from "../../server/positioning-draft";
import { limiter, subjectFromHeaders } from "../../server/rate-limit";
import { mayRead } from "../../server/read-access";
import type { Failed, Outcome } from "../directions/actions";

/**
 * The positioning actions of a business project (ORV-285 tech notes sections 6.1 and 6.2, ORV-292).
 *
 * `choosePositioning` saves the positioning choice (`positioning-door-1`, choice): the session, the
 * approved list, the `write` limit, the choice check, then one transaction that reads the project,
 * its newest intake and the agreed state and writes the row. `draftPositioning` asks for options
 * (`positioning-door-1`, draft): the session, the approved list, the input check, the project read,
 * the preconditions, then the `ai-read` limit, the spend cap, one call to the one pinned model and
 * the save. In both the order is fixed and nothing is saved before the checks have passed. The
 * statement, the options, the answers, the ids and the key never reach a log line or a refusal: the
 * boundary line carries closed words only, and a problem names a field and a kind.
 */

/**
 * A refusal at step 4: a `Failed` with `invalid-input` that also says which field failed and why,
 * so the editor can show it on the field. `problems` holds field names and kinds, never values.
 */
export type ChoiceRefused = {
  ok: false;
  error: "invalid-input";
  code: "INVALID_INPUT";
  requestId: string;
  retryable: false;
  problems: ChoiceProblem[];
};

/** The `satisfies` makes a new reason without a code fail `pnpm typecheck`. */
const CODE_OF = {
  "signed-out": "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
  "workspace-not-found": "NOT_FOUND",
  "not-found": "NOT_FOUND",
  "invalid-input": "INVALID_INPUT",
  "not-configured": "INTERNAL_ERROR",
  "ai-not-configured": "INTERNAL_ERROR",
  "ai-failed": "UPSTREAM_FAILED",
  failed: "INTERNAL_ERROR",
} satisfies Partial<Record<Failed["error"], ErrorCode>>;

/** `Denied` maps by its status alone; a new status without a row fails `pnpm typecheck`. */
const ERROR_OF_DENIED = {
  401: "signed-out",
  403: "forbidden",
  404: "workspace-not-found",
} as const satisfies Record<Denied["status"], keyof typeof CODE_OF>;

type Chosen = Outcome<{ kind: ChoiceInput["kind"] }> | ChoiceRefused;

export async function choosePositioning(input: unknown): Promise<Chosen> {
  const h = await headers();
  const requestId = requestIdOf(h);
  const fail = (error: keyof typeof CODE_OF, code: ErrorCode = CODE_OF[error]): Failed => ({
    ok: false,
    error,
    ...failureFields(code, requestId),
  });
  const refused = (error: keyof typeof CODE_OF): Ended<Chosen> => ({
    value: fail(error),
    ending: { level: "info", outcome: "refused", reason: error },
  });

  return atBoundary({ requestId, route: "business/choosePositioning" }, async () => {
    try {
      // 1. The session, read on the server.
      const session = await auth().api.getSession({ headers: h });
      // 2. The approved list, before anything is counted, parsed or opened.
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

      // 4. The choice check. Nothing is saved on a refusal.
      const checked = checkChoice(input);
      if (!checked.ok) {
        const value: ChoiceRefused = {
          ok: false,
          error: "invalid-input",
          ...failureFields("INVALID_INPUT", requestId),
          problems: checked.problems,
        };
        return { value, ending: { level: "info", outcome: "refused", reason: "invalid-input" } };
      }

      // 5 and 6. The project, its newest intake and the agreed state are read, and the row is
      // written, in one transaction in the session's active workspace, never one the client names.
      try {
        const { kind } = await positioningService(accessDeps()).choose(
          h,
          session.session.activeOrganizationId ?? "",
          checked.choice,
        );
        return { value: { ok: true, value: { kind } }, ending: { level: "info", outcome: "ok" } };
      } catch (error) {
        if (error instanceof BusinessError) {
          // One body for another workspace's project, an unknown project, a draft that is not
          // there and an option it lacks (security rule 9); an agreed positioning stays agreed.
          if (error.reason === "not-found") return refused("not-found");
          if (error.reason === "gate-passed" || error.reason === "invalid-input") {
            return refused("invalid-input");
          }
          return {
            value: fail("failed"),
            ending: { level: "error", outcome: "failed", reason: "failed" },
          };
        }
        throw error;
      }
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

/** Step 3 of the draft door: the project the options are for, and nothing else. */
const draftRequestSchema = z
  .object({
    projectId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  })
  .strict();

type Drafting = Outcome<{ draftId: string }>;

/**
 * Drafts two or three positioning options from a project's answers, saves them once and answers the
 * draft's id (`positioning-door-1`, draft). A stored draft of the newest intake is answered again,
 * never drafted again: the limit, the cap and the call are not touched. The newest intake's answers
 * are read from the database, so the model reads the answers saved, whatever the client said. Nothing
 * is stored when the call is stopped; the person writes their own or skips.
 */
export async function draftPositioning(input: unknown): Promise<Drafting> {
  const h = await headers();
  const requestId = requestIdOf(h);
  const fail = (error: keyof typeof CODE_OF, code: ErrorCode = CODE_OF[error]): Failed => ({
    ok: false,
    error,
    ...failureFields(code, requestId),
  });
  const refused = (error: keyof typeof CODE_OF): Ended<Drafting> => ({
    value: fail(error),
    ending: { level: "info", outcome: "refused", reason: error },
  });
  const started = performance.now();
  /** The one step line of steps 6 to 9, with a word from a closed list. */
  const line = (outcome: Parameters<typeof logStep<"positioning-draft">>[0]["outcome"]) =>
    logStep({
      step: "positioning-draft",
      outcome,
      level: outcome === "drafted" ? "info" : "warn",
      ...(outcome === "limited" ? { limit: "ai-read" } : {}),
      durationMs: performance.now() - started,
    });

  return atBoundary({ requestId, route: "business/draftPositioning" }, async () => {
    try {
      // 1. The session, read on the server.
      const session = await auth().api.getSession({ headers: h });
      // 2. The approved list, before anything is counted, parsed or opened.
      if (session && !mayRead(session.user.email)) return refused("forbidden");
      if (!session) {
        // No session: the `signed-out` limit by address is counted, as `createProject` does.
        const counted = await limiter().consume(LIMITS["signed-out"], {
          ip: subjectFromHeaders(h),
        });
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
        return refused("signed-out");
      }

      // 3. The input check. Nothing is read or counted on a refusal.
      const request = draftRequestSchema.safeParse(input);
      if (!request.success) return refused("invalid-input");

      // 4. The project and its newest intake, in the session's active workspace.
      const workspaceId = session.session.activeOrganizationId ?? "";
      const service = businessService(accessDeps());
      let opened: Awaited<ReturnType<typeof service.open>>;
      try {
        opened = await service.open(h, workspaceId, request.data.projectId);
      } catch (error) {
        if (error instanceof BusinessError) {
          // One body for another workspace's project and an unknown id (security rule 9).
          if (error.reason === "not-found") return refused("not-found");
          return {
            value: fail("failed"),
            ending: { level: "error", outcome: "failed", reason: "failed" },
          };
        }
        throw error;
      }

      // 5. Preconditions: an agreed positioning needs no options, a stored draft is answered again,
      // and the value answer is what every option rests on. No limit is counted for any of them.
      const { positioning } = opened;
      const gate = positioningGate({
        newestIntakeId: positioning.intakeId,
        choice: positioning.choice,
        draftOfNewest: positioning.draft !== null,
      });
      if (gate.state === "given" || gate.state === "confirmed") return refused("invalid-input");
      if (positioning.draft) {
        return {
          value: { ok: true, value: { draftId: positioning.draft.id } },
          ending: { level: "info", outcome: "ok" },
        };
      }
      if (givenAnswers(opened.intake).value === undefined) return refused("invalid-input");

      // 6 to 8. The `ai-read` limit, the spend cap and the one model call.
      const drafted = await draftFromAnswers(h, workspaceId, session.user.id, opened);
      if (!("record" in drafted)) {
        line(drafted.outcome);
        if (drafted.reason === "ai-rate-limited") {
          return {
            value: {
              ok: false,
              error: "ai-rate-limited",
              ...failureFields("RATE_LIMITED", requestId),
              retryAfter: drafted.retryAfter ?? 0,
            },
            ending: { level: "warn", outcome: "limited", reason: "ai-rate-limited" },
          };
        }
        if (drafted.reason === "ai-spend-cap") {
          return {
            value: {
              ok: false,
              error: "ai-spend-cap",
              ...failureFields("AI_SPEND_CAP", requestId),
            },
            ending: { level: "warn", outcome: "limited", reason: "ai-spend-cap" },
          };
        }
        if (drafted.unavailable) {
          return {
            value: fail("ai-failed", "SERVICE_UNAVAILABLE"),
            ending: { level: "error", outcome: "unavailable", reason: drafted.unavailable },
          };
        }
        return {
          value: fail(drafted.reason),
          ending: { level: "error", outcome: "failed", reason: drafted.reason },
        };
      }

      // 9. The save is a second transaction: step 4 committed before the call began. A save that
      // fails reads the project again: a second request that won the unique has stored its draft,
      // which is the one answered; with none there the save failed.
      try {
        const { draftId } = await positioningService(accessDeps()).saveDraft(
          h,
          workspaceId,
          drafted.record,
        );
        line("drafted");
        return {
          value: { ok: true, value: { draftId } },
          ending: { level: "info", outcome: "ok" },
        };
      } catch {
        try {
          const again = await service.open(h, workspaceId, request.data.projectId);
          if (again.positioning.draft) {
            line("drafted");
            return {
              value: { ok: true, value: { draftId: again.positioning.draft.id } },
              ending: { level: "info", outcome: "ok" },
            };
          }
        } catch {
          // Reading it again failed too: the save failed.
        }
        line("save-failed");
        return {
          value: fail("failed"),
          ending: { level: "error", outcome: "failed", reason: "failed" },
        };
      }
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
