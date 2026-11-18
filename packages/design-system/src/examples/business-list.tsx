"use client";

import { Button, Card, CardTitle, EmptyState, PageHeader } from "../components/index";
import { KnowledgeIcon } from "../components/icons";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill } from "../i18n/messages/index";
import { BusinessAccessNotice, type BusinessAccess } from "./business-access";
import { FIELD_NOTE, formatSavedAt } from "./business-text";

/**
 * The project list screen (ORV-281 design section 3): the workspace's projects by name, newest
 * first, each a link to its board, and the link to the intake. It knows no route: every link comes
 * in as a prop. A project name is the person's text, inside `bdi`, wrapped and never clamped.
 */
export interface BusinessListProject {
  id: string;
  name: string;
  href: string;
  /** ISO time the project was saved. */
  createdAt: string;
}

export interface BusinessListScreenProps {
  access: BusinessAccess;
  /** Where the sign-in link goes on a signed-out screen. */
  signInHref: string;
  /** Where the intake is. */
  newHref: string;
  projects: readonly BusinessListProject[];
}

export function BusinessListScreen({
  access,
  signInHref,
  newHref,
  projects,
}: BusinessListScreenProps) {
  const m = useMessages();
  const locale = useLocale();
  const newLink = (
    <Button asChild variant="primary">
      <a href={newHref}>{m.business.list.new}</a>
    </Button>
  );
  const empty = projects.length === 0;
  return (
    <div className="@container mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 wrap-anywhere">
      <PageHeader
        title={m.business.list.heading}
        actions={access === "ready" && !empty ? newLink : undefined}
      />
      {access === "ready" ? (
        empty ? (
          <EmptyState
            size="md"
            level={2}
            icon={KnowledgeIcon}
            title={m.business.list.empty}
            action={newLink}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 @min-[480px]:grid-cols-2">
            {projects.map((project) => (
              <li key={project.id} className="flex min-w-0">
                <Card interactive href={project.href} className="min-w-0 flex-1">
                  <CardTitle>
                    <bdi>{project.name}</bdi>
                  </CardTitle>
                  <p className={`${FIELD_NOTE} mt-1`}>
                    {fill(m.business.board.savedAt, {
                      date: formatSavedAt(project.createdAt, locale),
                    })}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : (
        <BusinessAccessNotice access={access} signInHref={signInHref} />
      )}
    </div>
  );
}
