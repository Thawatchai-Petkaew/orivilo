"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useId, useRef, useState } from "react";
import type { SelectOption } from "../select/Select";
import { nextActive } from "./options";

export interface UseComboboxListArgs {
  /** The options on screen, flat and in order, groups already unrolled. */
  options: readonly SelectOption[];
  /** An enabled option was chosen, by Enter or by a press. The popup is already closed. */
  onChoose: (option: SelectOption) => void;
}

/**
 * The open state, the active option and the keys of the editable combobox pattern, with DOM focus
 * staying in the input (`cbx-keys-1`, `cbx-pointer-1`, `cbx-ime-1`). Internal: Combobox and, later,
 * MultiSelect share it. Radix has no combobox, so the keys and ids are ours.
 */
export function useComboboxList({ options, onChoose }: UseComboboxListArgs) {
  const listId = useId();
  const [open, setOpenState] = useState(false);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const composing = useRef(false);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const disabled = options.map((option) => option.disabled === true);
  const index = activeValue === null ? -1 : options.findIndex((o) => o.value === activeValue);
  const optionId = (at: number) => `${listId}-o${at}`;

  const activate = (at: number) => setActiveValue(options[at]?.value ?? null);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next) {
      setActiveValue(null);
      pointer.current = null;
    }
  };

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    setOpen(false);
    onChoose(option);
  };

  useEffect(() => {
    if (!open || index < 0) return;
    document.getElementById(`${listId}-o${index}`)?.scrollIntoView({ block: "nearest" });
  }, [open, index, listId]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // Three tests, as CanvasChat has them: `isComposing`, keyCode 229, and a flag for Safari,
    // whose compositionend fires before the Enter keydown.
    if (event.nativeEvent.isComposing || event.keyCode === 229 || composing.current) return;
    switch (event.key) {
      case "ArrowDown":
        if (event.altKey) {
          if (!open) {
            setOpenState(true);
            event.preventDefault();
          }
          return;
        }
        event.preventDefault();
        if (!open) setOpenState(true);
        activate(nextActive(open ? index : -1, 1, disabled));
        return;
      case "ArrowUp":
        if (event.altKey) {
          if (open) {
            setOpen(false);
            event.preventDefault();
          }
          return;
        }
        event.preventDefault();
        if (!open) setOpenState(true);
        activate(nextActive(open ? index : -1, -1, disabled));
        return;
      case "Enter": {
        const active = open ? options[index] : undefined;
        if (!active) return;
        event.preventDefault();
        choose(active);
        return;
      }
      case "Home":
      case "End":
        if (open && index >= 0) {
          event.preventDefault();
          activate(nextActive(-1, event.key === "Home" ? 1 : -1, disabled));
        }
        return;
      case "ArrowLeft":
      case "ArrowRight":
        setActiveValue(null);
        return;
      default:
    }
  };

  return {
    listId,
    open,
    setOpen,
    /** Opens without making any option active. */
    openList: () => setOpenState(true),
    /** No option is active; a text edit calls this. */
    clearActive: () => setActiveValue(null),
    index,
    optionId,
    /** The id for `aria-activedescendant`, absent with no active option. */
    activeId: index >= 0 ? optionId(index) : undefined,
    choose,
    onKeyDown,
    compositionProps: {
      onCompositionStart: () => {
        composing.current = true;
      },
      onCompositionEnd: () => {
        setTimeout(() => {
          composing.current = false;
        }, 0);
      },
    },
    /**
     * Moving the pointer makes an enabled option active. A move that leaves the pointer where it
     * was (the browser repeats one after a scroll) is ignored, so the keys keep the option.
     */
    onOptionPointerMove: (option: SelectOption, event: PointerEvent) => {
      const last = pointer.current;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (last && last.x === event.clientX && last.y === event.clientY) return;
      if (!option.disabled) setActiveValue(option.value);
    },
  };
}
