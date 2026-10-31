import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../button/Button";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { ReferenceIcon, SearchIcon } from "../icons";
import { Matrix, Narrow } from "../matrix";
import { InputGroup } from "./InputGroup";

/** A width cap around the story. Storybook adds a meta decorator to every story (a story's
 * `decorators: []` does not drop it), so each story that wants it names it. */
const inWidth = (Story: ComponentType) => (
  <div className="max-w-md">
    <Story />
  </div>
);

const meta = {
  title: "Base/Input group",
  component: InputGroup,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "An input with a start and an end slot (ORV-67): an icon, a text addon or a Button. One outline, one focus ring, one invalid and one disabled state for the whole group. A string slot is a text addon that the input reads through aria-describedby. A shortcut shows a Kbd and sets aria-keyshortcuts.",
      },
    },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A search field: an icon at the start. */
export const WithIcon: Story = {
  decorators: [inWidth],
  render: () => (
    <Field label="ค้นหา">
      <InputGroup start={<SearchIcon />} placeholder="ค้นหาโปรเจกต์" />
    </Field>
  ),
};

/** A text addon is read with the input (AC 3), and the Field's description still comes first. */
export const TextAddon: Story = {
  decorators: [inWidth],
  render: () => (
    <Field label="เว็บไซต์" description="ใส่ที่อยู่โดยไม่ต้องมี https://">
      <InputGroup start="https://" end=".com" placeholder="example" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("เว็บไซต์");
    const described = (input.getAttribute("aria-describedby") ?? "").split(" ");
    await expect(described).toHaveLength(3);
    const words = described.map(
      (id) => canvasElement.ownerDocument.getElementById(id)?.textContent,
    );
    await expect(words).toEqual(["ใส่ที่อยู่โดยไม่ต้องมี https://", "https://", ".com"]);
  },
};

/** One outline around all parts: the input has no edge of its own (AC 3). */
export const OneOutline: Story = {
  decorators: [inWidth],
  render: () => (
    <Field label="ลิงก์">
      <InputGroup
        start={<ReferenceIcon />}
        end={
          <Button variant="secondary" size="sm">
            {fixtures.latin}
          </Button>
        }
        placeholder="วางลิงก์"
      />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("ลิงก์");
    const group = input.closest<HTMLElement>(".ds-input-group") as HTMLElement;
    await expect(getComputedStyle(group).borderTopWidth).toBe("1px");
    await expect(getComputedStyle(input).borderTopWidth).toBe("0px");
    await expect(getComputedStyle(input).outlineStyle).toBe("none");
    // The Button stays inside the outline.
    const button = canvas.getByRole("button", { name: fixtures.latin });
    const g = group.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    await expect(b.top).toBeGreaterThan(g.top);
    await expect(b.bottom).toBeLessThan(g.bottom);
    await expect(b.right).toBeLessThan(g.right);
  },
};

/** Focus on the input turns the whole group's border to the brand and adds the halo, not around the input (AC 3; ORV-192 row 9). */
export const FocusRing: Story = {
  decorators: [inWidth],
  render: () => (
    <Field label="ค้นหา">
      <InputGroup start={<SearchIcon />} placeholder="ค้นหาโปรเจกต์" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("ค้นหา");
    const group = input.closest<HTMLElement>(".ds-input-group") as HTMLElement;
    await expect(getComputedStyle(group).outlineStyle).toBe("none");
    await userEvent.tab();
    await expect(input).toHaveFocus();
    // The group's border is the focus line (it turns to the resolved --ds-focus-ring) and the halo touches it;
    // the outline is transparent, kept for forced-colours mode.
    const probe = document.createElement("span");
    probe.style.color = "var(--ds-focus-ring)";
    group.appendChild(probe);
    const ring = getComputedStyle(probe).color;
    probe.remove();
    await waitFor(() => expect(getComputedStyle(group).borderTopColor).toBe(ring));
    await expect(getComputedStyle(group).outlineColor).toBe("rgba(0, 0, 0, 0)");
    await expect(getComputedStyle(group).boxShadow).not.toBe("none");
    await expect(getComputedStyle(input).outlineStyle).toBe("none");
    await expect(getComputedStyle(input).boxShadow).toBe("none");
  },
};

