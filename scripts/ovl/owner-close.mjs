// The owner-close check (ORV-108 spec, Stuck envelope: the close form; ADR 0014 applied to closing).
// Only an option the owner clicks in a question form closes a stuck envelope. Reads
// PostToolUse(AskUserQuestion) input; nothing typed in chat reaches it.
import { allTasks, isOpen, writeClosed } from "./records.mjs";
import { hasFinalStop } from "./close-envelope.mjs";

// The whole trimmed label must be the close form. A decline that merely contains the phrase is not one.
const CLOSE_LABEL = /^(?:ปิดงาน|close envelope) (ORV-\d+-[a-z0-9-]+)$/i;
// Looks like an attempt to close, so a refusal is reported. A plain decline ("Keep open", "ยังไม่ปิด") stays silent.
const closeLike = (answer) => /ปิดงาน|close envelope/i.test(answer);

const AFK_REASON =
  "the form closed by itself while the owner was idle (tool_response.afkTimeoutMs is set), so its answer is not a click";

const need = (value, what) => {
  if (typeof value !== "string" || value === "") throw new Error(`hook input has no ${what}`);
  return value;
};

/** True when the input's `background_tasks` lists the agent as running (an absent field says nothing). */
const listedRunning = (input, agentId) =>
  Array.isArray(input.background_tasks) &&
  input.background_tasks.some(
    (t) => (t?.id === agentId || t?.agent_id === agentId) && t?.status === "running",
  );

/** The reasons no envelope was closed ([] when nothing needed one). Throws when a field it reads is missing. */
export function checkOwnerClose(input, { store }) {
  if (input.hook_event_name !== "PostToolUse" || input.tool_name !== "AskUserQuestion") {
    throw new Error("owner-close reads only PostToolUse AskUserQuestion input");
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

  // An idle dialog resolves by itself and picks the highlighted option; that is not the owner's click.
  const afk = input.tool_response?.afkTimeoutMs !== undefined;
  const reasons = [];
  for (const { question, labels, answer } of parsed) {
    if (!closeLike(answer)) continue;
    const id = CLOSE_LABEL.exec(answer.trim())?.[1];
    if (input.agent_id !== undefined) {
      reasons.push(
        "a subagent asked this form; only the main session's form can close an envelope",
      );
      continue;
    }
    if (afk) {
      reasons.push(AFK_REASON);
      continue;
    }
    if (!labels.includes(answer)) {
      reasons.push(
        "the answer is not an option label the form offered (text typed under Other closes nothing)",
      );
      continue;
    }
    if (id === undefined) {
      reasons.push(
        `"${answer}" is not a close option: its whole label must be "ปิดงาน <task_id>" or "Close envelope <task_id>"`,
      );
      continue;
    }
    const task = allTasks(store).find((t) => t.id === id);
    if (!task) {
      reasons.push(`${id}: no such envelope`);
    } else if (!isOpen(task)) {
      reasons.push(`${id} is already closed`);
    } else if (task.agent === undefined) {
      reasons.push(
        `${id} was never bound; close it with: node scripts/ovl/close-envelope.mjs ${id}`,
      );
    } else if (hasFinalStop(store, task.agent.agent_id)) {
      reasons.push(`${id} has stopped; close it with: node scripts/ovl/close-envelope.mjs ${id}`);
    } else if (listedRunning(input, task.agent.agent_id)) {
      reasons.push(`${id} is still running in this session`);
    } else {
      writeClosed(store, task, "abandoned", {
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
