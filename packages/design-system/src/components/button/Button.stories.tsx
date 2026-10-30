import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { DesignProfileBoundary, type Mode } from "../../boundary/DesignProfileBoundary";
import { expectInkCentred, inVitest } from "../../testing/visual-asserts";
import { fixtures } from "../fixtures";
import { ChevronDownIcon, PlusIcon } from "../icons";
import { Matrix, Narrow } from "../matrix";
import { Button, type ButtonVariant, type ControlSize } from "./Button";

const VARIANTS: readonly ButtonVariant[] = [
  "primary",
  "secondary",
  "ghost",
  "destructive",
  "intent",
  "link",
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

const SIZES: readonly ControlSize[] = ["sm", "md", "lg"];
const MODES: readonly Mode[] = ["light", "dark"];

/**
 * ORV-111: a label sits at the vertical centre of its button, in Thai as in English. Primary
 * buttons at sm, md and lg, each with `fixtures.thai` and `fixtures.latin`, under the neutral
 * profile in light and dark. The play reads the rendered pixels (`expectInkCentred`, rule
 * ink-centre-1), one screenshot per boundary and one assertion per button, so a Thai label that
 * rides high fails with its offset. The static Storybook shows the story without the check.
 */
export const LabelCentre: Story = {
  render: (args) => (
    <>
      {MODES.map((mode) => (
        <DesignProfileBoundary key={mode} mode={mode} profile="neutral">
          <div
            data-testid={`label-centre-${mode}`}
            className="flex flex-col gap-3 bg-surface-canvas p-4"
          >
            {SIZES.map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-3">
                {[fixtures.thai, fixtures.latin].map((label) => (
                  <Button key={label} {...args} variant="primary" size={size}>
                    {label}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </DesignProfileBoundary>
      ))}
    </>
  ),
  play: async ({ canvasElement }) => {
    if (!inVitest) return; // the screenshot needs Vitest browser mode
    const canvas = within(canvasElement);
    for (const mode of MODES) {
      const cell = canvas.getByTestId(`label-centre-${mode}`);
      const buttons = within(cell).getAllByRole("button");
      await expect(buttons).toHaveLength(SIZES.length * 2);
      await expectInkCentred(cell, buttons);
    }
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

/**
 * A caller's `aria-disabled` (ORV-105 D1): the button looks disabled in every variant, stays in the
 * Tab order and ignores the press. Native `disabled` is the other way and leaves the Tab order.
 */
export const AriaDisabled: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} aria-disabled="true">
          {fixtures.thai}
        </Button>
      ))}
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const buttons = within(canvasElement).getAllByRole("button");
    await expect(buttons).toHaveLength(VARIANTS.length);
    for (const button of buttons) {
      await expect(button).toHaveAttribute("aria-disabled", "true");
      await expect(button).toBeEnabled();
      await userEvent.click(button);
    }
    await expect(args.onClick).not.toHaveBeenCalled();
    // Focusable: Tab from the top of the page lands on the first one.
    (document.activeElement as HTMLElement).blur();
    await userEvent.tab();
    await expect(buttons[0]).toHaveFocus();
    // The primary variant wears its disabled ground, not the live one.
    const live = document.createElement("button");
    live.className = "ds-button";
    live.dataset.variant = "primary";
    canvasElement.append(live);
    await expect(getComputedStyle(buttons[0] as HTMLElement).backgroundColor).not.toBe(
      getComputedStyle(live).backgroundColor,
    );
    live.remove();
  },
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

/** The icon sits before or after the label at the button's icon size, hidden from assistive tech (AC 1). */
export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary" size="sm" iconLeading={<PlusIcon />}>
        {fixtures.latin}
      </Button>
      <Button {...args} variant="secondary" iconLeading={<PlusIcon />}>
        {fixtures.thai}
      </Button>
      <Button {...args} variant="secondary" size="lg" iconTrailing={<ChevronDownIcon />}>
        {fixtures.mixed}
      </Button>
      <Button
        {...args}
        variant="ghost"
        iconLeading={<PlusIcon />}
        iconTrailing={<ChevronDownIcon />}
      >
        {fixtures.latin}
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const leading = canvas.getByRole("button", { name: fixtures.thai });
    // The name is the label alone; the icon is hidden.
    const icon = leading.querySelector(".ds-button__icon");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(leading.firstElementChild).toBe(icon);
    const trailing = canvas.getByRole("button", { name: fixtures.mixed });
    await expect(trailing.lastElementChild).toHaveClass("ds-button__icon");
    await expect(trailing.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    // 16 px for sm and md, 20 px for lg.
    await expect(getComputedStyle(icon as Element).width).toBe("16px");
    await expect(getComputedStyle(trailing.lastElementChild as Element).width).toBe("20px");
  },
};

/** While loading, the spinner replaces the leading icon and the trailing one stays (AC 1). */
export const LoadingWithIcons: Story = {
  args: { variant: "secondary", loading: true },
  render: (args) => (
    <Button
      {...args}
      iconLeading={<PlusIcon data-testid="lead" />}
      iconTrailing={<ChevronDownIcon data-testid="trail" />}
    >
      {fixtures.latin}
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId("lead")).toBeNull();
    await expect(canvas.getByTestId("trail")).toBeInTheDocument();
    const button = canvas.getByRole("button", { name: /Save changes/ });
    await expect(button.querySelectorAll(".ds-button__icon")).toHaveLength(2);
    await expect(button.querySelector(".ds-spin")).not.toBeNull();
  },
};

