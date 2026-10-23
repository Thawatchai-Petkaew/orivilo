import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { DesignProfileBoundary, useDesignProfile } from "../../boundary/DesignProfileBoundary";
import { useMessages } from "../../i18n/LocaleProvider";
import { Button } from "../button/Button";
import { fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { type ToastEntry, type ToastOptions, Toaster, ToastRegion, toast } from "./Toast";

const body = () => within(document.body);
const toastsOpen = () => document.querySelectorAll('.ds-toast[data-state="open"]');

/** Mounts the region and clears whatever a story left in the store when it unmounts. */
function Harness({
  label,
  options,
  container,
  children,
}: {
  label: string;
  options: ToastOptions;
  container?: HTMLElement | null;
  children?: ReactNode;
}) {
  useEffect(() => () => toast.dismiss(), []);
  return (
    <div className="flex flex-col items-start gap-3">
      <Toaster container={container} />
      <Button variant="secondary" onClick={() => toast(options)}>
        {label}
      </Button>
      {children}
    </div>
  );
}

const meta = {
  title: "Base/Toast",
  component: Toaster,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A short notice that does not block (E4-5), called with toast() and shown by one Toaster at the bottom end corner. Failure is assertive and stays until dismissed. The stories fire mock notices; nothing here is saved or generated.",
      },
    },
  },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const savedOptions: ToastOptions = {
  title: "บันทึกร่างแล้ว",
  description: "ข้อมูลตัวอย่างจากชุดทดสอบ",
  action: { label: "เลิกทำ", onClick: fn() },
};

/** Title, description and action; focus stays where it was; the close button and Escape dismiss it. */
export const Default: Story = {
  render: () => <Harness label="แสดงการแจ้งเตือน" options={savedOptions} />,
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" });
    await userEvent.click(trigger);
    const title = await body().findByText("บันทึกร่างแล้ว");
    // The toast fades in; wait until it has.
    await waitFor(() => expect(body().getByText("ข้อมูลตัวอย่างจากชุดทดสอบ")).toBeVisible());
    await expect(body().getByRole("button", { name: "เลิกทำ" })).toBeVisible();
    // Focus does not jump to the toast when it appears.
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(title).not.toBeInTheDocument());
  },
};

/** The close button is named "ปิดการแจ้งเตือน" and removes the toast. */
export const Dismiss: Story = {
  render: () => <Harness label="แสดงการแจ้งเตือน" options={{ title: "ส่งออกแล้ว" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" }));
    const title = await body().findByText("ส่งออกแล้ว");
    await userEvent.click(body().getByRole("button", { name: "ปิดการแจ้งเตือน" }));
    await waitFor(() => expect(title).not.toBeInTheDocument());
  },
};

/** Neutral and success leave after their duration (shortened here so the test does not wait 5 s). */
export const LeavesAfterDuration: Story = {
  render: () => (
    <Harness
      label="แสดงการแจ้งเตือน"
      options={{ title: "คัดลอกลิงก์แล้ว", variant: "success", duration: 300 }}
    />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" }));
    const title = await body().findByText("คัดลอกลิงก์แล้ว");
    await waitFor(() => expect(title).not.toBeInTheDocument(), { timeout: 3000 });
  },
};

/** While the pointer is over the region the timer is paused, so the toast stays past its duration. */
export const StaysWhileHovered: Story = {
  render: () => (
    <Harness label="แสดงการแจ้งเตือน" options={{ title: "กำลังอ่านอยู่", duration: 300 }} />
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" }));
    const title = await body().findByText("กำลังอ่านอยู่");
    await userEvent.hover(title);
    // A negative claim needs time to pass: three durations.
    await new Promise((resolve) => setTimeout(resolve, 900));
    await expect(title).toBeVisible();
    await userEvent.unhover(title);
    await waitFor(() => expect(title).not.toBeInTheDocument(), { timeout: 3000 });
  },
};

const failure: ToastOptions = {
  title: "สร้างโลโก้ไม่สำเร็จ",
  description: "โควตาเต็มแล้ว รอรอบถัดไปหรือลดจำนวนตัวเลือก แล้วลองอีกครั้ง",
  variant: "danger",
  duration: 100,
};

/** Announced assertively, says what failed and how to fix it, and does not leave on its own. */
export const Failure: Story = {
  render: () => <Harness label="แสดงข้อผิดพลาด" options={failure} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "แสดงข้อผิดพลาด" }));
    const title = await body().findByText("สร้างโลโก้ไม่สำเร็จ");
    await waitFor(() => {
      const live = document.querySelector('[aria-live="assertive"]');
      expect(live?.textContent ?? "").toContain("สร้างโลโก้ไม่สำเร็จ");
    });
    // The duration above is ignored for a failure: it is still here well after it.
    await new Promise((resolve) => setTimeout(resolve, 600));
    await expect(title).toBeVisible();
    await userEvent.click(body().getByRole("button", { name: "ปิดการแจ้งเตือน" }));
    await waitFor(() => expect(title).not.toBeInTheDocument());
  },
};

