import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cell, Page, Section, Swatch, Table, chainText, varOf } from "./shared";
import { SpecSheet } from "./spec-sheet";
import { type Mode, tokens } from "../tokens/index";

const component = tokens.layer("component");
const groups = [...new Set(component.map((t) => t.path.split(".")[0] ?? ""))];

function ComponentTokensPage({ mode }: { mode: Mode }) {
  return (
    <Page
      title={`Component tokens, ${mode} mode`}
      lead="One name per slot of a component, each referencing a semantic token (DESIGN.md §5). The chain reads component to semantic to primitive to value. The spec sheet below is painted from these names alone; it is not a component. E2-4 builds the real ones on top of this contract."
    >
      <Section title="Spec sheet (tokens only, not components)">
        <SpecSheet scope="component-tokens" />
      </Section>
      {groups.map((g) => (
        <Section key={g} title={g}>
          <Table head={["Token", `Chain, ${mode}`, "Chain, other mode"]}>
            {component
              .filter((t) => t.path.startsWith(`${g}.`))
              .map((t) => (
                <tr key={t.path}>
                  <Cell>
                    <span className="inline-flex items-center gap-2">
                      {t.type === "color" ? (
                        <Swatch cssVar={varOf(t)} label={`${t.path} in ${mode} mode`} />
                      ) : null}
                      <span className="font-mono">{t.path}</span>
                    </span>
                  </Cell>
                  <Cell mono>{chainText(t, mode)}</Cell>
                  <Cell mono>{chainText(t, mode === "light" ? "dark" : "light")}</Cell>
                </tr>
              ))}
          </Table>
        </Section>
      ))}
    </Page>
  );
}

const meta = {
  title: "Foundations/Component tokens",
  component: ComponentTokensPage,
  tags: ["autodocs"],
  args: { mode: "light" },
  render: (_args, { globals }) => <ComponentTokensPage mode={globals["mode"] as Mode} />,
} satisfies Meta<typeof ComponentTokensPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Contract: Story = {};
