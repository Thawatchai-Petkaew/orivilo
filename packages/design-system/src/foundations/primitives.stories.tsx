import type { Meta, StoryObj } from "@storybook/react-vite";
import { contrastRatio } from "./contrast";
import { Cell, Page, Section, Table, varOf } from "./shared";
import { displayValue, tokens } from "../tokens/index";

const prims = tokens.layer("primitive");
const group = (prefix: string) => prims.filter((t) => t.path.startsWith(prefix));
const families = ["gray", "violet", "lime", "red", "amber", "green", "blue"];
const INK = "#16151D";
const WHITE = "#FFFFFF";

function Ramp({ family }: { family: string }) {
  const steps = group(`color.${family}.`);
  return (
    <div className="mt-4">
      <h3 className="text-label-md">{family}</h3>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {steps.map((t) => {
          const hex = String(t.raw);
          const best = Math.max(contrastRatio(INK, hex) ?? 0, contrastRatio(WHITE, hex) ?? 0);
          return (
            <div key={t.path} className="text-label-sm">
              <div
                role="img"
                aria-label={`${t.path} ${hex}`}
                className="h-10 rounded-check border border-border-subtle"
                style={{ background: `var(${varOf(t)})` }}
              />
              <div className="mt-1 flex justify-between">
                <span>{t.path.split(".")[2]}</span>
                <span className="text-text-secondary">{best.toFixed(1)}</span>
              </div>
              <div className="font-mono text-text-secondary">{hex}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrimitivesPage() {
  return (
    <Page
      title="Primitives"
      lead="Raw scales with no meaning attached: the lowest layer of DESIGN.md §5. Only semantic tokens may reference them. Values come from src/tokens/source/primitives.json. Each colour chip shows the step, its hex, and the best contrast ink or white reaches on it."
    >
      <Section title="Colour ramps">
        {families.map((f) => (
          <Ramp key={f} family={f} />
        ))}
      </Section>
      <Section title="Radius">
        <div className="flex flex-wrap gap-4">
          {group("radius.").map((t) => (
            <div key={t.path} className="text-center text-label-sm">
              <div
                className="size-16 border-2 border-border-strong"
                style={{ borderRadius: `var(${varOf(t)})` }}
              />
              <div className="mt-1 font-mono">{t.path.split(".")[1]}</div>
              <div className="text-text-secondary">{String(t.raw)}</div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Space">
        <div className="flex flex-col gap-1">
          {group("space.").map((t) => (
            <div key={t.path} className="flex items-center gap-3 text-label-sm">
              <span className="w-10 font-mono">{t.path.split(".")[1]}</span>
              <span className="h-3 bg-action-primary" style={{ width: `var(${varOf(t)})` }} />
              <span className="text-text-secondary">{String(t.raw)}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Size">
        <Table head={["Token", "Value"]}>
          {group("size.").map((t) => (
            <tr key={t.path}>
              <Cell mono>{t.path}</Cell>
              <Cell>{String(t.raw)}</Cell>
            </tr>
          ))}
        </Table>
      </Section>
      <Section title="Type">
        <Table head={["Token", "Value"]}>
          {group("font.").map((t) => (
            <tr key={t.path}>
              <Cell mono>{t.path}</Cell>
              <Cell>{displayValue(t.raw, t.type)}</Cell>
            </tr>
          ))}
        </Table>
      </Section>
      <Section title="Shadow, blur, opacity, motion, breakpoints, z-index">
        <Table head={["Token", "Value"]}>
          {[
            ...group("shadow."),
            ...group("blur."),
            ...group("opacity."),
            ...group("duration."),
            ...group("easing."),
            ...group("breakpoint."),
            ...group("z."),
          ].map((t) => (
            <tr key={t.path}>
              <Cell mono>{t.path}</Cell>
              <Cell>{displayValue(t.raw, t.type)}</Cell>
            </tr>
          ))}
        </Table>
      </Section>
    </Page>
  );
}

const meta = {
  title: "Foundations/Primitives",
  component: PrimitivesPage,
  tags: ["autodocs"],
} satisfies Meta<typeof PrimitivesPage>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Scales: Story = {};
