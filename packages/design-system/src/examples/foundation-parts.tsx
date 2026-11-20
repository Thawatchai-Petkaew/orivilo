"use client";

import { Notice } from "./brand-report";

/**
 * The two pieces every foundation editor shares (ORV-291 design section 5): the project id the
 * client check parses with, and the failure region under a row of buttons.
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
