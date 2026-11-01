import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectEdgeInk,
  expectFocusBorderForm,
  expectNoGlyphClip,
  inVitest,
  resolvedColor,
} from "../../testing/visual-asserts";
import { evidenceFixtures as ev } from "../fixtures";
import { Matrix } from "../matrix";
import { EvidenceSpan } from "./EvidenceSpan";

const meta = {
  title: "Application/Evidence span",
  component: EvidenceSpan,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A fact followed by a pill that opens a card with the words of the brief it came from (ORV-211). It opens on a press only (click, Enter, Space); hover and focus never open it. The card says whether a rule or an AI model read the quote. A fact with no usable quote shows plain text that says so. The items in these stories are mock evidence: no brief analyser exists yet, and nothing here was read by a rule or a model.",
      },
    },
  },
  args: { children: ev.fact.name, item: ev.name },
  render: (args) => (
    <p className="max-w-prose">
      <EvidenceSpan {...args} />
    </p>
  ),
} satisfies Meta<typeof EvidenceSpan>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = () => within(document.body);
const pillName = (fact: string, label = "หลักฐาน") => `${label} ${fact}`;
const pillOf = (root: HTMLElement, name: string) => within(root).getByRole("button", { name });
const settled = (done: () => Promise<void>) => waitFor(done);

/** Runs `check` with the browser at 360 by 640, then puts the size back. Vitest's browser iframe is
 * 1200 by 900, wide enough to hide a card that runs off a phone. The static Storybook has no
 * `vitest/browser`; there the frame is the viewport the toolbar chose. */
async function atPhoneSize(check: () => Promise<void>) {
  if (!inVitest) return check();
  const { page } = await import("vitest/browser");
  const before = { width: window.innerWidth, height: window.innerHeight };
  const resized = async (width: number, height: number) => {
    await page.viewport(width, height);
    await waitFor(() => expect([window.innerWidth, window.innerHeight]).toEqual([width, height]));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  };
  // The screenshot lock of `visual-asserts.ts`: no other file's screenshot runs while the frame is resized.
  await navigator.locks.request("orivilo-screenshot", async () => {
    await resized(360, 640);
    try {
      await check();
    } finally {
      await resized(before.width, before.height);
    }
  });
}

/** Closed: a pill after the fact; hover and focus open nothing; a press opens the card; a click outside closes it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const name = pillName(ev.fact.name);
    const pill = pillOf(canvasElement, name);
    await expect(pill).toHaveAttribute("aria-haspopup", "dialog");
    await expect(pill).toHaveAttribute("aria-expanded", "false");
    await expect(pill).not.toHaveAttribute("aria-pressed");
    await expect(pill).not.toHaveAttribute("aria-label");
    await expect(body().queryByRole("dialog")).toBeNull();
    // AC 7: hover and focus alone open nothing.
    await userEvent.hover(pill);
    await expect(pill).toHaveAttribute("aria-expanded", "false");
    pill.focus();
    await expect(pill).toHaveAttribute("aria-expanded", "false");
    await expect(body().queryByRole("dialog")).toBeNull();
    // AC 2: a press opens the card with the quote and its source line.
    await userEvent.click(pill);
    const dialog = await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    await expect(dialog.querySelector("blockquote")).toHaveTextContent("ร้านบ้านกาแฟ");
    await expect(dialog.querySelector(".ds-evidence-quote__meta")).toHaveTextContent(
      "จากบรีฟของคุณ อ่านด้วยกฎ",
    );
    await expect(pillOf(canvasElement, name)).toHaveAttribute("aria-expanded", "true");
    // The quote's start line is 2 px of ink, read from a screenshot (L-0018); the static Storybook has no screenshots.
    if (inVitest) await expectEdgeInk(dialog.querySelector("blockquote") as Element, "left", 2);
    // AC 3: a click outside closes it.
    await userEvent.click(canvasElement);
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(pillOf(canvasElement, name)).toHaveAttribute("aria-expanded", "false");
  },
};

/** Tab to the pill; Enter opens the card and moves focus in; Esc closes it and returns focus; Space does the same. */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const pill = pillOf(canvasElement, pillName(ev.fact.name));
    await userEvent.tab();
    await expect(pill).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const dialog = await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    // Border form (ORV-192 row 9): the card's border turns focus.ring with the halo.
    await expectFocusBorderForm(dialog);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(pill).toHaveFocus();
    await userEvent.keyboard(" ");
    await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(pill).toHaveFocus();
  },
};

