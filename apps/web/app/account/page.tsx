import { Denied, withWorkspace } from "@orivilo/auth";
import { eq, MissingEnvError, organization } from "@orivilo/db";
import { Button, fill } from "@orivilo/design-system";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getWebMessages } from "../../i18n/locale";
import { accessDeps, auth } from "../../server/auth";
import { signInWithGoogle, signOut } from "./actions";
import { SignInForm } from "./SignInForm";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getWebMessages();
  return { title: m.account.title };
}

type View =
  | { kind: "not-configured" }
  | { kind: "signed-out" }
  | { kind: "signed-in"; email: string; workspace: string };

/** The person and their workspace, read through the authorization helper (ORV-38 AC 2). */
async function load(): Promise<View> {
  try {
    const h = await headers();
    const session = await auth().api.getSession({ headers: h });
    if (!session) return { kind: "signed-out" };
    const workspaceId = session.session.activeOrganizationId;
    const workspace = await withWorkspace(
      accessDeps(),
      h,
      workspaceId,
      "member",
      async ({ tx }) => {
        const [row] = await tx
          .select({ name: organization.name })
          .from(organization)
          .where(eq(organization.id, workspaceId ?? ""));
        return row?.name ?? "";
      },
    );
    return { kind: "signed-in", email: session.user.email, workspace };
  } catch (error) {
    if (error instanceof MissingEnvError) return { kind: "not-configured" };
    if (error instanceof Denied) return { kind: "signed-out" };
    throw error;
  }
}

export default async function AccountPage() {
  const { m } = await getWebMessages();
  const view = await load();
  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-start gap-6 px-4 pt-24 pb-12">
      <h1 className="font-display text-display-md text-balance">{m.account.heading}</h1>
      {view.kind === "not-configured" ? (
        <p className="text-body-md text-text-secondary">{m.account.notConfigured}</p>
      ) : null}
      {view.kind === "signed-out" ? (
        <SignInForm action={signInWithGoogle} labels={{ account: m.account, wait: m.wait }} />
      ) : null}
      {view.kind === "signed-in" ? (
        <form action={signOut} className="flex flex-col gap-3">
          <p className="text-body-md">{fill(m.account.signedInAs, { email: view.email })}</p>
          <p className="text-body-md">{fill(m.account.workspace, { name: view.workspace })}</p>
          <div>
            <Button type="submit" variant="secondary">
              {m.account.signOut}
            </Button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
