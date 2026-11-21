import { GuidebookScreen } from "@orivilo/design-system/examples";
import { guidebookOf } from "@orivilo/intent-engine";
import { notFound } from "next/navigation";
import { loadProject } from "../../data";

export const dynamic = "force-dynamic";

/**
 * The brand guidebook of one saved business (ORV-302 tech notes section 5): the same read as the
 * board's page, then `guidebookOf`, a pure function of the view. Opening it reads rows and nothing
 * else: no write, no limit, no model. An unknown id, an id of another form and another workspace's
 * project are the same 404 as on the board. The screen gets the guidebook's keys and values and no
 * view, so a reading of the model never reaches the client. The page exports no metadata: no project
 * name reaches a title or a link preview, and the back link's address is built only once the loader
 * has accepted the id.
 */
export default async function GuidebookPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const loaded = await loadProject(projectId);
  if (loaded.access === "not-found") notFound();
  return (
    <main className="w-full">
      {loaded.access === "ready" ? (
        <GuidebookScreen
          access="ready"
          guidebook={guidebookOf(loaded.view)}
          boardHref={`/business/${projectId}`}
          signInHref="/account"
        />
      ) : (
        <GuidebookScreen access={loaded.access} signInHref="/account" />
      )}
    </main>
  );
}
