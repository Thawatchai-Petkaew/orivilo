import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Button, type ButtonVariant } from "./Button";

const VARIANTS: readonly ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "destructive",
  "intent",
];

const meta = {
  title: "Base/Button",
  component: Button,
  args: { children: fixtures.thai, onClick: fn() },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant === "intent" ? "ถามเครื่องมือ" : fixtures.thai}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary" size="sm">
        {fixtures.latin}
      </Button>
      <Button {...args} variant="primary" size="md">
        {fixtures.latin}
      </Button>
      <Button {...args} variant="primary" size="lg">
        {fixtures.latin}
      </Button>
    </div>
  ),
};

/** Hover, focus-visible and pressed are interaction states; the play function puts one instance in each. */
export const InteractionStates: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary" data-testid="hover">
        Hover
      </Button>
      <Button {...args} variant="primary" data-testid="focus">
        Focus
      </Button>
      <Button {...args} variant="primary" data-testid="press">
        Pressed
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.pointer({ keys: "[MouseLeft>]", target: canvas.getByTestId("press") });
    await userEvent.hover(canvas.getByTestId("hover"));
    canvas.getByTestId("focus").focus();
    await expect(canvas.getByTestId("focus")).toHaveFocus();
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} disabled>
          {fixtures.thai}
        </Button>
      ))}
    </div>
  ),
};

/** The label stays, a status line announces, and the click does not fire (AC 4). */
export const Loading: Story = {
  args: { variant: "primary", loading: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /บันทึกการเปลี่ยนแปลง/ });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByRole("status")).toHaveTextContent("กำลังดำเนินการ");
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/** `iconOnly` makes `aria-label` mandatory at the type level (AC 5). */
export const IconOnly: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} iconOnly aria-label="ปิด" variant="ghost">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </Button>
      <Button {...args} iconOnly aria-label="เพิ่ม" variant="primary" size="sm">
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M10 4v12M4 10h12" />
        </svg>
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "ปิด" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "เพิ่ม" })).toBeVisible();
  },
};

/** The recipe on another element: a link that looks like a secondary button. */
export const AsChild: Story = {
  render: (args) => (
    <Button {...args} asChild variant="secondary">
      <a href="#as-child">ไปที่ backlog</a>
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "ไปที่ backlog" });
    await expect(link).toHaveClass("ds-button");
  },
};

export const LongLabelAt360: Story = {
  render: (args) => (
    <Narrow>
      <div className="flex flex-col gap-3">
        <Button {...args} variant="primary" className="max-w-full">
          <span className="truncate">{fixtures.longThai}</span>
        </Button>
        <Button {...args} variant="secondary">
          {fixtures.mixed}
        </Button>
      </div>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <div className="flex flex-wrap items-center gap-2">
        {VARIANTS.map((variant) => (
          <Button key={variant} {...args} variant={variant} size="sm">
            {variant === "intent" ? "ถามเครื่องมือ" : fixtures.latin}
          </Button>
        ))}
        <Button {...args} variant="primary" size="sm" loading>
          {fixtures.thai}
        </Button>
        <Button {...args} variant="secondary" size="sm" disabled>
          {fixtures.thai}
        </Button>
      </div>
    </Matrix>
  ),
};
