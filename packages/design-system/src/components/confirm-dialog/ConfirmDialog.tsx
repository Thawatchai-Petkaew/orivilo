"use client";

import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  type DialogVariant,
} from "../dialog/Dialog";

/** What `onConfirm` settles with. A rejection is treated as `failed` with the catalog's own text. */
export type ConfirmResult = { status: "done" } | { status: "failed"; message: ReactNode };
/** How the panel closed: the person left (`cancelled`) or pressed the confirm (`confirmed`). */
export type ConfirmCloseOutcome = "cancelled" | "confirmed";

export interface ConfirmDialogProps {
  /**
   * `destructive` for a step that is not easily reversed: first focus goes to the cancel and the
   * confirm is a destructive Button. `default` for a step that can be undone: first focus goes to
   * the confirm. There is no default, so every caller chooses.
   */
  variant: DialogVariant;
  /** Names the consequence ("Delete 3 projects?"); it is the accessible name. */
  title: ReactNode;
  /** One or two sentences of plain text: what will happen. No list, no link, no control. */
  impact: ReactNode;
  /** A short verb phrase that fits one line and names the outcome; a name goes in `title`. */
  confirmLabel: string;
  /** Names what stays ("Keep project"). */
  cancelLabel: string;
  /** What the status line announces while running; the catalog's `button.working` by default. */
  pendingLabel?: string | undefined;
  /** Runs on the press. The panel closes only on `done`; it must settle, or return `failed` on a timeout. */
  onConfirm: () => Promise<ConfirmResult>;
  /** The element that opens the panel, wrapped in `DialogTrigger`; omit it when `open` is controlled. */
  trigger?: ReactNode;
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Where focus goes after the panel closes, called once per close. Pass it whenever the action
   * removes the trigger or there is no trigger; otherwise focus goes to the trigger.
   */
  returnFocus?: ((outcome: ConfirmCloseOutcome) => HTMLElement | null | undefined) | undefined;
  /** `false` for previews and the recipe matrix only, as Dialog. */
  modal?: boolean | undefined;
  /** Where the portal mounts (a preview frame), as Dialog. */
  container?: HTMLElement | null | undefined;
}

/** Marks the two footer buttons so the pattern finds them: `ButtonProps` types no `ref`. */
const PART = "data-confirm-part";

/**
 * Confirms a step that deletes something or takes on proposed changes (DESIGN.md section 6), over
 * Dialog (ORV-226). It owns the whole flow: alertdialog role, first focus by `variant`, no close on
 * an outside press, pending while `onConfirm` runs, the failure above the actions with the same
 * button as the retry, and a close only on `done`. It never shows a success state.
 */
export function ConfirmDialog({
  variant,
  title,
  impact,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  onConfirm,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  returnFocus,
  modal,
  container,
}: ConfirmDialogProps) {
  const m = useMessages();
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const current = open ?? innerOpen;
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ message: ReactNode } | null>(null);
  const [wasOpen, setWasOpen] = useState(current);
  // Closing, by any route, removes the message so the panel opens clean next time.
  if (wasOpen !== current) {
    setWasOpen(current);
    if (!current) setFailure(null);
  }
  const running = useRef(false);
  const outcome = useRef<ConfirmCloseOutcome>("cancelled");
  const returnFocusRef = useRef(returnFocus);
  returnFocusRef.current = returnFocus;
  const panel = useRef<HTMLElement | null>(null);

  const setOpen = (next: boolean) => {
    if (!next && running.current) return;
    setInnerOpen(next);
    onOpenChange?.(next);
  };

  // When the panel overflows the message must not sit under the sticky actions: scroll to the end,
  // instantly, and leave focus where it is.
  useLayoutEffect(() => {
    if (failure && panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  }, [failure]);

  const press = async (event: MouseEvent<HTMLButtonElement>) => {
    if (running.current) return;
    running.current = true;
    outcome.current = "confirmed";
    const confirm = event.currentTarget;
    panel.current = confirm.closest<HTMLElement>(".ds-confirm");
    // A browser may not focus a clicked button; disabling the cancel would then drop focus.
    if (document.activeElement !== confirm) confirm.focus({ preventScroll: true });
    setFailure(null);
    setPending(true);
    let result: ConfirmResult;
    try {
      result = await onConfirm();
    } catch {
      result = { status: "failed", message: m.dialog.confirmFailed };
    }
    running.current = false;
    setPending(false);
    if (result.status === "done") {
      setOpen(false);
    } else {
      outcome.current = "cancelled";
      setFailure({ message: result.message });
    }
  };

  const missing = impact === undefined || impact === null || impact === "";

  return (
    <Dialog open={current} onOpenChange={setOpen} modal={modal}>
      {trigger ? <DialogTrigger>{trigger}</DialogTrigger> : null}
      <DialogContent
        className="ds-confirm"
        role="alertdialog"
        aria-modal={modal === false ? undefined : true}
        aria-busy={false}
        variant={variant}
        size="sm"
        title={title}
        description={missing ? m.dialog.impactMissing : impact}
        pending={pending}
        error={failure?.message}
        container={container}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          outcome.current = "cancelled";
          const part = variant === "destructive" ? "cancel" : "confirm";
          (event.currentTarget as HTMLElement | null)
            ?.querySelector<HTMLElement>(`[${PART}="${part}"]`)
            ?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current?.(outcome.current);
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        footer={
          <>
            <DialogClose>
              <Button variant="ghost" disabled={pending} {...{ [PART]: "cancel" }}>
                {cancelLabel}
              </Button>
            </DialogClose>
            <Button
              variant={variant === "destructive" ? "destructive" : "primary"}
              loading={pending}
              loadingLabel={pendingLabel}
              onClick={press}
              {...{ [PART]: "confirm" }}
            >
              {confirmLabel}
            </Button>
            <span role="status" className="sr-only">
              {pending ? (pendingLabel ?? m.button.working) : ""}
            </span>
          </>
        }
      />
    </Dialog>
  );
}
