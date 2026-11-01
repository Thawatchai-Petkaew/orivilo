import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import { Card } from "../card/Card";
import { Matrix } from "../matrix";
import { Skeleton, SkeletonGroup } from "./Skeleton";

const meta = {
  title: "Base/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Static placeholder shapes for a region whose layout is known (ORV-201): `text`, `block` and `circle`. Every shape is hidden from assistive technology; `SkeletonGroup` sets `aria-busy` and speaks one status for the region. There is no pulse: a page waiting for data is not the engine at work, and a long pulse beside usable content falls under WCAG 2.2.2.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Loading composition: a card with an avatar and title, two text lines and a media block. */
function LoadingCard() {
  return (
    <Card className="w-80 max-w-full">
      <SkeletonGroup>
        <div className="flex items-center gap-3">
          <Skeleton shape="circle" className="size-10 shrink-0" />
          <Skeleton className="w-[60%]" />
        </div>
        <Skeleton className="w-full" />
        <Skeleton className="w-3/4" />
        <Skeleton shape="block" className="h-[120px] w-full" />
      </SkeletonGroup>
    </Card>
  );
}

/** What the engine computes for one CSS value, read from a probe so a play compares like with like. */
function resolved(host: Element, property: string, value: string): string {
  const probe = document.createElement("div");
  probe.style.setProperty(property, value);
  host.appendChild(probe);
  try {
    return getComputedStyle(probe).getPropertyValue(property);
  } finally {
    probe.remove();
  }
}

/** Text, block and circle; each is hidden from assistive technology. */
export const Shapes: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Skeleton className="w-full" />
      <Skeleton shape="block" className="h-20 w-full" />
      <Skeleton shape="circle" className="size-10" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shapes = Array.from(canvasElement.querySelectorAll<HTMLElement>(".ds-skeleton"));
    await expect(shapes).toHaveLength(3);
    for (const shape of shapes) await expect(shape).toHaveAttribute("aria-hidden", "true");
    const [text, block, circle] = shapes as [HTMLElement, HTMLElement, HTMLElement];

    // circle: round by clip-path in every profile, a 1 to 1 box.
    await expect(getComputedStyle(circle).clipPath).toBe("circle(50%)");
    const circleBox = circle.getBoundingClientRect();
    await expect(circleBox.width).toBe(circleBox.height);

    // block: the media radius.
    await expect(getComputedStyle(block).borderTopLeftRadius).toBe(
      resolved(canvasElement, "border-top-left-radius", "var(--ds-shape-media-radius)"),
    );

    // text: the bar (::before) takes the control radius; the host is one body.sm line box.
    await expect(getComputedStyle(text, "::before").borderTopLeftRadius).toBe(
      resolved(canvasElement, "border-top-left-radius", "var(--ds-shape-control-radius)"),
    );
    const probe = document.createElement("div");
    probe.style.fontSize = "var(--ds-type-body-sm-font-size)";
    probe.style.lineHeight = "var(--ds-type-body-sm-line-height)";
    canvasElement.appendChild(probe);
    const lineBox = parseFloat(getComputedStyle(probe).lineHeight);
    probe.remove();
    await expect(Math.abs(text.getBoundingClientRect().height - lineBox)).toBeLessThanOrEqual(0.5);
  },
};

/** One group: five shapes in a card, `aria-busy`, one status, no motion. */
export const Loading: Story = {
  render: () => <LoadingCard />,
  play: async ({ canvasElement }) => {
    const statuses = within(canvasElement).getAllByRole("status");
    await expect(statuses).toHaveLength(1);
    await expect(statuses[0]).toHaveTextContent("กำลังโหลดเนื้อหา");
    await expect(canvasElement.querySelector(".ds-skeleton-group")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    const shapes = Array.from(canvasElement.querySelectorAll<HTMLElement>(".ds-skeleton"));
    await expect(shapes).toHaveLength(5);
    for (const shape of shapes) {
      const style = getComputedStyle(shape);
      await expect(style.animationName).toBe("none");
      await expect(style.transitionDuration).toBe("0s");
    }
  },
};

/** English: the status holds "Loading content". */
export const InEnglish: Story = {
  decorators: [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>],
  render: () => <LoadingCard />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("Loading content");
    await expect(canvasElement.querySelectorAll(".ds-skeleton")).toHaveLength(5);
  },
};

/** A 360 px frame: every shape stays inside it and nothing scrolls sideways. */
export const At360: Story = {
  render: () => (
    <div data-testid="frame" className="w-[360px] max-w-full overflow-hidden">
      <LoadingCard />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(360);
    const frameBox = frame.getBoundingClientRect();
    for (const shape of Array.from(canvasElement.querySelectorAll(".ds-skeleton"))) {
      await expect(shape.getBoundingClientRect().right).toBeLessThanOrEqual(frameBox.right + 0.5);
    }
  },
};

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <LoadingCard />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-matrix-cell]")).toHaveLength(6);
    await expect(within(canvasElement).getAllByRole("status")).toHaveLength(6);
  },
};
