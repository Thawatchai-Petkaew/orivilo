import type { Meta, StoryObj } from "@storybook/react-vite";
import { useReactFlow } from "@xyflow/react";
import { useRef, useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider, useLocale } from "../../i18n/LocaleProvider";
import { CanvasBoard } from "../canvas-board/CanvasBoard";
import { BOARD } from "../canvas-board/fixtures";
import type { Graph } from "../canvas-board/graph";
import { chatFixtures, type ChatHost } from "../fixtures";
import { Matrix } from "../matrix";
import { CanvasChat, type ChatReply, type ChatRequest } from "./CanvasChat";
import { placeReply, replyTitle } from "./place-reply";

const meta = {
  title: "Application/Canvas chat",
  component: CanvasChat,
  parameters: {
    layout: "padded",
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

/** The widths a host gives the chat, 2 px more than the panel range for the frame's border. */
const WIDTH = {
  min: "w-[242px]",
  panel: "w-[322px]",
  sheet: "w-[360px]",
  max: "w-[482px]",
} as const;

function Frame({ size, children }: { size: keyof typeof WIDTH; children: ReactNode }) {
  return (
    <div className={`h-[560px] max-w-full border border-border-card ${WIDTH[size]}`}>
      {children}
    </div>
  );
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

const input = (canvas: ReturnType<typeof within>, name = "ข้อความถึงเอนจิน") =>
  canvas.getByRole("textbox", { name });

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

/** Empty transcript: invite text, basis notice, labelled textarea with its placeholder, Send. The notice says the replies are worked out by rules. */
export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "แชทบนบอร์ด" })).toBeVisible();
    await expect(canvas.getByText("ยังไม่มีข้อความ ถามเรื่องบนบอร์ดได้เลย")).toBeVisible();
    await expect(canvas.getByText("คำตอบมาจากกฎที่เขียนไว้ ยังไม่มี AI")).toBeVisible();
    await expect(input(canvas)).toHaveAttribute("placeholder", "ถามหรือสั่งงาน");
    await expect(action(canvas, "ส่ง")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ปิดแชท" })).toBeVisible();
    await expect(canvas.getByRole("region", { name: "บทสนทนา" })).toBeVisible();
  },
};

/** Mock basis: the notice and the reply word both say mock data, and nothing says AI answered. */
export const Mock: Story = {
  args: { basis: "mock", onAsk: fn(chatFixtures.host(chatFixtures.reply, "mock")) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("คำตอบเป็นข้อมูลจำลอง ยังไม่มี AI")).toBeVisible();
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
    await userEvent.keyboard("{Enter}");
    await userEvent.click(action(canvas, "ส่ง"));
    await expect(args.onAsk).not.toHaveBeenCalled();
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
    await ask(canvas, chatFixtures.question);
    await waitFor(() =>
      expect(canvas.getByText("กำลังตอบ", { selector: ".ds-chat__progress" })).toBeVisible(),
    );
    await expect(action(canvas, "หยุด")).toBeVisible();
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
      await waitFor(() => expect(getComputedStyle(target).outlineStyle).toBe("solid"));
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
  const canvas = within(canvasElement);
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
  const field = box(canvasElement.querySelector(".ds-chat__composer textarea") as HTMLElement);
  const send = box(action(canvas, "ส่ง"));
  const close = box(canvas.getByRole("button", { name: "ปิดแชท" }));
  const header = box(canvasElement.querySelector(".ds-chat__header") as HTMLElement);
  for (const part of [field, send, close]) await expect(inside(part, chat)).toBe(true);
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

/** The smallest panel the shell gives it, 240 px: the composer's actions wrap under the counter. The fixture host answers by rules. */
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
    // Below 320 px the Send button drops under the counter, at the end edge.
    const send = box(action(canvas, "ส่ง"));
    const counter = box(canvasElement.querySelector(".ds-textarea__counter") as HTMLElement);
    await expect(send.top).toBeGreaterThanOrEqual(counter.bottom - 0.5);
  },
};

