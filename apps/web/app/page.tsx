import { fill, PROFILES } from "@orivilo/design-system";
import { designProfileSchema } from "@orivilo/intent-engine";
import Link from "next/link";
import { getWebMessages } from "../i18n/locale";

const schemaVersion = designProfileSchema.shape.schemaVersion.value;

/** What exists today, stated as it is (AGENTS.md rule 4); every line names the story that made it real. */
export default async function Home() {
  const { m } = await getWebMessages();
  const params = { count: PROFILES.length, list: PROFILES.join(", "), version: schemaVersion };
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-display-md">{m.home.headline}</h1>
        <p className="max-w-prose text-body-lg text-text-secondary">{m.home.tagline}</p>
        <p className="text-body-md">
          <Link
            className="text-text-link underline-offset-4 hover:text-text-link-hover hover:underline"
            href="/workspace"
          >
            {m.home.openWorkspace}
          </Link>
        </p>
        <p className="text-body-md">
          <Link
            className="text-text-link underline-offset-4 hover:text-text-link-hover hover:underline"
            href="/directions"
          >
            {m.home.openDirections}
          </Link>
        </p>
        <p className="text-body-md">
          <Link
            className="text-text-link underline-offset-4 hover:text-text-link-hover hover:underline"
            href="/account"
          >
            {m.home.openAccount}
          </Link>
        </p>
      </header>

      <section aria-labelledby="real" className="flex flex-col gap-3">
        <h2 id="real" className="text-heading-sm">
          {m.home.realHeading}
        </h2>
        <ul className="flex flex-col gap-2">
          {m.home.real.map((item) => (
            <li
              key={item.story}
              className="flex gap-3 rounded-container border border-border-card bg-surface-card p-4"
            >
              <span className="shrink-0 font-mono text-label-sm whitespace-nowrap text-text-secondary">
                {item.story}
              </span>
              <span>{fill(item.what, params)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="not-yet" className="flex flex-col gap-3">
        <h2 id="not-yet" className="text-heading-sm">
          {m.home.notYetHeading}
        </h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-text-secondary">
          {m.home.notYet.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-body-sm text-text-secondary">
          {fill(m.home.schemaLine, params)}{" "}
          <a
            className="text-text-link underline underline-offset-4 hover:text-text-link-hover"
            href="https://tpetkaew.atlassian.net/browse/ORV"
          >
            {m.home.backlogLink}
          </a>
        </p>
      </section>
    </main>
  );
}
