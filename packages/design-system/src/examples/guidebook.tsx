"use client";

import type {
  Guidebook,
  GuidebookItem,
  GuidebookNote,
  GuidebookQuestionKey,
  GuidebookStep,
  GuidebookValue,
} from "@orivilo/intent-engine";
import type { ReactNode } from "react";
import { Button, PageHeader, SectionHeader } from "../components/index";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import { BusinessAccessNotice, type BusinessAccess } from "./business-access";
import {
  canvasWord,
  colorReason,
  decisionRule,
  FIELD_NOTE,
  familyWord,
  faceBecause,
  formatSavedAt,
  foundationFieldLabel,
  licenceLine,
  listOfNodes,
  logoTypeReason,
  logoTypeWord,
  nameLengthLine,
  neutralWord,
  provisionalLines,
  styleWord,
  uncheckedLine,
} from "./business-text";
import {
  axisLegendLine,
  guidebookStateLine,
  hypothesisLine,
  itemTitle,
  noteLine,
  notHeldLines,
  questionLine,
} from "./guidebook-text";

/**
 * The brand guidebook of one project (ORV-302 design, `guidebook-sections-1`): a document read top
 * to bottom, set as type on the page canvas. It holds the keys and values of `guidebookOf` and
 * looks every line up in the catalog; it decides no state, computes no mark and holds no state of
 * its own, so a language switch redraws the same data. Nothing on it changes anything: the back
 * link is the one control of the page body. Typed text (the project name, statements, answers, the
 * working name) is a text node in `bdi`, never markup and never a link (`guidebook-honest-1`).
 */
export interface GuidebookScreenProps {
  access: BusinessAccess;
  /** Where the sign-in link of the signed-out notice goes. */
  signInHref: string;
  /** `guidebookOf`'s result. Required when `access` is `ready`, ignored otherwise. */
  guidebook?: Guidebook | undefined;
  /** The project's board, the back link. Required when `access` is `ready`. */
  boardHref?: string | undefined;
}

const FRAME =
  "@container mx-auto flex w-full min-w-0 max-w-2xl flex-col px-4 pt-6 pb-12 wrap-anywhere";

export function GuidebookScreen(props: GuidebookScreenProps) {
  const m = useMessages();
  if (props.access !== "ready") {
    return (
      <div className={`${FRAME} gap-6`} data-guidebook>
        <PageHeader title={m.business.guidebook.title} />
        <BusinessAccessNotice access={props.access} signInHref={props.signInHref} />
      </div>
    );
  }
  if (props.guidebook === undefined || props.boardHref === undefined) {
    throw new Error("GuidebookScreen: access ready needs a guidebook and a boardHref");
  }
  return <ReadyGuidebook guidebook={props.guidebook} boardHref={props.boardHref} />;
}

/** A typed value as text: a text node in `bdi`, whole-block so a soft wrap never pushes past the column. */
function Typed({ children }: { children: string }) {
  return <bdi className="block">{children}</bdi>;
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: "business" | "foundation" | "visual" | "unconfirmed" | "notHeld";
  title: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-6" aria-labelledby={`gb-${id}`} data-section={id}>
      <SectionHeader id={`gb-${id}`} title={title} description={description} divider />
      {children}
    </section>
  );
}

