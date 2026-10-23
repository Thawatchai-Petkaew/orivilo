import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Progress } from "./Progress";

const meta = {
  title: "Base/Progress",
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "How far a job has got (E4-5). A known length shows the bar and the value as text; an unknown length shows a moving bar and the word Working, static under reduced motion. Done and failed say so in words with an icon. The stories are mock jobs, not live generation.",
      },
    },
  },
  args: { label: "สร้างโลโก้", value: 40 },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A bar with its range, a visible label and the value as text. */
export const Determinate: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar", { name: "สร้างโลโก้" });
    await expect(bar).toHaveAttribute("aria-valuenow", "40");
    await expect(bar).toHaveAttribute("aria-valuemin", "0");
    await expect(bar).toHaveAttribute("aria-valuemax", "100");
    await expect(bar).toHaveAttribute("aria-valuetext", "40%");
    await expect(canvas.getByText("40%")).toBeVisible();
    await expect(canvas.getByText("สร้างโลโก้")).toBeVisible();
  },
};

/** The value is clamped to 0 to max; `max` other than 100 scales the text. */
export const Clamped: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Progress label="เกินช่วง" value={140} />
      <Progress label="ต่ำกว่าช่วง" value={-5} />
      <Progress label="ครึ่งหนึ่ง" value={3} max={6} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("progressbar", { name: "เกินช่วง" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    await expect(canvas.getByRole("progressbar", { name: "ต่ำกว่าช่วง" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    const half = canvas.getByRole("progressbar", { name: "ครึ่งหนึ่ง" });
    await expect(half).toHaveAttribute("aria-valuemax", "6");
    await expect(half).toHaveAttribute("aria-valuetext", "50%");
  },
};

/** No `aria-valuenow`, `aria-busy` set, and the text says Working. */
export const Indeterminate: Story = {
  args: { value: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole("progressbar", { name: "สร้างโลโก้" });
    await expect(bar).not.toHaveAttribute("aria-valuenow");
    await expect(bar).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByText("กำลังทำงาน")).toBeVisible();
  },
};

/** Under reduced motion the sweep is switched off by the recipe; the text still says Working. */
export const ReducedMotion: Story = {
  args: { value: undefined },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("กำลังทำงาน")).toBeVisible();
    const fill = canvasElement.querySelector<HTMLElement>(".ds-progress__fill");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The browser applies the media rule when the user asks for less motion; no sweep then.
    await expect(getComputedStyle(fill as HTMLElement).animationName === "none").toBe(reduce);
    // And the rule exists: inside the reduced-motion media query the fill's animation is none.
    const rules: CSSStyleRule[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion")) {
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule && inner.selectorText.includes("ds-progress")) {
              rules.push(inner);
            }
          }
        }
      }
    }
    await expect(rules.some((r) => r.style.animationName === "none")).toBe(true);
  },
};

/** A finished job says so in words with an icon, in a status region; the bar is full. */
export const Done: Story = {
  args: { status: "done", value: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("เสร็จแล้ว");
    const bar = canvas.getByRole("progressbar", { name: "สร้างโลโก้" });
    await expect(bar).toHaveAttribute("aria-valuenow", "100");
    await expect(bar).toHaveAttribute("aria-valuetext", "เสร็จแล้ว");
  },
};

/** A failed job keeps where it stopped and says Failed in words with an icon. */
export const Failed: Story = {
  args: { status: "failed" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("status")).toHaveTextContent("ไม่สำเร็จ");
    const bar = canvas.getByRole("progressbar", { name: "สร้างโลโก้" });
    await expect(bar).toHaveAttribute("aria-valuenow", "40");
    await expect(bar).toHaveAttribute("aria-valuetext", "ไม่สำเร็จ");
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Progress label="เล็ก" value={60} size="sm" />
      <Progress label="กลาง" value={60} size="md" />
    </div>
  ),
};

export const LongLabelAt360: Story = {
  render: () => (
    <Narrow>
      <Progress label={fixtures.longThai} value={72} />
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(".ds-progress");
    await expect((root?.scrollWidth ?? 0) <= (root?.clientWidth ?? 0)).toBe(true);
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Progress label="กำลังสร้าง" value={40} />
      <Progress label="ไม่ทราบความยาว" />
      <Progress label="เสร็จ" status="done" size="sm" />
      <Progress label="พลาด" value={25} status="failed" size="sm" />
    </Matrix>
  ),
  decorators: [],
};
