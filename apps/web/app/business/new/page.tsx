import { MissingEnvError } from "@orivilo/db";
import { BusinessIntakeScreen, type BusinessAccess } from "@orivilo/design-system/examples";
import { headers } from "next/headers";
import { getWebMessages } from "../../../i18n/locale";
import { auth } from "../../../server/auth";
import { mayRead } from "../../../server/read-access";
import { IntakeForm } from "./IntakeForm";

export const dynamic = "force-dynamic";
/**
 * The save is quick today; slice 3 adds a model call of up to 20 s after it. The setting sits on the
 * page because a Server Action takes it from the page that calls it, so `createProject` must be
 * called from this page only (ORV-266 tech notes, D4; ORV-281 tech notes section 6.1).
 */
export const maxDuration = 60;

/**
 * The session and the approved list: nothing is read from the database here, and the action checks
 * both again. An unset or empty list shows the same line as a list without the person.
 */
async function accessOf(): Promise<BusinessAccess> {
  try {
    const session = await auth().api.getSession({ headers: await headers() });
    if (!session) return "signed-out";
    return mayRead(session.user.email) ? "ready" : "not-allowed";
  } catch (error) {
    if (error instanceof MissingEnvError) return "not-configured";
    throw error;
  }
}

/**
 * The intake (ORV-281 design section 4): the person tells ORIVILO about a business and the answers
 * are saved as a project. The page owns the one `main`; the screen holds the one `h1`. Signed out,
 * off the approved list, or with no database set up, the screen says so and shows no form.
 */
export default async function NewBusinessPage() {
  const { m } = await getWebMessages();
  const access = await accessOf();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {access === "ready" ? (
        <IntakeForm errors={m.saved.errors} wait={m.wait} failure={m.failure} />
      ) : (
        <BusinessIntakeScreen access={access} signInHref="/account" listHref="/business" />
      )}
    </main>
  );
}
