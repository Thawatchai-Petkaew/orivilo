import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { expectNoGlyphClip, resolvedColor } from "../../testing/visual-asserts";
import { Button } from "../button/Button";
import { evidenceFixtures as ev, fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { EvidenceList } from "./EvidenceList";

const meta = {
  title: "Application/Evidence list",
  component: EvidenceList,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A collapsible list of the quotes a reading drew on, behind one count (ORV-211), on our Collapsible. Items without a usable quote are not counted or listed; with none, plain text says so. The items in these stories are mock evidence: no brief analyser exists yet, and nothing here was read by a rule or a model.",
      },
    },
  },
  args: { items: [ev.name, ev.warm, ev.mood, ev.noQuote] },
} satisfies Meta<typeof EvidenceList>;

export default meta;
type Story = StoryObj<typeof meta>;

const triggerOf = (root: HTMLElement, name: string) => within(root).getByRole("button", { name });

/** Closed: one ghost trigger with the count; a press lists the quotes in order, each with its source line. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const trigger = triggerOf(canvasElement, "ยกมาจากบรีฟ 3 ข้อความ");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvasElement.querySelectorAll("li")).toHaveLength(0);
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const items = Array.from(canvasElement.querySelectorAll("ul.ds-evidence-list__items > li"));
    await expect(items).toHaveLength(3);
    await expect(items.map((li) => li.querySelector("blockquote")?.textContent)).toEqual([
      ev.name.observation.quote,
      ev.warm.observation.quote,
      ev.mood.observation.quote,
    ]);
    await expect(
      items.map((li) => li.querySelector(".ds-evidence-quote__meta")?.textContent),
    ).toEqual([
      "จากบรีฟของคุณ อ่านด้วยกฎ",
      "จากบรีฟของคุณ อ่านด้วยโมเดล AI",
      "จากบรีฟของคุณ อ่านด้วยกฎ",
    ]);
    // AC 16: the source line is 4 px under its quote, the next quote 16 px under the source line.
    let previousMeta: Element | null = null;
    for (const li of items) {
      const quote = (li.querySelector("blockquote") as Element).getBoundingClientRect();
      const meta = (
        li.querySelector(".ds-evidence-quote__meta") as Element
      ).getBoundingClientRect();
      await expect(Math.abs(meta.top - quote.bottom - 4)).toBeLessThan(0.5);
      if (previousMeta) {
        await expect(
          Math.abs(quote.top - previousMeta.getBoundingClientRect().bottom - 16),
        ).toBeLessThan(0.5);
      }
      previousMeta = li.querySelector(".ds-evidence-quote__meta");
    }
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvasElement.querySelectorAll("li")).toHaveLength(0);
  },
};

/** The caller holds `open`: it stays open when the trigger is pressed, and the spy hears the press. */
export const Controlled: Story = {
  args: { open: true, onOpenChange: fn() },
  play: async ({ canvasElement, args }) => {
    const trigger = triggerOf(canvasElement, "ยกมาจากบรีฟ 3 ข้อความ");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(trigger);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvasElement.querySelectorAll("li")).toHaveLength(3);
  },
};

/** One quote: the singular form of the count. */
export const One: Story = {
  args: { items: [ev.name] },
  play: async ({ canvasElement }) => {
    await expect(triggerOf(canvasElement, "ยกมาจากบรีฟ 1 ข้อความ")).toBeVisible();
  },
};

/** No usable quote: plain text at the trigger's height and label edge, no button. */
export const Empty: Story = {
  args: { items: [ev.noQuote] },
  render: (args) => (
    <div className="flex flex-col items-start gap-2">
      <EvidenceList {...args} />
      <Button variant="ghost" size="md">
        {fixtures.thai}
      </Button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button")).toHaveLength(1);
    await expect(canvasElement.querySelector("ul")).toBeNull();
    const missing = canvas.getByText("ไม่มีหลักฐาน");
    await expect(missing).toHaveClass("ds-evidence-list__missing");
    await expect(getComputedStyle(missing).color).toBe(
      resolvedColor(canvasElement, "--ds-text-secondary"),
    );
    const button = canvas.getByRole("button", { name: fixtures.thai });
    await expect(
      Math.abs(missing.getBoundingClientRect().height - button.getBoundingClientRect().height),
    ).toBeLessThanOrEqual(0.5);
  },
};

/** English: the plural count, then the English quotes; and the singular form. */
export const InEnglish: Story = {
  args: { items: [ev.nameEn, ev.warmEn, ev.moodEn, ev.noQuoteEn] },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const trigger = triggerOf(canvasElement, "3 quotes from the brief");
    await userEvent.click(trigger);
    const quotes = Array.from(canvasElement.querySelectorAll("blockquote")).map(
      (q) => q.textContent,
    );
    await expect(quotes).toEqual([
      "Baan Coffee",
      "feel as warm as at a friend's home",
      "wood tones and daylight",
    ]);
    await expect(canvasElement.querySelectorAll(".ds-evidence-quote__meta")[1]).toHaveTextContent(
      "From your brief, read by an AI model",
    );
  },
};

export const InEnglishOne: Story = {
  args: { items: [ev.nameEn] },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    await expect(triggerOf(canvasElement, "1 quote from the brief")).toBeVisible();
  },
};

export const EmptyInEnglish: Story = {
  args: { items: [ev.noQuoteEn] },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("No evidence")).toHaveClass(
      "ds-evidence-list__missing",
    );
  },
};

/** A 360 px frame: a long Thai quote wraps inside it, with no sideways scroll and no clipped marks. */
export const At360: Story = {
  args: { items: [ev.long, ev.name], defaultOpen: true },
  render: (args) => (
    <div data-testid="frame" className="w-[360px] max-w-full overflow-hidden">
      <EvidenceList {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const quotes = Array.from(frame.querySelectorAll("blockquote"));
    await expect(quotes).toHaveLength(2);
    for (const quote of quotes) {
      await expect(quote.scrollWidth).toBeLessThanOrEqual(quote.clientWidth);
    }
    // The frame clips (overflow hidden), so it checks every quote and source line under it.
    expectNoGlyphClip(frame);
  },
};

export const RecipesAndModes: Story = {
  render: (args) => (
    <Matrix>
      <EvidenceList {...args} />
      <EvidenceList {...args} defaultOpen />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    const triggers = within(canvasElement).getAllByRole("button");
    await expect(triggers).toHaveLength(12);
    await expect(triggers.filter((b) => b.getAttribute("aria-expanded") === "false")).toHaveLength(
      6,
    );
    await expect(triggers.filter((b) => b.getAttribute("aria-expanded") === "true")).toHaveLength(
      6,
    );
    await waitFor(() => expect(canvasElement.querySelectorAll("ul")).toHaveLength(6));
  },
};
