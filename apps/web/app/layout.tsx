import { DesignProfileBoundary } from "@orivilo/design-system";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORIVILO",
  description: "From business intent to living digital products.",
};

/**
 * The shell is ORIVILO's own first customer (DESIGN.md §2): every screen renders inside the neutral
 * profile and follows the OS colour mode. A customer preview opens its own boundary inside this one
 * (E2-11); nothing from the shell reaches it (DESIGN.md §9 item 10).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="antialiased">
        <DesignProfileBoundary profile="neutral" mode="system">
          <div className="min-h-dvh bg-surface-canvas font-body text-body-md text-text-primary">
            {children}
          </div>
        </DesignProfileBoundary>
      </body>
    </html>
  );
}
