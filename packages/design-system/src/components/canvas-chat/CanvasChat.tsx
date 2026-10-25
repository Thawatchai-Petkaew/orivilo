"use client";

import { flushSync } from "react-dom";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { surfaceCommands } from "../../commands/index";
import { LOCALE_TAGS } from "../../i18n/locale";
import { useLocale, useMessages, useWord } from "../../i18n/LocaleProvider";
import { fill } from "../../i18n/messages/index";
import { CANVAS_WORDS } from "../../tokens/canvas";
import { Button } from "../button/Button";
import type { ChatBasis } from "../canvas-board/graph";
import { useBoard } from "../canvas-board/context";
import { matches } from "../command-menu/CommandMenu";
import { cx } from "../cx";
import {
  CloseIcon,
  FillUnlinkedIcon,
  JumpIcon,
  MentionIcon,
  RetryIcon,
  SpinnerIcon,
  WarningIcon,
} from "../icons";
import { ScrollArea } from "../scroll-area/ScrollArea";
import { Tag } from "../tag/Tag";
import { Textarea } from "../textarea/Textarea";
import { countGraphemes } from "../textarea/graphemes";
import { replyTopic } from "./place-reply";

export type { ChatBasis };

export interface ChatRequest {
  /** What the person typed, trimmed. */
  text: string;
  /** Mentioned node ids still on the board, in the order picked (ORV-107). */
  mentions: readonly string[];
  /** The node selected alone on the board when the message was sent, if any (ORV-106). */
  contextNodeId?: string | undefined;
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
  /**
   * A finished reply: only one whose iterable ended, never a stopped or failed one. Returns the id
   * of the node the host placed it as, or nothing when it declines; with an id the chat offers a
   * jump to the node and announces it.
   */
  onReply?: ((reply: ChatReply, request: ChatRequest) => string | undefined) | undefined;
  /** Shows the close button; a streaming reply is aborted before this runs. */
  onClose?: (() => void) | undefined;
  /** Controlled: the node ids mentioned. The shell adds one on `node.mention` from the context menu. */
  mentions?: readonly string[] | undefined;
  /** Uncontrolled start value of the mentions. */
  defaultMentions?: readonly string[] | undefined;
  /** Fires with the whole list after a pick or a remove by the person, never on a gone node. */
  onMentionsChange?: ((ids: readonly string[]) => void) | undefined;
  className?: string | undefined;
}

type ExchangeStatus = "streaming" | "done" | "stopped" | "failed";

interface Exchange {
  id: number;
  request: ChatRequest;
  /** The titles of `request.mentions` when it was sent. */
  mentionTitles: readonly string[];
  status: ExchangeStatus;
  /** The latest snapshot; dropped on failure. */
  reply: ChatReply | undefined;
  /** The board node the host placed the reply as. */
  placedId?: string | undefined;
  /** The placement was announced. */
  announced?: boolean | undefined;
}

/** The soft limit of the message box, in graphemes (spec: Textarea's counter). */
const MAX_LENGTH = 2000;
/** Within this many pixels of the end, the transcript keeps following the newest reply. */
const FOLLOW_SLACK = 32;

/** The "@query" that ends at the caret: at the start or after a space, no space inside. */
function mentionToken(text: string, caret: number): { start: number; query: string } | null {
  const found = /(^|\s)@(\S*)$/.exec(text.slice(0, caret));
  if (!found) return null;
  const query = found[2] ?? "";
  return { start: caret - query.length - 1, query };
}

/**
 * The board chat, sidebar variant (catalog `application/canvas-chat`, ORV-105 slice A). It asks the
 * host through `onAsk`, shows the reply as it streams, and says on every reply where it came from
 * (rules or mock data). It never makes text up and never calls a network or a model; nothing here
 * claims AI. One request at a time. Question and reply render as plain text. The transcript lives
 * in component state and is gone on unmount. Inside a `CanvasBoard` it sends the node selected
 * alone as `contextNodeId`, and a reply the host placed as a node gets a jump to it (slice B).
 * Typing "@" or the Mention button opens a picker of the board's nodes; picked nodes are chips
 * above the box and travel as ids in `request.mentions` (slice C). Nothing reads their content.
 */
