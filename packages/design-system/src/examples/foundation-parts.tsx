"use client";

import type { Messages } from "../i18n/messages/index";
import { FIELD_NOTE } from "./business-text";
import { Notice } from "./brand-report";

/**
 * The pieces the foundation views share (ORV-291 design sections 4 and 5): the project id the client
 * check parses with, the failure region under a row of buttons, and the field that shows a proxy
 * answer in the person's own words.
 */

/** The editor check needs a project id to parse; the screen does not know it. */
export const NO_PROJECT = "00000000-0000-4000-8000-000000000000";

/** A failed call's line under the controls: the live alert region is always there, so it is announced once. */
export function FailureRegion({ line }: { line: string | undefined }) {
  return (
    <div role="alert">
      {line === undefined ? null : (
        <div className="mt-3">
          <Notice variant="danger" text={line} live="off" />
        </div>
      )}
    </div>
  );
}

/** A proxy answer: the person's words as text with the label that says so, or the fallback line. */
export function AnswerField({
  field,
  title,
  text,
  fallback,
  m,
}: {
  field: "person" | "never" | "remember";
  title: string;
  text: string | null;
  fallback: string;
  m: Messages;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1" data-field={field}>
      <h3 className="self-start text-label-md">{title}</h3>
      {text === null ? (
        <p className={FIELD_NOTE}>{fallback}</p>
      ) : (
        <>
          <p className="whitespace-pre-wrap">
            <bdi>{text}</bdi>
          </p>
          <p className={FIELD_NOTE}>{m.business.label.yourWords}</p>
        </>
      )}
    </div>
  );
}
