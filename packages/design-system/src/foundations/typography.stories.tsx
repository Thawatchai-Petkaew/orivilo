import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

interface Step {
  role: string;
  /** Utilities from the type scale in src/tokens/orivilo.css (DESIGN.md §4). */
  className: string;
  spec: string;
}

const SCALE: readonly Step[] = [
  {
    role: "Display 56",
    className: "font-display text-display-lg",
    spec: "56 / 1.2, weight 500",
  },
  {
    role: "Display 32",
    className: "font-display text-display-md",
    spec: "32 / 1.25, weight 500",
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
      <h1 className="font-display text-display-md">Typography</h1>
      <p className="mt-2 max-w-prose text-text-secondary">
        Thai and Latin on the same line at each step of the scale. Loopless Anuphan at 24 px and
        above, looped Sarabun below with Latin and digits in IBM Plex Sans. Fonts are self-hosted
        from this package. No letter-spacing and no text-transform on Thai.
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
      <h2 className="mt-10 font-display text-heading-sm">
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

/**
 * The body role sets Thai in looped Sarabun and Latin in IBM Plex Sans (ORV-58): the stack names
 * Plex first, and the self-hosted Sarabun face loads for a Thai character.
 */
export const Scale: Story = {
  play: async ({ canvasElement }) => {
    const body = canvasElement.querySelector<HTMLElement>(".font-body");
    if (!body) throw new Error("no body sample");
    await expect(getComputedStyle(body).fontFamily).toMatch(/^"IBM Plex Sans", Sarabun,/);
    const thai = await document.fonts.load("400 16px Sarabun", "ก");
    await expect(thai.map((f) => f.family.replaceAll('"', ""))).toContain("Sarabun");
    const latin = await document.fonts.load("400 16px Sarabun", "A");
    await expect(latin).toHaveLength(0);
    const weight = (el: Element | null) => getComputedStyle(el as HTMLElement).fontWeight;
    for (const cls of [".text-display-lg", ".text-display-md", "h1", "h2"]) {
      await expect(weight(canvasElement.querySelector(cls)), cls).toBe("500");
    }
    for (const cls of [".text-body-lg", ".text-body-md", ".text-body-sm"]) {
      await expect(weight(canvasElement.querySelector(cls)), cls).toBe("400");
    }
    const medium = await document.fonts.load("500 20px Sarabun", "ก");
    await expect(medium.map((f) => f.family.replaceAll('"', ""))).toContain("Sarabun");
  },
};