/** The error and the disabled state cover the whole group, and the Field supplies the message (AC 3). */
export const InvalidAndDisabled: Story = {
  decorators: [inWidth],
  render: () => (
    <div className="flex flex-col gap-4">
      <Field label="เว็บไซต์" error="ที่อยู่เว็บไซต์ไม่ถูกต้อง ลองใส่ตัวอย่างเช่น example.com">
        <InputGroup start="https://" defaultValue="exa mple" />
      </Field>
      <Field label="ปิดใช้งาน" disabled>
        <InputGroup start="https://" end={<Button size="sm">{fixtures.latin}</Button>} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas.getByLabelText("เว็บไซต์");
    await expect(invalid).toHaveAttribute("aria-invalid", "true");
    await expect(invalid.closest(".ds-input-group")).toHaveAttribute("data-invalid");
    await expect(invalid).toHaveAccessibleDescription(/ที่อยู่เว็บไซต์ไม่ถูกต้อง/);
    const disabled = canvas.getByLabelText("ปิดใช้งาน");
    await expect(disabled).toBeDisabled();
    await expect(disabled.closest(".ds-input-group")).toHaveAttribute("data-disabled");
  },
};

/** A shortcut shows a Kbd at the end, hidden from assistive tech, and the input announces it (AC 4). */
export const Shortcut: Story = {
  decorators: [inWidth],
  render: () => (
    <Field label="ค้นหา">
      <InputGroup start={<SearchIcon />} shortcut="Mod+K" placeholder="ค้นหาคำสั่ง" />
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText("ค้นหา");
    // Mod is Control, or Meta on Apple.
    await expect(input.getAttribute("aria-keyshortcuts")).toMatch(/^(Control|Meta)\+K$/);
    const hint = canvasElement.querySelector("kbd")?.closest("[aria-hidden]");
    await expect(hint).toHaveAttribute("aria-hidden", "true");
    await expect(canvasElement.querySelectorAll("kbd").length).toBeGreaterThanOrEqual(2);
    // Kbd is the last part of the group.
    const group = input.closest(".ds-input-group") as HTMLElement;
    await expect(group.lastElementChild).toBe(hint);
    await expect(input.getAttribute("aria-describedby")).toBeNull();
  },
};

export const Sizes: Story = {
  decorators: [inWidth],
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <Field key={size} label={size}>
          <InputGroup size={size} start={<SearchIcon />} end="THB" placeholder="0" />
        </Field>
      ))}
    </div>
  ),
};

export const LongValueAt360: Story = {
  decorators: [inWidth],
  render: () => (
    <Narrow>
      <Field label={fixtures.longThai}>
        <InputGroup
          start={<SearchIcon />}
          end={<Button size="sm">{fixtures.latin}</Button>}
          shortcut="Mod+K"
          defaultValue={fixtures.longThai}
        />
      </Field>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector<HTMLElement>(".ds-input-group") as HTMLElement;
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Field label="ค้นหา">
        <InputGroup start={<SearchIcon />} shortcut="Mod+K" placeholder="ค้นหาคำสั่ง" />
      </Field>
      <Field label="เว็บไซต์">
        <InputGroup start="https://" end=".com" defaultValue={fixtures.latin} />
      </Field>
      <Field label="ลิงก์">
        <InputGroup
          end={<Button size="sm">{fixtures.latin}</Button>}
          defaultValue={fixtures.mixed}
        />
      </Field>
      <Field label="ผิดพลาด" error="ใส่ชื่อโปรเจกต์อย่างน้อย 3 ตัวอักษร">
        <InputGroup start={<SearchIcon />} defaultValue="ab" />
      </Field>
      <Field label="ปิดใช้งาน" disabled>
        <InputGroup start="https://" defaultValue={fixtures.latin} />
      </Field>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
    // The matrix is not inside the width cap: a meta decorator wrapping this story would narrow it.
    await expect(canvasElement.querySelector(".max-w-md")).toBeNull();
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(canvasElement.querySelectorAll(".ds-input-group")).toHaveLength(6 * 5);
  },
};
