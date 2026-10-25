"use client";

import {
  type Direction,
  type DirectionsResult,
  type Interpretation,
  PERSONALITY_AXES,
  type RecommendOptions,
  recommendDirections,
} from "@orivilo/intent-engine";
import { type ReactNode, useEffect, useEffectEvent, useId, useMemo, useState } from "react";
import {
  DesignProfileBoundary,
  type ProfileId,
  useDesignProfile,
} from "../../boundary/DesignProfileBoundary";
import { pick } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import {
  componentsReading,
  CURATED_PROFILES,
  DECISIONS,
  donorFor,
  isRefinable,
  type Profile,
  profiles,
  REFINABLE,
  type RefinableKey,
  type Refinements,
  refineProfile,
} from "../../profiles/index";
import { Badge } from "../badge/Badge";
import { Button } from "../button/Button";
import { Card, CardFooter, CardTitle } from "../card/Card";
import { cx } from "../cx";
import { Field } from "../field/Field";
import { Textarea } from "../textarea/Textarea";
import { ToggleGroup, ToggleGroupItem } from "../toggle-group/ToggleGroup";

type Messages = ReturnType<typeof useMessages>["direction"];
type Key = keyof Messages["keys"];
type Value = keyof Messages["values"];
type Adjustments = NonNullable<RecommendOptions["adjustments"]>;

/**
 * What the studio shows, as the engine's inputs (ORV-35): enough to save it and to open it again
 * with the same look. `null` while no direction is offered.
 */
export interface DirectionStudioState {
  brief: string;
  /** The direction being viewed. */
  profileId: string;
  locked: NonNullable<RecommendOptions["locked"]>;
  /** The caller's adjustments and the refinements, in the order the engine takes them. */
  adjustments: Adjustments;
  /** The model's reading of this brief, when AI read it (ORV-62); otherwise the rules read it. */
  reading?: Interpretation | undefined;
}

export interface DirectionStudioProps {
  /** The reference screen shown under the direction being viewed; the same element for every direction, so what the person typed stays. */
  preview: ReactNode;
  /** The brief the studio opens with. */
  defaultBrief?: string | undefined;
  /** Decisions the brand locked; they always hold (ADR 0007). */
  locked?: RecommendOptions["locked"];
  /** Decisions a person set by hand, each with its reason. */
  adjustments?: RecommendOptions["adjustments"];
  /** The direction to view first, when the brief offers it. */
  defaultProfileId?: string | undefined;
  /** Refinements the studio opens with (a saved direction). */
  defaultRefinements?: Refinements | undefined;
  /**
   * Reads the brief with AI (ORV-62). Without it the studio offers no AI reading. It resolves to
   * the checked reading, `null` when AI could not read, or `{ notice }` when the caller says why
   * and when AI can read again (a rate limit, ORV-112), already in the person's language. In
   * the last two the rules' reading stays.
   */
  readWithAi?: ((brief: string) => Promise<Interpretation | null | { notice: string }>) | undefined;
  /** The AI reading the studio opens with (a saved direction); it holds while the brief is unchanged. */
  defaultReading?: Interpretation | undefined;
  /** Called with what the studio shows whenever it changes. */
  onChange?: ((state: DirectionStudioState | null) => void) | undefined;
  className?: string | undefined;
}

/**
 * The props that open a saved state with the same look: refinable adjustments come back as
 * refinements, the rest stay adjustments. Remount the studio (a new `key`) to open another.
 */
export function studioPropsFrom(
  state: DirectionStudioState,
): Pick<
  DirectionStudioProps,
  | "defaultBrief"
  | "defaultProfileId"
  | "defaultRefinements"
  | "locked"
  | "adjustments"
  | "defaultReading"
