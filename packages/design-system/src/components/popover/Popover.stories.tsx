import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Button } from "../button/Button";
import { Field } from "../field/Field";
import { fixtures } from "../fixtures";
import { Input } from "../input/Input";
import { Matrix } from "../matrix";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "./Popover";

const meta = {
  title: "Base/Popover",
  component: Popover,
  parameters: { layout: "centered" },
  args: {
    children: (
      <>
        <PopoverTrigger>
          <Button variant="secondary">เปลี่ยนชื่อ</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="เปลี่ยนชื่อโปรเจกต์">
          <form
            className="flex w-72 max-w-full flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <Field label="ชื่อใหม่">
              <Input defaultValue={fixtures.mixed} />
            </Field>
            <div className="flex justify-end gap-2">
              <PopoverClose>
                <Button variant="ghost">ยกเลิก</Button>
              </PopoverClose>
              <Button variant="primary" type="submit">
                บันทึกชื่อ
              </Button>
            </div>
          </form>
        </PopoverContent>
      </>
    ),
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);

/** Focus moves inside on open and returns to the trigger on Escape (catalog a11y). */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "เปลี่ยนชื่อ" });
    await userEvent.click(trigger);
    const dialog = await body().findByRole("dialog", { name: "เปลี่ยนชื่อโปรเจกต์" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const Open: Story = { args: { defaultOpen: true } };

function PendingForm() {
  const [pending, setPending] = useState(false);
  return (
    <Popover defaultOpen>
      <PopoverTrigger>
        <Button variant="secondary">เปลี่ยนชื่อ</Button>
      </PopoverTrigger>
      <PopoverContent aria-label="เปลี่ยนชื่อโปรเจกต์">
        <form
          className="flex w-72 max-w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
          }}
        >
          <Field label="ชื่อใหม่">
            <Input defaultValue={fixtures.mixed} />
          </Field>
          <div className="flex justify-end gap-2">
            <PopoverClose>
              <Button variant="ghost">ยกเลิก</Button>
            </PopoverClose>
            <Button variant="primary" type="submit" loading={pending}>
              บันทึกชื่อ
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/** Pending: the task inside is running; the save button blocks a second submit. */
export const Pending: Story = {
  render: () => <PendingForm />,
  play: async () => {
    const save = await body().findByRole("button", { name: "บันทึกชื่อ" });
    await userEvent.click(save);
    await expect(save).toHaveAttribute("aria-busy", "true");
  },
};

/** The content is rendered in a portal and still carries the trigger's profile (AC 7). */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="professional" mode="light">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Popover {...args} defaultOpen />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "เปลี่ยนชื่อ" });
    const dialog = await body().findByRole("dialog");
    const scope = dialog.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("professional");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(dialog)).toBe(read(trigger));
  },
};

export const RecipesAndModes: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Matrix>
      <div className="min-h-64">
        <Popover {...args} defaultOpen />
      </div>
    </Matrix>
  ),
};
