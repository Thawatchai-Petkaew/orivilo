import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { expectNoGlyphClip } from "../../testing/visual-asserts";
import { collapsibleFixtures, fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./Collapsible";

const meta = {
  title: "Base/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A show and hide control (ORV-203) on the Radix primitive. The trigger is a ghost Button with a chevron that points down while closed and up while open, so the state shows by shape. Enter and Space toggle it; hover and focus never do. The content is mounted only while open and fades in on opacity, with no fade under reduced motion. The copy in these stories is fixture text, not catalog copy.",
      },
    },
  },
  args: { children: null },
  render: (args) => (
    <Collapsible {...args}>
      <CollapsibleTrigger>{collapsibleFixtures.trigger}</CollapsibleTrigger>
      <CollapsibleContent>{collapsibleFixtures.content}</CollapsibleContent>
    </Collapsible>
  ),
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

const trigger = (root: HTMLElement, name: string = collapsibleFixtures.trigger) =>
  within(root).getByRole("button", { name });
/** The content element while open. Closed, Radix keeps an empty `hidden` div; this skips it. */
const contentOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(".ds-collapsible__content:not([hidden])");

/** The chevron in the trigger: its shape is the state (down closed, up open). */
const chevronOf = (button: HTMLElement) =>
  button.querySelector(".ds-button__icon svg")?.getAttribute("class") ?? "";

/** The left edge of the first glyph box of the text under `el`. */
function textLeft(el: Element): number {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().left;
}

/** Geometry of AC 15: one md line is 40 px, the content sits under the trigger on its label's start edge. */
async function expectLayout(root: HTMLElement, name: string) {
  const button = trigger(root, name);
  const content = contentOf(root) as HTMLElement;
  const box = button.getBoundingClientRect();
  await expect(Math.abs(box.height - 40)).toBeLessThan(0.5);
  await expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.bottom);
  const label = Array.from(button.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
  const range = document.createRange();
  range.selectNodeContents(label as Node);
  await expect(Math.abs(textLeft(content) - range.getBoundingClientRect().left)).toBeLessThan(1);
}

/** Every rule of every loaded sheet, with the media condition it sits in (empty when none). */
function* styleRules(): Generator<{ rule: CSSStyleRule; media: string }> {
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSStyleRule) yield { rule, media: "" };
      else if (rule instanceof CSSMediaRule) {
        for (const inner of Array.from(rule.cssRules)) {
          if (inner instanceof CSSStyleRule) yield { rule: inner, media: rule.conditionText };
        }
      }
    }
  }
}

/** Closed: a chevron-down button, no content in the DOM; hover and focus alone open nothing. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).not.toHaveAttribute("aria-controls");
    await expect(button).toHaveAttribute("data-state", "closed");
    await expect(button).toHaveAttribute("type", "button");
    await expect(chevronOf(button)).toContain("lucide-chevron-down");
    await expect(within(canvasElement).queryByText(collapsibleFixtures.content)).toBeNull();
    // AC 9: hover and focus open nothing.
    await userEvent.hover(button);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    button.focus();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(contentOf(canvasElement)).toBeNull();
    // AC 6: a press opens it and the content fades in on opacity at the feedback duration.
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(chevronOf(button)).toContain("lucide-chevron-up");
    const content = contentOf(canvasElement) as HTMLElement;
    await expect(content).toHaveTextContent(collapsibleFixtures.content);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = getComputedStyle(content);
    await expect(style.animationName).toBe(reduce ? "none" : "ds-fade-in");
    await expect(style.animationDuration).toBe(reduce ? "0s" : "0.12s");
    // The fade rule sits on the bare class, and nothing on the content grows, slides or moves.
    let fade = false;
    const moves: string[] = [];
    for (const { rule, media } of styleRules()) {
      if (!/\.ds-collapsible__content\b/.test(rule.selectorText)) continue;
      if (
        rule.selectorText === ".ds-collapsible__content" &&
        media === "" &&
        rule.style.animation.includes("ds-fade-in")
      ) {
        fade = true;
      }
      for (const prop of ["height", "width", "transform", "inset", "top", "left", "right"]) {
        if (rule.style.getPropertyValue(prop) !== "") moves.push(`${rule.selectorText} ${prop}`);
      }
      if (rule.style.transition !== "") moves.push(`${rule.selectorText} transition`);
    }
    await expect(fade).toBe(true);
    await expect(moves).toEqual([]);
    for (const sheet of Array.from(document.styleSheets)) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSKeyframesRule && rule.name === "ds-fade-in") {
          await expect(rule.cssText).not.toMatch(/height|width|transform|inset/);
        }
      }
    }
  },
};

/** Tab to the trigger, Enter opens, Space closes; focus stays on the button throughout. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const content = contentOf(canvasElement) as HTMLElement;
    await expect(content).toHaveTextContent(collapsibleFixtures.content);
    await expect(button).toHaveAttribute("aria-controls", content.id);
    await expect(content.id).not.toBe("");
    await expect(canvasElement.querySelector(".ds-collapsible")).toHaveAttribute(
      "data-state",
      "open",
    );
    await expect(button).toHaveAttribute("data-state", "open");
    await expect(content).toHaveAttribute("data-state", "open");
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(chevronOf(button)).toContain("lucide-chevron-down");
    await expect(button).not.toHaveAttribute("aria-controls");
    await expect(contentOf(canvasElement)).toBeNull();
    await expect(button).toHaveFocus();
  },
};

/** Open at first render: the content shows at once, with no fade. */
export const Open: Story = {
  args: { defaultOpen: true },
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const content = contentOf(canvasElement) as HTMLElement;
    await expect(content).toBeVisible();
    await expect(getComputedStyle(content).animationName).toBe("none");
    await expectLayout(canvasElement, collapsibleFixtures.trigger);
  },
};

