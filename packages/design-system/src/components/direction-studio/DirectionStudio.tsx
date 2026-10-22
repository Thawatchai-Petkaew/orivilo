"use client";

import {
  type Direction,
  type DirectionsResult,
  PERSONALITY_AXES,
  type RecommendOptions,
  recommendDirections,
} from "@orivilo/intent-engine";
import { type ReactNode, useId, useMemo, useState } from "react";
import {
  DesignProfileBoundary,
  type ProfileId,
  useDesignProfile,
} from "../../boundary/DesignProfileBoundary";
import { pick } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { type Profile, profiles } from "../../profiles/index";
import { Badge } from "../badge/Badge";
import { Button } from "../button/Button";
import { Card, CardFooter, CardTitle } from "../card/Card";
import { cx } from "../cx";
import { Field } from "../field/Field";
import { Textarea } from "../textarea/Textarea";

type Messages = ReturnType<typeof useMessages>["direction"];
type Key = keyof Messages["keys"];
type Value = keyof Messages["values"];

export interface DirectionStudioProps {
  /** The reference screen shown under the direction being viewed; the same element for every direction, so what the person typed stays. */
  preview: ReactNode;
  /** The brief the studio opens with. */
  defaultBrief?: string | undefined;
  /** Decisions the brand locked; they always hold (ADR 0007). */
  locked?: RecommendOptions["locked"];
  /** Decisions a person set by hand, each with its reason. */
  adjustments?: RecommendOptions["adjustments"];
  className?: string | undefined;
}

/** The hand-made profiles as the engine takes them; `profiles.test.ts` proves their decisions fit the vocabulary. */
const CURATED = profiles.map((p) => ({
  id: p.id,
  decisions: p.decisions as RecommendOptions["profiles"][number]["decisions"],
}));

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
  className,
}: DirectionStudioProps) {
  const all = useMessages();
  const m = all.direction;
  const locale = useLocale();
  const scope = useDesignProfile();
  const briefId = useId();
  const [brief, setBrief] = useState(defaultBrief);
  const [picked, setPicked] = useState<string | null>(null);

  const result = useMemo(
    () =>
      brief.trim() === ""
        ? null
        : recommendDirections(brief, {
            profiles: CURATED,
            ...(locked ? { locked } : {}),
            ...(adjustments ? { adjustments } : {}),
          }),
    [brief, locked, adjustments],
  );
  const directions = result?.directions ?? [];
  const viewing =
    directions.find((d) => d.profileId === picked)?.profileId ?? directions[0]?.profileId ?? null;
  const viewingProfile = profiles.find((p) => p.id === viewing);

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
          <Badge size="sm">{m.byRules}</Badge>
        </h3>
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

      <section className="ds-direction__section" aria-labelledby={`${briefId}-preview`}>
        <h3 id={`${briefId}-preview`} className="ds-direction__heading">
          {m.preview}
        </h3>
        <p className="ds-direction__muted" aria-live="polite">
          {viewingProfile
            ? fill(m.previewOf, { name: pick(viewingProfile.name, locale) })
            : m.previewNeutral}
        </p>
        <div className="ds-direction__preview">
          <DesignProfileBoundary mode={scope?.mode} profile={(viewing ?? "neutral") as ProfileId}>
            {preview}
          </DesignProfileBoundary>
        </div>
      </section>
    </section>
  );
}
