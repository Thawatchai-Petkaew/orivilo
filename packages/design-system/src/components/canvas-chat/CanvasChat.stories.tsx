import type { Meta, StoryObj } from "@storybook/react-vite";
import { useReactFlow } from "@xyflow/react";
import { useRef, useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider, useLocale } from "../../i18n/LocaleProvider";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import { BOARD } from "../canvas-board/fixtures";
import type { Graph } from "../canvas-board/graph";
import { chatFixtures, fixtures, type ChatHost } from "../fixtures";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Matrix } from "../matrix";
import { CanvasChat, type ChatReply, type ChatRequest } from "./CanvasChat";
import { placeReply, replyTitle } from "./place-reply";

const meta = {
  title: "Application/Canvas chat",
  component: CanvasChat,
  parameters: {
    layout: "padded",
    // axe rejects role="combobox" on a textarea, but the mention list needs the combobox pattern
    // CommandMenu uses (review F1); a multiline field cannot be an input.
    a11y: { config: { rules: [{ id: "aria-allowed-role", enabled: false }] } },
    docs: {
      description: {
        component:
          "The board chat, sidebar variant (E4-5 part 3, slices A and B): a transcript that follows the newest reply and a composer. The host answers through onAsk; the chat shows each reply as it streams, says on every reply where it came from (rules or mock data) and never claims AI. Every story's replies come from a fixture host that streams canned text, so they are mock data or worked out by rules, not a model. Inside a CanvasBoard (slice B) the host can place a finished reply as a note linked to the node it is about, and the chat offers a jump to it; the note says by rules or mock data. @ mentions and the at-cursor form arrive in later slices.",
      },
    },
  },
  args: {
    variant: "sidebar",
    basis: "rules",
    onAsk: fn(chatFixtures.host(chatFixtures.reply)),
    onReply: fn(),
    onClose: fn(),
  },
  render: (args) => (
    <Frame size="panel">
      <CanvasChat {...args} />
    </Frame>
  ),
} satisfies Meta<typeof CanvasChat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The widths a host gives the chat: the panel range, 240 to 480. The chat is a card, so the frame draws nothing. */
const WIDTH = {
  min: "w-[240px]",
  panel: "w-[320px]",
  sheet: "w-[360px]",
  max: "w-[480px]",
} as const;

function Frame({ size, children }: { size: keyof typeof WIDTH; children: ReactNode }) {
  return <div className={`h-[560px] max-w-full ${WIDTH[size]}`}>{children}</div>;
}

const chatOf = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-chat") as HTMLElement;
const viewportOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(".ds-scroll__viewport") as HTMLElement;
/** The chat's own status region; Button keeps a status of its own while loading. */
const statusOf = (root: HTMLElement) =>
  chatOf(root).querySelector<HTMLElement>(":scope > [role='status']") as HTMLElement;
const box = (el: Element) => el.getBoundingClientRect();
const inside = (inner: DOMRect, outer: DOMRect) =>
  inner.left >= outer.left - 0.5 &&
  inner.right <= outer.right + 0.5 &&
  inner.top >= outer.top - 0.5 &&
  inner.bottom <= outer.bottom + 0.5;
const overlap = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const q = <T extends Element = HTMLElement>(root: ParentNode, selector: string) =>
  root.querySelector(selector) as T;
/** A semantic or component custom property as the browser resolves it, in the cascade of `el`. */
function resolved(el: Element, property: string, prop: "color" | "borderTopColor" = "color") {
  const probe = document.createElement("span");
  probe.style.setProperty(prop === "color" ? "color" : "border-top-color", `var(${property})`);
  if (prop !== "color") probe.style.borderTopStyle = "solid";
  el.appendChild(probe);
  const value = getComputedStyle(probe)[prop];
  probe.remove();
  return value;
}
/**
 * A gone chip (ORV-107 v1.6): it stays one line, as tall as a normal chip, with the caution mark
 * inside it and the title truncated; the explanation sits whole under the chip row in the warning
 * ink and the textarea is described by it. Measured in the browser; the request leaves the id out.
 */
async function expectGoneChip(root: HTMLElement, words: string, title: string) {
  const gone = q(root, ".ds-chat__chip[data-gone]");
  const tag = q(gone, ".ds-tag");
  const normal = q(root, ".ds-chat__chip:not([data-gone]) .ds-tag");
  const label = q(tag, ".ds-tag__label");
  const message = q(root, ".ds-chat__gone-message");
  const chat = chatOf(root);
  await expect(box(tag).height).toBeCloseTo(box(normal).height, 0);
  await expect(label.scrollHeight).toBe(label.clientHeight);
  await expect(label).toHaveTextContent(title);
  await expect(inside(box(q(tag, ".ds-chat__gone-mark svg")), box(tag))).toBe(true);
  await expect(inside(box(tag), box(chat))).toBe(true);
  await expect(message).toBeVisible();
  await expect(message).toHaveTextContent(`${title} ${words}`);
  await expect(message.scrollHeight).toBeLessThanOrEqual(message.clientHeight);
  await expect(message.scrollWidth).toBeLessThanOrEqual(message.clientWidth);
  await expect(inside(box(message), box(chat))).toBe(true);
  await expect(box(message).top).toBeGreaterThanOrEqual(box(q(root, ".ds-chat__chips")).bottom);
  await expect(inside(box(message), box(q(root, ".ds-chat__box")))).toBe(true);
  await expect(getComputedStyle(message).color).toBe(resolved(message, "--ds-feedback-warning-fg"));
  await expect(q(root, "form textarea")).toHaveAttribute(
    "aria-describedby",
    expect.stringContaining(message.id),
  );
}
const near = (actual: number, expected: number, tolerance = 0.5) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);

/** The honesty line sits under the composer box, centred, in the chat, and wraps instead of clipping (spec row 35). */
async function expectNotice(root: HTMLElement, text: string) {
  const notice = q(root, ".ds-chat__notice");
  await expect(notice).toBeVisible();
  await expect(notice).toHaveTextContent(text);
  await expect(getComputedStyle(notice).textAlign).toBe("center");
  await expect(notice.scrollWidth).toBeLessThanOrEqual(notice.clientWidth);
  await expect(inside(box(notice), box(chatOf(root)))).toBe(true);
  await expect(box(notice).top).toBeGreaterThanOrEqual(box(q(root, ".ds-chat__box")).bottom);
  await expect(q(root, "form textarea")).toHaveAttribute(
    "aria-describedby",
    expect.stringContaining(notice.id),
  );
}

/** Every inner-row control is a round 32 px button, on one row, with the counter clear of Send (design change 10). */
async function expectActions(root: HTMLElement) {
  const buttons = [...root.querySelectorAll<HTMLElement>(".ds-chat__actions .ds-button")];
  await expect(buttons.length).toBeGreaterThan(0);
  for (const button of buttons) {
    near(box(button).width, 32);
    near(box(button).height, 32);
    await expect(parseFloat(getComputedStyle(button).borderTopLeftRadius)).toBeGreaterThanOrEqual(
      16,
    );
    await expect(inside(box(button), box(q(root, ".ds-chat__box")))).toBe(true);
  }
  const send = box(q(root, ".ds-chat__send"));
  const mention = root.querySelector(".ds-chat__mention");
  if (mention) near(box(mention).top, send.top);
  // Under 1,800 characters the counter is hidden (ORV-107 comment 10146).
  await expect(getComputedStyle(q(root, ".ds-textarea__counter")).display).toBe("none");
}

const input = (canvas: ReturnType<typeof within>, name = "ข้อความถึงเอนจิน") =>
  // A combobox on a board (mentions are possible), a plain textbox otherwise.
  (canvas.queryByRole("combobox", { name }) ??
    canvas.getByRole("textbox", { name })) as HTMLElement;

/** Types a message and sends it with Enter. */
async function ask(canvas: ReturnType<typeof within>, text: string) {
  await userEvent.type(input(canvas), `${text}{Enter}`);
}

/** The Stop button (with a stream running) or Send (without one) in the composer. */
const action = (canvas: ReturnType<typeof within>, name: string) =>
  canvas.getByRole("button", { name });

/** The signal of the nth `onAsk` call. */
function signalOf(onAsk: { mock: { calls: unknown[][] } }, n = 0): AbortSignal {
  return onAsk.mock.calls[n]?.[1] as AbortSignal;
}

/**
 * Empty transcript at 320: the floating card (radius 24, shadow, inset edge), the quiet 48 px header
 * row, the invite text and three starters at the foot of the log, one rounded box with a round
 * grey Send, and the honesty line (rules) centred under it. A starter fills the textarea and
 * sends nothing. The notice says the replies are worked out by rules.
 */
