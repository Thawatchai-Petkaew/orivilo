"use client";

import {
  Badge,
  Button,
  Card,
  CardTitle,
  DirectionStudio,
  type DirectionStudioState,
  Field,
  fill,
  Input,
  studioPropsFrom,
} from "@orivilo/design-system";
import type { Interpretation } from "@orivilo/intent-engine";
import { type ReactNode, useId, useMemo, useRef, useState, useTransition } from "react";
import type { WebMessages } from "../../i18n/messages";
import { errorLine as errorLineOf } from "../../i18n/wait";
import { readingResult } from "./read-outcome";
import {
  type ActionError,
  approveDirection,
  exportVersion,
  importDirection,
  type Listing,
  listDirections,
  openVersion,
  readBriefWithAi,
  type Outcome,
  saveDirection,
} from "./actions";

type M = WebMessages["saved"];

const errorLine = (m: M, wait: WebMessages["wait"], error: ActionError, retryAfter?: number) =>
  errorLineOf(m.errors, wait, error, retryAfter);

export type SavedView =
  | { kind: "signed-out" }
  | { kind: "not-configured" }
  | { kind: "error"; error: ActionError }
  | { kind: "ready"; listing: Listing };

/** The direction being edited: where it is saved, and what was last saved or opened. */
interface Current {
  key: number;
  directionId: string | null;
  opened: DirectionStudioState | null;
  savedState: DirectionStudioState | null;
  savedName: string;
}

interface Notice {
  tone: "info" | "warning" | "danger";
  lines: string[];
}

const MAX_FILE_BYTES = 256_000;

/** Same inputs, whatever the key order the state was built with. */
function sameState(a: DirectionStudioState | null, b: DirectionStudioState | null) {
  if (!a || !b) return a === b;
  const norm = (s: DirectionStudioState) =>
    JSON.stringify([
      s.brief,
      s.profileId,
      Object.entries(s.locked).sort(([x], [y]) => x.localeCompare(y)),
      s.adjustments.map((x) => [x.set, x.to, x.reason]),
      s.reading ? JSON.stringify(s.reading) : null,
    ]);
  return norm(a) === norm(b);
}

const versionWord = (m: M, number: number | null) =>
  number === null ? m.draft : fill(m.version, { number: String(number) });

function fileName(name: string, number: number | null) {
  // Browsers drop a download name with non-Latin letters, so the file name keeps Latin letters
  // and digits only; the direction's own name is inside the file.
  const safe = name.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "direction";
  return `${safe}-${number === null ? "draft" : `v${number}`}.orivilo.json`;
}

