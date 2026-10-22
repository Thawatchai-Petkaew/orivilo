"use client";

import type { NodeProps } from "@xyflow/react";
import { type ComponentType, type SVGProps, useEffect, useState } from "react";
import { useBoard } from "../canvas-board/context";
import { type BoardNode, elapsedSince, type NodeStep, type StepTask } from "../canvas-board/graph";
import {
  ArtifactIcon,
  CompareStepIcon,
  DirectionIcon,
  DraftStepIcon,
  GenerateStepIcon,
  GroupIcon,
  InputBlockIcon,
  KnowledgeIcon,
  LockIcon,
  NoteIcon,
  ReadStepIcon,
  ReferenceIcon,
  ReviewStepIcon,
  SpinnerIcon,
  StaleIcon,
  WarningIcon,
} from "../icons";
import type { NodeKind } from "../../tokens/canvas";
import { NodePort } from "../node-port/NodePort";
import { useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { NodeToolbar } from "../node-toolbar/NodeToolbar";

export type CanvasNodeProps = NodeProps<BoardNode>;

type Glyph = ComponentType<Omit<SVGProps<SVGSVGElement>, "children">>;

const KIND_ICON: Record<NodeKind, Glyph> = {
  "input-block": InputBlockIcon,
  knowledge: KnowledgeIcon,
  artifact: ArtifactIcon,
  reference: ReferenceIcon,
  direction: DirectionIcon,
  note: NoteIcon,
  group: GroupIcon,
};

const STEP_ICON: Record<StepTask, Glyph> = {
  read: ReadStepIcon,
  draft: DraftStepIcon,
  compare: CompareStepIcon,
  generate: GenerateStepIcon,
  review: ReviewStepIcon,
};

/** The time since a run started, ticking once a second while the node runs. */
function useElapsed(startedAt: string | undefined, running: boolean): string | undefined {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running || !startedAt) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, startedAt]);
  return running ? elapsedSince(startedAt, now) : undefined;
}

/**
 * Anything placed on the board (ADR 0004 item 2). One surface, no header band (ORV-57): a top row
 * with the kind's icon and word, the status and the run time; the title; a body per variant; the
 * run's steps while it runs; a missing-inputs row, an error row, and the ports in the footer.
 * React Flow renders it inside the focusable node wrapper, which carries the accessible name
 * ("title, kind") and the selection; this component paints every state from the node tokens.
 * Status is a word and a glyph, never a tint (catalog rule); a running node also turns the AI
 * gradient ring. Steps and time show only when the run reports them.
 */
export function CanvasNode({ id, data, selected, dragging }: CanvasNodeProps) {
  const board = useBoard();
  const m = useMessages();
  const word = useWord();
  const kind = word(CANVAS_WORDS.node[data.kind]);
  const status = data.status ? word(CANVAS_WORDS.status[data.status]) : undefined;
  const candidate =
    board.connecting?.targets[board.connecting.index]?.nodeId === id ? "" : undefined;
  const body = board.renderBody?.({ id, type: "orivilo", position: { x: 0, y: 0 }, data });
  const locked = data.status === "locked";
  const running = data.status === "running";
  const elapsed = useElapsed(data.startedAt, running);
  const steps = running ? (data.steps ?? []) : [];
  const KindIcon = KIND_ICON[data.kind];
  const stepState: Record<NodeStep["state"], string> = {
    done: m.node.stepDone,
    current: m.node.stepCurrent,
    pending: m.node.stepPending,
  };

  return (
    <div
      className="ds-node"
      data-kind={data.kind}
      data-size={data.size ?? "md"}
      data-status={data.status}
      data-selected={selected ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
      data-collapsed={data.collapsed ? "" : undefined}
      data-readonly={board.readOnly ? "" : undefined}
      data-error={data.error ? "" : undefined}
      data-missing={data.missing && data.missing.length > 0 ? "" : undefined}
      data-connect-candidate={candidate}
      aria-busy={data.status === "running" ? true : undefined}
    >
      <NodeToolbar node={{ id, data, selected }} />
      <div className="ds-node__header">
        <div className="ds-node__meta">
          <span className="ds-node__chip">
            <KindIcon />
          </span>
          <span className="ds-node__kind">{kind}</span>
          {status ? (
            <span className="ds-node__status" data-status={data.status}>
              {running ? <SpinnerIcon className="ds-spin" /> : null}
              {data.status === "stale" ? <StaleIcon /> : null}
              {locked ? <LockIcon /> : null}
              {status}
            </span>
          ) : null}
          {elapsed ? (
            <span className="ds-node__elapsed" aria-label={fill(m.node.elapsed, { time: elapsed })}>
              {elapsed}
            </span>
          ) : null}
        </div>
        <span className="ds-node__title">{data.title}</span>
      </div>
      {data.collapsed ? null : (
        <div className="ds-node__body">
          {body ?? data.summary ?? <span className="ds-node__empty">{m.node.empty}</span>}
        </div>
      )}
      {steps.length > 0 && !data.collapsed ? (
        <ol className="ds-node__steps" aria-label={m.node.steps}>
          {steps.map((step) => {
            const StepIcon = STEP_ICON[step.task];
            return (
              <li key={step.id} className="ds-node__step" data-state={step.state}>
                <StepIcon />
                <span>{step.label}</span>
                <span className="ds-node__step-state">{stepState[step.state]}</span>
              </li>
            );
          })}
        </ol>
      ) : null}
      {data.missing && data.missing.length > 0 ? (
        <p className="ds-node__missing">
          {fill(m.node.missing, { list: data.missing.join(", ") })}
        </p>
      ) : null}
      {data.error ? (
        <p className="ds-node__error">
          <WarningIcon />
          {data.error}
        </p>
      ) : null}
      {data.inputs.length > 0 || data.outputs.length > 0 ? (
        <div className="ds-node__ports">
          <ul className="ds-node__port-list" data-direction="input" aria-label={m.node.inputs}>
            {data.inputs.map((port) => (
              <NodePort key={port.id} port={port} direction="input" disabled={locked} />
            ))}
          </ul>
          <ul className="ds-node__port-list" data-direction="output" aria-label={m.node.outputs}>
            {data.outputs.map((port) => (
              <NodePort key={port.id} port={port} direction="output" disabled={locked} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