export const Idle: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const chatEl = chatOf(canvasElement);
    const chat = box(chatEl);
    await expect(canvas.getByRole("region", { name: "แชทบนบอร์ด" })).toBeVisible();
    await expect(canvas.getByText("ยังไม่มีข้อความ ถามเรื่องบนบอร์ดได้เลย")).toBeVisible();
    await expectNotice(canvasElement, "คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI");
    await expect(input(canvas)).toHaveAttribute("placeholder", "ถามหรือสั่งงาน");
    await expect(action(canvas, "ส่ง")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ปิดแชท" })).toBeVisible();
    await expect(canvas.getByRole("region", { name: "บทสนทนา" })).toBeVisible();
    // Change 1: the floating card.
    const style = getComputedStyle(chatEl);
    await expect(style.borderTopLeftRadius).toBe("24px");
    await expect(style.borderBottomRightRadius).toBe("24px");
    await expect(style.boxShadow).not.toBe("none");
    await expect(style.outlineOffset).toBe("-1px");
    // Change 2: one 48 px row, an icon before the title, the close ending on the content edge, no rule.
    const header = q(canvasElement, ".ds-chat__header");
    const close = canvas.getByRole("button", { name: "ปิดแชท" });
    near(box(header).height, 48);
    await expect(header.querySelectorAll("svg[aria-hidden]")).toHaveLength(1);
    await expect(header.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    near(
      box(q(header, ".ds-chat__title")).top + box(q(header, ".ds-chat__title")).height / 2,
      box(close).top + box(close).height / 2,
      1,
    );
    near(box(q(close, "svg")).right, chat.right - 16);
    await expect(getComputedStyle(header).borderBottomWidth).toBe("0px");
    await expect(header.nextElementSibling).toBe(q(canvasElement, ".ds-chat__scroll"));
    // Change 7: no rule above the composer; the box 8 below its top, edge to edge on the content
    // width, the honesty line 8 under the box and 12 above the chat's end.
    const composer = q(canvasElement, ".ds-chat__composer");
    const boxEl = q(canvasElement, ".ds-chat__box");
    const notice = q(canvasElement, ".ds-chat__notice");
    await expect(getComputedStyle(composer).borderTopWidth).toBe("0px");
    near(box(boxEl).top - box(composer).top, 8);
    near(box(boxEl).left, chat.left + 16);
    near(box(boxEl).right, chat.right - 16);
    near(box(notice).top - box(boxEl).bottom, 8);
    near(chat.bottom - box(notice).bottom, 12);
    // Change 8: one box, 89.2 tall with no chips, one edge, radius 16.
    near(box(boxEl).height, 89.2, 1);
    await expect(getComputedStyle(boxEl).borderTopWidth).toBe("1px");
    await expect(getComputedStyle(boxEl).borderTopLeftRadius).toBe("16px");
    await expectActions(canvasElement);
    // Change 12: three starters at the foot of the log, inside the content width.
    const starters = canvas.getByRole("list", { name: "เริ่มจากคำถามเหล่านี้" });
    const pills = within(starters).getAllByRole("button");
    await expect(pills.map((b) => b.textContent)).toEqual([
      "บอร์ดนี้ยังขาดอะไรบ้าง",
      "เสนอโทนสีให้แบรนด์หน่อย",
      "ควรทำอะไรต่อดี",
    ]);
    for (const pill of pills)
      await expect(box(pill).right).toBeLessThanOrEqual(chat.right - 16 + 0.5);
    const viewport = box(viewportOf(canvasElement));
    near(viewport.bottom - box(starters).bottom, 16, 1);
    // Pressing one fills the textarea, focuses it with the caret at the end and sends nothing.
    await userEvent.click(within(starters).getByRole("button", { name: "ควรทำอะไรต่อดี" }));
    const field = input(canvas) as HTMLTextAreaElement;
    await expect(field.value).toBe("ควรทำอะไรต่อดี");
    await expect(field).toHaveFocus();
    await expect(field.selectionStart).toBe(field.value.length);
    await expect(args.onAsk).not.toHaveBeenCalled();
    await expect(canvas.queryByRole("list", { name: "เริ่มจากคำถามเหล่านี้" })).toBeNull();
    // Clearing the text brings them back; one letter takes them away.
    await userEvent.clear(field);
    await expect(canvas.getByRole("list", { name: "เริ่มจากคำถามเหล่านี้" })).toBeVisible();
    await userEvent.type(field, "ก");
    await expect(canvas.queryByRole("list", { name: "เริ่มจากคำถามเหล่านี้" })).toBeNull();
  },
};

/** Mock basis: the notice and the reply word both say mock data, and nothing says AI answered. */
export const Mock: Story = {
  args: { basis: "mock", onAsk: fn(chatFixtures.host(chatFixtures.reply, "mock")) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNotice(canvasElement, "คำตอบเป็นข้อมูลจำลอง ยังไม่มี AI");
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("ข้อมูลจำลอง", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expect(chatOf(canvasElement).textContent).not.toMatch(
      /(AI|เอไอ)\s*(answered|replied|ตอบ)|(answered|replied|ตอบ)\s*(by|โดย)\s*(AI|เอไอ)/i,
    );
  },
};

/** Blank and space-only text: Send is aria-disabled, stays focusable, and nothing is sent. Nothing is asked, so no host answers (a rules host is wired). */
export const BlankSend: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const send = action(canvas, "ส่ง");
    await expect(send).toHaveAttribute("aria-disabled", "true");
    await expect(send).toBeEnabled();
    // The lime appears only once there is something to send.
    await expect(getComputedStyle(send).backgroundColor).toBe(
      resolved(send, "--cmp-button-primary-bg-disabled"),
    );
    await userEvent.click(send);
    await userEvent.type(input(canvas), "   {Enter}");
    await expect(send).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(send);
    await expect(args.onAsk).not.toHaveBeenCalled();
    await expect(canvas.getByText("ยังไม่มีข้อความ ถามเรื่องบนบอร์ดได้เลย")).toBeVisible();
  },
};

/** 2,010 graphemes: the counter says by how much, Send is aria-disabled, Enter does nothing. Nothing is asked, so no host answers (a rules host is wired). */
export const OverLimit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(input(canvas));
    await userEvent.paste("ก".repeat(2010));
    await expect(
      canvas.getByText("ตัวอักษร 2,010 จาก 2,000 เกินมา 10 ตัวอักษร"),
    ).toBeInTheDocument();
    await expect(action(canvas, "ส่ง")).toHaveAttribute("aria-disabled", "true");
    await expect(input(canvas)).toHaveAttribute("aria-invalid", "true");
    // The edge eases to the error colour (feedback motion), so wait for it to land.
    // `resolved` adds a node, so it runs outside `waitFor`, whose observer would see it and loop.
    const errorEdge = resolved(chatOf(canvasElement), "--cmp-input-border-error");
    await waitFor(() =>
      expect(getComputedStyle(q(canvasElement, ".ds-chat__box")).borderTopColor).toBe(errorEdge),
    );
    await userEvent.keyboard("{Enter}");
    await userEvent.click(action(canvas, "ส่ง"));
    await expect(args.onAsk).not.toHaveBeenCalled();
  },
};

/** The counter stays hidden below 1,800 graphemes and shows from 1,800. The fixture host answers by rules. */
export const CounterThreshold: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const counter = q(canvasElement, ".ds-textarea__counter");
    await userEvent.click(input(canvas));
    await userEvent.paste("ก".repeat(1799));
    await expect(getComputedStyle(counter).display).toBe("none");
    await expect(input(canvas).getAttribute("aria-describedby")).not.toContain(counter.id);
    await userEvent.paste("ก");
    await expect(getComputedStyle(counter).display).not.toBe("none");
    await expect(input(canvas).getAttribute("aria-describedby")).toContain(counter.id);
    await expect(canvas.getByText("ตัวอักษร 1,800 จาก 2,000")).toBeInTheDocument();
  },
};

/** Enter and Send both ask once with the trimmed text and a signal; Shift+Enter adds a line. The fixture host answers by rules. */
export const Send: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = input(canvas) as HTMLTextAreaElement;
    await userEvent.type(field, "บรรทัดแรก{Shift>}{Enter}{/Shift}บรรทัดสอง");
    await expect(field.value).toBe("บรรทัดแรก\nบรรทัดสอง");
    await expect(args.onAsk).not.toHaveBeenCalled();
    // With focus in the textarea one ring goes around the whole box, not the field.
    const boxStyle = getComputedStyle(q(canvasElement, ".ds-chat__box"));
    await expect(boxStyle.outlineStyle).toBe("solid");
    await expect(boxStyle.outlineWidth).toBe("2px");
    await expect(boxStyle.outlineColor).toBe(resolved(chatOf(canvasElement), "--ds-focus-ring"));
    await expect(boxStyle.boxShadow).toBe("none");
    const focusEdge = resolved(chatOf(canvasElement), "--cmp-input-border-focus");
    await waitFor(() => expect(boxStyle.borderTopColor).toBe(focusEdge));
    await expect(getComputedStyle(field).outlineStyle).toBe("none");
    await expect(getComputedStyle(action(canvas, "ส่ง")).backgroundColor).toBe(
      resolved(chatOf(canvasElement), "--cmp-button-intent-bg"),
    );
    // Focus on Send shows Send's own ring and none on the box (one ring at a time).
    await userEvent.tab();
    await expect(action(canvas, "ส่ง")).toHaveFocus();
    await expect(getComputedStyle(q(canvasElement, ".ds-chat__box")).outlineStyle).toBe("none");
    await expect(getComputedStyle(action(canvas, "ส่ง")).outlineWidth).toBe("2px");
    await userEvent.click(field);
    await userEvent.clear(field);

    await userEvent.type(field, `  ${chatFixtures.question}  {Enter}`);
    await expect(args.onAsk).toHaveBeenCalledTimes(1);
    await expect(args.onAsk).toHaveBeenLastCalledWith(
      { text: chatFixtures.question, mentions: [] },
      expect.any(AbortSignal),
    );
    await expect(canvas.getByText("คุณ")).toBeVisible();
    await expect(canvas.getByText(chatFixtures.question)).toBeVisible();
    await expect(field.value).toBe("");
    await expect(field).toHaveFocus();

    // The first reply must end before a second message can go.
    await waitFor(() => expect(action(canvas, "ส่ง")).toBeVisible());
    await userEvent.type(field, "คำถามที่สอง");
    await userEvent.click(action(canvas, "ส่ง"));
    await expect(args.onAsk).toHaveBeenCalledTimes(2);
    await expect(field.value).toBe("");
    await expect(field).toHaveFocus();
    await expect(canvas.getAllByText("คุณ")).toHaveLength(2);
  },
};

/** Enter that commits a Thai IME composition never sends, even when compositionend came first. The fixture host answers by rules. */
export const ImeCompose: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const field = input(canvas);
    const enter = (isComposing: boolean) =>
      field.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          isComposing,
          bubbles: true,
          cancelable: true,
        }),
      );
    await userEvent.type(field, "สวัสดี");
    field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    enter(true);
    await expect(args.onAsk).not.toHaveBeenCalled();
    // Safari fires compositionend before the Enter keydown: the flag still blocks it.
    field.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    enter(false);
    await expect(args.onAsk).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await userEvent.keyboard("{Enter}");
    await expect(args.onAsk).toHaveBeenCalledTimes(1);
  },
};

