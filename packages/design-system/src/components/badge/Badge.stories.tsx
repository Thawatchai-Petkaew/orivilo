import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, within } from "storybook/test";
import { fixtures } from "../fixtures";
import { CheckIcon, LockIcon, StaleIcon, WarningIcon } from "../icons";
import { Matrix, Narrow } from "../matrix";
import { expectSameHeight } from "../../testing/visual-asserts";
import { Badge, type BadgeVariant } from "./Badge";

/** The word carries the status; each is a state a real record can be in. */
const STATUS: readonly { variant: BadgeVariant; word: string }[] = [
  { variant: "neutral", word: "ฉบับร่าง" },
  { variant: "success", word: "อนุมัติแล้ว" },
  { variant: "warning", word: "ล้าสมัย" },
  { variant: "danger", word: "ล้มเหลว" },
  { variant: "info", word: "กำลังทำงาน" },
  { variant: "brand", word: "ORIVILO" },
];

const meta = {
  title: "Base/Badge",
  component: Badge,
  args: { children: "ฉบับร่าง" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS.map(({ variant, word }) => (
        <Badge key={variant} variant={variant}>
          {word}
        </Badge>
      ))}
    </div>
  ),
  // ORV-118 row 1: the brand badge shares the neutral ground and is told apart by the mark's bead.
  // Probes, not literals, so the play holds under every toolbar profile and mode. The probe sits
  // inside the profile and mode boundary the badge sits in; on the canvas root it would read neutral light.
  play: async ({ canvasElement }) => {
    const badgeOf = (word: string) =>
      within(canvasElement).getByText(word).closest<HTMLElement>(".ds-badge") as HTMLElement;
    const brand = badgeOf("ORIVILO");
    const neutral = badgeOf("ฉบับร่าง");
    const bead = brand.firstElementChild as HTMLElement;
    await expect(bead).toHaveClass("ds-badge__dot");
    await expect(bead).toHaveAttribute("aria-hidden", "true");
    await expect(brand).toHaveTextContent(/^ORIVILO$/);
    await expect(brand.querySelector(".ds-badge__icon")).toBeNull();
    const boundary = brand.closest("[data-design-profile]");
    if (!boundary) throw new Error("the Variants badge sits in no profile and mode boundary");
    const probe = (property: "color" | "background-color", token: string) => {
      const el = document.createElement("span");
      el.style.setProperty(property, `var(${token})`);
      boundary.appendChild(el);
      const value = getComputedStyle(el).getPropertyValue(property);
      el.parentNode?.removeChild(el);
      return value;
    };
    await expect(getComputedStyle(brand).backgroundColor).toBe(
      getComputedStyle(neutral).backgroundColor,
    );
    await expect(getComputedStyle(brand).color).toBe(probe("color", "--ds-text-primary"));
    await expect(getComputedStyle(bead).backgroundColor).toBe(
      probe("background-color", "--ds-brand-dot-small"),
    );
    expectSameHeight(brand, neutral);
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge {...args} size="sm" variant="success">
        อนุมัติแล้ว
      </Badge>
      <Badge {...args} size="md" variant="success">
        อนุมัติแล้ว
      </Badge>
      <Badge {...args} size="sm">
        {fixtures.latin}
      </Badge>
      <Badge {...args} size="md">
        {fixtures.latin}
      </Badge>
    </div>
  ),
};

const ICONS: Record<Exclude<BadgeVariant, "brand">, ReactNode> = {
  neutral: <LockIcon />,
  success: <CheckIcon />,
  warning: <StaleIcon />,
  danger: <WarningIcon />,
  info: <CheckIcon />,
};

/** The brand badge takes no icon: its bead is what tells it from a neutral badge (ORV-118). */
const ICON_STATUS = STATUS.filter(
  (entry): entry is { variant: Exclude<BadgeVariant, "brand">; word: string } =>
    entry.variant !== "brand",
);

