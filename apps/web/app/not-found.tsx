import Link from "next/link";
import { getWebMessages } from "../i18n/locale";

/**
 * The page Next.js serves for an unknown address (ORV-161). Its own copy replaces the built-in
 * English page, which has no landmark and ignores the locale. The 404 status comes from Next.js.
 */
export default async function NotFound() {
  const { m } = await getWebMessages();
  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-start gap-6 px-4 pt-24 pb-12">
      <h1 className="font-display text-display-md text-balance">{m.notFound.heading}</h1>
      <p className="text-body-md text-text-secondary">{m.notFound.body}</p>
      <p className="text-body-md">
        <Link
          className="text-text-link underline-offset-4 hover:text-text-link-hover hover:underline"
          href="/"
        >
          {m.notFound.home}
        </Link>
      </p>
    </main>
  );
}