/**
 * A host that holds mid-stream: the latest text shows with "Replying", Stop replaces Send, a second
 * Enter sends nothing, and the reply is one polite live region that is busy until it ends.
 * The fixture host answers by rules.
 */
export const Streaming: Story = {
  args: { onAsk: fn(chatFixtures.hostHold(chatFixtures.reply)) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const sendBox = box(action(canvas, "ส่ง"));
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("กำลังตอบ", { selector: ".ds-chat__progress" })).toBeVisible(),
    );
    await expect(action(canvas, "หยุด")).toBeVisible();
    // Stop is a round 32 px button in Send's place; the meta row is one 32 px line; the honesty line stays.
    near(box(action(canvas, "หยุด")).width, 32);
    near(box(action(canvas, "หยุด")).left, sendBox.left);
    near(box(action(canvas, "หยุด")).top, sendBox.top);
    near(box(q(canvasElement, ".ds-chat__meta")).height, 32);
    await expectNotice(canvasElement, "คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI");
    await expect(canvas.queryByRole("button", { name: "ส่ง" })).toBeNull();
    const reply = canvasElement.querySelector(".ds-chat__reply .ds-chat__text") as HTMLElement;
    await waitFor(() => expect(reply.textContent).not.toBe(""));
    await expect(chatFixtures.reply.startsWith(reply.textContent ?? "x")).toBe(true);
    await expect(reply).toHaveAttribute("aria-live", "polite");
    await expect(reply).toHaveAttribute("aria-busy", "true");
    await expect(statusOf(canvasElement)).toHaveTextContent("กำลังตอบ");
    // The box stays editable for the next draft, but Enter sends nothing while a reply streams.
    await userEvent.type(input(canvas), "ข้อความที่สอง{Enter}");
    await expect(args.onAsk).toHaveBeenCalledTimes(1);
    await expect((input(canvas) as HTMLTextAreaElement).value).toBe("ข้อความที่สอง");
  },
};

/** Under reduced motion the streaming mark stops: the word "Replying" carries the state. The fixture host answers by rules. */
export const StreamingReducedMotion: Story = {
  args: { onAsk: fn(chatFixtures.hostHold(chatFixtures.reply)) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvasElement.querySelector(".ds-chat__mark .ds-spin")).not.toBeNull(),
    );
    const mark = canvasElement.querySelector(".ds-chat__mark .ds-spin") as SVGElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    await expect(getComputedStyle(mark).animationName === "none").toBe(reduce);
    const stopsMark = () => {
      for (const sheet of Array.from(document.styleSheets)) {
        for (const rule of Array.from(sheet.cssRules)) {
          if (
            rule instanceof CSSMediaRule &&
            rule.conditionText.includes("prefers-reduced-motion")
          ) {
            for (const inner of Array.from(rule.cssRules)) {
              if (
                inner instanceof CSSStyleRule &&
                inner.selectorText.includes(".ds-chat__mark") &&
                inner.style.animationName === "none"
              ) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };
    await expect(stopsMark()).toBe(true);
  },
};

/** A finished rules reply: full text, its basis word, Send back, onReply once with the last snapshot. The fixture host answers by rules. */
export const Replied: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    const reply = canvasElement.querySelector(".ds-chat__reply .ds-chat__text") as HTMLElement;
    await expect(reply).toHaveTextContent(chatFixtures.reply);
    await expect(reply).toHaveAttribute("aria-busy", "false");
    await expect(action(canvas, "ส่ง")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "หยุด" })).toBeNull();
    // Changes 4 and 5: a pill bubble at the end edge; "คุณ" is read first but not drawn; 12 px to the reply.
    const exchange = q(canvasElement, ".ds-chat__exchange");
    const question = q(canvasElement, ".ds-chat__question");
    const log = box(q(canvasElement, ".ds-chat__log"));
    near(box(question).right, log.right - 16);
    await expect(box(question).width).toBeLessThanOrEqual(log.width - 32 - 32 + 0.5);
    await expect(getComputedStyle(question).borderTopLeftRadius).toBe("24px");
    await expect(getComputedStyle(question).paddingInlineStart).toBe("16px");
    const speaker = q(canvasElement, ".ds-chat__speaker");
    near(box(speaker).width, 1, 0.1);
    near(box(speaker).height, 1, 0.1);
    await expect(exchange.textContent?.startsWith("คุณ")).toBe(true);
    near(box(q(canvasElement, ".ds-chat__reply")).top - box(question).bottom, 12);
    // Change 6: the meta row is one 32 px line and the reply is plain text at the start edge.
    near(box(q(canvasElement, ".ds-chat__meta")).height, 32);
    near(box(reply).left, log.left + 16);
    await expect(canvas.queryByRole("list", { name: "เริ่มจากคำถามเหล่านี้" })).toBeNull();
    // The host placed nothing (onReply returns nothing): no jump, no unlinked note, as in slice A.
    await expect(canvas.queryByRole("button", { name: /^ไปที่โหนดคำตอบ/ })).toBeNull();
    await expect(canvas.queryByText("ไม่ได้ผูกกับโหนดใด")).toBeNull();
    await expect(args.onReply).toHaveBeenCalledTimes(1);
    await expect(args.onReply).toHaveBeenCalledWith(
      { text: chatFixtures.reply, basis: "rules" },
      { text: chatFixtures.question, mentions: [] },
    );
  },
};

/** A reply with line breaks keeps them: the newlines are in the text and the lines render apart. The fixture host answers by rules. */
export const RepliedLines: Story = {
  args: { onAsk: fn(chatFixtures.host(chatFixtures.replyLines)) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    const reply = canvasElement.querySelector(".ds-chat__reply .ds-chat__text") as HTMLElement;
    await expect(reply.textContent).toBe(chatFixtures.replyLines);
    await expect(getComputedStyle(reply).whiteSpace).toMatch(/^pre-(wrap|line)$/);
    const lineHeight = parseFloat(getComputedStyle(reply).lineHeight);
    await expect(box(reply).height).toBeGreaterThanOrEqual(lineHeight * 4 - 1);
  },
};

