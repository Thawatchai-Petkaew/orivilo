import "server-only";

import {
  atBoundary,
  BusinessError,
  businessService,
  Denied,
  type Ended,
  type ProjectSummary,
  type Route,
  requestIdOf,
} from "@orivilo/auth";
import { MissingEnvError } from "@orivilo/db";
import { type BusinessView, toBusinessView } from "@orivilo/intent-engine";
import { headers } from "next/headers";
import { accessDeps, auth } from "../../server/auth";
import { mayRead } from "../../server/read-access";

/**
 * The two page loaders of the business screens (ORV-281 tech notes section 6.2). Each reads the
 * session, then the approved list, then the database through `businessService`, and answers either
 * the data or the one reason the screen shows no content. Neither counts a limit, as
 * `listDirections` does not, and neither calls a model. Each is one boundary line with closed words
 * only: no project name, answer or website reaches it.
 */

/** Why a screen shows a line and no content. The screen's `access` states, less `ready`. */
export type Withheld = { access: "signed-out" | "not-allowed" | "not-configured" };

export type ListLoad =
  { access: "ready"; projects: Array<{ id: string; name: string; createdAt: string }> } | Withheld;

/** `not-found` is one answer for an unknown id, an id of another form and another workspace's project. */
export type ProjectLoad =
  { access: "ready"; view: BusinessView } | Withheld | { access: "not-found" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The shared door: session, approved list, then the work. `fn` gets the request's headers and the
 * session's active workspace and answers what the page shows. A refusal is a closed reason; a
 * `Denied` (no workspace, not a member) is `denied` for the caller to word.
 */
async function load<T extends { access: string }>(
  route: Route,
  denied: T,
  fn: (h: Headers, workspaceId: string) => Promise<Ended<T>>,
): Promise<T | Withheld> {
  const h = await headers();
  const requestId = requestIdOf(h);
  return atBoundary<T | Withheld>({ requestId, route }, async () => {
    try {
      const session = await auth().api.getSession({ headers: h });
      if (!session) {
        return {
          value: { access: "signed-out" },
          ending: { level: "info", outcome: "refused", reason: "signed-out" },
        };
      }
      if (!mayRead(session.user.email)) {
        return {
          value: { access: "not-allowed" },
          ending: { level: "info", outcome: "refused", reason: "forbidden" },
        };
      }
      return await fn(h, session.session.activeOrganizationId ?? "");
    } catch (error) {
      if (error instanceof MissingEnvError) {
        return {
          value: { access: "not-configured" },
          ending: { level: "error", outcome: "failed", reason: "not-configured" },
        };
      }
      // No active workspace, or one the person is not in: a person with no workspace has no projects.
      if (error instanceof Denied && error.status !== 401) {
        return {
          value: denied,
          ending: { level: "info", outcome: "refused", reason: "workspace-not-found" },
        };
      }
      if (error instanceof Denied) {
        return {
          value: { access: "signed-out" },
          ending: { level: "info", outcome: "refused", reason: "signed-out" },
        };
      }
      throw error;
    }
  });
}

/** The workspace's projects that have an intake, newest first, at most 100. */
export async function loadList(): Promise<ListLoad> {
  return load<ListLoad>(
    "business/listProjects",
    { access: "ready", projects: [] },
    async (h, workspaceId) => {
      const projects: ProjectSummary[] = await businessService(accessDeps()).list(h, workspaceId);
      return {
        value: {
          access: "ready",
          projects: projects.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.createdAt.toISOString(),
          })),
        },
        ending: { level: "info", outcome: "ok" },
      };
    },
  );
}

/**
 * One project with its newest intake, that intake's saved reading and the project's newest
 * positioning choice (ORV-285) and its brand foundation entries (ORV-291), as the view the screen
 * takes. Opening reads rows and never calls a model. The id is a name to look up: one that is not
 * in UUID form never reaches the database. Another workspace's project, an unknown
 * id and a bad form all answer `not-found`, one answer for the page's one 404 body (security rule 9).
 * A stored row, an intake or a reading, that no longer parses shows as the same 404: the page tells
 * nothing about the row.
 */
export async function loadProject(id: string): Promise<ProjectLoad> {
  return load<ProjectLoad>(
    "business/openProject",
    { access: "not-found" },
    async (h, workspaceId) => {
      if (!UUID.test(id)) {
        return {
          value: { access: "not-found" },
          ending: { level: "info", outcome: "refused", reason: "not-found" },
        };
      }
      try {
        const opened = await businessService(accessDeps()).open(h, workspaceId, id);
        const view = toBusinessView({
          project: {
            id: opened.project.id,
            name: opened.project.name,
            createdAt: opened.savedAt.toISOString(),
          },
          intake: opened.intake,
          reading: opened.reading,
          positioning: opened.positioning,
          foundation: opened.foundation,
        });
        return {
          value: { access: "ready", view },
          ending: { level: "info", outcome: "ok" },
        };
      } catch (error) {
        if (error instanceof BusinessError && error.reason === "not-found") {
          return {
            value: { access: "not-found" },
            ending: { level: "info", outcome: "refused", reason: "not-found" },
          };
        }
        // A row that fails its own check is ours to fix, so the boundary line is an error line.
        if (error instanceof BusinessError) {
          return {
            value: { access: "not-found" },
            ending: { level: "error", outcome: "failed", reason: "failed" },
          };
        }
        throw error;
      }
    },
  );
}
