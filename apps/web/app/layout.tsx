import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORIGO",
  description: "From business intent to living digital products.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-surface text-on-surface antialiased">{children}</body>
    </html>
  );
}