/** Stop has focus when the reply ends: focus moves to the textarea instead of falling to the page. The fixture host answers by rules. */
export const FocusKeptOnEnd: Story = {
  render: (args) => {
    const latch = chatFixtures.hostLatch(chatFixtures.reply);
    (window as unknown as { __latch: () => void }).__latch = latch.release;
    return (
      <Frame size="panel">
        <CanvasChat {...args} onAsk={latch.host} />
      </Frame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    const stop = await canvas.findByRole("button", { name: "หยุด" });
    stop.focus();
    await expect(stop).toHaveFocus();
    (window as unknown as { __latch: () => void }).__latch();
    await waitFor(() =>
      expect(canvas.getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expect(input(canvas)).toHaveFocus();
  },
};

/** Stop has focus when the host throws: focus moves to the textarea. The fixture host fails, so no basis is shown. */
export const FocusKeptOnFail: Story = {
  render: (args) => {
    const latch = chatFixtures.hostLatch(chatFixtures.reply, { fail: true });
    (window as unknown as { __latch: () => void }).__latch = latch.release;
    return (
      <Frame size="panel">
        <CanvasChat {...args} onAsk={latch.host} />
      </Frame>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    const stop = await canvas.findByRole("button", { name: "หยุด" });
    stop.focus();
    await expect(stop).toHaveFocus();
    (window as unknown as { __latch: () => void }).__latch();
    await expect(await failure(canvas)).toBeVisible();
    await expect(input(canvas)).toHaveFocus();
  },
};

/** Stop mid-stream: the signal aborts, the partial text stays marked Stopped, nothing is passed on. The fixture host answers by rules. */
export const Stopped: Story = {
  args: { onAsk: fn(chatFixtures.hostHold(chatFixtures.reply)) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    const stop = await canvas.findByRole("button", { name: "หยุด" });
    const reply = canvasElement.querySelector(".ds-chat__reply .ds-chat__text") as HTMLElement;
    await waitFor(() => expect(reply.textContent).not.toBe(""));
    const partial = reply.textContent;
    await userEvent.click(stop);
    await expect(signalOf(args.onAsk as never).aborted).toBe(true);
    await expect(reply).toHaveTextContent(partial ?? "");
    await expect(canvas.getByText("หยุดแล้ว", { selector: ".ds-chat__stopped" })).toBeVisible();
    await expect(args.onReply).not.toHaveBeenCalled();
    await expect(action(canvas, "ส่ง")).toBeVisible();
    await expect(input(canvas)).toHaveFocus();
    await expect(reply).toHaveAttribute("aria-busy", "false");
    await expect(statusOf(canvasElement)).toHaveTextContent("หยุดแล้ว");
  },
};

const FAILED = "ยังไม่ได้คำตอบ ข้อความของคุณยังอยู่ กดส่งอีกครั้งได้เลย";
/** The visible failure text; the status region says it too, for screen readers only. */
const failure = (canvas: ReturnType<typeof within>) =>
  canvas.findByText(FAILED, { selector: ".ds-chat__failure p" });

/** The host throws at once: the question stays, the thrown text never shows, Send again repeats it. The fixture host throws, so no basis is shown. */
export const Failed: Story = {
  args: { onAsk: fn(chatFixtures.hostFail("upstream timeout 504")) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await expect(await failure(canvas)).toBeVisible();
    await expect(canvas.getByText(chatFixtures.question)).toBeVisible();
    await expect(canvas.queryByText(/504/)).toBeNull();
    await expect(args.onReply).not.toHaveBeenCalled();
    await expect(statusOf(canvasElement)).toHaveTextContent(FAILED);
    await expectNotice(canvasElement, "คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI");
    await userEvent.click(canvas.getByRole("button", { name: "ส่งอีกครั้ง" }));
    await expect(args.onAsk).toHaveBeenCalledTimes(2);
    await expect((args.onAsk as ReturnType<typeof fn>).mock.calls[1]?.[0]).toBe(
      (args.onAsk as ReturnType<typeof fn>).mock.calls[0]?.[0],
    );
    await expect(input(canvas)).toHaveFocus();
    await expect(await failure(canvas)).toBeVisible();
    await expect(canvas.getAllByText(chatFixtures.question)).toHaveLength(1);
  },
};

/** The iterable throws after a snapshot: the partial text is dropped, the failure shows. The fixture host answers by rules. */
export const FailedMidStream: Story = {
  args: { onAsk: fn(chatFixtures.hostFailMidStream(chatFixtures.reply, "stream reset")) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await expect(await failure(canvas)).toBeVisible();
    await expect(canvasElement.querySelectorAll(".ds-chat__reply .ds-chat__text")).toHaveLength(0);
    await expect(canvas.queryByText(/stream reset/)).toBeNull();
    await expect(canvas.queryByText("ตามกฎ")).toBeNull();
  },
};

/** An iterable that ends with no snapshot is a failure, not an empty reply. The fixture host ends with no reply, so no basis is shown. */
export const FailedNoReply: Story = {
  args: { onAsk: fn(chatFixtures.hostEmpty) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await expect(await failure(canvas)).toBeVisible();
    await expect(args.onReply).not.toHaveBeenCalled();
    await expect(canvas.getByRole("button", { name: "ส่งอีกครั้ง" })).toBeVisible();
  },
};

/** Close while streaming: the signal aborts, the status region says Stopped, then onClose runs once. The fixture host answers by rules. */
export const Close: Story = {
  args: { onAsk: fn(chatFixtures.hostHold(chatFixtures.reply)) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await canvas.findByRole("button", { name: "หยุด" });
    const order: string[] = [];
    signalOf(args.onAsk as never).addEventListener("abort", () => order.push("abort"));
    // By the time the host closes the chat, its status region already says Stopped.
    (args.onClose as ReturnType<typeof fn>).mockImplementation(() => {
      if (statusOf(canvasElement).textContent === "หยุดแล้ว") order.push("status");
      order.push("close");
    });
    await userEvent.click(canvas.getByRole("button", { name: "ปิดแชท" }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await expect(order).toEqual(["abort", "status", "close"]);
    await expect(statusOf(canvasElement)).toHaveTextContent("หยุดแล้ว");
    // The host keeps the chat mounted: the reply is stopped, not stuck replying.
    await expect(canvas.getByText("หยุดแล้ว", { selector: ".ds-chat__stopped" })).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "หยุด" })).toBeNull();
    await expect(chatOf(canvasElement)).toHaveAttribute("data-state", "stopped");
  },
};

/** Without onClose there is no close button. The fixture host answers by rules. */
export const NoClose: Story = {
  render: (args) => (
    <Frame size="panel">
      <CanvasChat {...args} onClose={undefined} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button", { name: "ปิดแชท" })).toBeNull();
  },
};

/** One fixture host for the long stories: the first character of the question picks the outcome. */
const conversationHost: ChatHost = (request, signal) => {
  const kind = request.text.charAt(0);
  if (kind === "3") return chatFixtures.hostFail()(request, signal);
  if (kind === "4") return chatFixtures.hostHold(chatFixtures.reply)(request, signal);
  const text =
    kind === "2"
      ? chatFixtures.replyLines
      : kind === "5"
        ? chatFixtures.longReply
        : chatFixtures.reply;
  return chatFixtures.host(text, kind === "2" ? "mock" : "rules", { steps: 2, ms: 10 })(
    request,
    signal,
  );
};

async function converse(canvasElement: HTMLElement, questions: readonly string[]) {
  const canvas = within(canvasElement);
  for (const [i, question] of questions.entries()) {
    await ask(canvas, question);
    if (question.startsWith("4")) {
      await userEvent.click(await canvas.findByRole("button", { name: "หยุด" }));
    }
    await waitFor(() => expect(canvas.queryByRole("button", { name: "หยุด" })).toBeNull());
    await waitFor(() => expect(canvas.getAllByText("คุณ")).toHaveLength(i + 1));
  }
}

const SIX = [
  `1 ${chatFixtures.question}`,
  "2 ขอแบบเป็นข้อ",
  "3 ลองถามที่ล้มเหลว",
  "4 หยุดกลางคัน",
  `5 ${chatFixtures.longQuestion}`,
  "6 คำถามสุดท้าย",
] as const;

/**
 * Six exchanges in mixed states (done by rules, done by mock, failed, stopped, long): the named
 * transcript scrolls inside the chat and ends at the newest reply, and Tab goes transcript,
 * textarea, Send, close with a visible focus ring on each.
 * Fixture hosts mix worked out by rules and mock data.
 */
export const Conversation: Story = {
  args: { onAsk: fn(conversationHost) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await converse(canvasElement, SIX);
    const transcript = canvas.getByRole("region", { name: "บทสนทนา" });
    await expect(transcript.scrollHeight).toBeGreaterThan(transcript.clientHeight);
    await waitFor(() =>
      expect(transcript.scrollTop + transcript.clientHeight).toBeGreaterThanOrEqual(
        transcript.scrollHeight - 2,
      ),
    );
    // Changes 3 and 5: 8 above the first exchange, 16 at the sides and the end, 24 between exchanges.
    const log = q(canvasElement, ".ds-chat__log");
    const exchanges = [...canvasElement.querySelectorAll<HTMLElement>(".ds-chat__exchange")];
    near(box(exchanges[0] as Element).top - box(log).top, 8);
    await expect(getComputedStyle(log).paddingBlockEnd).toBe("16px");
    await expect(getComputedStyle(log).paddingInlineStart).toBe("16px");
    near(
      box(q(exchanges[1] as HTMLElement, ".ds-chat__question")).top -
        box(q(exchanges[0] as HTMLElement, ".ds-chat__meta")).bottom,
      24,
    );
    await expectNotice(canvasElement, "คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI");
    // The transcript sits above the composer, and the composer stays inside the chat.
    const chat = box(chatOf(canvasElement));
    const composer = box(canvasElement.querySelector(".ds-chat__composer") as HTMLElement);
    await expect(inside(composer, chat)).toBe(true);
    await expect(box(transcript).bottom).toBeLessThanOrEqual(composer.top + 0.5);
    await expect(chatOf(canvasElement).scrollHeight).toBeLessThanOrEqual(
      chatOf(canvasElement).clientHeight,
    );
    // Only the newest exchange carries the live region; older ones do not.
    await expect(canvasElement.querySelectorAll(".ds-chat [aria-live='polite']")).toHaveLength(1);
    // Keyboard: transcript, textarea, Send, close; the focus ring shows on each.
    transcript.focus();
    const order = [
      transcript,
      input(canvas),
      action(canvas, "ส่ง"),
      canvas.getByRole("button", { name: "ปิดแชท" }),
    ];
    for (const [i, target] of order.entries()) {
      if (i > 0) await userEvent.tab();
      await expect(target).toHaveFocus();
      // The textarea's ring is drawn around its whole box.
      const ringed = target === input(canvas) ? q(canvasElement, ".ds-chat__box") : target;
      await waitFor(() => expect(getComputedStyle(ringed).outlineStyle).toBe("solid"));
    }
    // The older failure keeps its text and has no retry: only the newest exchange can resend.
    await expect(canvas.getAllByText(FAILED, { selector: ".ds-chat__failure p" })).toHaveLength(1);
    await expect(canvas.queryByRole("button", { name: "ส่งอีกครั้ง" })).toBeNull();
  },
};

/** The notice says rules while the reply says mock: each is shown as it is, never corrected. The fixture host answers with mock data under a rules notice. */
export const BasisMismatch: Story = {
  args: { basis: "rules", onAsk: fn(chatFixtures.host(chatFixtures.reply, "mock")) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI")).toBeVisible();
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("ข้อมูลจำลอง", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expect(canvas.queryByText("ตามกฎ")).toBeNull();
  },
};

/** What every long-text story proves: nothing overflows or clips and the controls stay reachable. */
async function expectFits(canvasElement: HTMLElement) {
  const chatEl = chatOf(canvasElement);
  const chat = box(chatEl);
  await expect(chatEl.scrollWidth).toBeLessThanOrEqual(chatEl.clientWidth);
  const viewport = viewportOf(canvasElement);
  await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth);
  for (const text of canvasElement.querySelectorAll<HTMLElement>(".ds-chat__text")) {
    await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
    await expect(getComputedStyle(text).textOverflow).not.toBe("ellipsis");
    // Sideways only: a long transcript scrolls, so a text block may sit above or below the viewport.
    await expect(box(text).left).toBeGreaterThanOrEqual(chat.left - 0.5);
    await expect(box(text).right).toBeLessThanOrEqual(chat.right + 0.5);
  }
  for (const question of canvasElement.querySelectorAll<HTMLElement>(".ds-chat__question")) {
    // The bubble keeps 32 px free at the start and sits at the end edge.
    await expect(box(question).left).toBeGreaterThanOrEqual(box(viewport).left + 16 + 32 - 0.5);
    await expect(box(question).right).toBeLessThanOrEqual(box(viewport).right - 16 + 0.5);
    await expect(question.scrollWidth).toBeLessThanOrEqual(question.clientWidth);
  }
  const field = box(canvasElement.querySelector(".ds-chat__composer textarea") as HTMLElement);
  const send = box(q(canvasElement, ".ds-chat__send"));
  const close = box(q(canvasElement, ".ds-chat__close"));
  const header = box(canvasElement.querySelector(".ds-chat__header") as HTMLElement);
  for (const part of [field, send, close]) await expect(inside(part, chat)).toBe(true);
  await expect(inside(field, box(q(canvasElement, ".ds-chat__box")))).toBe(true);
  await expectActions(canvasElement);
  await expect(overlap(send, field)).toBe(false);
  await expect(overlap(close, header)).toBe(false);
  await expect(overlap(close, box(viewport))).toBe(false);
  await expect(box(viewport).bottom).toBeLessThanOrEqual(field.top);
  // The composer's bottom edge is the chat's: nothing hangs below it.
  await expect(
    box(canvasElement.querySelector(".ds-chat__composer") as HTMLElement).bottom,
  ).toBeLessThanOrEqual(chat.bottom + 0.5);
}

/** A long Thai question and reply without spaces at 360 px: wrapped in full, nothing clipped. The fixture host answers by rules. */
export const Narrow: Story = {
  args: { onAsk: fn(chatFixtures.host(chatFixtures.longReply, "rules", { steps: 2, ms: 10 })) },
  render: (args) => (
    <Frame size="sheet">
      <CanvasChat {...args} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.longQuestion);
    await waitFor(() =>
      expect(canvas.getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expectFits(canvasElement);
    const replyText = canvasElement.querySelector(".ds-chat__reply .ds-chat__text") as HTMLElement;
    await expect(replyText).toHaveTextContent(chatFixtures.longReply);
  },
};

/** The smallest panel the shell gives it, 240 px: the inner row still fits on one line. The fixture host answers by rules. */
export const NarrowestPanel: Story = {
  args: { onAsk: fn(chatFixtures.host(chatFixtures.longReply, "rules", { steps: 2, ms: 10 })) },
  render: (args) => (
    <Frame size="min">
      <CanvasChat {...args} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.longQuestion);
    await waitFor(() =>
      expect(canvas.getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expectFits(canvasElement);
    // At 240 the row still fits: Send sits inside the box, and the counter is hidden under 1,800.
    await expect(inside(box(action(canvas, "ส่ง")), box(q(canvasElement, ".ds-chat__box")))).toBe(
      true,
    );
    await expect(getComputedStyle(q(canvasElement, ".ds-textarea__counter")).display).toBe("none");
    // The long Thai question keeps 32 px free at the start and wraps by word.
    const question = box(q(canvasElement, ".ds-chat__question"));
    await expect(question.left).toBeGreaterThanOrEqual(
      box(chatOf(canvasElement)).left + 16 + 32 - 0.5,
    );
  },
};

/** The widest panel, 480 px, with Send inside the box and the counter hidden. The fixture host answers by rules. */
export const WidestPanel: Story = {
  render: (args) => (
    <Frame size="max">
      <CanvasChat {...args} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expectFits(canvasElement);
    near(box(chatOf(canvasElement)).width, 480);
    await expect(inside(box(action(canvas, "ส่ง")), box(q(canvasElement, ".ds-chat__box")))).toBe(
      true,
    );
    await expect(getComputedStyle(q(canvasElement, ".ds-textarea__counter")).display).toBe("none");
  },
};

/**
 * The same chat in English at 240 px; every string comes from the English catalog. The starters fit,
 * the honesty line wraps instead of clipping, the inner row stays on one line. Replies are mock data.
 */
export const English: Story = {
  args: {
    basis: "mock",
    onAsk: fn(chatFixtures.host(chatFixtures.replyEn, "mock", { steps: 2, ms: 10 })),
  },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: (args) => (
    <Frame size="min">
      <CanvasChat {...args} />
    </Frame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Board chat" })).toBeVisible();
    await expect(canvas.getByText("No messages yet. Ask anything about the board")).toBeVisible();
    await expectNotice(canvasElement, "Replies are mock data. No AI yet");
    await expect(input(canvas, "Message to the engine")).toHaveAttribute(
      "placeholder",
      "Ask or give a task",
    );
    const chat = box(chatOf(canvasElement));
    const starters = canvas.getByRole("list", { name: "Ways to start" });
    const pills = within(starters).getAllByRole("button");
    await expect(pills.map((b) => b.textContent)).toEqual([
      "What is missing here?",
      "Suggest brand colours",
      "What should I do next?",
    ]);
    for (const pill of pills) {
      await expect(box(pill).right).toBeLessThanOrEqual(chat.right - 16 + 0.5);
      near(box(pill).height, 32);
    }
    await expectActions(canvasElement);
    await userEvent.click(pills[0] as HTMLElement);
    await expect(input(canvas, "Message to the engine")).toHaveValue("What is missing here?");
    await expect(args.onAsk).not.toHaveBeenCalled();
    await userEvent.clear(input(canvas, "Message to the engine"));
    await userEvent.type(
      input(canvas, "Message to the engine"),
      `${chatFixtures.questionEn}{Enter}`,
    );
    await expect(canvas.getByText("You")).toBeInTheDocument();
    await waitFor(() =>
      expect(canvas.getByText("Mock data", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expect(canvas.getByRole("button", { name: "Send" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Close chat" })).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Conversation" })).toBeVisible();
    await expectFits(canvasElement);
  },
};

/**
 * Starter prompts at the three widths the shell gives the chat, 240, 320 and 480, in Thai and in
 * English: each list holds three buttons that fit the content width. Six chats in one document, so
 * axe's landmark-unique rule is off here, as in the matrix story. Fixture host, replies by rules.
 */
export const StartersAtWidths: Story = {
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: (args) => (
    <div className="flex flex-wrap gap-4">
      {(["th", "en"] as const).flatMap((locale) =>
        (["min", "panel", "max"] as const).map((size) => (
          <LocaleProvider key={`${locale}-${size}`} locale={locale}>
            <div data-case={`${locale}-${size}`}>
              <Frame size={size}>
                <CanvasChat {...args} />
              </Frame>
            </div>
          </LocaleProvider>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cases = [...canvasElement.querySelectorAll<HTMLElement>("[data-case]")];
    await expect(cases).toHaveLength(6);
    for (const item of cases) {
      const chat = box(chatOf(item));
      const list = q(item, ".ds-chat__starters");
      const pills = [...list.querySelectorAll<HTMLElement>(".ds-button")];
      await expect(pills).toHaveLength(3);
      for (const pill of pills) {
        await expect(box(pill).left).toBeGreaterThanOrEqual(chat.left + 16 - 0.5);
        await expect(box(pill).right).toBeLessThanOrEqual(chat.right - 16 + 0.5);
        await expect(pill.scrollWidth).toBeLessThanOrEqual(pill.clientWidth);
      }
    }
  },
};

/**
 * Six chats in one document, one per profile and mode, each with one finished reply from a fixture
 * host (worked out by rules). The region names come from the catalog and the public API has no label prop,
 * so axe's landmark-unique rule is off for this story only; each chat sits in a cell named by its
 * profile and mode. The fixture host answers by rules.
 */
export const RecipesAndModes: Story = {
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  args: { onAsk: fn(chatFixtures.host(chatFixtures.reply, "rules", { steps: 2, ms: 10 })) },
  render: (args) => (
    <Matrix>
      <Frame size="panel">
        <CanvasChat {...args} />
      </Frame>
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]"));
    await expect(cells).toHaveLength(6);
    for (const cell of cells) await ask(within(cell), chatFixtures.question);
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".ds-chat__basis")).toHaveLength(cells.length),
    );
    // Each chat shows the panel layout: 320 px wide inside its 322 px frame, with the basis word.
    for (const cell of cells) {
      await expect(box(chatOf(cell)).width).toBeCloseTo(320, 0);
      await expect(within(cell).getByText("ตามกฎ", { selector: ".ds-chat__basis" })).toBeVisible();
      // In dark the panel's edge is the card border; in light it is transparent.
      if (cell.dataset.matrixMode === "dark") {
        await expect(getComputedStyle(chatOf(cell)).outlineColor).toBe(
          resolved(cell, "--ds-border-card", "borderTopColor"),
        );
      }
    }
  },
};

/** The board of the slice B stories: the host applies placeReply to the graph it owns. */
function BoardChat({
  selected,
  args,
  height = 560,
  controlled = false,
  size = "panel",
}: {
  /** The node selected alone at the start, if any. */
  selected?: string;
  args: Parameters<typeof CanvasChat>[0];
  height?: number;
  /** The shell owns the mentions: `node.mention` from the context menu adds the node (ORV-107). */
  controlled?: boolean;
  /** The chat's width, from the panel range. */
  size?: keyof typeof WIDTH;
}) {
  const [mentions, setMentions] = useState<readonly string[]>(args.defaultMentions ?? []);
  const [graph, setGraph] = useState<Graph>(() => ({
    ...BOARD,
    nodes: BOARD.nodes.map((n) => ({ ...n, selected: n.id === selected })),
  }));
  const latest = useRef(graph);
  latest.current = graph;
  const count = useRef(0);
  const place = (
    reply: ChatReply,
    request: ChatRequest,
    locale: "th" | "en",
    position: { x: number; y: number },
  ) => {
    const id = `reply-${++count.current}`;
    const next = placeReply(latest.current, {
      id,
      title: replyTitle(request.text, locale),
      text: reply.text,
      basis: reply.basis,
      sources: [...(request.contextNodeId ? [request.contextNodeId] : []), ...request.mentions],
      position,
    });
    latest.current = next;
    setGraph(next);
    return id;
  };
  return (
    <div style={{ height }} className="relative">
      <CanvasBoard
        graph={graph}
        onChange={setGraph}
        label="กระดานแบรนด์ (ข้อมูลตัวอย่าง)"
        minimap={false}
        onCommand={(command, context) => {
          if (command !== "node.mention" || !context.nodeId) return;
          const id = context.nodeId;
          setMentions((list) => (list.includes(id) ? list : [...list, id]));
        }}
      >
        <ChatSlot
          args={
            controlled
              ? {
                  ...args,
                  defaultMentions: undefined,
                  mentions,
                  onMentionsChange: (ids) => {
                    setMentions(ids);
                    args.onMentionsChange?.(ids);
                  },
                }
              : args
          }
          place={place}
          size={size}
        />
      </CanvasBoard>
    </div>
  );
}

/** The chat as a child of the board, so it reads the selection; unlinked replies land at the centre. */
function ChatSlot({
  args,
  place,
  size,
}: {
  args: Parameters<typeof CanvasChat>[0];
  size: keyof typeof WIDTH;
  place: (
    reply: ChatReply,
    request: ChatRequest,
    locale: "th" | "en",
    position: { x: number; y: number },
  ) => string;
}) {
  const flow = useReactFlow();
  const locale = useLocale();
  const slot = useRef<HTMLDivElement>(null);
  const onReply = (reply: ChatReply, request: ChatRequest) => {
    const rect = slot.current?.closest(".ds-board")?.getBoundingClientRect();
    const centre = rect
      ? flow.screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 0, y: 0 };
    return place(reply, request, locale, centre);
  };
  return (
    <div
      ref={slot}
      className={`nodrag nopan nowheel absolute z-10 h-[calc(100%-24px)] ${WIDTH[size]} end-3 top-3`}
    >
      <CanvasChat {...args} onReply={onReply} />
    </div>
  );
}

/** The ids and boxes the slice B plays read. */
const nodeEl = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
const boardEl = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-board") as HTMLElement;
/** Every other node on the board that the given node's box meets (ORV-107 row 30). */
const nodesMet = (root: HTMLElement, el: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(".react-flow__node")]
    .filter((n) => n !== el && overlap(box(n), box(el)))
    .map((n) => n.dataset.id);

/**
 * The chat on a board with the brief node selected alone. A finished reply (worked out by rules)
 * becomes a note one grid unit right of the brief, titled by the question, with its basis word and
 * a derived edge from the brief; selection and focus stay where they were. The chat says it
 * placed the node and its jump button selects and focuses the node.
 */
export const OnBoard: Story = {
  render: (args) => <BoardChat selected="brief" args={args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "brief")).toHaveClass("selected"));
    // Change 1: the chat floats 12 px from the board's top and end edges and keeps its height (536).
    const floating = box(chatOf(canvasElement));
    near(box(boardEl(canvasElement)).right - floating.right, 12);
    near(floating.top - box(boardEl(canvasElement)).top, 12);
    near(floating.height, 536);
    // Change 13: the quiet header and the one-row box leave the transcript room for the answer.
    await expect(box(viewportOf(canvasElement)).height).toBeGreaterThanOrEqual(349);
    await ask(canvas, chatFixtures.question);
    const title = `คำตอบเรื่อง ${chatFixtures.question}`;
    await waitFor(() => expect(nodeEl(canvasElement, "reply-1")).toBeTruthy());
    const reply = nodeEl(canvasElement, "reply-1");
    const brief = nodeEl(canvasElement, "brief");
    // React Flow keeps a new node hidden until it is measured: wait for it to show.
    await waitFor(() => expect(within(reply).getByText(title)).toBeVisible());
    await expect(reply).toHaveTextContent(chatFixtures.reply);
    await expect(within(reply).getByText("ตามกฎ", { selector: ".ds-node__basis" })).toBeVisible();
    // The derived edge from the brief; the chat keeps focus and the brief stays the one selection.
    await expect(
      canvasElement.querySelector(`.react-flow__edge[data-id="e:brief:text:reply-1:from-brief"]`),
    ).not.toBeNull();
    await expect(brief).toHaveClass("selected");
    await expect(reply).not.toHaveClass("selected");
    await expect(canvasElement.querySelectorAll(".react-flow__node.selected")).toHaveLength(1);
    await expect(input(canvas)).toHaveFocus();
    // One grid unit (24 flow px) right of the brief; the spot beside it is covered by the logo, so
    // the note steps down in whole grid units until it covers no node (ORV-107 row 30).
    const scale = box(brief).width / brief.offsetWidth;
    await expect(box(reply).left - box(brief).right).toBeCloseTo(24 * scale, 0);
    const steps = (box(reply).top - box(brief).top) / scale / 24;
    await expect(steps).toBeGreaterThan(0);
    await expect(Math.abs(steps - Math.round(steps))).toBeLessThan(0.02);
    await expect(nodesMet(canvasElement, reply)).toEqual([]);
    await waitFor(() =>
      expect(statusOf(canvasElement)).toHaveTextContent(`วางคำตอบเป็นโหนด ${title} แล้ว`),
    );
    // The jump button sits in the chat beside the basis word and selects and focuses the node.
    const jump = canvas.getByRole("button", {
      name: `ไปที่โหนดคำตอบ เรื่อง ${chatFixtures.question}`,
    });
    await expect(jump).toHaveTextContent("ไปที่โหนดคำตอบ");
    // Change 6: the meta row stays one 32 px line with the Jump beside the basis word.
    const meta = box(q(canvasElement, ".ds-chat__meta"));
    near(meta.height, 32);
    near(
      box(q(canvasElement, ".ds-chat__basis")).top +
        box(q(canvasElement, ".ds-chat__basis")).height / 2,
      meta.top + 16,
      1,
    );
    const chat = box(chatOf(canvasElement));
    await expect(inside(box(jump), chat)).toBe(true);
    await expect(
      overlap(box(jump), box(canvasElement.querySelector(".ds-chat__basis") as Element)),
    ).toBe(false);
    await userEvent.click(jump);
    await waitFor(() => expect(reply).toHaveClass("selected"));
    await expect(brief).not.toHaveClass("selected");
    await waitFor(() => expect(reply).toHaveFocus());
    await expect(canvasElement.querySelector(".ds-board__status")).toHaveTextContent(
      `ไปที่ ${title}`,
    );
    // The node settles inside the board and clear of the chat panel.
    await waitFor(() => {
      const node = box(reply);
      expect(inside(node, box(boardEl(canvasElement)))).toBe(true);
      expect(overlap(node, chat)).toBe(false);
    });
    // Deleting the node removes the jump button: it is only offered while the node is on the board.
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(nodeEl(canvasElement, "reply-1")).toBeNull());
    await waitFor(() =>
      expect(canvas.queryByRole("button", { name: /^ไปที่โหนดคำตอบ/ })).toBeNull(),
    );
  },
};

/**
 * No node selected and no mention: the reply (worked out by rules) lands at the board's centre
 * with no edge, and the transcript says it is not linked to any node. The jump still works.
 */
export const Unlinked: Story = {
  render: (args) => <BoardChat args={args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "brief")).toBeTruthy());
    await expect(canvasElement.querySelectorAll(".react-flow__node.selected")).toHaveLength(0);
    // React Flow draws edges only once the nodes are measured: wait for the fixture's edges.
    const edges = BOARD.edges.length;
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".react-flow__edge")).toHaveLength(edges),
    );
    const title = `คำตอบเรื่อง ${chatFixtures.question}`;
    await ask(canvas, chatFixtures.question);
    await waitFor(() => expect(nodeEl(canvasElement, "reply-1")).toBeTruthy());
    const reply = nodeEl(canvasElement, "reply-1");
    await waitFor(() => expect(within(reply).getByText(title)).toBeVisible());
    await expect(canvasElement.querySelectorAll(".react-flow__edge")).toHaveLength(edges);
    await expect(canvas.getByText("ไม่ได้ผูกกับโหนดใด")).toBeVisible();
    // Its left edge is the board's centre, snapped to the grid: within half a grid unit. The
    // centre is covered by a node, so the note steps down by whole grid units, never up.
    const board = box(boardEl(canvasElement));
    const scale = box(reply).width / reply.offsetWidth;
    const half = 12 * scale + 0.5;
    await expect(Math.abs(box(reply).left - (board.left + board.width / 2))).toBeLessThanOrEqual(
      half,
    );
    await expect(box(reply).top).toBeGreaterThanOrEqual(board.top + board.height / 2 - half);
    // The node and the chat's controls are clear of each other and inside their parents.
    // It may sit below the visible part of the board; the jump below brings it into view.
    await expect(nodesMet(canvasElement, reply)).toEqual([]);
    await expect(overlap(box(reply), box(chatOf(canvasElement)))).toBe(false);
    for (const part of [".ds-chat__meta .ds-button", ".ds-chat__unlinked"]) {
      await expect(
        inside(box(canvasElement.querySelector(part) as Element), box(chatOf(canvasElement))),
      ).toBe(true);
    }
    await userEvent.click(canvas.getByRole("button", { name: /^ไปที่โหนดคำตอบ เรื่อง/ }));
    await waitFor(() => expect(reply).toHaveClass("selected"));
    await waitFor(() => expect(reply).toHaveFocus());
  },
};

