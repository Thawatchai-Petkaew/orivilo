"use client";

import type { InputRole, ReportView, ViewReading } from "@orivilo/intent-engine";
import { Fragment, type FormEvent, type ReactNode, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  RadioGroup,
  RadioGroupItem,
  SectionHeader,
} from "../components/index";
import { formatNumber } from "../i18n/format";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { DATE_TAGS, type Locale } from "../i18n/locale";
import { fill } from "../i18n/messages/index";

/**
 * The brand evidence report screen (ORV-266 tech notes section 7, ORV-267): a form for one website
 * address and, below it, the report of the last read. It takes a `ReportView`, which holds line keys
 * and values and no resolved text, and looks the keys up in the person's language here, so a language
 * switch redraws the same report with no second read. It has no landmark: the page owns the one
 * `main`, as `/workspace` does. Every value that came from the page (a quote, a URL, an element path,
 * a font name) renders as a React text node inside `bdi`, never as HTML and never as a link
 * (`report-text-1`). The readings are rule-based, not AI, and the screen says so.
 */
export interface BrandReportScreenProps {
  access: "form" | "signed-out" | "not-configured" | "not-allowed";
  /** Where the sign-in link goes; `/account` when left out. */
  signInHref?: string | undefined;
  view?: ReportView | null | undefined;
  pending?: boolean | undefined;
  /** A line already resolved by the caller, for what the design-system catalog does not hold. */
  failure?: string | undefined;
  onRead?: ((input: { url: string; role: InputRole }) => void) | undefined;
}

type Analysed = Extract<ReportView, { status: "analysed" }>;

/** The page's own words, which are data: text inside `bdi`, so a Thai or Latin run never flips its neighbours. */
function Page({ children }: { children: string }) {
  return <bdi>{children}</bdi>;
}

/** A catalog template with its `{name}` slots filled by nodes, so page values can wrap themselves in `Page`. */
function Template({ text, values }: { text: string; values: Record<string, ReactNode> }) {
  return (
    <>
      {text.split(/(\{[a-zA-Z0-9_]+\})/).map((part, i) => {
        const name = /^\{([a-zA-Z0-9_]+)\}$/.exec(part)?.[1];
        if (name === undefined) return part;
        const value = values[name];
        if (value === undefined)
          throw new Error(`brand report: no value for {${name}} in "${part}"`);
        return <Fragment key={i}>{value}</Fragment>;
      })}
    </>
  );
}

/**
 * One sentence in an Alert. The catalog's Alert asks for a title and a description, and the report's
 * strings are single sentences, so the sentence is the title and the description stays empty.
 */
function Notice({
  variant,
  text,
  live,
}: {
  variant: "info" | "warning" | "danger";
  text: string;
  live?: "off" | undefined;
}) {
  switch (variant) {
    case "danger":
      return <Alert variant="danger" title={text} description="" live={live} />;
    case "warning":
      return <Alert variant="warning" title={text} description="" live={live} />;
    case "info":
      return <Alert variant="info" title={text} description="" live={live} />;
  }
}

function formatReadAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(DATE_TAGS[locale], {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

const FIELD_NOTE = "text-body-sm text-text-secondary";

function More({ total, shown }: { total: number; shown: number }) {
  const m = useMessages();
  const locale = useLocale();
  if (total <= shown) return null;
  return (
    <p className={FIELD_NOTE}>
      {fill(m.brandReport.more, { count: formatNumber(total - shown, locale) })}
    </p>
  );
}

function ReadingCard({
  reading,
  url,
  below,
}: {
  reading: ViewReading;
  url: string;
  below: boolean;
}) {
  const m = useMessages();
  const locale = useLocale();
  return (
    <li className="flex min-w-0 flex-1 basis-56 flex-col gap-2 rounded-container border border-border-card bg-surface-card p-3">
      {below ? (
        <p className="text-body-sm">
          {fill(m.brandReport.engine["evidence.belowFloor"], {
            reason: reading.reasons.map((key) => m.brandReport.engine[key]).join(", "),
          })}
        </p>
      ) : null}
      <div>
        <Badge size="sm">{m.direction.levels[reading.level]}</Badge>
      </div>
      {reading.quote === null ? null : (
        <q>
          <Page>{reading.quote}</Page>
        </q>
      )}
      <p className={FIELD_NOTE}>
        {reading.path === null ? (
          <Template text={m.brandReport.sourcePage} values={{ url: <Page>{url}</Page> }} />
        ) : (
          <Template
            text={m.brandReport.sourceBlock}
            values={{ url: <Page>{url}</Page>, path: <Page>{reading.path}</Page> }}
          />
        )}
      </p>
      <p className={FIELD_NOTE}>{fill(m.brandReport.rules, { rules: reading.rules.join(", ") })}</p>
      <p className={FIELD_NOTE}>
        {fill(m.brandReport.confidence, { value: formatNumber(reading.confidence, locale) })}
      </p>
      {reading.hypothesis ? <p className="text-body-sm">{m.brandReport.hypothesis}</p> : null}
    </li>
  );
}

/** Where each colour or font was declared: one line per stylesheet item, the stylesheet's URL read from `sheets`. */
function Sources({ view, at }: { view: Analysed; at: Analysed["colours"][number]["at"] }) {
  const m = useMessages();
  return (
    <ul className="flex flex-col gap-1">
      {at.map(({ sheet, offset }) => {
        const url = view.sheets[sheet];
        return url === undefined ? null : (
          <li key={`${sheet}:${offset}`} className={FIELD_NOTE}>
            <Template
              text={m.brandReport.sourceSheet}
              values={{ url: <Page>{url}</Page>, offset }}
            />
          </li>
        );
      })}
    </ul>
  );
}

/** One block of the report: a level 2 title under the page's level 1, its note, then the content. */
function Block({
  title,
  note,
  children,
}: {
  title: string;
  note?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <SectionHeader level={2} title={title} description={note} />
      {children}
    </div>
  );
}

function Report({ view }: { view: Analysed }) {
  const m = useMessages();
  const locale = useLocale();
  const roleLabel = {
    own: m.brandReport.roleOwn,
    reference: m.brandReport.roleReference,
    competitor: m.brandReport.roleCompetitor,
  }[view.role];
  const page = <Page>{view.url}</Page>;
  return (
    <div className="flex min-w-0 flex-col gap-6" data-report="">
      <div className="flex flex-col gap-3">
        <Notice variant="info" text={m.brandReport.ruleBased} />
        <p>{m.brandReport.notSaved}</p>
        <p>
          <Template text={m.brandReport.pageRead} values={{ url: page }} />
        </p>
        <p>{fill(m.brandReport.readAt, { time: formatReadAt(view.readAt, locale) })}</p>
        <p>{fill(m.brandReport.readAs, { role: roleLabel })}</p>
      </div>

      {view.incomplete || view.thin ? (
        <div className="flex flex-col gap-3">
          {view.incomplete ? <Notice variant="warning" text={m.brandReport.incomplete} /> : null}
          {view.thin ? <Notice variant="warning" text={m.brandReport.thin} /> : null}
        </div>
      ) : null}

      <Block title={m.brandReport.coloursHeading} note={m.brandReport.declaredNote}>
        {view.colours.length === 0 ? (
          <p>{m.brandReport.coloursEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {view.colours.map((colour) => (
              <li key={colour.hex} className="flex flex-col gap-1">
                <p>
                  <Page>{colour.hex}</Page>, {m.brandReport.hue[colour.band]}
                </p>
                <Sources view={view} at={colour.at} />
              </li>
            ))}
          </ul>
        )}
        <More total={view.coloursTotal} shown={view.colours.length} />
      </Block>

      <Block title={m.brandReport.fontsHeading} note={m.brandReport.declaredNote}>
        {view.fonts.length === 0 ? (
          <p>{m.brandReport.fontsEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {view.fonts.map((font) => (
              <li key={font.name} className="flex flex-col gap-1">
                <p>
                  <Page>{font.name}</Page>
                </p>
                <Sources view={view} at={font.at} />
              </li>
            ))}
          </ul>
        )}
        <More total={view.fontsTotal} shown={view.fonts.length} />
      </Block>

      <Block title={m.brandReport.textHeading} note={m.brandReport.textNote}>
        {view.text.length === 0 ? (
          <p>{m.brandReport.textEmpty}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {view.text.map((entry) => (
                <li key={entry.kind}>
                  {fill(m.brandReport.textLine, {
                    kind: m.brandReport.kind[entry.kind],
                    blocks: formatNumber(entry.blocks, locale),
                    words: formatNumber(entry.words, locale),
                  })}
                </li>
              ))}
            </ul>
            <p className={FIELD_NOTE}>
              <Template text={m.brandReport.sourcePage} values={{ url: page }} />
            </p>
          </>
        )}
      </Block>

      <Block title={m.brandReport.personalityHeading}>
        {view.lines.map((line) => (
          <p key={line}>{m.brandReport.engine[line]}</p>
        ))}
        {view.personality.map((axis) => (
          <div key={axis.axis} className="flex min-w-0 flex-col gap-2">
            <h3 className="text-label-md">{m.direction.axes[axis.axis]}</h3>
            {axis.leans.length === 0 ? (
              <p>{m.brandReport.noSignal}</p>
            ) : (
              <ul className="flex flex-wrap gap-3">
                {axis.leans.map((reading) => (
                  <ReadingCard
                    key={reading.evidenceId}
                    reading={reading}
                    url={view.url}
                    below={false}
                  />
                ))}
              </ul>
            )}
            <More total={axis.leansTotal} shown={axis.leans.length} />
            {axis.belowFloor.length === 0 ? null : (
              <ul className="flex flex-wrap gap-3">
                {axis.belowFloor.map((reading) => (
                  <ReadingCard key={reading.evidenceId} reading={reading} url={view.url} below />
                ))}
              </ul>
            )}
            <More total={axis.belowFloorTotal} shown={axis.belowFloor.length} />
          </div>
        ))}
      </Block>

      <Block title={m.brandReport.notMeasuredHeading}>
        <ul className="flex flex-col gap-2">
          {view.notMeasured.map((entry) => (
            <li key={entry.what}>
              {fill(m.brandReport.engine[entry.line], {
                what: m.brandReport.engine[entry.what],
                reason: entry.reason === null ? "" : m.brandReport.engine[entry.reason],
              })}
            </li>
          ))}
          <li>{m.brandReport.notReadIndustryMood}</li>
          <li>{m.brandReport.notReadSources}</li>
        </ul>
      </Block>
    </div>
  );
}

/** A read that gave no report: refused (a warning), failed (a danger) or not read. Each goes in the live container of its kind. */
function outcomeOf(view: ReportView | null | undefined, m: ReturnType<typeof useMessages>) {
  if (view?.status === "refused") {
    const text = m.brandReport.engine[view.line];
    return view.line.startsWith("read.failed.")
      ? { danger: <Notice variant="danger" text={text} live="off" />, status: null }
      : { danger: null, status: <Notice variant="warning" text={text} live="off" /> };
  }
  if (view?.status === "not-read") {
    return {
      danger: null,
      status: (
        <>
          <Notice variant="info" text={m.brandReport.engine[view.line]} live="off" />
          <p>
            <Template text={m.brandReport.address} values={{ url: <Page>{view.url}</Page> }} />
          </p>
        </>
      ),
    };
  }
  return { danger: null, status: null };
}

export function BrandReportScreen({
  access,
  signInHref = "/account",
  view,
  pending = false,
  failure,
  onRead,
}: BrandReportScreenProps) {
  const m = useMessages();
  const [url, setUrl] = useState("");
  const [role, setRole] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [roleError, setRoleError] = useState(false);

  const outcome = outcomeOf(view, m);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const missingUrl = url.trim() === "";
    const missingRole = role === "";
    setUrlError(missingUrl);
    setRoleError(missingRole);
    if (missingUrl || missingRole) return;
    onRead?.({ url, role: role as InputRole });
  };

  return (
    <div className="@container mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 wrap-anywhere">
      <PageHeader title={m.brandReport.heading} />
      {access === "signed-out" ? (
        <>
          <p>{m.brandReport.signedOut}</p>
          <div>
            <Button asChild variant="primary">
              <a href={signInHref}>{m.brandReport.signInLink}</a>
            </Button>
          </div>
        </>
      ) : null}
      {access === "not-configured" ? <p>{m.brandReport.notConfigured}</p> : null}
      {access === "not-allowed" ? <p>{m.brandReport.notAllowed}</p> : null}
      {access === "form" ? (
        <>
          <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
            <Field
              label={m.brandReport.urlLabel}
              description={m.brandReport.urlHint}
              error={urlError ? m.brandReport.urlRequired : undefined}
              required
            >
              <Input
                name="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setUrlError(false);
                }}
              />
            </Field>
            <Field
              group
              label={m.brandReport.roleLegend}
              error={roleError ? m.brandReport.roleRequired : undefined}
              required
            >
              <RadioGroup
                name="role"
                value={role}
                onValueChange={(next) => {
                  setRole(next);
                  setRoleError(false);
                }}
              >
                <RadioGroupItem value="own" label={m.brandReport.roleOwn} />
                <RadioGroupItem value="reference" label={m.brandReport.roleReference} />
                <RadioGroupItem value="competitor" label={m.brandReport.roleCompetitor} />
              </RadioGroup>
            </Field>
            <div className="flex flex-col items-start gap-2">
              <Button type="submit" variant="primary" loading={pending} disabled={pending}>
                {m.brandReport.submit}
              </Button>
              <p role="status" className={FIELD_NOTE}>
                {pending ? m.brandReport.pending : null}
              </p>
            </div>
          </form>
          <div role="alert" className="flex flex-col gap-3">
            {failure === undefined ? null : <Notice variant="danger" text={failure} live="off" />}
            {outcome.danger}
          </div>
          <div role="status" className="flex flex-col gap-3">
            {outcome.status}
          </div>
          {view?.status === "analysed" ? <Report view={view} /> : null}
        </>
      ) : null}
    </div>
  );
}
