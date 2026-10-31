import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Badge } from "../badge/Badge";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix, Narrow } from "../matrix";
import { Card, CardFooter, CardTitle, CardValue } from "./Card";

/** The unit every story shows: a title and a line of secondary text. */
const content = (
  <>
    <CardTitle>{fixtures.mixed}</CardTitle>
    <p className="text-text-secondary">
      Design system และ Product ของทีม แก้ไขล่าสุดเมื่อ 2 ชั่วโมงก่อน
    </p>
  </>
);

const meta = {
  title: "Application/Card",
  component: Card,
  parameters: { layout: "padded" },
  args: { as: "article", children: content },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A static card: a unit with a title, text and actions in the footer. */
export const Default: Story = {
  render: () => (
    <Card as="article">
      {content}
      <CardFooter>
        <Badge>ฉบับร่าง</Badge>
        <Button variant="ghost" size="sm" className="ms-auto">
          เปิด
        </Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    // ORV-192 row 18: the paragraph has no type token of its own, so it takes the boundary's body
    // type, 16 / 1.7 (27.2 px), not Tailwind's 16 / 1.5 (24 px).
    const paragraph = canvasElement.querySelector("article p") as HTMLElement;
    await expect(getComputedStyle(paragraph).lineHeight).toBe("27.2px");
  },
};

/** The whole card is one button; its text is its name. Selected renders `aria-pressed` (AC 8). */
export const Interactive: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card interactive>{content}</Card>
      <Card interactive selected>
        {content}
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cards = canvas.getAllByRole("button", {
      name: (name: string) => name.includes(fixtures.mixed),
    });
    await expect(cards).toHaveLength(2);
    await expect(cards[0]).toHaveAttribute("aria-pressed", "false");
    await expect(cards[1]).toHaveAttribute("aria-pressed", "true");
  },
};

/** The whole card is one link; selected renders `aria-current`. */
export const Link: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card interactive href="#canvas">
        {content}
      </Card>
      <Card interactive href="#design-system" selected>
        {content}
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole("link");
    await expect(links[1]).toHaveAttribute("aria-current", "true");
  },
};

/**
 * Hover shows an edge, focus the ring, pressed the same edge; none is a tint alone (DESIGN.md §7).
 * A synthetic pointer sets no `:hover`, so `parameters.pseudo` forces the hover look on the hover
 * card (spec ORV-84, `hover-force-1`).
 */
export const InteractionStates: Story = {
  parameters: { pseudo: { rootSelector: "body", hover: ['[data-testid="hover"]'] } },
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card interactive data-testid="default">
        {content}
      </Card>
      <Card interactive data-testid="hover">
        {content}
      </Card>
      <Card interactive data-testid="focus">
        {content}
      </Card>
      <Card interactive data-testid="press">
        {content}
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.pointer({ keys: "[MouseLeft>]", target: canvas.getByTestId("press") });
    await userEvent.hover(canvas.getByTestId("hover"));
    canvas.getByTestId("focus").focus();
    await expect(canvas.getByTestId("focus")).toHaveFocus();
    await waitFor(() =>
      expect(getComputedStyle(canvas.getByTestId("hover")).borderColor).not.toBe(
        getComputedStyle(canvas.getByTestId("default")).borderColor,
      ),
    );
  },
};

/** A static selected card: `surface.selected` and a `selection.fg` edge; the list labels what selected means. */
export const Selected: Story = {
  render: () => (
    <ul aria-label="โปรเจกต์ (เลือกอยู่ 1)" className="grid list-none gap-4 p-0 sm:grid-cols-2">
      <Card as="li">{content}</Card>
      <Card as="li" selected aria-label={`${fixtures.mixed}, เลือกอยู่`}>
        {content}
      </Card>
    </ul>
  ),
};

/** The airy bento (DESIGN.md §2): borderless cards on the canvas, a numeral tile with `CardValue`, one lime badge at most. */
export const Bento: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card as="article">
        <CardTitle>โปรเจกต์ที่กำลังทำ</CardTitle>
        <CardValue>12</CardValue>
        <p className="text-text-secondary">เพิ่มขึ้น 3 จากสัปดาห์ก่อน</p>
      </Card>
      <Card as="article">
        <CardTitle>การตัดสินใจที่มีเหตุผลกำกับ</CardTitle>
        <CardValue>98%</CardValue>
        <p className="text-text-secondary">จาก 412 รายการ</p>
      </Card>
      <Card as="article">
        <CardTitle>รอรีวิว</CardTitle>
        <CardValue>4</CardValue>
        <CardFooter>
          <Badge variant="brand">Intent Engine</Badge>
        </CardFooter>
      </Card>
    </div>
  ),
};

/** 360 px with a long Thai name without spaces: the title wraps inside the card, nothing overflows. */
export const LongContentAt360: Story = {
  render: () => (
    <Narrow>
      <Card as="article">
        <CardTitle>{fixtures.longThai}</CardTitle>
        <p className="text-text-secondary">{fixtures.longLatin}</p>
        <CardFooter>
          <Badge>{fixtures.missingLabel}</Badge>
        </CardFooter>
      </Card>
    </Narrow>
  ),
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Card as="article">{content}</Card>
      <Card interactive>{content}</Card>
      <Card interactive selected>
        {content}
      </Card>
    </Matrix>
  ),
};