const optionsOf = (canvas: ReturnType<typeof within>) =>
  within(canvas.getByRole("listbox", { name: "โหนดบนบอร์ด" })).getAllByRole("option");
const chipsOf = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(".ds-chat__chip .ds-tag__label")].map(
    (el) => el.textContent,
  );
const edgesTo = (root: HTMLElement, id: string) =>
  [...root.querySelectorAll<HTMLElement>(".react-flow__edge")].filter((e) =>
    (e.dataset.id ?? "").includes(`:${id}:`),
  );

/**
 * Mentions (ORV-105 rows 18 to 21, ORV-107): typing "@" opens "โหนดบนบอร์ด" above the box, full
 * width, with every node by title and kind word; more text narrows it, arrows move, Enter picks
 * and turns the "@query" into the node title and a space, Escape closes the list only. The Mention button opens
 * the same list. Chips are neutral tags with a remove; a repeat adds nothing. Sending passes the
 * ids in pick order and the transcript lists them; the reply (rules) is linked once to each
 * mentioned node and to the node selected alone. Nothing is read from the nodes.
 */
export const Mentions: Story = {
  args: { onMentionsChange: fn() },
  render: (args) => <BoardChat selected="brief" args={args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "brief")).toHaveClass("selected"));
    const field = input(canvas);
    const chat = box(chatOf(canvasElement));
    // Row 20: the Mention button is round, icon-only and leads the inner row; focus shows its name in a tooltip.
    const mention = canvas.getByRole("button", { name: "อ้างถึงโหนด" });
    await expect(mention.textContent).toBe("");
    mention.focus();
    await waitFor(() =>
      expect(document.body.querySelector(".ds-tooltip")).toHaveTextContent("อ้างถึงโหนด"),
    );
    // Row 18: "@" at the start opens the list above the box, exactly the box's width.
    await expect(canvas.queryByRole("listbox")).toBeNull();
    await userEvent.click(field);
    await expect(field).toHaveAttribute("role", "combobox");
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await userEvent.type(field, "@");
    await expect(field).toHaveAttribute("aria-expanded", "true");
    const list = canvas.getByRole("listbox", { name: "โหนดบนบอร์ด" });
    await expect(optionsOf(canvas)).toHaveLength(BOARD.nodes.length);
    await expect(optionsOf(canvas)[0]).toHaveTextContent("บรีฟ");
    await expect(optionsOf(canvas)[0]).toHaveTextContent("บล็อกป้อนข้อมูล");
    const picker = list.parentElement as HTMLElement;
    const composer = box(q(canvasElement, ".ds-chat__box"));
    near(composer.top - box(picker).bottom, 8);
    await expect(box(picker).left).toBeCloseTo(composer.left, 0);
    await expect(box(picker).width).toBeCloseTo(composer.width, 0);
    await expect(box(picker).height).toBeLessThanOrEqual(240 + 1);
    await expect(inside(box(picker), chat)).toBe(true);
    await expect(field).toHaveAttribute("aria-controls", list.id);
    await expect(field).toHaveAttribute("aria-activedescendant", optionsOf(canvas)[0]?.id);
    await userEvent.keyboard("{ArrowDown}");
    await expect(field).toHaveAttribute("aria-activedescendant", optionsOf(canvas)[1]?.id);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    await expect(field).toHaveAttribute(
      "aria-activedescendant",
      optionsOf(canvas).at(-1)?.id as string,
    );
    // The list narrows by text; a miss says so.
    await userEvent.keyboard("{Backspace}");
    await userEvent.type(field, "@");
    await userEvent.type(field, "zz");
    await expect(canvas.getByText('ไม่มีโหนดชื่อ "zz"')).toBeVisible();
    await expect(canvas.queryByRole("listbox")).toBeNull();
    await expect(field).toHaveAttribute("aria-expanded", "false");
    // Escape closes the list only: the text stays, nothing is sent, the chat stays.
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByText('ไม่มีโหนดชื่อ "zz"')).toBeNull();
    await expect(field).toHaveValue("@zz");
    await expect(args.onClose).not.toHaveBeenCalled();
    await userEvent.clear(field);
    // Row 19: picking turns "@query" into the title and a space and adds a chip; Enter during IME composition never picks.
    await userEvent.type(field, "@โล");
    await expect(optionsOf(canvas)).toHaveLength(1);
    await expect(field).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await userEvent.clear(field);
    await userEvent.type(field, "@โล");
    field.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    field.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await expect(chipsOf(canvasElement)).toEqual([]);
    await expect(canvas.getByRole("listbox")).toBeVisible();
    field.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    await userEvent.keyboard("{Enter}");
    await expect(field).toHaveValue("โลโก้ ");
    await expect(canvas.queryByRole("listbox")).toBeNull();
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await expect(args.onAsk).not.toHaveBeenCalled();
    await expect(args.onMentionsChange).toHaveBeenLastCalledWith(["logo"]);
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้"]);
    const chips = canvas.getByRole("list", { name: "โหนดที่อ้างถึง" });
    const boxEl = box(q(canvasElement, ".ds-chat__box"));
    await expect(inside(box(chips), boxEl)).toBe(true);
    // Change 9: chips are the box's first row; the text sits 4 below them; the chip label starts one border width (1 px) after the text and the Mention icon.
    near(box(chips).top - boxEl.top, 9);
    near(box(field).top - box(chips).bottom, 4);
    const fieldPad = parseFloat(getComputedStyle(field).paddingLeft);
    near(box(q(chips, ".ds-tag__label")).left, box(field).left + fieldPad, 1.5);
    near(box(q(canvasElement, ".ds-chat__mention svg")).left, box(field).left + fieldPad, 1);
    await expect(canvas.getByRole("button", { name: "ลบ โลโก้" })).toBeVisible();
    // Row 20: the Mention button opens the same list; a click picks.
    await userEvent.click(canvas.getByRole("button", { name: "อ้างถึงโหนด" }));
    await expect(field).toHaveFocus();
    await expect(optionsOf(canvas)).toHaveLength(BOARD.nodes.length);
    await userEvent.click(canvas.getByRole("option", { name: /โปรไฟล์ว่าที่ลูกค้า/ }));
    await expect(field).toHaveValue("โลโก้ โปรไฟล์ว่าที่ลูกค้า ");
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้", "โปรไฟล์ว่าที่ลูกค้า"]);
    // The same node again adds nothing and does not fire the callback; picking the node that is
    // selected alone is a chip like any other.
    const calls = (args.onMentionsChange as ReturnType<typeof fn>).mock.calls.length;
    await userEvent.type(field, "@โล{Enter}");
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้", "โปรไฟล์ว่าที่ลูกค้า"]);
    await expect((args.onMentionsChange as ReturnType<typeof fn>).mock.calls).toHaveLength(calls);
    await userEvent.type(field, "@บรี{Enter}");
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้", "โปรไฟล์ว่าที่ลูกค้า", "บรีฟ"]);
    const valueAfterPicks = (field as HTMLTextAreaElement).value;
    await expect(valueAfterPicks).toBe("โลโก้ โปรไฟล์ว่าที่ลูกค้า โลโก้ บรีฟ ");
    // Removing a chip does not edit the text.
    await userEvent.click(canvas.getByRole("button", { name: "ลบ บรีฟ" }));
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้", "โปรไฟล์ว่าที่ลูกค้า"]);
    await expect(field).toHaveValue(valueAfterPicks);
    await userEvent.type(field, "@บรี{Enter}");
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้", "โปรไฟล์ว่าที่ลูกค้า", "บรีฟ"]);
    // Row 21: sending passes the ids in pick order; the question lists them; one edge per source.
    await userEvent.clear(field);
    await userEvent.type(field, `${chatFixtures.question}{Enter}`);
    await expect(args.onAsk).toHaveBeenCalledTimes(1);
    await expect((args.onAsk as ReturnType<typeof fn>).mock.calls[0]?.[0]).toEqual({
      text: chatFixtures.question,
      mentions: ["logo", "profile", "brief"],
      contextNodeId: "brief",
    });
    await expect(canvasElement.querySelector(".ds-chat__refs")).toHaveTextContent(
      "โหนดที่อ้างถึง: โลโก้, โปรไฟล์ว่าที่ลูกค้า, บรีฟ",
    );
    await waitFor(() => expect(nodeEl(canvasElement, "reply-1")).toBeTruthy());
    await waitFor(() => expect(edgesTo(canvasElement, "reply-1")).toHaveLength(3));
    for (const source of ["brief", "logo", "profile"]) {
      await expect(
        edgesTo(canvasElement, "reply-1").filter((e) => e.dataset.id?.startsWith(`e:${source}:`)),
      ).toHaveLength(1);
    }
    await expect(nodesMet(canvasElement, nodeEl(canvasElement, "reply-1"))).toEqual([]);
    // The chips stay for the next question; removing one drops it from the row.
    await userEvent.click(canvas.getByRole("button", { name: "ลบ โลโก้" }));
    await expect(chipsOf(canvasElement)).toEqual(["โปรไฟล์ว่าที่ลูกค้า", "บรีฟ"]);
    await expect(args.onMentionsChange).toHaveBeenLastCalledWith(["profile", "brief"]);
  },
};