/** AC 4: a dot in the variant's feedback ink before the word; the word carries the meaning. */
export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS.map(({ variant, word }) => (
        <Badge key={variant} variant={variant} dot>
          {word}
        </Badge>
      ))}
      <Badge variant="success" size="sm" dot>
        อนุมัติแล้ว
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const badge = within(canvasElement).getByText("อนุมัติแล้ว", {
      selector: "span[data-size='md']",
    });
    const dot = badge.querySelector(".ds-badge__dot");
    await expect(dot).not.toBeNull();
    await expect(dot).toHaveAttribute("aria-hidden", "true");
    // The dot is decoration: the badge's text is the word alone.
    await expect(badge).toHaveTextContent(/^อนุมัติแล้ว$/);
    // The dot reads the variant's token, never a literal (the token test covers the source).
    await expect(getComputedStyle(dot as Element).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    // Dot before the word.
    await expect(badge.firstElementChild).toBe(dot);
    await expect(badge.querySelector(".ds-badge__icon")).toBeNull();
  },
};

/** AC 5: an icon before the word, sized for the badge size. */
export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {ICON_STATUS.map(({ variant, word }) => (
        <Badge key={variant} variant={variant} icon={ICONS[variant]}>
          {word}
        </Badge>
      ))}
      <Badge variant="warning" size="sm" icon={ICONS.warning}>
        ล้าสมัย
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const md = canvas.getByText("ล้มเหลว").closest<HTMLElement>(".ds-badge");
    const sm = canvasElement.querySelector<HTMLElement>(".ds-badge[data-size='sm']");
    const iconOf = (el: HTMLElement | null) => el?.querySelector<HTMLElement>(".ds-badge__icon");
    await expect(iconOf(md)).toHaveAttribute("aria-hidden", "true");
    await expect(md).toHaveTextContent(/^ล้มเหลว$/);
    const size = (el: HTMLElement | null | undefined) =>
      Math.round(el?.getBoundingClientRect().width ?? 0);
    await expect(size(iconOf(md))).toBe(16);
    await expect(size(iconOf(sm))).toBe(14);
  },
};

/** `dot` and `icon` together do not compile; the type keeps the badge to one mark. */
export const OneMarkOnly: Story = {
  render: () => (
    <>
      {/* @ts-expect-error a dot and an icon in one badge is a type error (AC 5) */}
      <Badge dot icon={<CheckIcon />}>
        {fixtures.latin}
      </Badge>
      {/* @ts-expect-error an icon on the brand badge is a type error: its bead is its mark (ORV-118 design row 1) */}
      <Badge variant="brand" icon={<CheckIcon />}>
        ORIVILO
      </Badge>
    </>
  ),
};

/** Next to a title, the way the canvas and the version list use it. */
export const NextToATitle: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <h2 className="flex flex-wrap items-center gap-2 text-heading-sm">
        {fixtures.mixed}
        <Badge {...args} variant="success">
          อนุมัติแล้ว
        </Badge>
      </h2>
      <h2 className="flex flex-wrap items-center gap-2 text-heading-sm">
        <span className="min-w-0 truncate">{fixtures.longThai}</span>
        <Badge {...args} variant="warning">
          ล้าสมัย
        </Badge>
      </h2>
    </div>
  ),
};

/** A badge never renders without backing data; when the value is missing the line says so in text. */
export const MissingValue: Story = {
  render: () => (
    <p className="text-body-sm text-text-secondary">
      สถานะ: {fixtures.missing ?? fixtures.missingLabel}
    </p>
  ),
};

export const At360: Story = {
  render: () => (
    <Narrow>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS.map(({ variant, word }) => (
          <Badge key={variant} variant={variant} dot>
            {word}
          </Badge>
        ))}
        <Badge icon={ICONS.neutral}>{fixtures.longThai}</Badge>
      </div>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Matrix>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS.map(({ variant, word }) => (
          <Badge key={variant} variant={variant} size="sm" dot>
            {word}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {ICON_STATUS.map(({ variant, word }) => (
          <Badge key={variant} variant={variant} icon={ICONS[variant]}>
            {word}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {STATUS.map(({ variant, word }) => (
          <Badge key={variant} variant={variant} size="sm">
            {word}
          </Badge>
        ))}
      </div>
    </Matrix>
  ),
};
