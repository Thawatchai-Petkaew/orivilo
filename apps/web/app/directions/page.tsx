import { DirectionStudio, messagesFor } from "@orivilo/design-system";
import { WorkspaceScreen } from "@orivilo/design-system/examples";
import type { Metadata } from "next";
import { getWebMessages } from "../../i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getWebMessages();
  return { title: m.directions.title, description: m.directions.description };
}

/**
 * Two directions on the same task (E2-11, ORV-34 part 2): the brief is read by rules in the
 * browser, nothing is stored, and the preview is the reference screen with its Thai fixture data.
 */
export default async function DirectionsPage() {
  const { locale, m } = await getWebMessages();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-display-md text-balance">{m.directions.heading}</h1>
      <DirectionStudio
        defaultBrief={messagesFor(locale).direction.preset1Text}
        preview={<WorkspaceScreen />}
      />
    </main>
  );
}