/**
 * The shell side of the context menu (ORV-105 row 20): "อ้างถึง node นี้ใน prompt" on a node
 * reaches the board's shell through onCommand("node.mention", { nodeId }) and the shell adds the
 * id to the controlled mentions, so the chip appears. Fixture host, replies by rules.
 */
export const MentionFromMenu: Story = {
  args: { onMentionsChange: fn() },
  render: (args) => <BoardChat args={args} controlled />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "logo")).toBeTruthy());
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".react-flow__edge")).toHaveLength(BOARD.edges.length),
    );
    await userEvent.pointer({ keys: "[MouseRight]", target: nodeEl(canvasElement, "logo") });
    const menu = await within(document.body).findByRole("menu");
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: "อ้างถึง node นี้ใน prompt" }),
    );
    await waitFor(() => expect(chipsOf(canvasElement)).toEqual(["โลโก้"]));
    // A second use adds a second chip; the same node twice adds none. The shell owns the list.
    await userEvent.pointer({ keys: "[MouseRight]", target: nodeEl(canvasElement, "palette") });
    await userEvent.click(
      within(await within(document.body).findByRole("menu")).getByRole("menuitem", {
        name: "อ้างถึง node นี้ใน prompt",
      }),
    );
    await waitFor(() => expect(chipsOf(canvasElement)).toHaveLength(2));
    await userEvent.pointer({ keys: "[MouseRight]", target: nodeEl(canvasElement, "logo") });
    await userEvent.click(
      within(await within(document.body).findByRole("menu")).getByRole("menuitem", {
        name: "อ้างถึง node นี้ใน prompt",
      }),
    );
    await expect(chipsOf(canvasElement)).toHaveLength(2);
    // A pick through the chat's own picker calls the callback; a shell add does not.
    await expect(args.onMentionsChange).not.toHaveBeenCalled();
    await userEvent.click(canvas.getAllByRole("button", { name: /^ลบ / })[0] as HTMLElement);
    await expect(args.onMentionsChange).toHaveBeenCalledTimes(1);
    await expect(chipsOf(canvasElement)).toHaveLength(1);
  },
};

