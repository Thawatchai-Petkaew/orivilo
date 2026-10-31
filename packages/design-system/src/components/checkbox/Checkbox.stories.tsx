import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Base/Checkbox",
  component: Checkbox,
  args: { label: "ส่งสรุปให้ทีมเมื่ออนุมัติ" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking the label toggles the box: the label is part of the hit area (catalog rule). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: "ส่งสรุปให้ทีมเมื่ออนุมัติ" });
    await expect(box).toHaveAttribute("aria-checked", "false");
    await userEvent.click(canvas.getByText("ส่งสรุปให้ทีมเมื่ออนุมัติ"));
    await expect(box).toHaveAttribute("aria-checked", "true");
  },
};

export const Checked: Story = { args: { defaultChecked: true } };

/** Exposed as aria-checked="mixed" with a minus glyph (AC 8). */
export const Indeterminate: Story = {
  args: { checked: "indeterminate", label: "เลือกทั้งหมด", description: "เลือกไว้ 2 จาก 5 รายการ" },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: "เลือกทั้งหมด" });
    await expect(box).toHaveAttribute("aria-checked", "mixed");
  },
};

/**
 * `sm` for tables and dense lists (ORV-72, AC 1): a 16 px box in small type, and a point 3 px
 * outside the box still hits it, so the target stays at least 24 px with the label hidden.
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3 p-4">
      <Checkbox {...args} size="sm" label="เล็ก" />
      <Checkbox {...args} size="md" label="กลาง" />
      <Checkbox {...args} size="sm" label="Small" />
      <Checkbox {...args} size="md" label={fixtures.longThai} />
      <Checkbox {...args} size="sm" label={<span className="sr-only">ซ่อนป้าย</span>} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const small = canvas.getByRole("checkbox", { name: "เล็ก" });
    const sm = small.getBoundingClientRect();
    const md = canvas.getByRole("checkbox", { name: "กลาง" }).getBoundingClientRect();
    await expect(sm.width).toBe(16);
    await expect(sm.width).toBeLessThan(md.width);
    const label = getComputedStyle(canvas.getByText("เล็ก"));
    const bodySm = getComputedStyle(document.documentElement)
      .getPropertyValue("--ds-type-body-sm-font-size")
      .trim();
    await expect(label.fontSize).toBe(bodySm);
    // ORV-80: the box sits on the centre of the label's first line, Thai or Latin, one line or many.
    for (const name of ["เล็ก", "กลาง", "Small", fixtures.longThai]) {
      const box = canvas.getByRole("checkbox", { name }).getBoundingClientRect();
      const label = canvasElement.querySelector(
        `label[for="${canvas.getByRole("checkbox", { name }).id}"]`,
      ) as HTMLElement;
      const line = parseFloat(getComputedStyle(label).lineHeight);
      const lineCentre = label.getBoundingClientRect().top + line / 2;
      await expect(Math.abs(box.top + box.height / 2 - lineCentre)).toBeLessThanOrEqual(1);
    }
    // ORV-80: sm keeps the md label gap.
    const gap = (name: string) => {
      const el = canvas.getByRole("checkbox", { name });
      const label = canvasElement.querySelector(`label[for="${el.id}"]`) as HTMLElement;
      return label.getBoundingClientRect().left - el.getBoundingClientRect().right;
    };
    await expect(gap("เล็ก")).toBe(gap("กลาง"));
    const hidden = canvas.getByRole("checkbox", { name: "ซ่อนป้าย" });
    await userEvent.click(hidden);
    await expect(hidden.querySelector("svg")?.getBoundingClientRect().width).toBe(12);
    const box = hidden.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const probes: [number, number][] = [
      [box.left - 3.5, cy],
      [box.right + 3.5, cy],
      [cx, box.top - 3.5],
      [cx, box.bottom + 3.5],
    ];
    for (const [x, y] of probes) {
      const hit = document.elementFromPoint(x, y);
      await expect(hit === hidden || hidden.contains(hit)).toBe(true);
    }
    await expect(hidden).toHaveAttribute("aria-checked", "true");
  },
};

/**
 * A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces the hover look (spec ORV-84,
 * `hover-force-1`). The hover rule keys on the `.ds-checkbox` root, not on the box that carries the `id`.
 */
export const InteractionStates: Story = {
  parameters: { pseudo: { rootSelector: "body", hover: [".ds-checkbox:has(#cb-hover)"] } },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} label="Default" id="cb-default" />
      <Checkbox {...args} label="Hover" id="cb-hover" />
      <Checkbox {...args} label="Focus" id="cb-focus" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByText("Hover"));
    canvas.getByRole("checkbox", { name: "Focus" }).focus();
    await expect(canvas.getByRole("checkbox", { name: "Focus" })).toHaveFocus();
    await waitFor(() =>
      expect(
        getComputedStyle(canvas.getByRole("checkbox", { name: "Hover" })).borderColor,
      ).not.toBe(getComputedStyle(canvas.getByRole("checkbox", { name: "Default" })).borderColor),
    );
  },
};

export const WithDescription: Story = {
  args: { description: "สรุปจะส่งทางอีเมลถึงทุกคนในโปรเจกต์" },
};

export const Invalid: Story = {
  args: {
    label: "ยอมรับเงื่อนไขการใช้งาน",
    error: "ติ๊กยอมรับเงื่อนไขก่อนจึงจะสร้างโปรเจกต์ได้",
    required: true,
  },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole("checkbox", { name: "ยอมรับเงื่อนไขการใช้งาน" });
    await expect(box).toHaveAttribute("aria-invalid", "true");
    await expect(box).toHaveAccessibleDescription("ติ๊กยอมรับเงื่อนไขก่อนจึงจะสร้างโปรเจกต์ได้");
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} disabled />
      <Checkbox {...args} disabled defaultChecked label="ปิดใช้งานและเลือกไว้" />
    </div>
  ),
};

export const LongLabelAt360: Story = {
  render: (args) => (
    <Narrow>
      <Checkbox {...args} label={fixtures.longThai} description={fixtures.longLatin} />
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Matrix>
      <Checkbox {...args} />
      <Checkbox {...args} defaultChecked label="เลือกไว้" />
      <Checkbox {...args} checked="indeterminate" label="บางส่วน" />
      <Checkbox {...args} error="ติ๊กยอมรับเงื่อนไขก่อน" label="ผิดพลาด" />
      <Checkbox {...args} disabled label="ปิดใช้งาน" />
      <Checkbox {...args} size="sm" defaultChecked label="เล็ก เลือกไว้" />
    </Matrix>
  ),
};
