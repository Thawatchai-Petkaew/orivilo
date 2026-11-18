"use client";

import { Button } from "../components/index";
import { useMessages } from "../i18n/LocaleProvider";

/**
 * What a business screen shows before it shows its content (design section 2): `ready` shows the
 * screen, the other three show one paragraph under the header and nothing else, no form, no list,
 * no board, no header actions.
 */
export type BusinessAccess = "ready" | "signed-out" | "not-allowed" | "not-configured";

export function BusinessAccessNotice({
  access,
  signInHref,
}: {
  access: Exclude<BusinessAccess, "ready">;
  signInHref: string;
}) {
  const m = useMessages();
  switch (access) {
    case "signed-out":
      return (
        <>
          <p>{m.business.signedOut}</p>
          <div>
            <Button asChild variant="primary">
              <a href={signInHref}>{m.business.signInLink}</a>
            </Button>
          </div>
        </>
      );
    case "not-allowed":
      return <p>{m.business.notAllowed}</p>;
    case "not-configured":
      return <p>{m.business.notConfigured}</p>;
  }
}