function download(name: string, content: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(content, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * The Studio with saving (ORV-35 part 2): save the studio's inputs as the direction's draft,
 * approve it into a numbered version (admins), open any version again with the same look, and
 * move a version out and in as a file. Every message here reports what the server returned.
 */
export function SavedStudio({
  view,
  m,
  wait,
  defaultBrief,
  preview,
}: {
  view: SavedView;
  m: M;
  wait: WebMessages["wait"];
  defaultBrief: string;
  preview: ReactNode;
}) {
  const nameId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [listing, setListing] = useState(view.kind === "ready" ? view.listing : null);
  const [name, setName] = useState(m.defaultName);
  const [state, setState] = useState<DirectionStudioState | null>(null);
  const [current, setCurrent] = useState<Current>({
    key: 0,
    directionId: null,
    opened: null,
    savedState: null,
    savedName: m.defaultName,
  });
  const [notice, setNotice] = useState<Notice | null>(
    view.kind === "error" ? { tone: "danger", lines: [errorLine(m, wait, view.error)] } : null,
  );
  const [busy, setBusy] = useState<"save" | "approve" | "import" | null>(null);
  const [, startTransition] = useTransition();
  // Seals for AI readings, by the reading object the studio reports back (ORV-62).
  const seals = useRef(new WeakMap<Interpretation, string>());

  const readWithAi = async (brief: string) => {
    const result = readingResult(await readBriefWithAi(brief), m.errors, wait);
    if ("notice" in result) return result;
    if (result.reading === null) {
      if (result.cardNotice) setNotice({ tone: "warning", lines: [result.cardNotice] });
      return null;
    }
    seals.current.set(result.reading, result.seal);
    return result.reading;
  };

  const openedProps = useMemo(
    () => (current.opened ? studioPropsFrom(current.opened) : {}),
    [current.opened],
  );
  const ready = view.kind === "ready" && listing !== null;
  const canApproveRole = listing?.role === "admin" || listing?.role === "owner";
  const editing = listing?.directions.find((d) => d.id === current.directionId);
  const hasDraft = editing?.versions.some((v) => v.status === "draft") ?? false;
  const dirty =
    current.directionId === null ||
    !sameState(state, current.savedState) ||
    name !== current.savedName;

  const act = <T,>(
    kind: NonNullable<typeof busy> | null,
    call: () => Promise<Outcome<T>>,
    done: (value: T) => Promise<void> | void,
  ) =>
    startTransition(async () => {
      setBusy(kind);
      const result = await call();
      if (result.ok) await done(result.value);
      else {
        const retryAfter = result.error === "rate-limited" ? result.retryAfter : undefined;
        setNotice({ tone: "danger", lines: [errorLine(m, wait, result.error, retryAfter)] });
      }
      setBusy(null);
    });

  const refresh = async () => {
    const next = await listDirections();
    if (next.ok) setListing(next.value);
  };

  const open = (versionId: string) =>
    act(
      null,
      () => openVersion(versionId),
      (v) => {
        if (v.state.reading && v.seal) seals.current.set(v.state.reading, v.seal);
        const version = versionWord(m, v.number);
        setName(v.name);
        setCurrent((c) => ({
          key: c.key + 1,
          directionId: v.directionId,
          opened: v.state,
          savedState: v.state,
          savedName: v.name,
        }));
        const words = { name: v.name, version };
        const line = fill(v.status === "approved" ? m.openedApproved : m.opened, words);
        setNotice(
          v.replay
            ? {
                tone: "warning",
                lines: [line, fill(m.replayWarning, { reason: m.replayReasons[v.replay] })],
              }
            : { tone: "info", lines: [line] },
        );
      },
    );

  const save = () => {
    if (!state) return;
    const savedState = state;
    const savedName = name.trim();
    const seal = state.reading ? seals.current.get(state.reading) : undefined;
    act(
      "save",
      () =>
        saveDirection({
          ...(current.directionId ? { directionId: current.directionId } : {}),
          name: savedName,
          ...savedState,
          ...(seal ? { seal } : {}),
        }),
      async (r) => {
        setCurrent((c) => ({ ...c, directionId: r.directionId, savedState, savedName }));
        setName(savedName);
        setNotice({ tone: "info", lines: [fill(m.savedDraft, { name: savedName })] });
        await refresh();
      },
    );
  };

  const approve = () => {
    if (!current.directionId) return;
    const directionId = current.directionId;
    act(
      "approve",
      () => approveDirection(directionId),
      async (r) => {
        setNotice({
          tone: "info",
          lines: [fill(m.approved, { name: current.savedName, number: String(r.number) })],
        });
        await refresh();
      },
    );
  };

  const exportOne = (versionId: string, label: string, number: number | null) =>
    act(
      null,
      () => exportVersion(versionId),
      (file) => {
        const target = fileName(file.name, number);
        download(target, file);
        setNotice({
          tone: "info",
          lines: [fill(m.exported, { name: file.name, version: label, file: target })],
        });
      },
    );

  const importFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    let parsed: unknown = null;
    try {
      parsed = file.size <= MAX_FILE_BYTES ? JSON.parse(await file.text()) : null;
    } catch {
      parsed = null;
    }
    if (parsed === null) {
      setNotice({ tone: "danger", lines: [m.errors["invalid-file"]] });
      return;
    }
    act(
      "import",
      () => importDirection(parsed),
      async (r) => {
        await refresh();
        open(r.versionId);
      },
    );
  };

  const startNew = () => {
    setName(m.defaultName);
    setCurrent((c) => ({
      key: c.key + 1,
      directionId: null,
      opened: null,
      savedState: null,
      savedName: m.defaultName,
    }));
    setNotice(null);
  };

  const approveNote = !canApproveRole
    ? m.approveAdminOnly
    : dirty || !hasDraft
      ? m.approveSaveFirst
      : null;

  return (
    <div className="flex flex-col gap-6">
      <Card as="section" aria-labelledby={`${nameId}-heading`}>
        <div className="flex flex-col gap-4">
          <CardTitle as="h2" id={`${nameId}-heading`}>
            {m.heading}
          </CardTitle>

          {view.kind === "signed-out" ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-body-md text-text-secondary">{m.signedOut}</p>
              <Button asChild variant="primary">
                <a href="/account">{m.signIn}</a>
              </Button>
            </div>
          ) : null}
          {view.kind === "not-configured" ? (
            <p className="text-body-md text-text-secondary">{m.notConfigured}</p>
          ) : null}

          {ready ? (
            <>
              <Field label={m.name} description={m.nameHint}>
                <Input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
              </Field>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  disabled={!state || name.trim() === "" || !dirty}
                  loading={busy === "save"}
                  loadingLabel={m.saving}
                  onClick={save}
                >
                  {m.saveDraft}
                </Button>
                <Button
                  variant="secondary"
                  disabled={approveNote !== null}
                  loading={busy === "approve"}
                  loadingLabel={m.approving}
                  onClick={approve}
                >
                  {m.approve}
                </Button>
                <Button variant="ghost" onClick={startNew}>
                  {m.newDirection}
                </Button>
              </div>
              <ul className="flex flex-col gap-1 text-body-sm text-text-secondary">
                <li>{!state ? m.nothingToSave : dirty ? m.unsaved : m.upToDate}</li>
                {approveNote ? <li>{approveNote}</li> : null}
              </ul>
            </>
          ) : null}

          <div role="status" aria-live="polite" className="flex flex-col gap-2">
            {notice ? (
              <>
                {notice.tone !== "info" ? (
                  <span>
                    <Badge variant={notice.tone} size="sm">
                      {notice.tone === "danger" ? m.problem : m.attention}
                    </Badge>
                  </span>
                ) : null}
                {notice.lines.map((line) => (
                  <p key={line} className="text-body-md">
                    {line}
                  </p>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </Card>

      {ready ? (
        <section aria-labelledby={`${nameId}-list`} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id={`${nameId}-list`} className="text-heading-md">
              {m.listHeading}
            </h2>
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="secondary"
                size="sm"
                loading={busy === "import"}
                loadingLabel={m.importing}
                onClick={() => fileRef.current?.click()}
                aria-describedby={`${nameId}-import-hint`}
              >
                {m.import}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => void importFile(e.target.files?.[0])}
              />
            </div>
          </div>
          <p id={`${nameId}-import-hint`} className="text-body-sm text-text-secondary">
            {m.importHint}
          </p>
          {listing.directions.length === 0 ? (
            <p className="text-body-md text-text-secondary">{m.listEmpty}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {listing.directions.map((d) => (
                <Card as="li" key={d.id} selected={d.id === current.directionId}>
                  <div className="flex flex-col gap-2">
                    <CardTitle as="h3" className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words">{d.name}</span>
                      {d.id === current.directionId ? (
                        <Badge size="sm" variant="info">
                          {m.editing}
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <ul className="flex flex-col gap-2">
                      {d.versions.map((v) => {
                        const label = versionWord(m, v.number);
                        const words = { name: d.name, version: label };
                        return (
                          <li key={v.id} className="flex flex-wrap items-center gap-2">
                            <span className="text-body-md">{label}</span>
                            {v.status === "approved" ? (
                              <Badge size="sm" variant="success">
                                {m.approvedBadge}
                              </Badge>
                            ) : null}
                            <span className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={fill(m.openLabel, words)}
                                onClick={() => open(v.id)}
                              >
                                {m.open}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={fill(m.exportLabel, words)}
                                onClick={() => exportOne(v.id, label, v.number)}
                              >
                                {m.export}
                              </Button>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <DirectionStudio
        key={current.key}
        defaultBrief={defaultBrief}
        preview={preview}
        onChange={setState}
        readWithAi={ready ? readWithAi : undefined}
        {...openedProps}
      />
    </div>
  );
}
