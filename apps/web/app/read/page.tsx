import { MissingEnvError } from "@orivilo/db";
import { BrandReportScreen } from "@orivilo/design-system/examples";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getWebMessages } from "../../i18n/locale";
import { auth } from "../../server/auth";
import { ReadForm } from "./ReadForm";

export const dynamic = "force-dynamic";
/**
 * The read stops itself at 30 s (`TOTAL_BUDGET_MS`); the rest of the action gets the other 30 s.
 * The setting sits on the page because the Next.js docs say a Server Action takes it from the page
 * that calls it, so `analysePage` must be called from this page only (ORV-266 tech notes section 4).
 */
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getWebMessages();
  return { title: m.brandReport.title, description: m.brandReport.description };
}

type Access = "form" | "signed-out" | "not-configured";

/** The session only: nothing is read from the database here, and the action checks it again. */
async function accessOf(): Promise<Access> {
  try {
    const session = await auth().api.getSession({ headers: await headers() });
    return session ? "form" : "signed-out";
  } catch (error) {
    if (error instanceof MissingEnvError) return "not-configured";
    throw error;
  }
}

/**
 * The brand evidence report (ORV-266, ORV-267): a signed-in person pastes a website address and
 * sees what its page declares and says, read by fixed rules and not by AI. The page owns the one
 * `main`; the screen holds the one `h1` and no landmark. Signed out, or with no auth set up, the
 * screen says so and shows no form.
 */
export default async function ReadPage() {
  const { m } = await getWebMessages();
  const access = await accessOf();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {access === "form" ? (
        <ReadForm errors={m.saved.errors} wait={m.wait} failure={m.failure} />
      ) : (
        <BrandReportScreen access={access} />
      )}
    </main>
  );
}
