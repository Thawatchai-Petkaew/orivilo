import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary } from "../../boundary/DesignProfileBoundary";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { expectFocusBorderForm, expectLinesClear, inVitest } from "../../testing/visual-asserts";
import { Matrix } from "../matrix";
import { Sheet, SheetClose, SheetContent, type SheetContentProps, SheetTrigger } from "./Sheet";

const body = () => within(document.body);

const trigger = (
  <SheetTrigger>
    <Button variant="secondary">ดูรายละเอียด</Button>
  </SheetTrigger>
);

function InspectorContent(props: Partial<SheetContentProps>) {
  return (
    <SheetContent
      title="โลโก้"
      description="ชิ้นงานจากบรีฟรอบที่ 2"
      footer={
        <SheetClose>
          <Button variant="ghost" disabled={props.pending}>
            ปิดแผง
          </Button>
        </SheetClose>
      }
      {...props}
    >
      <div className="flex flex-col gap-3">
        {Array.from({ length: 12 }, (_, i) => (
          <p key={i} className="m-0">
            {i % 2 ? fixtures.longThai : fixtures.mixed}
          </p>
        ))}
      </div>
    </SheetContent>
  );
}

const meta = {
  title: "Application/Sheet",
  component: Sheet,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A side panel for a longer task that keeps the board in view (E4-4): the inspector on small screens. Same focus model as Dialog; Escape closes unless pending.",
      },
    },
  },
  args: {
    children: (
      <>
        {trigger}
        <InspectorContent />
      </>
    ),
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed until the trigger opens it; focus stays inside and Escape returns it to the trigger. */
export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "ดูรายละเอียด" });
    await userEvent.click(button);
    const sheet = await body().findByRole("dialog", { name: "โลโก้" });
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));
    for (let i = 0; i < 4; i += 1) {
      await userEvent.tab();
      await expect(sheet.contains(document.activeElement)).toBe(true);
    }
    // Border form on the open edge (ORV-192 rows 9 and 19): one brand line, the shadow first, the 3 px halo last
    await expectFocusBorderForm(sheet, ["Left"]);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body().queryByRole("dialog")).toBeNull());
    await expect(button).toHaveFocus();
  },
};

/** Open on the end edge at full height; never wider than the viewport less the gutter. */
export const Open: Story = {
  args: { defaultOpen: true },
  play: async () => {
    const sheet = await body().findByRole("dialog", { name: "โลโก้" });
    await Promise.all(sheet.getAnimations().map((a) => a.finished));
    const box = sheet.getBoundingClientRect();
    await expect(Math.round(box.right)).toBe(window.innerWidth);
    await expect(box.width).toBeLessThanOrEqual(480);
    // ORV-194 row 6: the title's wrapped Thai lines keep 1.5 px of ground between them.
    const title = sheet.querySelector<HTMLElement>(".ds-side-sheet__title");
    if (!title) throw new Error("the sheet has no title");
    if (inVitest) await expectLinesClear(title);
  },
};

export const StartLarge: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        {trigger}
        <InspectorContent side="start" size="lg" />
      </>
    ),
  },
  play: async () => {
    const sheet = await body().findByRole("dialog", { name: "โลโก้" });
    await Promise.all(sheet.getAnimations().map((a) => a.finished));
    await expect(Math.round(sheet.getBoundingClientRect().left)).toBe(0);
  },
};

function PendingSheet() {
  const [pending, setPending] = useState(false);
  return (
    <Sheet defaultOpen>
      {trigger}
      <InspectorContent
        pending={pending}
        footer={
          <Button variant="primary" loading={pending} onClick={() => setPending(true)}>
            สร้างใหม่
          </Button>
        }
      />
    </Sheet>
  );
}

/** Pending: Escape and the close control do nothing while the work runs. */
export const Pending: Story = {
  render: () => <PendingSheet />,
  play: async () => {
    await userEvent.click(await body().findByRole("button", { name: "สร้างใหม่" }));
    const sheet = body().getByRole("dialog");
    await expect(sheet).toHaveAttribute("aria-busy", "true");
    await userEvent.keyboard("{Escape}");
    await expect(body().getByRole("dialog")).toBeVisible();
    await expect(body().getByRole("button", { name: "ปิด" })).toBeDisabled();
  },
};

export const ErrorState: Story = {
  args: {
    defaultOpen: true,
    children: (
      <>
        {trigger}
        <InspectorContent error="สร้างไม่สำเร็จ เพราะบรีฟยังขาดกลุ่มผู้ใช้ เติมแล้วลองอีกครั้ง" />
      </>
    ),
  },
  play: async () => {
    await expect(await body().findByRole("alert")).toHaveTextContent("สร้างไม่สำเร็จ");
  },
};

/** The portal keeps the trigger's profile and mode. */
export const InsideProfile: Story = {
  render: (args) => (
    <DesignProfileBoundary profile="friendly" mode="dark">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Sheet {...args} defaultOpen />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "ดูรายละเอียด",
      hidden: true,
    });
    const sheet = await body().findByRole("dialog");
    const scope = sheet.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("friendly");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-surface-raised").trim();
    await expect(read(sheet)).toBe(read(button));
  },
};

function Frame({ children }: { children: (container: HTMLElement) => ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setNode}
      className="relative isolate h-80 overflow-hidden rounded-container bg-surface-canvas [contain:layout]"
    >
      {node ? children(node) : null}
    </div>
  );
}

export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Frame>
        {(container) => (
          <Sheet defaultOpen modal={false}>
            {trigger}
            <InspectorContent
              container={container}
              onInteractOutside={(event) => event.preventDefault()}
            />
          </Sheet>
        )}
      </Frame>
    </Matrix>
  ),
  play: async () => {
    await waitFor(() => expect(body().getAllByRole("dialog")).toHaveLength(6));
  },
};
