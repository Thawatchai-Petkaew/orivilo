import { BusinessListScreen } from "@orivilo/design-system/examples";
import { loadList } from "./data";

export const dynamic = "force-dynamic";

/**
 * The project list (ORV-281 design section 3): the workspace's businesses, newest first, each a
 * link to its board. The page owns the one `main`; the screen holds the one `h1`. Links are built
 * here, so the screen knows no route. Signed out, off the approved list or with no database set
 * up, the screen says so and shows no list.
 */
export default async function BusinessListPage() {
  const loaded = await loadList();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <BusinessListScreen
        access={loaded.access}
        signInHref="/account"
        newHref="/business/new"
        projects={
          loaded.access === "ready"
            ? loaded.projects.map((p) => ({ ...p, href: `/business/${p.id}` }))
            : []
        }
      />
    </main>
  );
}