/**
 * A mentioned node deleted from the board (ORV-105 row 22): its chip keeps the title on one line and "{title} ไม่อยู่บนบอร์ดแล้ว" shows under the chip row
 * beside a caution mark, keeps its ink and has no strikethrough, the callback is not fired, and
 * the next request leaves its id out. The chip stays until the person removes it. Fixture host,
 * replies by rules.
 */
export const MentionGone: Story = {
  args: { defaultMentions: ["logo", "palette"], onMentionsChange: fn() },
  render: (args) => <BoardChat args={args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "logo")).toBeTruthy());
    await expect(chipsOf(canvasElement)).toEqual(["โลโก้", fixtures.mixed]);
    await userEvent.click(nodeEl(canvasElement, "logo"));
    await waitFor(() => expect(nodeEl(canvasElement, "logo")).toHaveClass("selected"));
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(nodeEl(canvasElement, "logo")).toBeNull());
    await waitFor(() => expect(chipsOf(canvasElement)).toEqual(["โลโก้", fixtures.mixed]));
    const gone = canvasElement.querySelector<HTMLElement>(
      ".ds-chat__chip[data-gone]",
    ) as HTMLElement;
    await expect(gone.querySelector(".ds-chat__gone-mark svg")).not.toBeNull();
    await expect(inside(box(gone), box(chatOf(canvasElement)))).toBe(true);
    const label = gone.querySelector(".ds-tag__label") as HTMLElement;
    await expect(getComputedStyle(label).textDecorationLine).toBe("none");
    await expect(getComputedStyle(label).color).toBe(
      getComputedStyle(
        canvasElement.querySelector(".ds-chat__chip:not([data-gone]) .ds-tag__label") as Element,
      ).color,
    );
    await expect(args.onMentionsChange).not.toHaveBeenCalled();
    await userEvent.type(input(canvas), `${chatFixtures.question}{Enter}`);
    await expect((args.onAsk as ReturnType<typeof fn>).mock.calls[0]?.[0]).toMatchObject({
      mentions: ["palette"],
    });
    await expect(canvasElement.querySelector(".ds-chat__refs")).toHaveTextContent(
      `โหนดที่อ้างถึง: ${fixtures.mixed}`,
    );
    await expect(chipsOf(canvasElement)).toHaveLength(2);
    await userEvent.click(canvas.getByRole("button", { name: "ลบ โลโก้ ไม่อยู่บนบอร์ดแล้ว" }));
    await expect(chipsOf(canvasElement)).toEqual([fixtures.mixed]);
    await expect(args.onMentionsChange).toHaveBeenCalledWith(["palette"]);
  },
};

