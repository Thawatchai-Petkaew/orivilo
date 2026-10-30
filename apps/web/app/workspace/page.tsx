import { WorkspaceScreen } from "@orivilo/design-system/examples";
import type { Metadata } from "next";
import { getWebMessages } from "../../i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getWebMessages();
  return { title: m.workspace.title, description: m.workspace.description };
}

/**
 * The reference screen (handoff §19) rendered inside the neutral shell. The component lives in the
 * design-system package so Storybook proves it under every profile and E2-11's preview can render
 * the same screen under two directions. Thai fixture data, labelled as such on the home page; the
 * real shell (E4-0, E4-8) replaces it. The page owns the one `main` (ORV-161): the component stays
 * landmark-free because /directions embeds it inside its own `main`.
 */
export default function WorkspacePage() {
  return (
    <main>
      <WorkspaceScreen />
    </main>
  );
}
