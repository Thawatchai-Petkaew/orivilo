import type { Meta, StoryObj } from "@storybook/react-vite";
import { contrastRatio } from "./contrast";
import { Cell, Page, Section, Swatch, Table, chainText, varOf } from "./shared";
import { type Mode, tokens } from "../tokens/index";

const semantic = tokens.layer("semantic");
const groups = [...new Set(semantic.map((t) => t.path.split(".")[0] ?? ""))];

function SemanticPage({ mode }: { mode: Mode }) {
  return (
    <Page
      title={`Semantic, ${mode} mode`}
      lead="Names with meaning, the contract components and pages use (DESIGN.md §3). Each row shows the reference chain down to the primitive for the current mode and for the other mode, and the contrast of its declared pair. Values come from src/tokens/source/semantic.json; the swatch is painted by the CSS the app ships, so a mismatch would be visible here."
    >
      {groups.map((g) => (
        <Section key={g} title={g}>
          <Table head={["Token", "Chain, light", "Chain, dark", "Contrast", "Use for"]}>
            {semantic
              .filter((t) => t.path.startsWith(`${g}.`))
              .map((t) => {
                let contrast = "";
                if (t.contrast) {
                  const against = tokens.get("semantic", t.contrast.against);
                  const ratio = against
                    ? contrastRatio(
                        String(tokens.resolve(t, mode).value),
                        String(tokens.resolve(against, mode).value),
                      )
                    : null;
                  contrast =
                    ratio === null
                      ? "not measured"
                      : `${ratio.toFixed(1)} on ${t.contrast.against}${t.contrast.floor ? (ratio >= t.contrast.floor ? `, passes ${t.contrast.floor}` : `, fails ${t.contrast.floor}`) : ""}`;
                }
                return (
                  <tr key={t.path}>
                    <Cell>
                      <span className="inline-flex items-center gap-2">
                        {t.type === "color" ? (
                          <Swatch cssVar={varOf(t)} label={`${t.path} in ${mode} mode`} />
                        ) : null}
                        <span className="font-mono">{t.path}</span>
                      </span>
                    </Cell>
                    <Cell mono>{chainText(t, "light")}</Cell>
                    <Cell mono>{chainText(t, "dark")}</Cell>
                    <Cell>{contrast}</Cell>
                    <Cell>{t.description ?? ""}</Cell>
                  </tr>
                );
              })}
          </Table>
        </Section>
      ))}
    </Page>
  );
}

const meta = {
  title: "Foundations/Semantic",
  component: SemanticPage,
  tags: ["autodocs"],
  args: { mode: "light" },
  render: (_args, { globals }) => <SemanticPage mode={globals["mode"] as Mode} />,
} satisfies Meta<typeof SemanticPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Contract: Story = {};