export function CanvasChat({
  variant,
  basis,
  onAsk,
  onReply,
  onClose,
  mentions,
  defaultMentions,
  onMentionsChange,
  className,
}: CanvasChatProps) {
  const m = useMessages();
  const locale = useLocale();
  const word = useWord();
  const board = useBoard();
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
  const listId = useId();
  const [ownMentions, setOwnMentions] = useState<readonly string[]>(defaultMentions ?? []);
  const ids = mentions ?? ownMentions;
  // The title a mentioned node last had, so its chip can still name it after it is deleted.
  const titles = useRef(new Map<string, string>());
  const [caret, setCaret] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [active, setActive] = useState(0);
  const nextCaret = useRef<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const latest = exchanges[exchanges.length - 1];
  const streaming = latest?.status === "streaming";
  const trimmed = draft.trim();
  const blocked = trimmed === "" || countGraphemes(draft, LOCALE_TAGS[locale]) > MAX_LENGTH;

  const token = pickerOpen ? mentionToken(draft, caret) : null;
  const canMention =
    board.graph.nodes.length > 0 && surfaceCommands("chat").some((c) => c.id === "node.mention");
  const options = token
    ? board.graph.nodes
        .filter((n) => !n.hidden)
        .map((n) => ({
          id: n.id,
          title: n.data.title,
          word: word(CANVAS_WORDS.node[n.data.kind]),
          text: `${n.data.title} ${CANVAS_WORDS.node[n.data.kind].th} ${CANVAS_WORDS.node[n.data.kind].en}`,
        }))
        .filter((o) => matches(o.text, token.query))
    : [];
  const current = Math.min(active, Math.max(0, options.length - 1));
  const activeId = token && options.length > 0 ? `${listId}-${current}` : undefined;

  useLayoutEffect(() => {
    for (const id of ids) {
      const found = board.graph.nodes.find((n) => n.id === id);
      if (found) titles.current.set(id, found.data.title);
    }
  });
  // The picker never grows past the chat's top: its room is what lies above the composer.
  useLayoutEffect(() => {
    const picker = pickerRef.current;
    const root = rootRef.current;
    const composer = composerRef.current;
    if (!picker || !root || !composer) return;
    const room = composer.getBoundingClientRect().top - root.getBoundingClientRect().top;
    picker.style.maxBlockSize = `min(var(--cmp-chat-picker-max-block-size), ${Math.max(0, room)}px)`;
  });
  useLayoutEffect(() => {
    if (nextCaret.current === null) return;
    textarea()?.setSelectionRange(nextCaret.current, nextCaret.current);
    nextCaret.current = null;
  });

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

  // A placed reply is announced once its node shows up in the board's graph, by the title it has there.
  useEffect(() => {
    const pending = exchanges.find(
      (e) => e.placedId && !e.announced && board.graph.nodes.some((n) => n.id === e.placedId),
    );
    const node = pending && board.graph.nodes.find((n) => n.id === pending.placedId);
    if (!pending || !node) return;
    setAnnouncement(fill(m.chat.placed, { title: node.data.title }));
    setExchanges((list) => list.map((e) => (e.id === pending.id ? { ...e, announced: true } : e)));
  }, [exchanges, board.graph, m]);

  const onBoard = (id: string) => board.graph.nodes.some((n) => n.id === id);
  const titleOf = (id: string) =>
    board.graph.nodes.find((n) => n.id === id)?.data.title ?? titles.current.get(id) ?? id;

  const changeMentions = (next: readonly string[]) => {
    if (mentions === undefined) setOwnMentions(next);
    onMentionsChange?.(next);
  };

  /** Picks a node: its "@query" leaves the text and it joins the chips once. */
  const pick = (id: string) => {
    if (!token) return;
    const text = `${draft.slice(0, token.start)}${draft.slice(caret)}`;
    setDraft(text);
    setCaret(token.start);
    nextCaret.current = token.start;
    setPickerOpen(false);
    if (!ids.includes(id)) changeMentions([...ids, id]);
    textarea()?.focus();
  };

  /** The Mention button: an "@" at the caret (after a space) opens the same picker. */
  const openPicker = () => {
    const el = textarea();
    const at = el?.selectionStart ?? draft.length;
    const lead = at > 0 && !/\s/.test(draft[at - 1] ?? "") ? " " : "";
    const text = `${draft.slice(0, at)}${lead}@${draft.slice(at)}`;
    const next = at + lead.length + 1;
    setDraft(text);
    setCaret(next);
    nextCaret.current = next;
    setActive(0);
    setPickerOpen(true);
    el?.focus();
  };

  const onDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.currentTarget.value;
    const at = event.currentTarget.selectionStart;
    const typed = (event.nativeEvent as InputEvent).data;
    setDraft(text);
    setCaret(at);
    setActive(0);
    // "@" opens the picker when it is the typed character; later keys only narrow or end it.
    const found = canMention ? mentionToken(text, at) : null;
    setPickerOpen(found !== null && (pickerOpen || typed === "@"));
  };

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
    const placedId = onReply?.(last, request);
    patch(id, { status: "done", reply: last, placedId });
  };

  const start = (request: ChatRequest, titlesOf: readonly string[], retryId?: number) => {
    const id = retryId ?? nextId.current++;
    const fresh: Exchange = {
      id,
      request,
      mentionTitles: titlesOf,
      status: "streaming",
      reply: undefined,
    };
    follow.current = true;
    setExchanges((list) =>
      retryId === undefined ? [...list, fresh] : list.map((e) => (e.id === id ? fresh : e)),
    );
    void run(id, request);
  };

  const submit = () => {
    if (blocked || streaming) return;
    const [only, ...more] = board.selectedNodeIds;
    // A node deleted since it was picked keeps its chip but is left out of the request.
    const live = ids.filter(onBoard);
    start(
      {
        text: trimmed,
        mentions: live,
        ...(only !== undefined && more.length === 0 ? { contextNodeId: only } : {}),
      },
      live.map(titleOf),
    );
    setDraft("");
    setPickerOpen(false);
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
    start(exchange.request, exchange.mentionTitles, exchange.id);
    textarea()?.focus();
  };

  const close = () => {
    abortRef.current?.abort();
    // A host that keeps the chat mounted must not see a reply stuck in "streaming": mark it and
    // say so before the host closes the chat.
    if (latest && streaming) {
      flushSync(() => {
        patch(latest.id, { status: "stopped" });
        setAnnouncement(m.chat.stopped);
      });
    }
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
    const isComposing = event.nativeEvent.isComposing || event.keyCode === 229 || composing.current;
    if (token && !isComposing) {
      // The open picker owns the arrows, Enter and Escape; Escape closes the list only.
      const last = Math.max(0, options.length - 1);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        setActive(
          event.key === "ArrowDown"
            ? (current + 1) % (last + 1)
            : (current - 1 + last + 1) % (last + 1),
        );
        event.preventDefault();
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        const chosen = options[current];
        if (chosen) pick(chosen.id);
        event.preventDefault();
        return;
      }
      if (event.key === "Escape") {
        setPickerOpen(false);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    if (isComposing) return;
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
              // The placed node, while it is still on the board; linked when an edge touches it.
              const placed = exchange.placedId
                ? board.graph.nodes.find((n) => n.id === exchange.placedId)
                : undefined;
              const linked = placed
                ? board.graph.edges.some((e) => e.source === placed.id || e.target === placed.id)
                : false;
              return (
                <li key={exchange.id} className="ds-chat__exchange" data-state={status}>
                  <div className="ds-chat__question">
                    <span className="ds-chat__speaker">{m.chat.you}</span>
                    <p className="ds-chat__text">{exchange.request.text}</p>
                    {exchange.mentionTitles.length > 0 ? (
                      <p className="ds-chat__refs">
                        {m.chat.mentioned}: {exchange.mentionTitles.join(", ")}
                      </p>
                    ) : null}
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
                          {placed ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              iconLeading={<JumpIcon />}
                              aria-label={fill(m.chat.jumpLabel, {
                                topic: replyTopic(exchange.request.text, locale),
                              })}
                              onClick={() => board.jumpToNode(placed.id, { select: true })}
                            >
                              {m.chat.jump}
                            </Button>
                          ) : null}
                          {placed && !linked ? (
                            <span className="ds-chat__unlinked">
                              <span className="ds-chat__mark" aria-hidden="true">
                                <FillUnlinkedIcon />
                              </span>
                              {m.chat.unlinked}
                            </span>
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
        {token ? (
          <div className="ds-chat__picker" ref={pickerRef}>
            {options.length === 0 ? (
              <p className="ds-chat__picker-empty" role="status">
                {fill(m.chat.mentionNone, { query: token.query })}
              </p>
            ) : (
              <div
                id={listId}
                role="listbox"
                aria-label={m.chat.mentionList}
                className="ds-chat__options"
              >
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === current}
                    className="ds-chat__option"
                    data-active={index === current ? "" : undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => pick(option.id)}
                  >
                    <span>
                      {option.title}
                      <span className="ds-chat__option-meta">{option.word}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {ids.length > 0 ? (
          <ul className="ds-chat__chips" aria-label={m.chat.mentioned}>
            {ids.map((id) => (
              <li key={id} className="ds-chat__chip" data-gone={onBoard(id) ? undefined : ""}>
                {onBoard(id) ? null : (
                  <span className="ds-chat__mark ds-chat__gone-mark" aria-hidden="true">
                    <WarningIcon />
                  </span>
                )}
                <Tag
                  size="sm"
                  label={
                    onBoard(id) ? titleOf(id) : fill(m.chat.mentionGone, { title: titleOf(id) })
                  }
                  onRemove={() => changeMentions(ids.filter((other) => other !== id))}
                />
              </li>
            ))}
          </ul>
        ) : null}
        <Textarea
          aria-label={m.chat.input}
          placeholder={m.chat.placeholder}
          maxLength={MAX_LENGTH}
          rows={3}
          value={draft}
          onChange={onDraftChange}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          aria-controls={activeId ? listId : undefined}
          aria-activedescendant={activeId}
          aria-autocomplete={token ? "list" : undefined}
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
          {canMention ? (
            <Button
              variant="ghost"
              size="sm"
              iconLeading={<MentionIcon />}
              aria-haspopup="listbox"
              aria-expanded={token !== null}
              onClick={openPicker}
            >
              {m.chat.mention}
            </Button>
          ) : null}
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