/** The AI model read it: the card says so. */
export const ByModel: Story = {
  args: { children: ev.fact.warm, item: ev.warm },
  play: async ({ canvasElement }) => {
    await userEvent.click(pillOf(canvasElement, pillName(ev.fact.warm)));
    const dialog = await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    await expect(dialog.querySelector("blockquote")).toHaveTextContent(
      "อยากให้ลูกค้ารู้สึกอบอุ่นเหมือนมาบ้านเพื่อน",
    );
    await expect(dialog.querySelector(".ds-evidence-quote__meta")).toHaveTextContent(
      "จากบรีฟของคุณ อ่านด้วยโมเดล AI",
    );
  },
};

const blank: typeof ev.name = {
  ...ev.name,
  observation: { ...ev.name.observation, quote: "   " },
};

/** No usable quote: no item, no quote at all, or a quote of spaces. Plain text, no pill. */
export const Missing: Story = {
  render: () => (
    <div className="flex max-w-prose flex-col gap-2">
      <p>
        <EvidenceSpan item={undefined}>{ev.fact.name}</EvidenceSpan>
      </p>
      <p>
        <EvidenceSpan item={ev.noQuote}>{ev.fact.noQuote}</EvidenceSpan>
      </p>
      <p>
        <EvidenceSpan item={blank}>{ev.fact.name}</EvidenceSpan>
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole("button")).toHaveLength(0);
    await expect(canvasElement.querySelectorAll("[aria-haspopup]")).toHaveLength(0);
    const missing = canvas.getAllByText("ไม่มีหลักฐาน");
    await expect(missing).toHaveLength(3);
    const secondary = resolvedColor(canvasElement, "--ds-text-secondary");
    for (const text of missing) {
      await expect(text).toHaveClass("ds-evidence-span__missing");
      await expect(getComputedStyle(text).color).toBe(secondary);
    }
  },
};

/** Markup in a quote shows as typed characters, and the source reference is never shown. */
export const TextOnly: Story = {
  args: { children: ev.fact.markup, item: ev.markup },
  play: async ({ canvasElement }) => {
    await userEvent.click(pillOf(canvasElement, pillName(ev.fact.markup)));
    const dialog = await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    const quote = ev.markup.observation.quote ?? "";
    await expect(dialog.querySelector("blockquote")?.textContent).toBe(quote);
    await expect(dialog.querySelector("b")).toBeNull();
    await expect(dialog.querySelector("a")).toBeNull();
    await expect(document.body.textContent).not.toContain("fixture:brief");
  },
};

/** The caller holds `open`: it stays open when the pill is pressed, and the spy hears the press. */
export const Controlled: Story = {
  args: { open: true, onOpenChange: fn() },
  play: async ({ canvasElement, args }) => {
    const pill = pillOf(canvasElement, pillName(ev.fact.name));
    await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    await expect(pill).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(pill);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(body().getByRole("dialog", { name: "หลักฐานจากบรีฟ" })).toBeVisible();
  },
};

