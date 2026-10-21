import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Field } from "../field/Field";
import { fixtureOptions } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Select } from "./Select";

const meta = {
  title: "Base/Select",
  component: Select,
  args: { options: fixtureOptions },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Field label="โมดูล">
          <Story />
        </Field>
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

export const Default: Story = {};

export const Sizes: Story = {
  decorators: [],
  render: (args) => (
    <div className="flex max-w-md flex-col gap-4">
      <Field label="เล็ก">
        <Select {...args} size="sm" />
      </Field>
      <Field label="กลาง">
        <Select {...args} size="md" />
      </Field>
      <Field label="ใหญ่">
        <Select {...args} size="lg" />
      </Field>
    </div>
  ),
};

export const WithValue: Story = { args: { defaultValue: "product" } };

/** Keyboard: Enter opens, arrows move, Enter chooses, Escape closes and returns focus. */
export const Open: Story = {
  args: { defaultValue: "canvas" },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const listbox = await body().findByRole("listbox");
    const selected = within(listbox).getByRole("option", { name: "Brand Canvas" });
    await expect(selected).toHaveAttribute("aria-selected", "true");
    await expect(within(listbox).getByRole("option", { name: "เก็บถาวรแล้ว" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Design System");
    await expect(trigger).toHaveFocus();
  },
};

/** The listbox is rendered in a portal and still carries the trigger's profile (AC 7). */
export const InsideProfile: Story = {
  decorators: [],
  render: (args) => (
    <DesignProfileBoundary profile="professional" mode="dark">
      <div className="max-w-md rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Field label="โมดูล">
          <Select {...args} defaultValue="review" />
        </Field>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    await userEvent.click(trigger);
    const listbox = await body().findByRole("listbox");
    const scope = listbox.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("professional");
    await expect(scope?.dataset["mode"]).toBe("dark");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(listbox)).toBe(read(trigger));
    await userEvent.keyboard("{Escape}");
  },
};

export const Invalid: Story = {
  decorators: [],
  render: (args) => (
    <div className="max-w-md">
      <Field label="โมดูล" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select {...args} />
      </Field>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true, defaultValue: "canvas" } };

/** No options yet: the list says so instead of opening blank. */
export const Empty: Story = {
  args: { options: [], emptyText: "ยังไม่มีโมดูล สร้างโมดูลแรกจากหน้าโปรเจกต์" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    await expect(await body().findByText(/ยังไม่มีโมดูล/)).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const LongOptionAt360: Story = {
  decorators: [],
  render: (args) => (
    <Narrow>
      <Field label="โมดูล">
        <Select {...args} defaultValue="long" />
      </Field>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  decorators: [],
  render: (args) => (
    <Matrix>
      <Field label="โมดูล">
        <Select {...args} defaultValue="product" />
      </Field>
      <Field label="ผิดพลาด" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select {...args} />
      </Field>
    </Matrix>
  ),
};