/** The caller holds `open`; the spy hears true, then false. */
export const Controlled: Story = {
  args: { onOpenChange: fn() },
  render: ({ onOpenChange }) => {
    const [open, setOpen] = useState(false);
    return (
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
      >
        <CollapsibleTrigger>{collapsibleFixtures.trigger}</CollapsibleTrigger>
        <CollapsibleContent>{collapsibleFixtures.content}</CollapsibleContent>
      </Collapsible>
    );
  },
  play: async ({ canvasElement, args }) => {
    const button = trigger(canvasElement);
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(args.onOpenChange).toHaveBeenCalledTimes(2);
    await expect(args.onOpenChange).toHaveBeenNthCalledWith(1, true);
    await expect(args.onOpenChange).toHaveBeenNthCalledWith(2, false);
  },
};

/** Disabled: Button's disabled look, and a press opens nothing. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement);
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("data-disabled");
    await expect(canvasElement.querySelector(".ds-collapsible")).toHaveAttribute("data-disabled");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(contentOf(canvasElement)).toBeNull();
  },
};

/** The recipe stops the fade under reduced motion, on the same bare selector the fade uses. */
export const ReducedMotion: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    const content = contentOf(canvasElement) as HTMLElement;
    // The fade starts at opacity 0, so it is visible a moment after the press.
    await waitFor(() => expect(content).toBeVisible());
    let stopped = false;
    for (const { rule, media } of styleRules()) {
      if (
        rule.selectorText === ".ds-collapsible__content" &&
        media.includes("prefers-reduced-motion") &&
        media.includes("reduce") &&
        rule.style.animationName === "none"
      ) {
        stopped = true;
      }
    }
    await expect(stopped).toBe(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(getComputedStyle(content).animationName).toBe("none");
    }
  },
};

/** English: "Project details", then the content below it after a press. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>{collapsibleFixtures.triggerEn}</CollapsibleTrigger>
      <CollapsibleContent>{collapsibleFixtures.contentEn}</CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const button = trigger(canvasElement, collapsibleFixtures.triggerEn);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(within(canvasElement).getByText(collapsibleFixtures.contentEn)).toBeVisible(),
    );
  },
};

/** A 360 px frame: a long Thai name wraps in the content and in a trigger label, with no sideways scroll. */
export const At360: Story = {
  render: () => (
    <div data-testid="frame" className="flex w-[360px] max-w-full flex-col gap-4 overflow-hidden">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>{collapsibleFixtures.trigger}</CollapsibleTrigger>
        <CollapsibleContent>{fixtures.longThai}</CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger>{fixtures.longThai}</CollapsibleTrigger>
        <CollapsibleContent>{collapsibleFixtures.content}</CollapsibleContent>
      </Collapsible>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const long = trigger(canvasElement, fixtures.longThai);
    await expect(long.scrollWidth).toBeLessThanOrEqual(long.clientWidth);
    // Wrapped: above the 40 px of one md line.
    await expect(long.getBoundingClientRect().height).toBeGreaterThan(40);
    const frameBox = frame.getBoundingClientRect();
    await expect(long.getBoundingClientRect().right).toBeLessThanOrEqual(frameBox.right + 0.5);
    await expectLayout(frame.firstElementChild as HTMLElement, collapsibleFixtures.trigger);
    // The frame clips (overflow hidden), so it checks every label and the content under it.
    expectNoGlyphClip(frame);
    await expect(contentOf(canvasElement)).toHaveTextContent(fixtures.longThai);
    // The chevron sits beside the first line of the wrapped label.
    const icon = long.querySelector<HTMLElement>(".ds-button__icon") as HTMLElement;
    const longBox = long.getBoundingClientRect();
    await expect(icon.getBoundingClientRect().top).toBeLessThan(longBox.top + 20);
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Collapsible>
        <CollapsibleTrigger>{collapsibleFixtures.trigger}</CollapsibleTrigger>
        <CollapsibleContent>{collapsibleFixtures.content}</CollapsibleContent>
      </Collapsible>
      <Collapsible defaultOpen>
        <CollapsibleTrigger>{collapsibleFixtures.trigger}</CollapsibleTrigger>
        <CollapsibleContent>{collapsibleFixtures.content}</CollapsibleContent>
      </Collapsible>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    const buttons = within(canvasElement).getAllByRole("button");
    await expect(buttons).toHaveLength(12);
    await expect(buttons.filter((b) => b.getAttribute("aria-expanded") === "false")).toHaveLength(
      6,
    );
    await expect(buttons.filter((b) => b.getAttribute("aria-expanded") === "true")).toHaveLength(6);
    await expect(
      canvasElement.querySelectorAll(".ds-collapsible__content:not([hidden])"),
    ).toHaveLength(6);
  },
};