/** English: the pill, the card, the model line and the missing text. */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => (
    <div className="flex max-w-prose flex-col gap-2">
      <p>
        <EvidenceSpan item={ev.nameEn}>{ev.fact.nameEn}</EvidenceSpan>
      </p>
      <p>
        <EvidenceSpan item={ev.warmEn}>{ev.fact.warmEn}</EvidenceSpan>
      </p>
      <p>
        <EvidenceSpan item={ev.noQuoteEn}>{ev.fact.noQuoteEn}</EvidenceSpan>
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nameEn = pillName(ev.fact.nameEn, "Evidence");
    await userEvent.click(pillOf(canvasElement, nameEn));
    const dialog = await body().findByRole("dialog", { name: "Evidence from the brief" });
    await expect(dialog.querySelector("blockquote")).toHaveTextContent("Baan Coffee");
    await expect(dialog.querySelector(".ds-evidence-quote__meta")).toHaveTextContent(
      "From your brief, read by rules",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await userEvent.click(pillOf(canvasElement, pillName(ev.fact.warmEn, "Evidence")));
    const model = await body().findByRole("dialog", { name: "Evidence from the brief" });
    await expect(model.querySelector(".ds-evidence-quote__meta")).toHaveTextContent(
      "From your brief, read by an AI model",
    );
    await expect(within(canvasElement).getByText("No evidence")).toHaveClass(
      "ds-evidence-span__missing",
    );
  },
};

/** A 360 px phone: the fact and pill wrap, the card keeps a gutter to both edges and wraps a long Thai quote. */
export const At360: Story = {
  parameters: { layout: "fullscreen" },
  args: { children: ev.fact.long, item: ev.long },
  render: (args) => (
    <div data-testid="frame" className="w-[360px] max-w-full overflow-hidden p-4">
      <p>
        <EvidenceSpan {...args} />
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await atPhoneSize(async () => {
      const frame = within(canvasElement).getByTestId("frame");
      // The surface's 16 px inset holds: the first glyph of the fact sits 16 px or more from the frame's left and top edge.
      const text = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT).nextNode() as Text;
      const range = document.createRange();
      range.setStart(text, 0);
      range.setEnd(text, 1);
      const glyph = range.getBoundingClientRect();
      const frameBox = frame.getBoundingClientRect();
      await expect(glyph.left - frameBox.left).toBeGreaterThanOrEqual(16);
      await expect(glyph.top - frameBox.top).toBeGreaterThanOrEqual(16);
      await userEvent.click(pillOf(canvasElement, pillName(ev.fact.long)));
      const dialog = await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
      await settled(async () => {
        const box = dialog.getBoundingClientRect();
        const edge = frame.getBoundingClientRect();
        await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
        await expect(box.width).toBeLessThanOrEqual(320);
        await expect(box.left - edge.left).toBeGreaterThanOrEqual(16);
        await expect(edge.right - box.right).toBeGreaterThanOrEqual(16);
      });
      const quote = dialog.querySelector("blockquote") as HTMLElement;
      await expect(quote.scrollWidth).toBeLessThanOrEqual(quote.clientWidth);
      // The card does not clip, so the check borrows it as the clip: every glyph box of the quote and the source line lies in the card.
      dialog.style.overflow = "hidden";
      expectNoGlyphClip(dialog);
      dialog.style.overflow = "";
    });
  },
};

/** The card is portaled and still carries the trigger's profile and mode. */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="friendly" mode="dark">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <p>
          <EvidenceSpan {...args} />
        </p>
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(pillOf(canvasElement, pillName(ev.fact.name)));
    const dialog = await body().findByRole("dialog", { name: "หลักฐานจากบรีฟ" });
    const scope = dialog.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("friendly");
    await expect(scope?.dataset["mode"]).toBe("dark");
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <p>
        <EvidenceSpan item={ev.name}>{ev.fact.name}</EvidenceSpan>
      </p>
      <p>
        <EvidenceSpan item={undefined}>{ev.fact.noQuote}</EvidenceSpan>
      </p>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("button")).toHaveLength(6);
    await expect(within(canvasElement).getAllByText("ไม่มีหลักฐาน")).toHaveLength(6);
  },
};
