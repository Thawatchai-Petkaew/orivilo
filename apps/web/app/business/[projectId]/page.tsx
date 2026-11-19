import { BusinessBoardScreen } from "@orivilo/design-system/examples";
import { notFound } from "next/navigation";
import { getWebMessages } from "../../../i18n/locale";
import { loadProject } from "../data";
import { ProjectBoard } from "./ProjectBoard";

export const dynamic = "force-dynamic";

/**
 * One saved business (ORV-281 design section 6, slice 2): the project name, when it was saved and
 * the five business nodes on a read-only board, each opening its view. Opening it reads what was
 * saved and never calls a model. An unknown id, an id of another form and another workspace's
 * project are the same 404. The board takes the full width of the window less the screen's own
 * padding, so the page sets no maximum width. A ready board goes through `ProjectBoard`, the client
 * wrapper that saves the person's choice on the Positioning gate (ORV-285).
 */
export default async function BusinessProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const loaded = await loadProject(projectId);
  if (loaded.access === "not-found") notFound();
  const { m } = await getWebMessages();
  return (
    <main className="w-full">
      {loaded.access === "ready" ? (
        <ProjectBoard
          view={loaded.view}
          projectId={projectId}
          errors={m.saved.errors}
          wait={m.wait}
          failure={m.failure}
        />
      ) : (
        <BusinessBoardScreen access={loaded.access} signInHref="/account" listHref="/business" />
      )}
    </main>
  );
}
