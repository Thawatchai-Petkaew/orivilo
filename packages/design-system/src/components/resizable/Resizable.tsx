"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { fill } from "../../i18n/messages/index";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { cx } from "../cx";
import { PanelEndOpenIcon, PanelStartOpenIcon } from "../icons";

/** Arrow keys move the handle by this many pixels; Page keys by ten times as much. */
export const RESIZE_STEP = 16;

export interface ResizableProps {
  /** Which edge of the layout the panel sits on; the handle is on its inner edge. */
  side: "start" | "end";
  /** The panel's name, used in the handle's and the reopen control's accessible names. */
  label: string;
  /**
   * Saves width and collapsed state in this browser under the key (catalog rule: sizes persist
   * per user). Without a key the panel starts from its defaults each time.
   */
  storageKey?: string | undefined;
  /** Bounds and first width in pixels; the `resizable` component tokens by default. */
  defaultSize?: number | undefined;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  /** Enter on the handle, or dragging well past the minimum, hides the panel. */
  collapsible?: boolean | undefined;
  /** Start collapsed when nothing is saved. */
  defaultCollapsed?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}

interface Saved {
  size: number;
  collapsed: boolean;
}

function readSaved(key: string | undefined): Saved | undefined {
  if (!key) return undefined;
  try {
    const raw = window.localStorage.getItem(`ds-resizable:${key}`);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<Saved>;
    if (typeof value.size !== "number" || typeof value.collapsed !== "boolean") return undefined;
    return { size: value.size, collapsed: value.collapsed };
  } catch {
    return undefined;
  }
}

function writeSaved(key: string | undefined, value: Saved) {
  if (!key) return;
  try {
    window.localStorage.setItem(`ds-resizable:${key}`, JSON.stringify(value));
  } catch {
    // Storage blocked (private window): the panel still works, it just forgets.
  }
}

/** Reads a pixel token such as `--cmp-resizable-min` from the element's computed style. */
function tokenPx(el: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(el).getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

export function clampSize(size: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(size)));
}

/**
 * A side panel the user widens: block library or inspector (catalog `base/resizable`). The handle
 * is a WAI-ARIA window splitter: focusable, arrow keys resize, Page keys resize by ten steps, Home
 * and End jump to the bounds, Enter hides and restores. A hidden panel leaves its reopen control
 * visible on the same edge, so the panel is never lost.
 */
export function Resizable({
  side,
  label,
  storageKey,
  defaultSize,
  minSize,
  maxSize,
  collapsible = true,
  defaultCollapsed = false,
  className,
  children,
}: ResizableProps) {
  const m = useMessages();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ min: minSize ?? 240, max: maxSize ?? 480 });
  const [state, setState] = useState<Saved>({
    size: defaultSize ?? 320,
    collapsed: defaultCollapsed,
  });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; size: number } | null>(null);
  const loaded = useRef(false);

  // Tokens and the saved state are read after mount, so server and first client render agree.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const min = minSize ?? tokenPx(root, "--cmp-resizable-min", 240);
    const max = maxSize ?? tokenPx(root, "--cmp-resizable-max", 480);
    const first = defaultSize ?? tokenPx(root, "--cmp-resizable-default", 320);
    const saved = readSaved(storageKey);
    setBounds({ min, max });
    setState({
      size: clampSize(saved?.size ?? first, min, max),
      collapsed: collapsible && (saved?.collapsed ?? defaultCollapsed),
    });
    loaded.current = true;
  }, [storageKey, defaultSize, minSize, maxSize, collapsible, defaultCollapsed]);

  useEffect(() => {
    if (loaded.current) writeSaved(storageKey, state);
  }, [storageKey, state]);

  const resize = useCallback(
    (size: number) => setState((s) => ({ ...s, size: clampSize(size, bounds.min, bounds.max) })),
    [bounds],
  );

  const setCollapsed = (collapsed: boolean) => setState((s) => ({ ...s, collapsed }));

  // Moving the handle toward the board widens the panel; on the end side that is leftward.
  const towardBoard = side === "start" ? 1 : -1;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key.startsWith("Page") ? RESIZE_STEP * 10 : RESIZE_STEP;
    switch (event.key) {
      case "ArrowRight":
      case "PageDown":
        resize(state.size + step * towardBoard);
        break;
      case "ArrowLeft":
      case "PageUp":
        resize(state.size - step * towardBoard);
        break;
      case "Home":
        resize(bounds.min);
        break;
      case "End":
        resize(bounds.max);
        break;
      case "Enter":
        if (!collapsible) return;
        setCollapsed(true);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    drag.current = { x: event.clientX, size: state.size };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const wanted = drag.current.size + (event.clientX - drag.current.x) * towardBoard;
    // Dragging half the minimum past it reads as "put it away".
    if (collapsible && wanted < bounds.min / 2) {
      drag.current = null;
      setDragging(false);
      setCollapsed(true);
      return;
    }
    resize(wanted);
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const OpenIcon = side === "start" ? PanelStartOpenIcon : PanelEndOpenIcon;

  if (state.collapsed) {
    return (
      <div
        ref={rootRef}
        className={cx("ds-resizable", className)}
        data-side={side}
        data-collapsed=""
      >
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className="ds-resizable__reopen"
          aria-label={fill(m.resizable.reopen, { panel: label })}
          aria-expanded={false}
          aria-controls={panelId}
          onClick={() => {
            setCollapsed(false);
            // Focus moves to the handle so the keyboard can carry on resizing.
            requestAnimationFrame(() => handleRef.current?.focus());
          }}
        >
          <OpenIcon className="size-4" />
        </Button>
        <div id={panelId} hidden />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cx("ds-resizable", className)}
      data-side={side}
      data-dragging={dragging ? "" : undefined}
      style={{ inlineSize: state.size }}
    >
      <section id={panelId} className="ds-resizable__panel" aria-label={label}>
        {children}
      </section>
      <div
        ref={handleRef}
        role="separator"
        tabIndex={0}
        className="ds-resizable__handle"
        aria-orientation="vertical"
        aria-controls={panelId}
        aria-label={fill(m.resizable.handle, { panel: label })}
        aria-valuenow={state.size}
        aria-valuemin={bounds.min}
        aria-valuemax={bounds.max}
        aria-valuetext={fill(m.resizable.width, { px: String(state.size) })}
        aria-keyshortcuts={collapsible ? "Enter" : undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      />
    </div>
  );
}
