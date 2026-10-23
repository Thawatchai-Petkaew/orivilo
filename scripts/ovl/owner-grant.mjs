// The owner-grant check (ORV-81 spec, Hooks; ADR 0014). Only an option the owner clicks in a question
// form grants a rework round. Reads PostToolUse(AskUserQuestion) input; nothing typed in chat reaches it.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { escalatedIssues, runsDir } from "./records.mjs";

// The whole trimmed label must be the grant form. A decline that merely contains the phrase is not one.
const GRANT_LABEL = /^(?:อนุญาตรอบ|grant round) (ORV-\d+)$/i;
// Looks like an attempt to grant, so a refusal is reported. A plain decline ("Decline", "ไม่อนุญาต") stays silent.
const grantLike = (answer) => /อนุญาต|grant/i.test(answer.replaceAll("ไม่อนุญาต", ""));

const need = (value, what) => {
  if (typeof value !== "string" || value === "") throw new Error(`hook input has no ${what}`);
  return value;
};

/** Writes owner-grant-<n>.json with an exclusive create, taking the next free n. */
function writeGrant(root, issue, record) {
  const dir = join(runsDir(root), issue);
  mkdirSync(dir, { recursive: true });
  const used = readdirSync(dir)
    .map((n) => /^owner-grant-(\d+)\.json$/.exec(n)?.[1])
    .filter(Boolean)
    .map(Number);
  for (let n = Math.max(0, ...used) + 1; ; n += 1) {
    const file = join(dir, `owner-grant-${n}.json`);
    if (existsSync(file)) continue;
    writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, { flag: "wx" });
    return;
  }
}

/** The reasons no grant was written ([] when nothing needed one). Throws when a field it reads is missing. */
export function checkOwnerGrant(input, { store }) {
  if (input.hook_event_name !== "PostToolUse" || input.tool_name !== "AskUserQuestion") {
    throw new Error("owner-grant reads only PostToolUse AskUserQuestion input");
  }
  const toolUseId = need(input.tool_use_id, "tool_use_id");
  const sessionId = need(input.session_id, "session_id");
  const transcript = need(input.transcript_path, "transcript_path");
  const questions = input.tool_input?.questions;
  const answers = input.tool_response?.answers;
  if (!Array.isArray(questions)) throw new Error("hook input has no tool_input.questions");
  if (answers === null || typeof answers !== "object" || Array.isArray(answers)) {
    throw new Error("hook input has no tool_response.answers");
  }
  const parsed = questions.map((q) => {
    const question = need(q?.question, "question text");
    if (!Array.isArray(q.options)) throw new Error("hook input has no option list");
    const labels = q.options.map((o) => need(o?.label, "option label"));
    return { question, labels, answer: need(answers[question], `answer for "${question}"`) };
  });

  const reasons = [];
  const granted = new Set();
  let escalated;
  for (const { question, labels, answer } of parsed) {
    if (!grantLike(answer)) continue;
    const key = GRANT_LABEL.exec(answer.trim())?.[1].toUpperCase();
    if (input.agent_id !== undefined) {
      reasons.push("a subagent asked this form; only the main session's form can grant a round");
    } else if (!labels.includes(answer)) {
      reasons.push(
        `the answer is not an option label the form offered (text typed under Other grants nothing)`,
      );
    } else if (key === undefined) {
      reasons.push(
        `"${answer}" is not a grant option: its whole label must be "อนุญาตรอบ ORV-<n>" or "Grant round ORV-<n>"`,
      );
    } else if (!(escalated ??= escalatedIssues(store)).includes(key)) {
      reasons.push(`${key} is not escalated, so there is nothing to grant`);
    } else if (granted.has(key)) {
      reasons.push(`${key} already has a grant from this form; one form grants one round`);
    } else {
      granted.add(key);
      writeGrant(store, key, {
        by: "owner",
        source: "question_form",
        question,
        options: labels,
        answer,
        answered_at: new Date().toISOString(),
        tool_use_id: toolUseId,
        session_id: sessionId,
        transcript_path: transcript,
      });
    }
  }
  return reasons;
}
