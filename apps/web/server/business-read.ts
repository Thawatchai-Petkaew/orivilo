import "server-only";
import { createHash } from "node:crypto";
import { businessService, type Charge, LIMITS, logStep, type UsageEntry } from "@orivilo/auth";
import {
  BUSINESS_READ_MAX_TOKENS,
  BUSINESS_READ_MODEL,
  type BusinessReadReason,
  type BusinessReading,
  BusinessReadRefused,
  modelReading,
  openRouterComplete,
  readBusiness,
  ruleBasedReading,
} from "@orivilo/intent-engine";
import { recordUsage } from "./ai-usage";
import { accessDeps } from "./auth";
import { limiter } from "./rate-limit";
import { spendCap } from "./spend-cap";

/**
 * Steps 6 to 9 of `business-door-1` for a saved business intake (ORV-283, tech notes section 6.1):
 * the `ai-read` limit, the spend cap, the model call and its checks, and the save of the record.
 * The key is read before step 6 (`orv287-key-first-1`): with none, steps 6 to 8 do not run and the
 * record is `rule-based` with the reason `ai-not-configured`.
 * It runs after the intake committed and never throws, so nothing here can undo or fail that save.
 * What happened is the saved record and one step line `business-read` with a word from a closed
 * list. No answer, name, quote, model text, provider message or key reaches a line: the only thing
 * a catch keeps is which step it was.
 */

/** How long the model may take before the person's own words stand alone (ADR 0009 point 3). */
const AI_TIMEOUT_MS = 20_000;

type Step = Parameters<typeof logStep<"business-read">>[0];
type Word = Step["outcome"];
type Decided = {
  record: BusinessReading;
  outcome: Word;
};

const sha256Text = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex");

/** Steps 6 to 8: what the reading of this intake is. Never throws. */
async function decide(
  headers: Headers,
  workspaceId: string,
  userId: string,
  opened: Awaited<ReturnType<ReturnType<typeof businessService>["open"]>>,
): Promise<Decided> {
  const without = (reason: BusinessReadReason, outcome: Word): Decided => ({
    record: ruleBasedReading(opened.intakeId, reason),
    outcome,
  });

  // The key first (`orv287-key-first-1`): with no key AI is not set up, so steps 6 to 8 do not run.
  // No `ai-read` count is used, the spend cap is not read and no model is called.
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return without("ai-not-configured", "not-configured");

  // 6. The `ai-read` limit. A store that cannot count fails closed.
  try {
    const counted = await limiter().consume(LIMITS["ai-read"], { user: userId });
    if (!counted.ok) {
      return counted.reason === "unavailable"
        ? without("ai-failed", "unavailable")
        : without("ai-rate-limited", "limited");
    }
  } catch {
    return without("ai-failed", "unavailable");
  }

  // 7. The spend cap, read before the call.
  let charge: Charge;
  try {
    const checked = await spendCap().check(headers, workspaceId);
    if (!checked.ok) {
      return checked.reason === "capped"
        ? without("ai-spend-cap", "spend-cap")
        : without("ai-failed", "unavailable");
    }
    charge = checked.charge;
  } catch {
    return without("ai-failed", "unavailable");
  }

  // 8. The model call, with the one pinned model and no other.
  const calls: UsageEntry[] = [];
  try {
    const { items } = await readBusiness(
      {
        intake: opened.intake,
        intakeId: opened.intakeId,
        savedAt: opened.savedAt.toISOString(),
      },
      {
        complete: openRouterComplete({
          apiKey,
          model: BUSINESS_READ_MODEL,
          fetch: (url, init) => fetch(url, init as RequestInit),
          signal: () => AbortSignal.timeout(AI_TIMEOUT_MS),
          maxTokens: BUSINESS_READ_MAX_TOKENS,
          onCall: (c) =>
            calls.push({
              job: "business-read",
              model: BUSINESS_READ_MODEL,
              costMicroUsd: c.costMicroUsd,
            }),
        }),
        sha256Text,
        model: BUSINESS_READ_MODEL,
      },
    );
    return {
      record: modelReading(opened.intakeId, BUSINESS_READ_MODEL, items),
      outcome: "read",
    };
  } catch (error) {
    // A refused answer and a failed call differ only in the word of the line.
    return without("ai-failed", error instanceof BusinessReadRefused ? "refused" : "failed");
  } finally {
    await recordUsage(charge, calls);
  }
}

/**
 * Reads the intake `projectId` was just saved with and saves the record of that read (steps 6 to 9).
 * The intake is read back from the database, so the answers the model reads are the answers saved,
 * and the record names the saved intake. Never throws: a failure here is the step line, not the
 * action's answer.
 */
export async function readSavedIntake(
  headers: Headers,
  workspaceId: string,
  userId: string,
  projectId: string,
): Promise<void> {
  const started = performance.now();
  const line = (outcome: Word) =>
    logStep({
      step: "business-read",
      outcome,
      level: outcome === "read" ? "info" : "warn",
      ...(outcome === "limited" ? { limit: "ai-read" } : {}),
      durationMs: performance.now() - started,
    });
  let outcome: Word = "save-failed";
  try {
    const service = businessService(accessDeps());
    const opened = await service.open(headers, workspaceId, projectId);
    const decided = await decide(headers, workspaceId, userId, opened);
    // 9. The save is a second transaction: step 5 committed before the call began.
    await service.saveReading(headers, workspaceId, decided.record);
    outcome = decided.outcome;
  } catch {
    // Reading the intake back, or saving the record, failed: the intake stays as it was saved.
  }
  line(outcome);
}
