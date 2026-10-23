"use client";

import { useRef, useState } from "react";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button, type ControlSize } from "../button/Button";
import { useFieldControl } from "../field/Field";
import { EyeIcon, EyeOffIcon } from "../icons";
import { InputGroup, type InputGroupProps } from "../input-group/InputGroup";

export type PasswordInputProps = Omit<InputGroupProps, "type" | "end" | "shortcut">;

/** The reveal button is one step smaller than the group so it sits inside the outline. */
const BUTTON_SIZE: Record<ControlSize, ControlSize> = { sm: "sm", md: "sm", lg: "md" };

/**
 * A password field with a reveal toggle (catalog `base/password-input`), built on InputGroup. The
 * toggle is a real button with `aria-pressed`, named for what pressing it does. A pointer press
 * never takes focus from the field and returns it there; a keyboard press keeps focus on the
 * button the user tabbed to.
 */
export function PasswordInput({ size = "md", ref, ...rest }: PasswordInputProps) {
  const m = useMessages().passwordInput;
  const [shown, setShown] = useState(false);
  const own = useRef<HTMLInputElement | null>(null);
  const { disabled } = useFieldControl(rest, undefined);
  return (
    <InputGroup
      {...rest}
      size={size}
      type={shown ? "text" : "password"}
      ref={(node) => {
        own.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      end={
        <Button
          iconOnly
          variant="ghost"
          size={BUTTON_SIZE[size]}
          aria-label={shown ? m.hide : m.show}
          aria-pressed={shown}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            setShown((value) => !value);
            if (event.detail > 0) own.current?.focus();
          }}
        >
          {shown ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </Button>
      }
    />
  );
}