> {
  const defaultRefinements: Refinements = {};
  const adjustments: Adjustments = [];
  for (const a of state.adjustments) {
    if (isRefinable(a.set)) defaultRefinements[a.set] = a.to;
    else adjustments.push(a);
  }
  return {
    defaultBrief: state.brief,
    defaultProfileId: state.profileId,
    defaultRefinements,
    locked: state.locked,
    adjustments,
    defaultReading: state.reading,
  };
}

const PRESETS = [
  ["preset1", "preset1Text"],
  ["preset2", "preset2Text"],
  ["preset3", "preset3Text"],
] as const;

function level(value: number): keyof Messages["levels"] {
  if (value >= 85) return "high";
  if (value >= 60) return "want";
  if (value >= 35) return "some";
  if (value >= 20) return "low";
  return "avoid";
}

const keyWord = (m: Messages, key: string) => m.keys[key as Key];
const valueWord = (m: Messages, value: string) => m.values[value as Value];
const decisionWords = (m: Messages, key: string, value: string) =>
  `${keyWord(m, key)} ${valueWord(m, value)}`;

/** Every line that says why a resolved decision holds, in the brief's own words. */
function reasonLines(m: Messages, result: DirectionsResult, keys: readonly string[]) {
  return result.reasons
    .filter((r) => keys.includes(r.key))
    .map((r) => {
      const words = { key: keyWord(m, r.key), value: valueWord(m, r.value) };
      if (r.source === "locked") return fill(m.lockedReason, words);
      if (r.source === "adjustment") return fill(m.adjustedReason, { ...words, reason: r.reason });
      return fill(m.because, { ...words, words: r.words.join(", ") });
    });
}

/** What the resolver could not settle, said in words; a tie is never settled silently. */
function unsettled(m: Messages, result: DirectionsResult): string[] {
  const lines = result.resolution.conflicts.map((c) =>
    c.kind === "rule-tie"
      ? fill(m.tie, {
          key: keyWord(m, c.key),
          values: c.candidates.map((x) => valueWord(m, x.value)).join(` ${m.or} `),
        })
      : fill(m.lockedConflict, {
          key: keyWord(m, c.key),
          locked: valueWord(m, c.locked),
          proposed: valueWord(m, c.proposed),
        }),
  );
  const conflicted = new Set(result.resolution.conflicts.map((c) => c.key));
  const open = result.resolution.open.filter((k) => !conflicted.has(k));
  if (open.length > 0) {
    lines.push(fill(m.open, { list: open.map((k) => keyWord(m, k)).join(", ") }));
  }
  return lines;
}

/** A small, inert sample of the direction under its own profile; the live preview is below. */
function Sample({ profile, name, m }: { profile: Profile; name: string; m: Messages }) {
  const scope = useDesignProfile();
  return (
    <DesignProfileBoundary mode={scope?.mode} profile={profile.id as ProfileId}>
      <div className="ds-direction__sample" role="img" aria-label={fill(m.sample, { name })} inert>
        <span className="ds-card__title">{m.sampleTitle}</span>
        <span className="ds-control" data-size="sm">
          {m.sampleField}
        </span>
        <span className="ds-direction__sample-row">
          <span className="ds-button" data-variant="primary" data-size="sm">
            {m.sampleAction}
          </span>
          <Badge size="sm" variant="info">
            {m.sampleBadge}
          </Badge>
        </span>
      </div>
    </DesignProfileBoundary>
  );
}

