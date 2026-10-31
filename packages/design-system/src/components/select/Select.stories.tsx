import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Field } from "../field/Field";
import { fixtureOptions, fixtures } from "../fixtures";
import { ArtifactIcon, DirectionIcon, KnowledgeIcon, NoteIcon, ReferenceIcon } from "../icons";
import { expectFocusBorderForm } from "../../testing/visual-asserts";
import { Matrix, Narrow } from "../matrix";
import { Select, type SelectGroup, type SelectOption, type SelectProps } from "./Select";

/** The flat form; the grouped form is told by its own stories. */
type FlatSelectProps = Extract<SelectProps, { options: readonly SelectOption[] }>;

/** Options that say more than one word: an icon, a second line, a long Thai line, a disabled one. */
const richOptions: readonly SelectOption[] = [
  {
    value: "canvas",
    label: "Brand Canvas",
    icon: <ArtifactIcon />,
    description: "พื้นที่รวมแหล่งข้อมูล การสังเคราะห์ และการตัดสินใจของแบรนด์",
  },
  {
    value: "design-system",
    label: "Design System",
    icon: <DirectionIcon />,
    description: "Tokens, recipes and components in one place",
  },
  { value: "product", label: "ผลิตภัณฑ์", icon: <KnowledgeIcon /> },
  {
    value: "long",
    label: fixtures.longThai,
    icon: <NoteIcon />,
    description: fixtures.longThai,
  },
  {
    value: "archived",
    label: "เก็บถาวรแล้ว",
    icon: <ReferenceIcon />,
    description: "ไม่รับการเปลี่ยนแปลงอีก",
    disabled: true,
  },
];

const groups: readonly SelectGroup[] = [
  {
    label: "ออกแบบ",
    options: [
      { value: "canvas", label: "Brand Canvas", icon: <ArtifactIcon /> },
      { value: "design-system", label: "Design System", description: "Tokens and recipes" },
    ],
  },
  { label: "ไม่มีรายการ", options: [] },
  {
    label: "ส่งมอบ",
    options: [
      { value: "review", label: "Review", icon: <ReferenceIcon /> },
      { value: "product", label: "ผลิตภัณฑ์", icon: <KnowledgeIcon /> },
      { value: "archived", label: "เก็บถาวรแล้ว", disabled: true },
    ],
  },
];

/** A Field around the story, for stories of one control. Storybook adds a meta decorator to every
 * story (a story's `decorators: []` does not drop it), so each story that wants it names it. */
const inField = (Story: ComponentType) => (
  <div className="max-w-md">
    <Field label="โมดูล">
      <Story />
    </Field>
  </div>
);

const meta = {
  title: "Base/Select",
  component: Select,
  args: { options: fixtureOptions },
  parameters: { layout: "padded" },
} satisfies Meta<FlatSelectProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

export const Default: Story = { decorators: [inField] };