/** The widest panel, 480 px, with the counter and Send on one line. The fixture host answers by rules. */
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
    const send = box(action(canvas, "ส่ง"));
    const counter = box(canvasElement.querySelector(".ds-textarea__counter") as HTMLElement);
    await expect(
      Math.abs(send.top + send.height / 2 - (counter.top + counter.height / 2)),
    ).toBeLessThan(2);
  },
};

/** The same chat in English; every string comes from the English catalog. Replies are mock data. */
export const English: Story = {
  args: {
    basis: "mock",
    onAsk: fn(chatFixtures.host(chatFixtures.replyEn, "mock", { steps: 2, ms: 10 })),
  },
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Board chat" })).toBeVisible();
    await expect(canvas.getByText("No messages yet. Ask anything about the board")).toBeVisible();
    await expect(canvas.getByText("Replies are mock data. No AI yet")).toBeVisible();
    await expect(input(canvas, "Message to the engine")).toHaveAttribute(
      "placeholder",
      "Ask or give a task",
    );
    await userEvent.type(
      input(canvas, "Message to the engine"),
      `${chatFixtures.questionEn}{Enter}`,
    );
    await expect(canvas.getByText("You")).toBeVisible();
    await waitFor(() =>
      expect(canvas.getByText("Mock data", { selector: ".ds-chat__basis" })).toBeVisible(),
    );
    await expect(canvas.getByRole("button", { name: "Send" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Close chat" })).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Conversation" })).toBeVisible();
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
    }
  },
};

/** The board of the slice B stories: the host applies placeReply to the graph it owns. */
function BoardChat({
  selected,
  args,
  height = 560,
}: {
  /** The node selected alone at the start, if any. */
  selected?: string;
  args: Parameters<typeof CanvasChat>[0];
  height?: number;
}) {
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
      >
        <ChatSlot args={args} place={place} />
      </CanvasBoard>
    </div>
  );
}

/** The chat as a child of the board, so it reads the selection; unlinked replies land at the centre. */
function ChatSlot({
  args,
  place,
}: {
  args: Parameters<typeof CanvasChat>[0];
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
      className={`nodrag nopan nowheel absolute z-10 h-[calc(100%-24px)] ${WIDTH.panel} end-3 top-3 border border-border-card`}
    >
      <CanvasChat {...args} onReply={onReply} />
    </div>
  );
}

/** The ids and boxes the slice B plays read. */
const nodeEl = (root: HTMLElement, id: string) =>
  root.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`) as HTMLElement;
const boardEl = (root: HTMLElement) => root.querySelector<HTMLElement>(".ds-board") as HTMLElement;

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
    // One grid unit (24 flow px) right of the brief, level with its top.
    const scale = box(brief).width / brief.offsetWidth;
    await expect(box(reply).left - box(brief).right).toBeCloseTo(24 * scale, 0);
    await expect(box(reply).top).toBeCloseTo(box(brief).top, 0);
    await waitFor(() =>
      expect(statusOf(canvasElement)).toHaveTextContent(`วางคำตอบเป็นโหนด ${title} แล้ว`),
    );
    // The jump button sits in the chat beside the basis word and selects and focuses the node.
    const jump = canvas.getByRole("button", {
      name: `ไปที่โหนดคำตอบ เรื่อง ${chatFixtures.question}`,
    });
    await expect(jump).toHaveTextContent("ไปที่โหนดคำตอบ");
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
    // Its top-left corner is the board's centre, snapped to the grid: within half a grid unit.
    const board = box(boardEl(canvasElement));
    const half = 12 * (box(reply).width / reply.offsetWidth) + 0.5;
    await expect(Math.abs(box(reply).left - (board.left + board.width / 2))).toBeLessThanOrEqual(
      half,
    );
    await expect(Math.abs(box(reply).top - (board.top + board.height / 2))).toBeLessThanOrEqual(
      half,
    );
    // The node and the chat's controls are clear of each other and inside their parents.
    await expect(inside(box(reply), board)).toBe(true);
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