function DirectionCard({
  direction,
  result,
  viewing,
  onView,
  m,
}: {
  direction: Direction;
  result: DirectionsResult;
  viewing: boolean;
  onView: () => void;
  m: Messages;
}) {
  const locale = useLocale();
  const profile = profiles.find((p) => p.id === direction.profileId);
  if (!profile) return null;
  const name = pick(profile.name, locale);
  const matches = direction.matches.map((k) => decisionWords(m, k, direction.decisions[k]));
  return (
    <Card as="li" selected={viewing}>
      <div className="ds-direction__card-body">
        <span>
          <Badge size="sm" variant={direction.role === "recommended" ? "brand" : "neutral"}>
            {direction.role === "recommended" ? m.recommended : m.contrast}
          </Badge>{" "}
          {viewing ? (
            <Badge size="sm" variant="info">
              {m.inUse}
            </Badge>
          ) : null}
        </span>
        <CardTitle as="h4">{name}</CardTitle>
        <p className="ds-direction__muted">
          {matches.length > 0 ? fill(m.matches, { list: matches.join(", ") }) : m.matchesNone}
        </p>
        {direction.differs.length > 0 ? (
          <p className="ds-direction__muted">
            {fill(m.differs, {
              list: direction.differs
                .map((d) =>
                  fill(m.differsItem, {
                    key: keyWord(m, d.key),
                    has: valueWord(m, d.has),
                    wanted: valueWord(m, d.wanted),
                  }),
                )
                .join(", "),
            })}
          </p>
        ) : null}
        {direction.matches.length > 0 ? (
          <ul className="ds-direction__list">
            {reasonLines(m, result, direction.matches).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        <Sample profile={profile} name={name} m={m} />
      </div>
      <CardFooter>
        <Button
          variant={viewing ? "primary" : "secondary"}
          size="sm"
          aria-pressed={viewing}
          aria-label={fill(m.useLabel, { name })}
          onClick={onView}
        >
          {m.use}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Progressive disclosure from the brief to the components (handoff §17.5): what the rules read,
 * each decision with where it came from, the tokens this direction changes from the base set, and
 * the component groups that read those tokens.
 */
function Trace({
  m,
  result,
  profile,
  name,
  axes,
  mode,
}: {
  m: Messages;
  result: DirectionsResult;
  profile: Profile;
  name: string;
  axes: { axis: string; line: string; words: string[] }[];
  mode: "light" | "dark";
}) {
  const decisions = Object.keys(DECISIONS).map((key) => {
    const value = profile.decisions[key] ?? "";
    const reason = result.reasons.find((r) => r.key === key);
    if (!reason)
      return fill(m.fromProfile, { key: keyWord(m, key), value: valueWord(m, value), name });
    if (reason.value !== value)
      return fill(m.wantedOther, {
        key: keyWord(m, key),
        value: valueWord(m, value),
        wanted: valueWord(m, reason.value),
      });
    return reasonLines(m, result, [key])[0] ?? "";
  });
  const tokens = profile.overrides.map((path) => {
    const d = profile.diff(path, mode);
    return fill(m.tokenLine, {
      path,
      base: String(d?.base ?? ""),
      value: String(d?.profile ?? ""),
    });
  });
  const readers = componentsReading(profile.overrides);
  return (
    <div className="ds-direction__trace">
      <details>
        <summary>{m.traceBrief}</summary>
        <ul className="ds-direction__list">
          {axes.map((a) => (
            <li key={a.axis}>
              {a.line}{" "}
              <span className="ds-direction__muted">
                {fill(m.quoted, { words: a.words.join(", ") })}
              </span>
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>{m.traceDecisions}</summary>
        <ul className="ds-direction__list">
          {decisions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>{m.traceTokens}</summary>
        <p className="ds-direction__muted">
          {fill(m.modeNote, { mode: mode === "dark" ? m.modeDark : m.modeLight })}
        </p>
        {tokens.length > 0 ? (
          <ul className="ds-direction__list ds-direction__tokens">
            {tokens.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="ds-direction__muted">{m.tokensNone}</p>
        )}
      </details>
      <details>
        <summary>{m.traceComponents}</summary>
        <p>{readers.join(", ")}</p>
      </details>
    </div>
  );
}

/**
 * Two directions on the same task (spec ORV-34 part 2, handoff §17.3). The person writes a brief or
 * picks a sample; the rules read it (labelled as rules, not AI); the engine offers the profile it
 * chose and the one that differs most, each with the brief's words behind it. One live preview
 * shows the same screen under the direction being viewed. It stays at one place in the tree, so
 * switching changes the profile only and keeps whatever the person typed or selected in it.
 */
export function DirectionStudio({
  preview,
  defaultBrief = "",
  locked,
  adjustments,
  defaultProfileId,
  defaultRefinements,
  readWithAi,
  defaultReading,
  onChange,
  className,
}: DirectionStudioProps) {
  const all = useMessages();
  const m = all.direction;
  const locale = useLocale();
  const scope = useDesignProfile();
  const briefId = useId();
  const [brief, setBrief] = useState(defaultBrief);
  const [picked, setPicked] = useState<string | null>(defaultProfileId ?? null);
  const [refinements, setRefinements] = useState<Refinements>(defaultRefinements ?? {});
  // An AI reading belongs to the brief it read; once the brief changes, the rules read it again.
  const [ai, setAi] = useState<{ brief: string; reading: Interpretation } | null>(
    defaultReading ? { brief: defaultBrief.trim(), reading: defaultReading } : null,
  );
  const [aiStatus, setAiStatus] = useState<
    | { brief: string; kind: "reading" | "failed" }
    | { brief: string; kind: "notice"; notice: string }
    | null
  >(null);
  const reading = ai && ai.brief === brief.trim() ? ai.reading : undefined;
  const current = aiStatus?.brief === brief.trim() ? aiStatus : null;
  const status = current?.kind ?? null;
  const askAi = () => {
    const text = brief.trim();
    if (!readWithAi || text === "") return;
    setAiStatus({ brief: text, kind: "reading" });
    readWithAi(text)
      .then((r) => {
        if (r && "notice" in r) {
          setAiStatus({ brief: text, kind: "notice", notice: r.notice });
          return;
        }
        if (r) setAi({ brief: text, reading: r });
        setAiStatus(r ? null : { brief: text, kind: "failed" });
      })
      .catch(() => setAiStatus({ brief: text, kind: "failed" }));
  };

  // A refinement is the expert layer (ADR 0007): an adjustment with its reason, after the caller's.
  const allAdjustments = useMemo(() => {
    const refined = Object.keys(refinements);
    return [
      ...(adjustments ?? []).filter((a) => !refined.includes(a.set)),
      ...Object.entries(refinements).map(([set, to]) => ({ set, to, reason: m.refineReason })),
    ] as Adjustments;
  }, [adjustments, refinements, m.refineReason]);

  const result = useMemo(
    () =>
      brief.trim() === ""
        ? null
        : recommendDirections(brief, {
            profiles: CURATED_PROFILES,
            ...(locked ? { locked } : {}),
            ...(allAdjustments.length > 0 ? { adjustments: allAdjustments } : {}),
            ...(reading ? { interpretation: reading } : {}),
          }),
    [brief, locked, allAdjustments, reading],
  );
  const directions = result?.directions ?? [];
  const viewing =
    directions.find((d) => d.profileId === picked)?.profileId ?? directions[0]?.profileId ?? null;
  const viewingProfile = profiles.find((p) => p.id === viewing);
  // A brand lock wins over a refinement: a locked key is never applied to the preview.
  const refined = useMemo(() => {
    if (!viewing) return undefined;
    const applicable: Refinements = {};
    for (const [key, value] of Object.entries(refinements) as [RefinableKey, string][]) {
      if (locked?.[key] === undefined) applicable[key] = value;
    }
    return refineProfile(viewing, applicable)?.profile;
  }, [viewing, refinements, locked]);
  const shown: Profile | undefined = refined ?? viewingProfile;
  const mode = scope?.mode === "dark" ? "dark" : "light";

  // Reports the engine's inputs, not the output, so the caller can save and replay them.
  // Compared by value, so a caller passing new but equal locks or adjustments does not report again.
  const state: DirectionStudioState | null =
    result && viewing
      ? {
          brief: brief.trim(),
          profileId: viewing,
          locked: locked ?? {},
          adjustments: allAdjustments,
          ...(reading ? { reading } : {}),
        }
      : null;
  const stateKey = JSON.stringify(state);
  const report = useEffectEvent(() => onChange?.(state));
  useEffect(() => report(), [stateKey]);

  const personality = result?.interpretation.facts.personality ?? {};
  const axes = PERSONALITY_AXES.filter((a) => personality[a] !== undefined);
  const wordsOf = (axis: string) => [
    ...new Set(
      (result?.interpretation.findings ?? [])
        .filter((f) => f.field === "personality" && f.axis === axis)
        .map((f) => f.evidence.text),
    ),
  ];
  const notUnderstood = (result?.interpretation.uncertain ?? [])
    .filter((u) => u.reason === "not-understood")
    .flatMap((u) => u.evidence.map((e) => e.text));
  const issues = result && directions.length > 0 ? unsettled(m, result) : [];

  return (
    <section className={cx("ds-direction", className)} aria-labelledby={`${briefId}-title`}>
      <h2 id={`${briefId}-title`} className="sr-only">
        {m.label}
      </h2>

      <div className="ds-direction__section">
        <Field label={m.brief} description={m.briefHint}>
          <Textarea value={brief} rows={3} onChange={(e) => setBrief(e.target.value)} />
        </Field>
        <div className="ds-direction__presets" role="group" aria-label={m.presets}>
          <span className="ds-direction__muted">{m.presets}</span>
          {PRESETS.map(([label, text]) => (
            <Button
              key={label}
              variant="ghost"
              size="sm"
              aria-pressed={brief === m[text]}
              onClick={() => {
                setBrief(m[text]);
                setPicked(null);
              }}
            >
              {m[label]}
            </Button>
          ))}
        </div>
      </div>

      <section className="ds-direction__section" aria-labelledby={`${briefId}-reading`}>
        <h3 id={`${briefId}-reading`} className="ds-direction__heading">
          {m.reading}
          <Badge size="sm">
            {reading
              ? fill(m.byAi, { model: reading.adapter.version.split("+").at(-1) ?? "" })
              : readWithAi
                ? m.byRulesOnly
                : m.byRules}
          </Badge>
        </h3>
        {readWithAi && result && !reading ? (
          <>
            <div className="ds-direction__presets">
              <Button
                variant="secondary"
                size="sm"
                // Inert but focusable while reading, so focus stays on the button it was pressed on.
                aria-disabled={status === "reading"}
                aria-busy={status === "reading"}
                onClick={askAi}
              >
                {status === "reading" ? m.aiReading : m.readWithAi}
              </Button>
            </div>
            {/* One polite live region stays mounted while the button is offered, so the text
                that arrives in it is announced. Empty, it leaves the flow so it adds no gap. */}
            <div
              className="ds-direction__note"
              role="status"
            >
              {current?.kind === "failed" ? (
                <p className="ds-direction__muted">{m.aiFailed}</p>
              ) : null}
              {current?.kind === "notice" ? (
                <>
                  <Badge variant="warning" size="sm">
                    {m.aiNotice}
                  </Badge>
                  <p>{current.notice}</p>
                </>
              ) : null}
            </div>
          </>
        ) : null}
        {axes.length > 0 ? (
          <ul className="ds-direction__list">
            {axes.map((axis) => (
              <li key={axis}>
                {fill(m.axisLine, {
                  axis: m.axes[axis],
                  level: m.levels[level(personality[axis] ?? 0)],
                })}{" "}
                <span className="ds-direction__muted">
                  {fill(m.quoted, { words: wordsOf(axis).join(", ") })}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {notUnderstood.length > 0 ? (
          <p className="ds-direction__muted">
            {fill(m.notUnderstood, { list: notUnderstood.join(", ") })}
          </p>
        ) : null}
        {directions.length === 0 ? <p className="ds-direction__muted">{m.unread}</p> : null}
      </section>

      {directions.length > 0 && result ? (
        <section className="ds-direction__section" aria-labelledby={`${briefId}-directions`}>
          <h3 id={`${briefId}-directions`} className="ds-direction__heading">
            {m.directions}
          </h3>
          {issues.length > 0 ? (
            <ul className="ds-direction__list">
              {issues.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          <ul className="ds-direction__cards">
            {directions.map((d) => (
              <DirectionCard
                key={d.profileId}
                direction={d}
                result={result}
                viewing={d.profileId === viewing}
                onView={() => setPicked(d.profileId)}
                m={m}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {shown && result ? (
        <section className="ds-direction__section" aria-labelledby={`${briefId}-refine`}>
          <h3 id={`${briefId}-refine`} className="ds-direction__heading">
            {m.refine}
          </h3>
          <p className="ds-direction__muted">{m.refineHint}</p>
          <div className="ds-direction__refine">
            {(Object.keys(REFINABLE) as RefinableKey[]).map((key) => {
              const values = DECISIONS[key] ?? [];
              const missing = values.filter((v) => !donorFor(key, v));
              return (
                <div key={key} className="ds-direction__control">
                  <span className="ds-direction__control-label">{keyWord(m, key)}</span>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    aria-label={keyWord(m, key)}
                    disabled={locked?.[key] !== undefined}
                    value={shown.decisions[key] ?? ""}
                    onValueChange={(value) => {
                      if (!value) return;
                      // Refining is about the direction in view; keep it in view if the ranking moves.
                      setPicked(viewing);
                      setRefinements((r) => ({ ...r, [key]: value }));
                    }}
                  >
                    {values.map((value) => (
                      <ToggleGroupItem key={value} value={value} disabled={missing.includes(value)}>
                        {valueWord(m, value)}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  {locked?.[key] !== undefined ? (
                    <span className="ds-direction__muted">
                      {fill(m.lockedReason, {
                        key: keyWord(m, key),
                        value: valueWord(m, locked[key] ?? ""),
                      })}
                    </span>
                  ) : null}
                  {missing.map((value) => (
                    <span key={value} className="ds-direction__muted">
                      {fill(m.noTokens, { value: valueWord(m, value) })}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
          <ul className="ds-direction__list">
            {Object.keys(DECISIONS)
              .filter((key) => !isRefinable(key))
              .map((key) => (
                <li key={key} className="ds-direction__muted">
                  {fill(m.colourOnly, {
                    key: keyWord(m, key),
                    value: valueWord(m, shown.decisions[key] ?? ""),
                  })}
                </li>
              ))}
          </ul>
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={Object.keys(refinements).length === 0}
              onClick={() => setRefinements({})}
            >
              {m.reset}
            </Button>
          </div>
        </section>
      ) : null}

      {shown && result ? (
        <section className="ds-direction__section" aria-labelledby={`${briefId}-trace`}>
          <h3 id={`${briefId}-trace`} className="ds-direction__heading">
            {m.trace}
          </h3>
          <Trace
            m={m}
            result={result}
            profile={shown}
            name={pick(shown.name, locale)}
            axes={axes.map((axis) => ({
              axis,
              line: fill(m.axisLine, {
                axis: m.axes[axis],
                level: m.levels[level(personality[axis] ?? 0)],
              }),
              words: wordsOf(axis),
            }))}
            mode={mode}
          />
        </section>
      ) : null}

      <section className="ds-direction__section" aria-labelledby={`${briefId}-preview`}>
        <h3 id={`${briefId}-preview`} className="ds-direction__heading">
          {m.preview}
        </h3>
        <p className="ds-direction__muted" aria-live="polite">
          {shown ? fill(m.previewOf, { name: pick(shown.name, locale) }) : m.previewNeutral}
        </p>
        <div className="ds-direction__preview">
          <DesignProfileBoundary
            mode={scope?.mode}
            profile={refined ?? ((viewing ?? "neutral") as ProfileId)}
          >
            {preview}
          </DesignProfileBoundary>
        </div>
      </section>
    </section>
  );
}
