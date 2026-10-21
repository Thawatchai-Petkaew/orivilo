import type { ReactNode } from "react";
import { type Mode, type Token, TokenSet, displayValue, tokens } from "../tokens/index";

/** Reads the chain and the resolved value of a token for one mode, in the base set unless given one. */
export function chainText(token: Token, mode: Mode, set: TokenSet = tokens): string {
  const { chain, value } = set.resolve(token, mode);
  const names = chain.map((c) => c.split(":")[1]);
  return [...names, displayValue(value, token.type)].join(" > ");
}

export function Swatch({ cssVar, label }: { cssVar: string; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-block size-6 shrink-0 rounded-check border border-border-subtle align-middle"
      style={{ background: `var(${cssVar})` }}
    />
  );
}

export function Page({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="font-display text-display-md">{title}</h1>
      <p className="mt-2 max-w-prose text-body-md text-text-secondary">{lead}</p>
      {children}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-heading-sm">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-body-sm">
        <thead>
          <tr className="border-b border-border-control text-left">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const Cell = ({ children, mono = false }: { children: ReactNode; mono?: boolean }) => (
  <td className={`border-b border-border-subtle py-2 pr-4 align-top ${mono ? "font-mono" : ""}`}>
    {children}
  </td>
);

export const varOf = (token: Token) => TokenSet.cssVar(token);
