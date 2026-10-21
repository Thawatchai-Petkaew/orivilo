import type { Meta, StoryObj } from "@storybook/react-vite";
import { useLayoutEffect, useRef, useState } from "react";
import type { Mode } from "../boundary/DesignProfileBoundary";
import { contrastRatio } from "./contrast";
import { COLOUR_TOKENS, cssVar } from "./tokens";

/**
 * Reads every semantic colour from the token CSS of the surrounding boundary and reports contrast.
 * The story remounts it when the toolbar mode changes, so the values are re-read.
 */
function ColourPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    if (!ref.current) return;
    const style = getComputedStyle(ref.current);
    const next: Record<string, string> = {};
    for (const token of COLOUR_TOKENS) {
      next[token.name] = style.getPropertyValue(cssVar(token.name)).trim().toUpperCase();
    }
    setValues(next);
  }, []);

  return (
    <div ref={ref} className="mx-auto max-w-5xl p-6">
      <h1 className="font-display text-display-md font-semibold">Colour</h1>
      <p className="mt-2 max-w-prose text-text-secondary">
        Every value below is read from the token CSS at render time. Contrast is computed on the
        page for display; E0-5 checks it in CI. Floors: 4.5 for text, 3 for UI edges.
      </p>
      <table className="mt-6 w-full border-collapse text-body-sm">
        <thead>
          <tr className="border-b border-border-control text-left">
            <th className="py-2 pr-4 font-medium">Token</th>
            <th className="py-2 pr-4 font-medium">Value</th>
            <th className="py-2 pr-4 font-medium">Against</th>
            <th className="py-2 pr-4 font-medium">Contrast</th>
            <th className="py-2 font-medium">Use for</th>
          </tr>
        </thead>
        <tbody>
          {COLOUR_TOKENS.map((token) => {
            const value = values[token.name] ?? "";
            const against = token.against ? (values[token.against] ?? "") : "";
            const ratio = token.against ? contrastRatio(value, against) : null;
            const meets = ratio !== null && token.floor !== null ? ratio >= token.floor : null;
            return (
              <tr key={token.name} className="border-b border-border-subtle align-top">
                <td className="py-2 pr-4 font-mono text-body-sm">{token.name}</td>
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block size-5 rounded-control border border-border-control"
                      style={{ background: `var(${cssVar(token.name)})` }}
                    />
                    <code className="font-mono">{value || "not resolved"}</code>
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono">{token.against ?? "surface"}</td>
                <td className="py-2 pr-4">
                  {ratio === null ? (
                    <span className="text-text-secondary">not measured</span>
                  ) : (
                    <span>
                      {ratio.toFixed(1)}
                      {meets === null ? "" : meets ? ", passes" : ", fails"}
                      {token.floor !== null ? ` (floor ${token.floor})` : ""}
                    </span>
                  )}
                </td>
                <td className="py-2">{token.note}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-4 max-w-prose text-text-secondary">
        Dark-mode placeholders until E0-5 computes them: surface.selected, surface.inverse, and the
        four feedback colours (DESIGN.md §3.2).
      </p>
    </div>
  );
}

const meta = {
  title: "Foundations/Colour",
  component: ColourPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Semantic colour tokens from DESIGN.md §3.1 and §3.2, read from src/tokens/orivilo.css. Switch the toolbar mode to see the dark set.",
      },
    },
  },
  render: (_args, { globals }) => <ColourPage key={globals["mode"] as Mode} />,
} satisfies Meta<typeof ColourPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tokens: Story = {};