/** A polite notice is announced politely, not assertively. */
export const Polite: Story = {
  render: () => <Harness label="แสดงการแจ้งเตือน" options={{ title: "ซิงก์เสร็จแล้ว" }} />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" }));
    await body().findByText("ซิงก์เสร็จแล้ว");
    await waitFor(() => {
      const live = document.querySelector('[aria-live="polite"]');
      expect(live?.textContent ?? "").toContain("ซิงก์เสร็จแล้ว");
    });
    await expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
  },
};

function Burst() {
  const [n, setN] = useState(0);
  return (
    <Harness label="ยิงสี่ครั้ง" options={{ title: "ครั้งที่ 1" }}>
      <Button
        variant="secondary"
        onClick={() => {
          for (let i = 1; i <= 4; i += 1) toast({ title: `ครั้งที่ ${n + i}`, duration: 60000 });
          setN(n + 4);
        }}
      >
        ยิงรัว
      </Button>
    </Harness>
  );
}

/** Four calls leave three on screen; the oldest leaves first. */
export const AtMostThree: Story = {
  render: () => <Burst />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "ยิงรัว" }));
    await waitFor(() => expect(toastsOpen()).toHaveLength(3));
    await waitFor(() => expect(body().getByText("ครั้งที่ 4")).toBeVisible());
    await waitFor(() => expect(body().queryByText("ครั้งที่ 1")).toBeNull());
  },
};

/** The region renders through a portal that re-opens the trigger's profile boundary. */
export const InsideProfile: Story = {
  render: () => (
    <DesignProfileBoundary profile="professional" mode="light">
      <div className="rounded-container bg-surface-canvas p-4 font-body text-text-primary">
        <Harness label="แสดงการแจ้งเตือน" options={{ title: "บันทึกร่างแล้ว" }} />
      </div>
    </DesignProfileBoundary>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" });
    await userEvent.click(button);
    const title = await body().findByText("บันทึกร่างแล้ว");
    const scope = title.closest<HTMLElement>("[data-design-profile]");
    await expect(scope?.dataset["designProfile"]).toBe("professional");
    const read = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--ds-action-primary").trim();
    await expect(read(title)).toBe(read(button));
  },
};

/** At the bottom end corner of a 360 px frame, inside its edges. */
export const At360: Story = {
  render: () => <Frame360 />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "แสดงการแจ้งเตือน" }));
    const title = await within(canvasElement).findByText(fixtures.longThai);
    const frame = canvasElement.querySelector<HTMLElement>("[data-frame]") as HTMLElement;
    const item = title.closest<HTMLElement>(".ds-toast") as HTMLElement;
    await waitFor(() => expect(item.getAnimations()).toHaveLength(0));
    const f = frame.getBoundingClientRect();
    const t = item.getBoundingClientRect();
    await expect(Math.round(f.right - t.right)).toBeGreaterThan(0);
    await expect(t.left).toBeGreaterThanOrEqual(f.left);
    await expect(t.bottom).toBeLessThanOrEqual(f.bottom);
  },
};

function Frame360() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setNode}
      data-frame=""
      className="relative isolate h-96 w-[360px] max-w-full overflow-hidden rounded-container bg-surface-canvas [contain:layout]"
    >
      {node ? (
        <Harness
          label="แสดงการแจ้งเตือน"
          container={node}
          options={{ title: fixtures.longThai, description: fixtures.longLatin }}
        />
      ) : null}
    </div>
  );
}

const sample = (id: string, options: ToastOptions): ToastEntry => ({
  ...options,
  id,
  open: true,
  duration: Infinity,
});

function Cell() {
  const m = useMessages();
  const scope = useDesignProfile();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setNode}
      className="relative isolate h-80 overflow-hidden rounded-container bg-surface-canvas [contain:layout]"
    >
      {node ? (
        <ToastRegion
          container={node}
          label={`${m.toast.region}, ${String(scope?.profile)}, ${scope?.mode}`}
          entries={[
            sample("a", {
              title: "บันทึกร่างแล้ว",
              description: "ข้อมูลตัวอย่าง",
              action: { label: "เลิกทำ", onClick: fn() },
            }),
            sample("b", { title: "ส่งออกแล้ว", variant: "success" }),
            sample("c", {
              title: "สร้างโลโก้ไม่สำเร็จ",
              description: "โควตาเต็ม รอรอบถัดไปแล้วลองอีกครั้ง",
              variant: "danger",
            }),
          ]}
        />
      ) : null}
    </div>
  );
}

/** Every variant under three profiles in both modes; each cell mounts its own region (mock data). */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <Cell />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll(".ds-toast")).toHaveLength(18));
  },
};
