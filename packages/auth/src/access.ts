import { and, eq, member } from "@orivilo/db";
import { type Db, inWorkspace, type Tx } from "@orivilo/db/client";

export const ROLES = ["member", "admin", "owner"] as const;
export type Role = (typeof ROLES)[number];

/** Access refused. `status` is what a route returns: 401 without a session, 403 otherwise. */
export class Denied extends Error {
  readonly status: 401 | 403;
  readonly reason: "no-session" | "no-workspace" | "not-a-member" | "role-too-low";
  constructor(status: Denied["status"], reason: Denied["reason"]) {
    super(`access denied: ${reason}`);
    this.name = "Denied";
    this.status = status;
    this.reason = reason;
  }
}

export interface Session {
  user: { id: string };
}

export interface AccessDeps {
  /** Resolves the session from the request's headers, on the server (Better Auth). */
  getSession: (headers: Headers) => Promise<Session | null>;
  db: Db;
}

export interface Access {
  userId: string;
  workspaceId: string;
  role: Role;
  tx: Tx;
}

const rank = (role: string) => ROLES.indexOf(role as Role);

/**
 * The one door to workspace data (ADR 0002). Resolves the session, checks that the person
 * belongs to the workspace with at least `minRole`, then runs `fn` in a transaction scoped to
 * that workspace, so row security agrees with this check. Anything else is denied before any
 * workspace query runs. Never take the workspace or user id from the client as proof of access.
 */
export async function withWorkspace<T>(
  deps: AccessDeps,
  headers: Headers,
  workspaceId: string | null | undefined,
  minRole: Role,
  fn: (access: Access) => Promise<T>,
): Promise<T> {
  const session = await deps.getSession(headers);
  if (!session) throw new Denied(401, "no-session");
  if (!workspaceId) throw new Denied(403, "no-workspace");
  const [row] = await deps.db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.userId, session.user.id), eq(member.organizationId, workspaceId)))
    .limit(1);
  if (!row) throw new Denied(403, "not-a-member");
  if (rank(row.role) < rank(minRole)) throw new Denied(403, "role-too-low");
  const role = row.role as Role;
  return inWorkspace(deps.db, workspaceId, (tx) =>
    fn({ userId: session.user.id, workspaceId, role, tx }),
  );
}
