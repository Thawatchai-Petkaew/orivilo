import "server-only";
import {
  type Charge,
  LIMITS,
  type logStep,
  type OpenedProject,
  type UsageEntry,
} from "@orivilo/auth";
import {
  draftPositioning,
  openRouterComplete,
  POSITIONING_DRAFT_MAX_TOKENS,
  POSITIONING_DRAFT_MODEL,
  type PositioningDraft,
  PositioningDraftRefused,
} from "@orivilo/intent-engine";
import { recordUsage } from "./ai-usage";
import { limiter } from "./rate-limit";
import { spendCap } from "./spend-cap";

/**
 * Steps 6 to 8 of `positioning-door-1`, draft (ORV-285 tech notes section 6.2), in the order of
 * `positioning-draft-key-1` (ORV-292): the key is read first, then the `ai-read` limit, the spend cap
 * and the one model call with its checks. With no key nothing is counted, checked, called or
 * recorded. It runs after the project was read and never throws: it answers the record to save, or
 * the reason no draft was made and the word of the step line, for the action to word. No answer,
 * option, quote, model text, provider message or key reaches a line: the only thing a catch keeps is
 * which step it was.
 */

/** How long the model may take before the person writes their own (ADR 0009 point 3). */
const AI_TIMEOUT_MS = 20_000;

type Word = Parameters<typeof logStep<"positioning-draft">>[0]["outcome"];

export type Drafted =
  | { record: PositioningDraft }
  | {
      /** The `ActionError` the person is told, and the word of the step line. */
      reason: "ai-rate-limited" | "ai-spend-cap" | "ai-not-configured" | "ai-failed";
      outcome: Exclude<Word, "drafted" | "save-failed">;
      /** Set with `ai-rate-limited`: how long to wait. */
      retryAfter?: number;
      /** Set when a store that counts could not answer, so the action says the service is down. */
      unavailable?: "rate-limit" | "spend-cap";
    };

export async function draftFromAnswers(
  headers: Headers,
  workspaceId: string,
  userId: string,
  opened: Pick<OpenedProject, "intake" | "intakeId">,
): Promise<Drafted> {
  // The key is read before the limit: with none, no limit is consumed and no cap is read.
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { reason: "ai-not-configured", outcome: "not-configured" };

  // 6. The `ai-read` limit. A store that cannot count fails closed.
  try {
    const counted = await limiter().consume(LIMITS["ai-read"], { user: userId });
    if (!counted.ok) {
      return counted.reason === "unavailable"
        ? { reason: "ai-failed", outcome: "unavailable", unavailable: "rate-limit" }
        : {
            reason: "ai-rate-limited",
            outcome: "limited",
            retryAfter: counted.retryAfter,
          };
    }
  } catch {
    return { reason: "ai-failed", outcome: "unavailable", unavailable: "rate-limit" };
  }

  // 7. The spend cap, read before the call.
  let charge: Charge;
  try {
    const checked = await spendCap().check(headers, workspaceId);
    if (!checked.ok) {
      return checked.reason === "capped"
        ? { reason: "ai-spend-cap", outcome: "spend-cap" }
        : { reason: "ai-failed", outcome: "unavailable", unavailable: "spend-cap" };
    }
    charge = checked.charge;
  } catch {
    return { reason: "ai-failed", outcome: "unavailable", unavailable: "spend-cap" };
  }

  // 8. The model call, with the one pinned model and no other.
  const calls: UsageEntry[] = [];
  try {
    const record = await draftPositioning(
      { intake: opened.intake, intakeId: opened.intakeId },
      {
        complete: openRouterComplete({
          apiKey,
          model: POSITIONING_DRAFT_MODEL,
          fetch: (url, init) => fetch(url, init as RequestInit),
          signal: () => AbortSignal.timeout(AI_TIMEOUT_MS),
          maxTokens: POSITIONING_DRAFT_MAX_TOKENS,
          onCall: (c) =>
            calls.push({
              job: "positioning-draft",
              model: POSITIONING_DRAFT_MODEL,
              costMicroUsd: c.costMicroUsd,
            }),
        }),
        model: POSITIONING_DRAFT_MODEL,
      },
    );
    return { record };
  } catch (error) {
    // A refused answer and a failed call differ only in the word of the line.
    return {
      reason: "ai-failed",
      outcome: error instanceof PositioningDraftRefused ? "refused" : "failed",
    };
  } finally {
    await recordUsage(charge, calls);
  }
}
