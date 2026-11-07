"use client";

import { Portal, Toast as ToastPrimitive } from "radix-ui";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { PortalScope } from "../../boundary/DesignProfileBoundary";
import { useMessages } from "../../i18n/LocaleProvider";
import { CheckIcon, CloseIcon, WarningIcon } from "../icons";

export type ToastVariant = "neutral" | "success" | "danger";

export interface ToastAction {
  label: string;
  onClick: () => void;
  /** What a screen reader hears for the action when the toast is gone from view; the label by default. */
  altText?: string | undefined;
}

export interface ToastOptions {
  /** What happened. On failure also say how to fix it, in the title or the description. */
  title: string;
  description?: string | undefined;
  action?: ToastAction | undefined;
  /** `success` only with backing data (AGENTS.md rule 4). */
  variant?: ToastVariant | undefined;
  /** Milliseconds before it leaves (5000 by default). Ignored for `danger`, which stays until dismissed. */
  duration?: number | undefined;
}

/** Newest first would hide the older notice; at most this many stay open, the oldest leave first. */
export const TOAST_LIMIT = 3;
export const TOAST_DURATION = 5000;

export interface ToastEntry extends ToastOptions {
  id: string;
  open: boolean;
}

let entries: readonly ToastEntry[] = [];
let counter = 0;
const listeners = new Set<() => void>();

function commit(next: readonly ToastEntry[]) {
  entries = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Shows a notice in the `Toaster` region (catalog `base/toast`). It is a plain function so a server
 * action's result handler or an event handler can call it without a hook. Returns the id for
 * `toast.dismiss`.
 */
export function toast(options: ToastOptions): string {
  counter += 1;
  const id = `toast-${counter}`;
  const next = [...entries, { ...options, id, open: true }];
  let open = next.filter((entry) => entry.open).length;
  commit(
    next.map((entry) => {
      if (entry.open && open > TOAST_LIMIT) {
        open -= 1;
        return { ...entry, open: false };
      }
      return entry;
    }),
  );
  return id;
}

/** Closes one toast by id, or every toast without an id. */
toast.dismiss = (id?: string): void => {
  commit(
    entries.map((entry) =>
      id === undefined || entry.id === id ? { ...entry, open: false } : entry,
    ),
  );
};

function remove(id: string) {
  commit(entries.filter((entry) => entry.id !== id));
}

function ToastItem({ entry }: { entry: ToastEntry }) {
  const m = useMessages();
  const ref = useRef<HTMLLIElement>(null);
  const { id, open, title, description, action, variant = "neutral" } = entry;

  // Keep the closed toast mounted until its leaving animation ends, then drop it from the store.
  useEffect(() => {
    if (open) return;
    let live = true;
    const animations = ref.current?.getAnimations() ?? [];
    void Promise.allSettled(animations.map((a) => a.finished)).then(() => {
      if (live) remove(id);
    });
    return () => {
      live = false;
    };
  }, [open, id]);

  const danger = variant === "danger";
  return (
    <ToastPrimitive.Root
      ref={ref}
      className="ds-toast"
      data-variant={variant}
      open={open}
      // A failure is announced assertively and stays; everything else is polite and times out.
      type={danger ? "foreground" : "background"}
      duration={danger ? Infinity : (entry.duration ?? TOAST_DURATION)}
      onOpenChange={(next) => {
        if (!next) toast.dismiss(id);
      }}
    >
      {variant === "success" ? (
        <CheckIcon className="ds-toast__icon" />
      ) : danger ? (
        <WarningIcon className="ds-toast__icon" />
      ) : null}
      <div className="ds-toast__content">
        <ToastPrimitive.Title className="ds-toast__title">{title}</ToastPrimitive.Title>
        {description ? (
          <ToastPrimitive.Description className="ds-toast__description">
            {description}
          </ToastPrimitive.Description>
        ) : null}
        {action ? (
          <ToastPrimitive.Action
            className="ds-toast__action"
            altText={action.altText ?? action.label}
            onClick={action.onClick}
          >
            {action.label}
          </ToastPrimitive.Action>
        ) : null}
      </div>
      <ToastPrimitive.Close className="ds-toast__close" aria-label={m.toast.dismiss}>
        <CloseIcon className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

/**
 * The region for a list of entries: the Radix provider, the items, and the viewport in a portal
 * that re-opens the nearest profile boundary. `Toaster` feeds it the store; a story feeds it a
 * fixed list to show every variant under one boundary.
 */
export function ToastRegion({
  entries: shown,
  container,
  label,
}: {
  entries: readonly ToastEntry[];
  container?: HTMLElement | null | undefined;
  /** The region's accessible name; the catalog's by default. A story with many regions tells them apart. */
  label?: string | undefined;
}) {
  const m = useMessages();
  return (
    <ToastPrimitive.Provider label={m.toast.region} swipeDirection="right">
      {shown.map((entry) => (
        <ToastItem key={entry.id} entry={entry} />
      ))}
      <Portal.Root container={container}>
        <PortalScope>
          <ToastPrimitive.Viewport className="ds-toast-viewport" label={label ?? m.toast.region} />
        </PortalScope>
      </Portal.Root>
    </ToastPrimitive.Provider>
  );
}

/**
 * The region that shows what `toast()` was called with. Mount it once, inside the profile boundary
 * of the shell. It renders at the bottom end corner through a portal that re-opens the nearest
 * boundary (into `container` when a preview frame is given), and clears the safe-area insets.
 * Focus never moves to a toast when it appears; F8 moves focus into the region.
 */
export function Toaster({ container }: { container?: HTMLElement | null | undefined }) {
  const shown = useSyncExternalStore(
    subscribe,
    () => entries,
    () => entries,
  );
  return <ToastRegion entries={shown} container={container} />;
}
