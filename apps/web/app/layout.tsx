import { DesignProfileBoundary, LocaleProvider } from "@orivilo/design-system";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getWebMessages } from "../i18n/locale";
import { LocaleSwitch } from "../i18n/LocaleSwitch";
import "./globals.css";

const NAV_LINK = "text-text-link underline-offset-4 hover:text-text-link-hover hover:underline";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getWebMessages();
  return { title: m.app.title, description: m.app.description };
}

/**
 * The shell is ORIVILO's own first customer (DESIGN.md §2): every screen renders inside the neutral
 * profile and follows the OS colour mode. The locale comes from the user's cookie (spec ORV-39) and
 * reaches every component through the provider. A customer preview opens its own boundary inside
 * this one (E2-11); nothing from the shell reaches it (DESIGN.md §9 item 10).
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, m } = await getWebMessages();
  return (
    <html lang={locale}>
      <body className="antialiased">
        <LocaleProvider locale={locale}>
          <DesignProfileBoundary profile="neutral" mode="system">
            <div className="min-h-dvh bg-surface-canvas font-body text-body-md text-text-primary">
              <header className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 pt-4">
                <nav aria-label={m.app.nav} className="flex items-center gap-4 text-label-md">
                  <Link
                    aria-label={m.app.home}
                    className="flex items-center gap-2 text-text-primary hover:text-text-link-hover"
                    href="/"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-control bg-brand-signature"
                    />
                    {m.app.title}
                  </Link>
                  <Link className={NAV_LINK} href="/directions">
                    {m.app.studio}
                  </Link>
                  <Link className={NAV_LINK} href="/account">
                    {m.app.account}
                  </Link>
                </nav>
                <LocaleSwitch locale={locale} label={m.app.languageSwitch} />
              </header>
              {children}
            </div>
          </DesignProfileBoundary>
        </LocaleProvider>
      </body>
    </html>
  );
}
