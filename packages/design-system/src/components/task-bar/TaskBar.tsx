"use client";

import { useEffect, useId, useRef, useState, type FocusEvent, type ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import type { Messages } from "../../i18n/messages/index";
import { Button } from "../button/Button";
import { useBoard } from "../canvas-board/context";
import { cx } from "../cx";
import {
  CheckIcon,
  CollapseIcon,
  ExpandIcon,
  JumpIcon,
  QueuedIcon,
  RetryIcon,
  RunningIcon,
  WarningIcon,
} from "../icons";
import { Progress } from "../progress/Progress";
import { ScrollArea } from "../scroll-area/ScrollArea";

export type TaskJobState = "queued" | "running" | "done" | "failed";
/** Where the job's outcome comes from today. A later story adds a real source with its adapter. */
export type TaskJobBasis = "rules" | "mock";

interface TaskJobBase {
  id: string;
  /** Visible job name, from the host's locale catalog. */
  name: string;
  basis: TaskJobBasis;
  /** The node the job made or works on; the jump appears only when it is on the board. */
  nodeId?: string | undefined;
}

export type TaskJob =
  | (TaskJobBase & { state: "queued" })
  | (TaskJobBase & { state: "running"; value?: number | undefined; max?: number | undefined })
  | (TaskJobBase & { state: "done" })
  | (TaskJobBase & { state: "failed"; reason: string });

export interface TaskBarProps {
  /** Jobs in the order to show them; the host owns order (newest first by convention). */
  jobs: readonly TaskJob[];
  /** Shown on failed jobs when given. The host moves the job back to queued. */
  onRetry?: ((jobId: string) => void) | undefined;
  expanded?: boolean | undefined;
  defaultExpanded?: boolean | undefined;
  onExpandedChange?: ((expanded: boolean) => void) | undefined;
  className?: string | undefined;
}

const COUNT_ORDER = ["queued", "running", "failed", "done"] as const;
const COUNT_KEY = {
  queued: "countQueued",
  running: "countRunning",
  failed: "countFailed",
  done: "countDone",
} as const satisfies Record<TaskJobState, keyof Messages["taskBar"]>;

function stateWord(m: Messages, state: TaskJobState): string {
  return state === "queued"
    ? m.taskBar.queued
    : state === "running"
      ? m.progress.working
      : state === "done"
        ? m.progress.done
        : m.progress.failed;
}

/** What the retry press waited for: the job stays pending until its state or reason changes. */
function signature(job: TaskJob): string {
  return job.state === "failed" ? `${job.state}|${job.reason}` : job.state;
}

const MARK: Record<TaskJobState, ReactNode> = {
  queued: <QueuedIcon />,
  running: <RunningIcon />,
  done: <CheckIcon />,
  failed: <WarningIcon />,
};

/**
 * The jobs strip at the foot of the board (catalog `application/task-bar`): a header with the count
 * summary and a toggle, and an upward list of job rows. It stores no job data, only the expanded
 * flag and which retries are pending. Every job says where its result comes from (rules or mock);
 * nothing here claims AI. One polite live region announces state changes; a running job's percent
 * is silent. Inside a `CanvasBoard` a job whose node is on the board gets a Go to node button that
 * selects, shows and focuses the node; elsewhere the board context is empty and the button never
 * shows.
 */
export function TaskBar({
  jobs,
  onRetry,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  className,
}: TaskBarProps) {
  const m = useMessages();
  const board = useBoard();
  /** The job's node when the board has it; the context default has no nodes, so off a board never. */
  const jumpTarget = (job: TaskJob): string | undefined =>
    board.graph.nodes.find((n) => n.id === job.nodeId)?.id;
  const labelId = useId();
  const panelId = useId();
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const open = expandedProp ?? expandedState;
  // The list fades in only when a person opens it, never on first render.
  const [animate, setAnimate] = useState(false);
  const toggle = () => {
    const next = !open;
    setAnimate(true);
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };

  // Retry pending: id -> what the job looked like when retry was pressed.
  const [pending, setPending] = useState<ReadonlyMap<string, string>>(new Map());
  const retry = (job: TaskJob) => {
    if (pending.get(job.id) === signature(job)) return;
    setPending((p) => new Map(p).set(job.id, signature(job)));
    onRetry?.(job.id);
  };

  // The one announcer: compare each job's state with the last jobs prop, by id.
  const [seen, setSeen] = useState<{
    jobs: readonly TaskJob[];
    states: ReadonlyMap<string, TaskJobState>;
  }>(() => ({ jobs, states: new Map(jobs.map((j) => [j.id, j.state])) }));
  const [message, setMessage] = useState("");
  if (seen.jobs !== jobs) {
    const changed = jobs.filter((j) => {
      const before = seen.states.get(j.id);
      return before !== undefined && before !== j.state;
    });
    setSeen({ jobs, states: new Map(jobs.map((j) => [j.id, j.state])) });
    // A pending retry ends when the job moved on (another signature) or left the list.
    const stale = [...pending].filter(([id, sig]) => {
      const job = jobs.find((j) => j.id === id);
      return job === undefined || signature(job) !== sig;
    });
    if (stale.length > 0) {
      setPending((p) => {
        const next = new Map(p);
        for (const [id] of stale) next.delete(id);
        return next;
      });
    }
    setMessage(
      changed
        .map((j) => fill(m.taskBar.announce, { name: j.name, state: stateWord(m, j.state) }))
        .join(", "),
    );
  }

  // Focus: when the focused row button unmounts (retry moved the job on), focus the row; if the
  // row is gone, the toggle. Never drop it to the body.
  const headerRef = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const focusedRow = useRef<string | null>(null);
  const trackFocus = (event: FocusEvent<HTMLElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-job-id]");
    focusedRow.current = row?.dataset["jobId"] ?? null;
  };
  const trackBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.relatedTarget !== null) return;
    const target = event.target;
    // A removed element is disconnected by now; a user who clicked away is not.
    setTimeout(() => {
      if (target.isConnected) focusedRow.current = null;
    }, 0);
  };
  useEffect(() => {
    const id = focusedRow.current;
    if (id === null) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    focusedRow.current = null;
    (rows.current.get(id) ?? headerRef.current?.querySelector("button"))?.focus();
  });

  const counts = COUNT_ORDER.map((state) => ({
    state,
    count: jobs.filter((j) => j.state === state).length,
  })).filter((c) => c.count > 0);
  const summary =
    counts.length === 0
      ? m.taskBar.none
      : counts.map((c) => fill(m.taskBar[COUNT_KEY[c.state]], { count: c.count })).join(", ");

  return (
    <section
      className={cx("ds-taskbar nowheel nopan nodrag", className)}
      aria-labelledby={labelId}
      onFocus={trackFocus}
      onBlur={trackBlur}
    >
      <div ref={headerRef} className="ds-taskbar__header">
        <span id={labelId} className="ds-taskbar__label">
          {m.taskBar.label}
        </span>
        <span className="ds-taskbar__summary" title={summary}>
          {summary}
        </span>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls={panelId}
          iconTrailing={open ? <ExpandIcon /> : <CollapseIcon />}
          onClick={toggle}
        >
          {open ? m.taskBar.hide : m.taskBar.show}
        </Button>
      </div>
      <div
        id={panelId}
        className="ds-taskbar__panel"
        data-animate={animate ? "" : undefined}
        hidden={!open}
      >
        {jobs.length === 0 ? (
          <p className="ds-taskbar__empty">{m.taskBar.empty}</p>
        ) : (
          <ScrollArea label={m.taskBar.list} className="ds-taskbar__scroll">
            <ul className="ds-taskbar__list" role="list">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  ref={(el) => {
                    if (el) rows.current.set(job.id, el);
                    else rows.current.delete(job.id);
                  }}
                  className="ds-taskbar__row"
                  data-state={job.state}
                  data-job-id={job.id}
                  tabIndex={-1}
                >
                  <span className="ds-taskbar__mark" aria-hidden="true">
                    {MARK[job.state]}
                  </span>
                  {job.state === "running" ? (
                    <div className="ds-taskbar__progress">
                      <Progress
                        size="sm"
                        label={
                          <span className="ds-taskbar__name" title={job.name}>
                            {job.name}
                          </span>
                        }
                        value={job.value}
                        max={job.max}
                      />
                    </div>
                  ) : (
                    <span className="ds-taskbar__name" title={job.name}>
                      {job.name}
                    </span>
                  )}
                  <div className="ds-taskbar__status">
                    {job.state === "running" ? null : (
                      <span className="ds-taskbar__word">{stateWord(m, job.state)}</span>
                    )}
                    <span className="ds-taskbar__basis">
                      {job.basis === "rules" ? m.taskBar.basisRules : m.taskBar.basisMock}
                    </span>
                  </div>
                  {job.state === "failed" ? (
                    <p className="ds-taskbar__reason">{job.reason}</p>
                  ) : null}
                  {jumpTarget(job) !== undefined || (job.state === "failed" && onRetry) ? (
                    <div className="ds-taskbar__actions">
                      {jumpTarget(job) !== undefined ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconLeading={<JumpIcon />}
                          aria-label={fill(m.taskBar.jumpLabel, { name: job.name })}
                          onClick={() =>
                            board.jumpToNode(jumpTarget(job) as string, { select: true })
                          }
                        >
                          {m.taskBar.jump}
                        </Button>
                      ) : null}
                      {job.state === "failed" && onRetry ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          iconLeading={<RetryIcon />}
                          loading={pending.get(job.id) === signature(job)}
                          aria-label={fill(m.taskBar.retryLabel, { name: job.name })}
                          onClick={() => retry(job)}
                        >
                          {m.taskBar.retry}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
      <span role="status" className="sr-only">
        {message}
      </span>
    </section>
  );
}
