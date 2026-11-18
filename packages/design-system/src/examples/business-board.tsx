"use client";

import type { BusinessView } from "@orivilo/intent-engine";
import { Button, PageHeader } from "../components/index";
import { useLocale, useMessages } from "../i18n/LocaleProvider";
import { fill } from "../i18n/messages/index";
import { BusinessAccessNotice, type BusinessAccess } from "./business-access";
import { BusinessNodeView } from "./business-node-view";
import { FIELD_NOTE, formatSavedAt } from "./business-text";

/**
 * The project board screen, slice 1 (ORV-281 design sections 6.1 and 6.2): the project name, what
 * the page holds, when it was saved, then the five node views stacked in fill order. The present
 * board and its viewer are slice 2. It takes a `BusinessView`, which holds keys and values and no
 * resolved text, so a language switch redraws it with no second load. It knows no route.
 */
export interface BusinessBoardScreenProps {
  access: BusinessAccess;
  /** Where the sign-in link goes on a signed-out screen. */
  signInHref: string;
  /** Where the project list is. */
  listHref: string;
  /** The saved project. Required when `access` is `ready`, ignored otherwise. */
  view?: BusinessView | undefined;
}

export function BusinessBoardScreen(props: BusinessBoardScreenProps) {
  const m = useMessages();
  const locale = useLocale();
  const root = "@container mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 p-6 wrap-anywhere";
  if (props.access !== "ready") {
    return (
      <div className={root}>
        <PageHeader title={m.business.list.heading} />
        <BusinessAccessNotice access={props.access} signInHref={props.signInHref} />
      </div>
    );
  }
  const { view } = props;
  if (view === undefined) throw new Error("BusinessBoardScreen: access ready needs a view");
  return (
    <div className={root}>
      <PageHeader
        title={<bdi>{view.projectName}</bdi>}
        description={m.business.board.lede}
        meta={
          <span className={FIELD_NOTE}>
            {fill(m.business.board.savedAt, { date: formatSavedAt(view.savedAt, locale) })}
          </span>
        }
        actions={
          <Button asChild variant="secondary">
            <a href={props.listHref}>{m.business.list.heading}</a>
          </Button>
        }
      />
      <div className="flex min-w-0 flex-col gap-12">
        {view.nodes.map((node) => (
          <BusinessNodeView key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