export const Sizes: Story = {
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
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

export const WithValue: Story = { decorators: [inField], args: { defaultValue: "product" } };

/** Keyboard: Enter opens, arrows move, Enter chooses, Escape closes and returns focus. */
export const Open: Story = {
  decorators: [inField],
  args: { defaultValue: "canvas" },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const listbox = await body().findByRole("listbox");
    // Border form (ORV-192 row 9): the listbox panel's border turns focus.ring and its elevation stays.
    await expectFocusBorderForm(listbox);
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

/** AC 1 and 2: icon before the label, description as a second line, trigger keeps one line. */
export const IconsAndDescriptions: Story = {
  decorators: [inField],
  args: { options: richOptions },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    await userEvent.click(trigger);
    const listbox = await body().findByRole("listbox");
    const option = within(listbox).getByRole("option", { name: "Brand Canvas" });
    // The accessible name is the label only; the description is the option's description.
    await expect(option).toHaveAccessibleName("Brand Canvas");
    await expect(option).toHaveAccessibleDescription(
      "พื้นที่รวมแหล่งข้อมูล การสังเคราะห์ และการตัดสินใจของแบรนด์",
    );
    const icon = option.querySelector("svg");
    await expect(icon).not.toBeNull();
    await expect(icon?.closest("[aria-hidden='true']")).not.toBeNull();
    const description = option.querySelector(".ds-menu__option-description");
    await expect(description).not.toBeNull();
    // The icon comes before the label in the DOM, the description after it.
    const text = option.textContent ?? "";
    await expect(text.indexOf("Brand Canvas")).toBeLessThan(text.indexOf("พื้นที่รวม"));
    // An option without a description carries no description and no empty line.
    const plain = within(listbox).getByRole("option", { name: "ผลิตภัณฑ์" });
    await expect(plain).not.toHaveAttribute("aria-describedby");
    await expect(plain.querySelector(".ds-menu__option-description")).toBeNull();
    await userEvent.click(option);
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    // AC 2: the trigger shows the icon and the label, never the description.
    await expect(trigger).toHaveTextContent("Brand Canvas");
    await expect(trigger).not.toHaveTextContent("พื้นที่รวม");
    await expect(trigger.querySelector("svg")).not.toBeNull();
    await expect(trigger.querySelector(".ds-menu__option-description")).toBeNull();
  },
};

/** AC 3: groups with headings; arrow keys and type-ahead cross groups; an empty group is not rendered. */
export const Grouped: Story = {
  decorators: [inField],
  render: () => <Select groups={groups} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("combobox", { name: "โมดูล" });
    await userEvent.click(trigger);
    const listbox = await body().findByRole("listbox");
    const found = within(listbox).getAllByRole("group");
    await expect(found).toHaveLength(2);
    await expect(within(listbox).getByRole("group", { name: "ออกแบบ" })).toBeVisible();
    await expect(within(listbox).getByRole("group", { name: "ส่งมอบ" })).toBeVisible();
    await expect(within(listbox).queryByText("ไม่มีรายการ")).toBeNull();
    const highlighted = () => listbox.querySelector("[data-highlighted]")?.textContent ?? "";
    // The first option is highlighted on open; ArrowDown walks into the next group.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(highlighted()).toContain("Review"));
    // Type-ahead runs across groups: "B" goes back to Brand Canvas in the first group.
    await userEvent.keyboard("b");
    await waitFor(() => expect(highlighted()).toContain("Brand Canvas"));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(body().queryByRole("listbox")).toBeNull());
    await expect(trigger).toHaveTextContent("Brand Canvas");
  },
};

/** Groups with nothing in them show the empty line, not a blank listbox. */
export const GroupedEmpty: Story = {
  decorators: [inField],
  render: () => <Select groups={[{ label: "ออกแบบ", options: [] }]} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    await expect(await body().findByText("ไม่มีตัวเลือก")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const RichAt360: Story = {
  args: { options: richOptions },
  render: (args) => (
    <Narrow>
      <Field label="โมดูล">
        <Select {...args} defaultValue="long" />
      </Field>
    </Narrow>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    await expect(await body().findByRole("listbox")).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Field label="โมดูล" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select {...args} />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};

export const Disabled: Story = {
  decorators: [inField],
  args: { disabled: true, defaultValue: "canvas" },
};

/** No options yet: the list says so instead of opening blank. */
export const Empty: Story = {
  decorators: [inField],
  args: { options: [], emptyText: "ยังไม่มีโมดูล สร้างโมดูลแรกจากหน้าโปรเจกต์" },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("combobox", { name: "โมดูล" }));
    await expect(await body().findByText(/ยังไม่มีโมดูล/)).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};

export const LongOptionAt360: Story = {
  render: (args) => (
    <Narrow>
      <Field label="โมดูล">
        <Select {...args} defaultValue="long" />
      </Field>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <Field label="โมดูล">
        <Select {...args} defaultValue="product" />
      </Field>
      <Field label="ผิดพลาด" error="เลือกโมดูลที่งานนี้สังกัด">
        <Select {...args} />
      </Field>
      <Field label="รายละเอียด">
        <Select options={richOptions} defaultValue="canvas" />
      </Field>
      <Field label="กลุ่ม">
        <Select groups={groups} defaultValue="review" />
      </Field>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    // No Field nested in a Field: a meta decorator wrapping this story would break its labels.
    await expect(canvasElement.querySelectorAll(".ds-field .ds-field")).toHaveLength(0);
  },
};