/** `iconOnly` keeps its required name and ignores the icon slots. */
export const IconOnlyIgnoresSlots: Story = {
  render: (args) => (
    <Button
      {...args}
      iconOnly
      aria-label="เพิ่ม"
      iconLeading={<PlusIcon />}
      iconTrailing={<PlusIcon />}
    >
      <PlusIcon className="size-4" />
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "เพิ่ม" });
    await expect(button.querySelectorAll(".ds-button__icon")).toHaveLength(0);
    await expect(button.querySelectorAll("svg")).toHaveLength(1);
  },
};

/**
 * The link variant: `text.link`, no fill, no border, an underline on hover (AC 2). It keeps the
 * height of other buttons so a row lines up.
 */
export const Link: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="secondary" data-testid="secondary">
        {fixtures.latin}
      </Button>
      <Button {...args} variant="link" data-testid="link">
        {fixtures.thai}
      </Button>
      <Button {...args} variant="link" iconTrailing={<ChevronDownIcon />}>
        {fixtures.latin}
      </Button>
      <Button {...args} variant="link" disabled>
        {fixtures.latin}
      </Button>
      <Button {...args} asChild variant="link">
        <a href="#link">ไปที่ backlog</a>
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByTestId("link");
    const style = getComputedStyle(link);
    await expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(style.borderTopColor).toBe("rgba(0, 0, 0, 0)");
    await expect(style.textDecorationLine).toBe("none");
    // The test runner has no real pointer, so :hover cannot be computed; read the recipe rule.
    const hover = [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .find(
        (rule): rule is CSSStyleRule =>
          rule instanceof CSSStyleRule && rule.selectorText.includes('[data-variant="link"]:hover'),
      );
    await expect(hover?.style.textDecorationLine).toBe("underline");
    await expect(link.getBoundingClientRect().height).toBe(
      canvas.getByTestId("secondary").getBoundingClientRect().height,
    );
    link.focus();
    await expect(link).toHaveFocus();
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
        <Button
          {...args}
          variant="primary"
          iconLeading={<PlusIcon />}
          iconTrailing={<ChevronDownIcon />}
        >
          {fixtures.thai}
        </Button>
        <Button {...args} variant="link" iconTrailing={<ChevronDownIcon />}>
          {fixtures.thai}
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
        <Button
          {...args}
          variant="secondary"
          size="sm"
          iconLeading={<PlusIcon />}
          iconTrailing={<ChevronDownIcon />}
        >
          {fixtures.latin}
        </Button>
        <Button {...args} variant="link" size="sm" iconTrailing={<ChevronDownIcon />}>
          {fixtures.latin}
        </Button>
      </div>
    </Matrix>
  ),
};
