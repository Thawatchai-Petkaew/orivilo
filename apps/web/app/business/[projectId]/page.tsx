import { BusinessBoardScreen } from "@orivilo/design-system/examples";
import { notFound } from "next/navigation";
import { loadProject } from "../data";

export const dynamic = "force-dynamic";

/**
 * One saved business (ORV-281 design section 6, slice 2): the project name, when it was saved and
 * the five business nodes on a read-only board, each opening its view. Opening it reads what was
 * saved and never calls a model. An unknown id, an id of another form and another workspace's
 * project are the same 404. The board takes the full width of the window less the screen's own
 * padding, so the page sets no maximum width.
 */
export default async function BusinessProjectPage({
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
        <BusinessBoardScreen
          access="ready"
          view={loaded.view}
          signInHref="/account"
          listHref="/business"
        />
      ) : (
        <BusinessBoardScreen access={loaded.access} signInHref="/account" listHref="/business" />
      )}
    </main>
  );
}
