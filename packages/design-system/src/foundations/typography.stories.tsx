import type { Meta, StoryObj } from "@storybook/react-vite";

interface Step {
  role: string;
  /** Utilities from the type scale in src/tokens/orivilo.css (DESIGN.md §4). */
  className: string;
  spec: string;
}

const SCALE: readonly Step[] = [
  {
    role: "Display 56",
    className: "font-display text-display-lg font-semibold",
    spec: "56 / 1.2, weight 600",
  },
  {
    role: "Display 32",
    className: "font-display text-display-md font-semibold",
    spec: "32 / 1.25, weight 600",
  },
  { role: "Body 20", className: "font-body text-body-lg", spec: "20 / 1.5, weight 400" },
  { role: "Body 16", className: "font-body text-body-md", spec: "16 / 1.7, weight 400" },
  { role: "Body 14", className: "font-body text-body-sm", spec: "14 / 1.6, weight 400" },
  { role: "Mono 14", className: "font-mono text-body-sm", spec: "14 / 1.6, weight 400" },
];

const SAMPLE = "ระบบตั้งใจ Intent Engine ตีความแบรนด์ให้เป็นผลิตภัณฑ์ที่มีชีวิต 0123";
const LONG_THAI = "บริษัทออริวิโลเทคโนโลยีสร้างสรรค์จำกัดมหาชนสาขากรุงเทพมหานคร";

function TypographyPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="font-display text-display-md font-semibold">Typography</h1>
      <p className="mt-2 max-w-prose text-text-secondary">
        Thai and Latin on the same line at each step of the scale. Loopless Anuphan at 24 px and
        above, looped IBM Plex Sans Thai below. Fonts are self-hosted from this package. No
        letter-spacing and no text-transform on Thai.
      </p>
      <dl className="mt-8 space-y-8">
        {SCALE.map((step) => (
          <div key={step.role} className="border-b border-border-subtle pb-6">
            <dt className="font-mono text-body-sm text-text-secondary">
              {step.role}: {step.spec}
            </dt>
            <dd className={step.className}>{SAMPLE}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-10 font-display text-body-lg font-semibold">
        Fixture lines every component must survive
      </h2>
      <ul className="mt-3 space-y-2">
        <li>{LONG_THAI}</li>
        <li>A long Latin word: Donaudampfschifffahrtsgesellschaftskapitän</li>
        <li className="text-text-secondary">
          A missing value: shown as an empty state, never as a placeholder number
        </li>
      </ul>
    </div>
  );
}

const meta = {
  title: "Foundations/Typography",
  component: TypographyPage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "The type scale from DESIGN.md §4 with Thai and Latin together, self-hosted fonts.",
      },
    },
  },
} satisfies Meta<typeof TypographyPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {};