/**
 * A gone chip at one width, locale and mode: one line like every chip, the title truncated with an
 * ellipsis, the explanation whole under the chip row (ORV-107 v1.6). Fixture host, replies by rules.
 */
function goneStory(
  size: "min" | "panel",
  locale: "th" | "en",
  mode: "light" | "dark",
  words: string,
): Story {
  return {
    args: { defaultMentions: ["palette", "logo"] },
    decorators: [
      (Story) => (
        <DesignProfileBoundary mode={mode}>
          <LocaleProvider locale={locale}>{Story()}</LocaleProvider>
        </DesignProfileBoundary>
      ),
    ],
    render: (args) => <BoardChat args={args} size={size} />,
    play: async ({ canvasElement, args }) => {
      await waitFor(() => expect(nodeEl(canvasElement, "palette")).toBeTruthy());
      await userEvent.click(nodeEl(canvasElement, "palette"));
      await userEvent.keyboard("{Delete}");
      await waitFor(() =>
        expect(canvasElement.querySelector(".ds-chat__chip[data-gone]")).not.toBeNull(),
      );
      await expectGoneChip(canvasElement, words, fixtures.mixed);
      if (size === "min") {
        const label = q(canvasElement, ".ds-chat__chip[data-gone] .ds-tag__label");
        await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      }
      const canvas = within(canvasElement);
      await userEvent.type(
        input(canvas, locale === "th" ? undefined : "Message to the engine"),
        `${chatFixtures.question}{Enter}`,
      );
      await expect((args.onAsk as ReturnType<typeof fn>).mock.calls[0]?.[0]).toMatchObject({
        mentions: ["logo"],
      });
    },
  };
}
const GONE_TH = "ไม่อยู่บนบอร์ดแล้ว";
const GONE_EN = "is no longer on the board";

export const MentionGoneNarrow: Story = goneStory("min", "th", "light", GONE_TH);
export const MentionGoneNarrowDark: Story = goneStory("min", "th", "dark", GONE_TH);
export const MentionGoneNarrowEnglish: Story = goneStory("min", "en", "light", GONE_EN);
export const MentionGoneNarrowEnglishDark: Story = goneStory("min", "en", "dark", GONE_EN);
export const MentionGonePanel: Story = goneStory("panel", "th", "light", GONE_TH);
export const MentionGonePanelDark: Story = goneStory("panel", "th", "dark", GONE_TH);
export const MentionGonePanelEnglish: Story = goneStory("panel", "en", "light", GONE_EN);
export const MentionGonePanelEnglishDark: Story = goneStory("panel", "en", "dark", GONE_EN);

/**
 * Outside a board there is no node to pick: no Mention button, and "@" is a plain character.
 * Fixture host, replies by rules.
 */
export const NoBoardNoMention: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(input(canvas), "@บ");
    await expect(canvas.queryByRole("button", { name: "อ้างถึงโหนด" })).toBeNull();
    await expect(canvas.queryByRole("listbox")).toBeNull();
    await expect(input(canvas)).toHaveValue("@บ");
    await userEvent.keyboard("{Enter}");
    await expect((args.onAsk as ReturnType<typeof fn>).mock.calls[0]?.[0]).toEqual({
      text: "@บ",
      mentions: [],
    });
  },
};

/** The picker and the chips in English, from the catalog; fixture host, replies by rules. */
export const MentionsEnglish: Story = {
  args: { defaultMentions: ["logo"] },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: (args) => <BoardChat args={args} size="min" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "logo")).toBeTruthy());
    const field = canvas.getByRole("combobox", { name: "Message to the engine" });
    await expect(canvas.getByRole("list", { name: "Mentioned nodes" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Mention a node" }));
    await expect(canvas.getByRole("listbox", { name: "Nodes on the board" })).toBeVisible();
    await userEvent.type(field, "qq");
    await expect(canvas.getByText('No node named "qq"')).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await userEvent.clear(field);
    await userEvent.click(nodeEl(canvasElement, "logo"));
    await userEvent.keyboard("{Delete}");
    await waitFor(() => expect(chipsOf(canvasElement)).toEqual(["โลโก้"]));
    await expect(
      canvas.getByRole("button", { name: "Remove โลโก้ is no longer on the board" }),
    ).toBeVisible();
    // A pick puts the node title and a space in the text, in English too.
    await userEvent.type(field, "@บรี{Enter}");
    await expect(field).toHaveValue("บรีฟ ");
    // Change 6 at 240: after a reply the Jump may take a second meta line, but the basis word stays
    // on the first one and nothing in the meta row overflows.
    await userEvent.clear(field);
    await userEvent.type(field, `${chatFixtures.questionEn}{Enter}`);
    const jump = await canvas.findByRole("button", { name: /^Go to reply node/ });
    const meta = q(canvasElement, ".ds-chat__meta");
    const basis = q(canvasElement, ".ds-chat__basis");
    await expect(meta.scrollWidth).toBeLessThanOrEqual(meta.clientWidth);
    near(box(basis).top + box(basis).height / 2, box(meta).top + 16, 1);
    await expect(inside(box(jump), box(chatOf(canvasElement)))).toBe(true);
    await expect([32, 68]).toContain(Math.round(box(meta).height));
  },
};

/**
 * The smallest chat the layout allows, 242 px wide and 380 px tall (the board's height leaves the
 * chat 356): with three chips and the picker open, the picker stays inside the chat and at the
 * composer's full width, the chips and the action buttons stay inside the composer, and the
 * picker scrolls instead of growing. Fixture host, replies by rules.
 */
export const MentionsSmallest: Story = {
  args: { defaultMentions: ["brief", "logo", "palette"] },
  render: (args) => <BoardChat args={args} height={380} size="min" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(nodeEl(canvasElement, "brief")).toBeTruthy());
    const field = input(canvas);
    await userEvent.type(field, "@");
    const picker = canvasElement.querySelector(".ds-chat__picker") as HTMLElement;
    const chat = box(chatOf(canvasElement));
    const composer = box(q(canvasElement, ".ds-chat__box"));
    await expect(inside(box(picker), chat)).toBe(true);
    await expect(box(picker).width).toBeCloseTo(composer.width, 0);
    await expect(box(picker).left).toBeCloseTo(composer.left, 0);
    near(composer.top - box(picker).bottom, 8);
    await expect(picker.scrollHeight).toBeGreaterThan(picker.clientHeight);
    for (const part of [".ds-chat__chips", "textarea"]) {
      await expect(inside(box(canvasElement.querySelector(part) as Element), composer)).toBe(true);
    }
    for (const button of canvasElement.querySelectorAll(".ds-chat__actions .ds-button")) {
      await expect(inside(box(button), composer)).toBe(true);
      await expect(overlap(box(button), box(field))).toBe(false);
      await expect(
        overlap(box(button), box(canvasElement.querySelector(".ds-chat__chips") as Element)),
      ).toBe(false);
    }
    await expectActions(canvasElement);
    // The chips never overlap the box or the buttons.
    await expect(
      overlap(box(canvasElement.querySelector(".ds-chat__chips") as Element), box(field)),
    ).toBe(false);
    await userEvent.keyboard("{Escape}");
    await expect(canvas.queryByRole("listbox")).toBeNull();
  },
};