function ReadyGuidebook({ guidebook: g, boardHref }: { guidebook: Guidebook; boardHref: string }) {
  const m = useMessages();
  const locale = useLocale();
  const gb = m.business.guidebook;
  return (
    <div className={`${FRAME} gap-12`} data-guidebook>
      <div className="flex min-w-0 flex-col gap-6" data-cover>
        <PageHeader
          title={gb.title}
          description={<Typed>{g.projectName}</Typed>}
          meta={
            <span className={FIELD_NOTE}>
              {fill(m.business.board.savedAt, { date: formatSavedAt(g.savedAt, locale) })}
            </span>
          }
        />
        <div className="flex min-w-0 flex-col gap-3" data-preface>
          <p className="text-body-md">{gb.byRule}</p>
          <p className="text-body-md">{gb.draftNote}</p>
        </div>
      </div>
      <Section id="business" title={gb.section.business} description={gb.businessNote}>
        <dl className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 @[30rem]:grid-cols-2" data-lead>
          {g.lead.map((line) => (
            <div key={line.id} className="flex min-w-0 flex-col gap-0.5" data-lead-line={line.id}>
              <dt className="text-label-md">{itemTitle(m, line.id)}</dt>
              <dd className={FIELD_NOTE}>{guidebookStateLine(m, locale, line)}</dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section id="foundation" title={gb.section.foundation}>
        <Items items={g.foundation} />
      </Section>
      <Section id="visual" title={gb.section.visual}>
        <Items items={g.visual} />
      </Section>
      <Section id="unconfirmed" title={gb.section.unconfirmed}>
        <Unconfirmed steps={g.unconfirmed} />
      </Section>
      <Section id="notHeld" title={gb.section.notHeld}>
        <dl className="flex min-w-0 flex-col gap-4" data-not-held>
          {g.notHeld.map((id) => {
            const { title, reason } = notHeldLines(m, id);
            return (
              <div key={id} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-label-md">{title}</dt>
                <dd className={FIELD_NOTE}>{reason}</dd>
              </div>
            );
          })}
        </dl>
      </Section>
      <div>
        <Button asChild variant="secondary">
          <a href={boardHref} data-back>
            {gb.backToBoard}
          </a>
        </Button>
      </div>
    </div>
  );
}

function Items({ items }: { items: readonly GuidebookItem[] }) {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}

/** The questions of an item or a step: the line `business.stillToAsk` and each question under it. */
function Ask({
  questions,
  className,
}: {
  questions: readonly GuidebookQuestionKey[];
  className?: string;
}) {
  const m = useMessages();
  if (questions.length === 0) return null;
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`.trim()} data-ask>
      <p className={FIELD_NOTE}>{m.business.stillToAsk}</p>
      <ul className="flex flex-col gap-2">
        {questions.map((key) => (
          <li key={key} className="text-body-sm">
            {questionLine(m, key)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A note line under the state line. The stale line is one step stronger: a line to read, not a label. */
function Note({ note }: { note: GuidebookNote }) {
  const m = useMessages();
  return note.key === "business.positioning.stale" ? (
    <p className="text-body-sm" data-marks="stale">
      {noteLine(m, note)}
    </p>
  ) : (
    <p className={FIELD_NOTE}>{noteLine(m, note)}</p>
  );
}

function Item({ item }: { item: GuidebookItem }) {
  const m = useMessages();
  const locale = useLocale();
  const provisional = provisionalLines(m, locale, item);
  const unchecked = uncheckedLine(m, locale, item);
  // A partly colour keeps its open notes inside the field that is still open (design 13).
  const notesInValue = item.status === "done" && item.id === "color";
  return (
    <div
      className="flex min-w-0 flex-col gap-3"
      data-item={item.id}
      data-done={item.status === "done"}
    >
      <div className="flex min-w-0 flex-col gap-1" data-head>
        <h3 className="self-start text-label-md">{itemTitle(m, item.id)}</h3>
        <p className={FIELD_NOTE} data-state>
          {guidebookStateLine(m, locale, item)}
        </p>
        {notesInValue || item.notes.length === 0 ? null : (
          <div className="mt-1 flex min-w-0 flex-col gap-2" data-notes>
            {item.notes.map((note) => (
              <Note key={note.key} note={note} />
            ))}
          </div>
        )}
        {provisional === null ? null : (
          <div className="mt-1 flex flex-col gap-1" data-marks="provisional">
            <p className="text-body-sm">{provisional.provisional}</p>
            <p className="text-body-sm">{provisional.restsOn}</p>
          </div>
        )}
        {unchecked === null ? null : (
          <p className="mt-1 text-body-sm" data-marks="unchecked">
            {unchecked}
          </p>
        )}
      </div>
      {notesInValue ? null : <Ask questions={item.questions} />}
      {item.status === "done" ? <Value item={item} /> : null}
    </div>
  );
}

type Done = Extract<GuidebookItem, { status: "done" }>;

/** The value of a done item and, for the visual items, the labels block after it. */
function Value({ item }: { item: Done }) {
  const m = useMessages();
  const { value } = item;
  const hypothesis = item.hypothesis === null ? null : hypothesisLine(m, item.hypothesis);
  switch (value.id) {
    case "positioning":
      return (
        <Statement statement={value.statement} gatePassed={m.business.positioning.gatePassed} />
      );
    case "identity-frame":
      return <IdentityValue value={value} hypothesis={hypothesis} />;
    case "architecture":
      return (
        <div className="flex min-w-0 flex-col gap-1" data-value>
          <p className="text-body-lg">{m.business.architecture.single}</p>
          <div className="flex min-w-0 flex-col gap-2" data-notes>
            <p className={FIELD_NOTE}>{m.business.architecture.because}</p>
            <Rules rules={item.rules} />
          </div>
        </div>
      );
    case "name":
      return (
        <div className="flex min-w-0 flex-col gap-1" data-value>
          <p className="text-body-lg whitespace-pre-wrap">
            <Typed>{value.name}</Typed>
          </p>
          <p className={FIELD_NOTE}>{m.business.name.notScreened}</p>
        </div>
      );
    case "core-idea":
      return (
        <div className="flex min-w-0 flex-col gap-4" data-value>
          <Statement
            statement={value.statement}
            gatePassed={m.business.coreIdea.gatePassed}
            marked={false}
          />
          <dl className="flex min-w-0 flex-col gap-4">
            <Answer field="remember" answer={value.remember} />
          </dl>
        </div>
      );
    case "logo-type":
      return <LogoTypeValue item={item} value={value} hypothesis={hypothesis} />;
    case "color":
      return <ColorValue item={item} value={value} hypothesis={hypothesis} />;
    case "typography":
      return <TypographyValue item={item} value={value} hypothesis={hypothesis} />;
  }
}

/** One rule line per rule id, in the item's order. */
function Rules({ rules }: { rules: readonly string[] }) {
  const m = useMessages();
  return (
    <>
      {rules.map((rule) => (
        <p key={rule} className={FIELD_NOTE} data-rule>
          {decisionRule(m, rule)}
        </p>
      ))}
    </>
  );
}

/**
 * A statement as the person wrote it, with its label. PR 1 shows `business.positioning.by.own` and
 * no line for a drafted label, as the board on `develop` does: those keys come with ORV-292.
 */
function Statement({
  statement,
  gatePassed,
  marked = true,
}: {
  statement: { text: string; label: string };
  gatePassed: string;
  /** False inside a value that already carries `data-value` (the core idea), so the item holds one. */
  marked?: boolean;
}) {
  const m = useMessages();
  return (
    <div className="flex min-w-0 flex-col gap-1" data-value={marked ? "" : undefined}>
      <p className="text-body-lg whitespace-pre-wrap">
        <Typed>{statement.text}</Typed>
      </p>
      <div className="flex min-w-0 flex-col gap-2" data-notes>
        {statement.label === "business.positioning.by.own" ? (
          <p className={FIELD_NOTE}>{m.business.positioning.by.own}</p>
        ) : null}
        <p className={FIELD_NOTE}>{gatePassed}</p>
      </div>
    </div>
  );
}

/** A field of the person's own words: its name, the answer and `business.label.yourWords`, or the empty line. */
function Answer({
  field,
  answer,
}: {
  field: "person" | "never" | "remember";
  answer: string | null;
}) {
  const m = useMessages();
  return (
    <div className="flex min-w-0 flex-col gap-1" data-field={field}>
      <dt className={FIELD_NOTE}>{foundationFieldLabel(m, field)}</dt>
      {answer === null ? (
        <dd className={FIELD_NOTE}>{m.business.state.empty}</dd>
      ) : (
        <>
          <dd className="text-body-md whitespace-pre-wrap">
            <Typed>{answer}</Typed>
          </dd>
          <dd className={FIELD_NOTE}>{m.business.label.yourWords}</dd>
        </>
      )}
    </div>
  );
}

function IdentityValue({
  value,
  hypothesis,
}: {
  value: Extract<GuidebookValue, { id: "identity-frame" }>;
  hypothesis: string | null;
}) {
  const m = useMessages();
  return (
    <dl className="flex min-w-0 flex-col gap-4" data-value>
      <Answer field="person" answer={value.person} />
      <Answer field="never" answer={value.never} />
      <div className="flex min-w-0 flex-col gap-1" data-field="personality">
        <dt className={FIELD_NOTE}>{foundationFieldLabel(m, "personality")}</dt>
        {hypothesis === null ? null : <dd className={FIELD_NOTE}>{hypothesis}</dd>}
        <dd>
          <dl className="mt-2 flex flex-col gap-2">
            {value.axes.map(({ axis, point }) => (
              <div key={axis} className="flex flex-col">
                <dt className={FIELD_NOTE}>{axisLegendLine(m, axis)}</dt>
                <dd className="text-body-md">{fill(m.business.identity.point, { n: point })}</dd>
              </div>
            ))}
          </dl>
        </dd>
      </div>
    </dl>
  );
}

/** The labels block after a visual item's value, 12 below it: each line a note. */
function Labels({ lines }: { lines: ReadonlyArray<string | null> }) {
  return (
    <div className="flex min-w-0 flex-col gap-2" data-labels>
      {lines.map((line) =>
        line === null ? null : (
          <p key={line} className={FIELD_NOTE}>
            {line}
          </p>
        ),
      )}
    </div>
  );
}

function LogoTypeValue({
  item,
  value,
  hypothesis,
}: {
  item: Done;
  value: Extract<GuidebookValue, { id: "logo-type" }>;
  hypothesis: string | null;
}) {
  const m = useMessages();
  const { decision } = value;
  const length = nameLengthLine(m, decision);
  return (
    <>
      <div className="flex min-w-0 flex-col gap-1" data-value>
        <p className="text-body-lg">{logoTypeWord(m, decision.type)}</p>
        <div className="flex min-w-0 flex-col gap-2" data-notes>
          {decision.reasons.map((reason) => (
            <p key={reason} className={FIELD_NOTE}>
              {logoTypeReason(m, reason)}
            </p>
          ))}
          <p className={`${FIELD_NOTE} whitespace-pre-wrap`} data-name-length>
            {length.before}
            <bdi>{decision.name}</bdi>
            {length.after}
          </p>
          <Rules rules={item.rules} />
        </div>
      </div>
      <Labels
        lines={[hypothesis, m.business.logoType.crowdingNotChecked, m.business.logoType.otherTypes]}
      />
    </>
  );
}

function ColorValue({
  item,
  value,
  hypothesis,
}: {
  item: Done;
  value: Extract<GuidebookValue, { id: "color" }>;
  hypothesis: string | null;
}) {
  const m = useMessages();
  const { decisions, points } = value;
  const { signature, neutral, canvas } = decisions;
  const explain = { points, decisions };
  return (
    <>
      <dl className="flex min-w-0 flex-col gap-4" data-value>
        <div className="flex min-w-0 flex-col gap-1" data-field="signature">
          <dt className={FIELD_NOTE}>{foundationFieldLabel(m, "signature")}</dt>{" "}
          {signature === null ? (
            <>
              {item.notes.map((note, i) => (
                <dd key={note.key} className={i === 0 ? "text-body-sm" : "mt-1 text-body-sm"}>
                  {noteLine(m, note)}
                </dd>
              ))}
              {item.questions.length === 0 ? null : (
                <dd className="mt-2">
                  <Ask questions={item.questions} />
                </dd>
              )}
            </>
          ) : (
            <>
              <dd className="text-body-lg">{familyWord(m, signature.value)}</dd>
              <dd className={FIELD_NOTE}>{colorReason(m, explain, signature.because)}</dd>
              <dd className={`mt-1 ${FIELD_NOTE}`} data-rule>
                {decisionRule(m, signature.rule)}
              </dd>
            </>
          )}
        </div>
        {neutral === null ? null : (
          <div className="flex min-w-0 flex-col gap-1" data-field="neutral">
            <dt className={FIELD_NOTE}>{foundationFieldLabel(m, "neutral")}</dt>
            <dd className="text-body-lg">{neutralWord(m, neutral.value)}</dd>
            <dd className={FIELD_NOTE}>{colorReason(m, explain, "neutral")}</dd>
            <dd className={`mt-1 ${FIELD_NOTE}`} data-rule>
              {decisionRule(m, neutral.rule)}
            </dd>
          </div>
        )}
        {canvas === null ? null : (
          <div className="flex min-w-0 flex-col gap-1" data-field="canvas">
            <dt className={FIELD_NOTE}>{foundationFieldLabel(m, "canvas")}</dt>
            <dd className="text-body-lg">{canvasWord(m, canvas.value)}</dd>
            <dd className={FIELD_NOTE}>{colorReason(m, explain, "canvas")}</dd>
            <dd className={`mt-1 ${FIELD_NOTE}`} data-rule>
              {decisionRule(m, canvas.rule)}
            </dd>
          </div>
        )}
      </dl>
      <Labels lines={[hypothesis, m.business.color.familyOnly]} />
    </>
  );
}

function TypographyValue({
  item,
  value,
  hypothesis,
}: {
  item: Done;
  value: Extract<GuidebookValue, { id: "typography" }>;
  hypothesis: string | null;
}) {
  const m = useMessages();
  const { faces } = value;
  const roles = [
    ["readingFace", faces.reading],
    ["displayFace", faces.display],
  ] as const;
  return (
    <>
      <div className="flex min-w-0 flex-col gap-3" data-value>
        <dl className="flex min-w-0 flex-col gap-4">
          {roles.map(([field, list]) => (
            <div key={field} className="flex min-w-0 flex-col gap-1" data-field={field}>
              <dt className={FIELD_NOTE}>{foundationFieldLabel(m, field)}</dt>
              <dd>
                <ul className="flex min-w-0 flex-col gap-3">
                  {list.map((face) => {
                    const because = faceBecause(m, face);
                    return (
                      <li key={face.id} className="flex min-w-0 flex-col gap-1" data-face>
                        <p className="text-body-lg">{face.family}</p>
                        <div className="flex min-w-0 flex-col gap-2" data-notes>
                          <p className={FIELD_NOTE}>{styleWord(m, face.style)}</p>
                          <p className={FIELD_NOTE}>{licenceLine(m, face)}</p>
                          {because === null ? null : <p className={FIELD_NOTE}>{because}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex min-w-0 flex-col gap-2" data-notes>
          {faces.pairing ? (
            <p className={FIELD_NOTE}>{m.business.typography.because.pairing}</p>
          ) : null}
          <Rules rules={item.rules} />
        </div>
      </div>
      <Labels lines={[m.business.typography.oneChoice, hypothesis]} />
    </>
  );
}

/** The steps the person skipped, each with what rests on it (`guidebook-unconfirmed-1`). */
function Unconfirmed({ steps }: { steps: readonly GuidebookStep[] }) {
  const m = useMessages();
  const locale = useLocale();
  const gb = m.business.guidebook;
  if (steps.length === 0) {
    return (
      <p className="text-body-md" data-unconfirmed-none>
        {gb.unconfirmed.none}
      </p>
    );
  }
  return (
    <ul className="flex min-w-0 flex-col gap-8" data-unconfirmed>
      {steps.map((step) => (
        <li key={step.id} className="flex min-w-0 flex-col gap-3" data-step={step.id}>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="self-start text-label-md">{itemTitle(m, step.id)}</h3>
            <p className={FIELD_NOTE}>{m.business.state.skipped}</p>
          </div>
          {step.questions.length === 0 ? null : (
            <ul className="flex flex-col gap-2">
              {step.questions.map((key) => (
                <li key={key} className="text-body-sm">
                  {questionLine(m, key)}
                </li>
              ))}
            </ul>
          )}
          {step.restingOn.length === 0 ? (
            <p className={FIELD_NOTE}>{gb.unconfirmed.nothing}</p>
          ) : (
            <div className="flex min-w-0 flex-col gap-2">
              <p className={FIELD_NOTE}>{gb.unconfirmed.restsOnIt}</p>
              <ul className="flex min-w-0 flex-col gap-2" data-rests>
                {step.restingOn.map(({ id, mark }) => (
                  <li key={id} className="flex flex-col gap-0.5" data-rests-item={id}>
                    <span className="text-label-md">{itemTitle(m, id)}</span>
                    <span className={FIELD_NOTE}>{restLine(m, locale, step.id, mark)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** An item's mark line in the resting list: `business.marks.restsOn` or `.unchecked` naming the step. */
function restLine(
  m: Messages,
  locale: "th" | "en",
  step: GuidebookStep["id"],
  mark: "restsOn" | "unchecked",
): string {
  return fill(mark === "restsOn" ? m.business.marks.restsOn : m.business.marks.unchecked, {
    nodes: listOfNodes(m, locale, [step]),
  });
}
