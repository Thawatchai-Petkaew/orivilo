"use client";

import {
  checkIntake,
  INTAKE_FIELDS,
  type Intake,
  type IntakeField,
  type IntakeProblem,
} from "@orivilo/intent-engine";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Alert, Button, Field, Input, PageHeader, Textarea } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";
import { fill, type Messages } from "../i18n/messages/index";
import { BusinessAccessNotice, type BusinessAccess } from "./business-access";
import { FIELD_NOTE, intakeLabel } from "./business-text";

/**
 * The intake screen (ORV-281 design section 4): eight fields in `intake-fields-1` order, the project
 * name and the idea required. It holds the field values itself, so a failure, a refusal or a pending
 * save never clears them, and it runs `checkIntake` before it calls `onSubmit`, so a name, an idea
 * or an answer that is too long makes no server call. It knows no route. No Textarea has a counter
 * or `maxLength`: a Textarea counts graphemes and the check counts characters, so a Thai answer
 * would pass a counter and fail the check; the bound speaks through `business.intake.tooLong`.
 */
export interface BusinessIntakeScreenProps {
  access: BusinessAccess;
  /** Where the sign-in link goes on a signed-out screen. */
  signInHref: string;
  /** Where the project list is. */
  listHref: string;
  /** A save is running: the button is disabled and the status line shows. */
  pending?: boolean | undefined;
  /**
   * Problems the server found (step 4 of `business-door-1`), shown on their fields. Pass a new array
   * for each refusal and leave it out otherwise; a new value moves focus to the first invalid field.
   */
  problems?: readonly IntakeProblem[] | undefined;
  /** A line already resolved by the caller (signed out, rate limited, failed), kept above no field. */
  failure?: string | undefined;
  /** Called with the checked intake: trimmed, the website as kept. */
  onSubmit?: ((intake: Intake) => void) | undefined;
}

type Values = Record<IntakeField, string>;

const EMPTY: Values = {
  projectName: "",
  idea: "",
  industry: "",
  customers: "",
  problem: "",
  competitors: "",
  value: "",
  website: "",
};

/** Rows shown and rows grown to, per Textarea; a field not listed is an `Input`. */
const AREA: Partial<Record<IntakeField, { rows: number; maxRows: number }>> = {
  idea: { rows: 4, maxRows: 10 },
  industry: { rows: 2, maxRows: 6 },
  customers: { rows: 3, maxRows: 10 },
  problem: { rows: 3, maxRows: 10 },
  competitors: { rows: 3, maxRows: 10 },
  value: { rows: 3, maxRows: 10 },
};

/** The line for a problem. `required` can only come from the two required fields; no other field gets one. */
function problemText(m: Messages, problem: IntakeProblem): string | undefined {
  const field = INTAKE_FIELDS.find((f) => f.key === problem.field);
  switch (problem.kind) {
    case "required":
      if (problem.field === "projectName") return m.business.intake.nameRequired;
      if (problem.field === "idea") return m.business.intake.offerRequired;
      return undefined;
    case "too-long":
      return field === undefined
        ? undefined
        : fill(m.business.intake.tooLong, { max: String(field.max) });
    case "website":
      return m.business.intake.websiteInvalid;
    case "unknown-key":
      return undefined;
  }
}

export function BusinessIntakeScreen({
  access,
  signInHref,
  listHref,
  pending = false,
  problems,
  failure,
  onSubmit,
}: BusinessIntakeScreenProps) {
  const m = useMessages();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [shown, setShown] = useState<readonly IntakeProblem[]>(problems ?? []);
  const [seen, setSeen] = useState(problems);
  const [focusRequest, setFocusRequest] = useState(problems === undefined ? 0 : 1);

  // A new refusal from the caller replaces what is shown and asks for focus.
  if (problems !== seen) {
    setSeen(problems);
    setShown(problems ?? []);
    if (problems !== undefined && problems.length > 0) setFocusRequest((n) => n + 1);
  }

  // Focus moves to the first invalid field in form order, after the errors are on the page.
  useEffect(() => {
    if (focusRequest === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusRequest]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const check = checkIntake(values);
    if (!check.ok) {
      setShown(check.problems);
      setFocusRequest((n) => n + 1);
      return;
    }
    setShown([]);
    onSubmit?.(check.intake);
  };

  const change = (key: IntakeField, text: string) => {
    setValues((current) => ({ ...current, [key]: text }));
    setShown((current) => current.filter((p) => p.field !== key));
  };

  const ready = access === "ready";
  return (
    <div className="@container mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 wrap-anywhere">
      <PageHeader
        title={m.business.intake.heading}
        description={ready ? m.business.intake.lede : undefined}
        actions={
          ready ? (
            <Button asChild variant="secondary">
              <a href={listHref}>{m.business.list.heading}</a>
            </Button>
          ) : undefined
        }
      />
      {ready ? (
        <>
          <form ref={formRef} className="flex flex-col gap-6" noValidate onSubmit={submit}>
            {INTAKE_FIELDS.map((row) => {
              const area = AREA[row.key];
              const problem = shown.find((p) => p.field === row.key);
              return (
                <Field
                  key={row.key}
                  label={intakeLabel(m, row.key)}
                  description={row.required ? undefined : m.business.intake.optional}
                  error={problem === undefined ? undefined : problemText(m, problem)}
                  required={row.required}
                >
                  {area === undefined ? (
                    <Input
                      name={row.key}
                      value={values[row.key]}
                      onChange={(event) => change(row.key, event.target.value)}
                      autoComplete="off"
                      {...(row.key === "website"
                        ? { type: "text", inputMode: "url", spellCheck: false }
                        : {})}
                    />
                  ) : (
                    <Textarea
                      name={row.key}
                      value={values[row.key]}
                      rows={area.rows}
                      maxRows={area.maxRows}
                      onChange={(event) => change(row.key, event.target.value)}
                    />
                  )}
                </Field>
              );
            })}
            <div className="flex flex-col items-start gap-2">
              <Button type="submit" variant="primary" loading={pending} disabled={pending}>
                {m.business.intake.submit}
              </Button>
              <p role="status" className={FIELD_NOTE}>
                {pending ? m.business.intake.pending : null}
              </p>
            </div>
          </form>
          <div role="alert" className="flex flex-col gap-3">
            {failure === undefined ? null : (
              <Alert variant="danger" title={failure} description="" live="off" />
            )}
          </div>
        </>
      ) : (
        <BusinessAccessNotice access={access} signInHref={signInHref} />
      )}
    </div>
  );
}
