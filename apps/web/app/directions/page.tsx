import { messagesFor } from "@orivilo/design-system";
import { WorkspaceScreen } from "@orivilo/design-system/examples";
import type { Metadata } from "next";
import { getWebMessages } from "../../i18n/locale";
import { listDirections } from "./actions";
import { SavedStudio, type SavedView } from "./SavedStudio";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getWebMessages();
  return { title: m.directions.title, description: m.directions.description };
}

async function load(): Promise<SavedView> {
  const listing = await listDirections();
  if (listing.ok) return { kind: "ready", listing: listing.value };
  if (listing.error === "signed-out") return { kind: "signed-out" };
  if (listing.error === "not-configured") return { kind: "not-configured" };
  return { kind: "error", error: listing.error };
}

/**
 * Two directions on the same task (E2-11), now kept (ORV-35): signed in, the studio's inputs are
 * saved as a draft, approved into a version that never changes, and exported or imported as a
 * file. Signed out, the studio still works and says nothing is saved. The brief is read by rules,
 * and the preview is the reference screen with its Thai fixture data.
 */
export default async function DirectionsPage() {
  const { locale, m } = await getWebMessages();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-display-md text-balance">{m.directions.heading}</h1>
      <SavedStudio
        view={await load()}
        m={m.saved}
        wait={m.wait}
        defaultBrief={messagesFor(locale).direction.preset1Text}
        preview={<WorkspaceScreen />}
      />
    </main>
  );
}
