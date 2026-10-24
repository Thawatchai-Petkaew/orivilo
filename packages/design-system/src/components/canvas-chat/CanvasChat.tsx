"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { LOCALE_TAGS } from "../../i18n/locale";
import { useLocale, useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { CloseIcon, RetryIcon, SpinnerIcon, WarningIcon } from "../icons";
import { ScrollArea } from "../scroll-area/ScrollArea";
import { Textarea } from "../textarea/Textarea";
import { countGraphemes } from "../textarea/graphemes";

/** Where a reply comes from today. A later story adds a real source with its adapter (ADR 0009). */
export type ChatBasis = "rules" | "mock";

export interface ChatRequest {
  /** What the person typed, trimmed. */
  text: string;
  /** Mentioned node ids still on the board, in the order picked. Always empty until slice C. */
  mentions: readonly string[];
}

/** One snapshot of the reply: the whole text so far. The last snapshot is the reply. */
export interface ChatReply {
  text: string;
  basis: ChatBasis;
}

export interface CanvasChatProps {
  /** The sidebar chat; the at-cursor form joins in slice D. */
  variant: "sidebar";
  /** What answers today; shown as a notice before the first message. */
  basis: ChatBasis;
  /**
   * The host's answer. Yields snapshots while it streams; ends to finish; throws to fail.
   * The signal aborts when the person presses Stop, closes the chat, or the chat unmounts.
   */
  onAsk: (request: ChatRequest, signal: AbortSignal) => AsyncIterable<ChatReply>;
  /** A finished reply: only one whose iterable ended, never a stopped or failed one. */
  onReply?: ((reply: ChatReply, request: ChatRequest) => void) | undefined;
  /** Shows the close button; a streaming reply is aborted before this runs. */
  onClose?: (() => void) | undefined;
  className?: string | undefined;
}

type ExchangeStatus = "streaming" | "done" | "stopped" | "failed";

interface Exchange {
  id: number;
  request: ChatRequest;
  status: ExchangeStatus;
  /** The latest snapshot; dropped on failure. */
  reply: ChatReply | undefined;
}

/** The soft limit of the message box, in graphemes (spec: Textarea's counter). */
const MAX_LENGTH = 2000;
/** Within this many pixels of the end, the transcript keeps following the newest reply. */
const FOLLOW_SLACK = 32;

/**
 * The board chat, sidebar variant (catalog `application/canvas-chat`, ORV-105 slice A). It asks the
 * host through `onAsk`, shows the reply as it streams, and says on every reply where it came from
 * (rules or mock data). It never makes text up and never calls a network or a model; nothing here
 * claims AI. One request at a time. Question and reply render as plain text. The transcript lives
 * in component state and is gone on unmount.
 */
export function CanvasChat({
  variant,
  basis,
  onAsk,
  onReply,
  onClose,
  className,
}: CanvasChatProps) {
  const m = useMessages();
  const locale = useLocale();
  const titleId = useId();
  const [draft, setDraft] = useState("");
  const [exchanges, setExchanges] = useState<readonly Exchange[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const nextId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const composerRef = useRef<HTMLFormElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const follow = useRef(true);
  const composing = useRef(false);

  const latest = exchanges[exchanges.length - 1];
  const streaming = latest?.status === "streaming";
  const trimmed = draft.trim();
  const blocked = trimmed === "" || countGraphemes(draft, LOCALE_TAGS[locale]) > MAX_LENGTH;

  // The chat unmounting aborts the request in flight; nothing is announced or stored after it.
  useEffect(() => () => abortRef.current?.abort(), []);

  const viewport = () =>
    rootRef.current?.querySelector<HTMLElement>(".ds-scroll__viewport") ?? null;
  const textarea = () => composerRef.current?.querySelector("textarea") ?? null;

  // The transcript follows the newest reply while it is at or near the end, and instantly.
  useEffect(() => {
    const el = viewport();
    if (!el) return;
    const onScroll = () => {
      follow.current = el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_SLACK;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useLayoutEffect(() => {
    const el = viewport();
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [exchanges]);

  const patch = (id: number, change: Partial<Exchange>) =>
    setExchanges((list) => list.map((e) => (e.id === id ? { ...e, ...change } : e)));

  /** The button that had focus is about to unmount: move focus to the textarea instead (D2). */
  const keepFocus = () => {
    const active = document.activeElement;
    if (active && composerRef.current?.contains(active) && active !== textarea()) {
      textarea()?.focus();
    }
  };

  const run = async (id: number, request: ChatRequest) => {
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    setAnnouncement(m.chat.streaming);
    let last: ChatReply | undefined;
    try {
      for await (const snapshot of onAsk(request, signal)) {
        if (signal.aborted) return;
        last = snapshot;
        patch(id, { reply: snapshot });
      }
    } catch {
      // The thrown message is never shown: it may be developer text (spec AC 9).
      if (signal.aborted) return;
      keepFocus();
      patch(id, { status: "failed", reply: undefined });
      setAnnouncement(m.chat.failed);
      return;
    }
    if (signal.aborted) return;
    keepFocus();
    // An iterable that ended with no snapshot has no reply and no basis: a failure (D3).
    if (!last) {
      patch(id, { status: "failed", reply: undefined });
      setAnnouncement(m.chat.failed);
      return;
    }
    patch(id, { status: "done", reply: last });
    onReply?.(last, request);
  };

  const start = (request: ChatRequest, retryId?: number) => {
    const id = retryId ?? nextId.current++;
    const fresh: Exchange = { id, request, status: "streaming", reply: undefined };
    follow.current = true;
    setExchanges((list) =>
      retryId === undefined ? [...list, fresh] : list.map((e) => (e.id === id ? fresh : e)),
    );
    void run(id, request);
  };

  const submit = () => {
    if (blocked || streaming) return;
    start({ text: trimmed, mentions: [] });
    setDraft("");
    textarea()?.focus();
  };

  const stop = () => {
    if (!latest || !streaming) return;
    abortRef.current?.abort();
    patch(latest.id, { status: "stopped" });
    setAnnouncement(m.chat.stopped);
    textarea()?.focus();
  };

  const retry = (exchange: Exchange) => {
    start(exchange.request, exchange.id);
    textarea()?.focus();
  };

  const close = () => {
    abortRef.current?.abort();
    onClose?.();
  };

  const onFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  // Enter sends, Shift+Enter adds a line. Enter that commits a Thai IME composition never sends:
  // `isComposing` and keyCode 229 cover most engines, the flag covers Safari, whose compositionend
  // fires before the Enter keydown.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing || event.keyCode === 229 || composing.current) return;
    event.preventDefault();
    submit();
  };

  const basisWord = (b: ChatBasis) => (b === "rules" ? m.taskBar.basisRules : m.taskBar.basisMock);

  return (
    <section
      ref={rootRef}
      className={cx("ds-chat", className)}
      data-variant={variant}
      data-state={latest?.status ?? "idle"}
      aria-labelledby={titleId}
    >
      <header className="ds-chat__header">
        <span className="ds-chat__title" id={titleId}>
          {m.chat.label}
        </span>
      </header>
      <p className="ds-chat__notice">
        {basis === "rules" ? m.chat.noticeRules : m.chat.noticeMock}
      </p>
      <ScrollArea label={m.chat.transcript} className="ds-chat__scroll">
        {exchanges.length === 0 ? (
          <p className="ds-chat__empty">{m.chat.empty}</p>
        ) : (
          <ol className="ds-chat__log">
            {exchanges.map((exchange) => {
              const isLatest = exchange === latest;
              const { status, reply } = exchange;
              return (
                <li key={exchange.id} className="ds-chat__exchange" data-state={status}>
                  <div className="ds-chat__question">
                    <span className="ds-chat__speaker">{m.chat.you}</span>
                    <p className="ds-chat__text">{exchange.request.text}</p>
                  </div>
                  <div className="ds-chat__reply">
                    {status === "failed" ? (
                      <div className="ds-chat__failure">
                        <span className="ds-chat__mark" aria-hidden="true">
                          <WarningIcon />
                        </span>
                        <p>{m.chat.failed}</p>
                        {isLatest ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            iconLeading={<RetryIcon />}
                            onClick={() => retry(exchange)}
                          >
                            {m.chat.retry}
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <p
                          className="ds-chat__text"
                          aria-live={isLatest ? "polite" : undefined}
                          aria-busy={isLatest ? status === "streaming" : undefined}
                        >
                          {reply?.text}
                        </p>
                        <div className="ds-chat__meta">
                          {status === "streaming" ? (
                            <span className="ds-chat__progress">
                              <span className="ds-chat__mark" aria-hidden="true">
                                <SpinnerIcon className="ds-spin" />
                              </span>
                              {m.chat.streaming}
                            </span>
                          ) : null}
                          {reply && status !== "streaming" ? (
                            <span className="ds-chat__basis">{basisWord(reply.basis)}</span>
                          ) : null}
                          {status === "stopped" ? (
                            <span className="ds-chat__stopped">{m.chat.stopped}</span>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </ScrollArea>
      <form className="ds-chat__composer" ref={composerRef} onSubmit={onFormSubmit}>
        <Textarea
          aria-label={m.chat.input}
          placeholder={m.chat.placeholder}
          maxLength={MAX_LENGTH}
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            setTimeout(() => {
              composing.current = false;
            }, 0);
          }}
        />
        <div className="ds-chat__actions">
          {streaming ? (
            <Button variant="secondary" onClick={stop}>
              {m.chat.stop}
            </Button>
          ) : (
            <Button type="submit" variant="intent" aria-disabled={blocked}>
              {m.chat.send}
            </Button>
          )}
        </div>
      </form>
      {onClose ? (
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={m.chat.close}
          className="ds-chat__close"
          onClick={close}
        >
          <CloseIcon />
        </Button>
      ) : null}
      <span className="sr-only" role="status">
        {announcement}
      </span>
    </section>
  );
}
