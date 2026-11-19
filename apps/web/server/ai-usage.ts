import "server-only";
import { type Charge, logStep, type UsageEntry } from "@orivilo/auth";
import { spendCap } from "./spend-cap";

/**
 * Writes the usage of one AI job with the charge `check` issued, for every job that reads the
 * business answers (`business-read`, `positioning-draft`). A failed record never costs the person
 * the paid result: it is one step line, with no error text, answer or amount, as `readBriefWithAi`
 * does (ORV-121 spend-cap-6). Never throws.
 */
export async function recordUsage(charge: Charge, calls: readonly UsageEntry[]): Promise<void> {
  for (const call of calls) {
    if (call.costMicroUsd === null) {
      logStep({ step: "ai-usage", outcome: "cost-not-reported", level: "warn", durationMs: 0 });
    }
  }
  const started = performance.now();
  try {
    await spendCap().record(charge, calls);
  } catch {
    logStep({
      step: "ai-usage",
      outcome: "record-failed",
      level: "warn",
      durationMs: performance.now() - started,
    });
  }
}
