import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useRef, useState } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import { LocaleProvider } from "../../i18n/LocaleProvider";
import {
  expectFocusBorderForm,
  expectFrameCutsNoInk,
  expectLabelInkWhole,
  expectLinesClear,
  inVitest,
} from "../../testing/visual-asserts";
import { fileUploadFixtures, fixtures } from "../fixtures";
import { Matrix } from "../matrix";
import { FileUpload, type FileUploadItem, type FileUploadProps } from "./FileUpload";
import { IMAGE_UPLOAD_LIMITS } from "./limits";

type Lang = "th" | "en";

/**
 * What the story driver does to the list from a play. The mock upload has no timers and no
 * network: a play says when a file moves on, so the plays wait on conditions, not on time.
 */
interface Driver {
  ids(): string[];
  progress(id: string, value: number): void;
  done(id: string): void;
  fail(id: string, reason: string): void;
}

const drivers = new WeakMap<Element, Driver>();

/**
 * MOCK. The list the caller owns, held in state so the control can be used in a story. Nothing
 * here reads a file or sends one: a chosen file becomes an `uploading` item at 0%, and a play
 * moves it on through `Driver` (`upload-server-1`).
 */
function MockHost(props: FileUploadProps) {
  const [items, setItems] = useState<readonly FileUploadItem[]>(props.items);
  const latest = useRef(items);
  latest.current = items;
  const count = useRef(0);
  const driver = useMemo<Driver>(() => {
    const update = (id: string, change: (item: FileUploadItem) => FileUploadItem) =>
      setItems((current) => current.map((item) => (item.id === id ? change(item) : item)));
    return {
      ids: () => latest.current.map((item) => item.id),
      progress: (id, value) =>
        update(id, (item) => ({
          id,
          name: item.name,
          size: item.size,
          status: "uploading",
          progress: value,
        })),
      done: (id) =>
        update(id, (item) => ({ id, name: item.name, size: item.size, status: "done" })),
      fail: (id, reason) =>
        update(id, (item) => ({ id, name: item.name, size: item.size, status: "failed", reason })),
    };
  }, []);
  return (
    <div
      data-mock-host=""
      ref={(el) => {
        if (el) drivers.set(el, driver);
      }}
    >
      <FileUpload
        {...props}
        items={items}
        onFiles={(files) => {
          props.onFiles(files);
          setItems((current) => [
            ...current,
            ...files.map((file): FileUploadItem => {
              count.current += 1;
              return {
                id: `new-${count.current}`,
                name: file.name,
                size: file.size,
                status: "uploading",
                progress: 0,
              };
            }),
          ]);
        }}
        onRetry={(id) => {
          props.onRetry(id);
          driver.progress(id, 0);
        }}
        onRemove={(id) => {
          props.onRemove(id);
          setItems((current) => current.filter((item) => item.id !== id));
        }}
      />
    </div>
  );
}

const meta = {
  title: "Base/File upload",
  component: FileUpload,
  args: {
    label: fileUploadFixtures.th.label,
    limits: IMAGE_UPLOAD_LIMITS,
    items: [],
    onFiles: fn(),
    onRetry: fn(),
    onRemove: fn(),
  },
  render: (args) => <MockHost {...args} />,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Mock upload: nothing leaves the browser. The control shows limits and state only (ORV-227): it picks files, names a refused file with its reason and its fix, and lists each file with its progress, done or failed state, with Try again and Remove. The check before the wait is a courtesy; the real file checks (type by content, size, count) stay on the server, and no upload exists yet. Every file, size, progress and failure in these stories is mock data moved by a story driver.",
      },
    },
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The words each language shows, written out here (not read from the catalog) so a copy change goes red. */
const TEXT = {
  th: {
    limits: "ไฟล์ PNG, JPEG, WebP ขนาดไม่เกิน 4 MB ต่อไฟล์ เลือกได้สูงสุด 5 ไฟล์",
    choose: "เลือกไฟล์",
    chooseName: (label: string) => `เลือกไฟล์ สำหรับ${label}`,
    full: "ครบ 5 ไฟล์แล้ว นำไฟล์ออกก่อนจึงจะเพิ่มได้",
    listLabel: "ไฟล์ที่เลือก",
    done: "อัปโหลดแล้ว",
    failed: "อัปโหลดไม่สำเร็จ",
    retry: "ลองอีกครั้ง",
    retryName: (name: string) => `ลองอีกครั้ง อัปโหลด ${name}`,
    removeName: (name: string) => `นำ ${name} ออกจากรายการ`,
    working: "กำลังทำงาน",
    sizeMissing: "ไม่ทราบขนาด",
    started: (name: string) => `กำลังอัปโหลด ${name}`,
    quarter: (name: string, percent: string) => `${name} อัปโหลดไปแล้ว ${percent}`,
    finished: (name: string) => `อัปโหลด ${name} แล้ว`,
    failedSaid: (name: string, reason: string) => `อัปโหลด ${name} ไม่สำเร็จ: ${reason}`,
    tooBig: (name: string) => `${name}: ไฟล์ขนาด 4.1 MB เกิน 4 MB ย่อไฟล์แล้วเลือกอีกครั้ง`,
    badType: (name: string) => `${name}: ไฟล์ชนิดนี้ใช้ไม่ได้ เลือกไฟล์ชนิด PNG, JPEG, WebP แทน`,
    overCount: (name: string) => `${name}: เกิน 5 ไฟล์ นำไฟล์ออกจากรายการก่อนแล้วเลือกอีกครั้ง`,
    more: (count: number) => `และอีก ${count} ไฟล์ที่เพิ่มไม่ได้`,
    wideFile: "ภาพ.PNG",
  },
  en: {
    limits: "PNG, JPEG, WebP files, up to 4 MB each. At most 5 files",
    choose: "Choose files",
    chooseName: (label: string) => `Choose files for ${label}`,
    full: "5 files added. Remove one to add another",
    listLabel: "Chosen files",
    done: "Uploaded",
    failed: "Upload failed",
    retry: "Try again",
    retryName: (name: string) => `Try again to upload ${name}`,
    removeName: (name: string) => `Remove ${name} from the list`,
    working: "Working",
    sizeMissing: "Size unknown",
    started: (name: string) => `Uploading ${name}`,
    quarter: (name: string, percent: string) => `${name}: ${percent} uploaded`,
    finished: (name: string) => `${name} uploaded`,
    failedSaid: (name: string, reason: string) => `${name} failed to upload: ${reason}`,
    tooBig: (name: string) =>
      `${name}: this file is 4.1 MB, over the 4 MB limit. Make it smaller and choose it again`,
    badType: (name: string) =>
      `${name}: this file type is not accepted. Choose one of these: PNG, JPEG, WebP`,
    overCount: (name: string) =>
      `${name}: over the limit of 5 files. Remove a file from the list and choose this one again`,
    more: (count: number) => `and ${count} more files not added`,
    wideFile: "photo.PNG",
  },
} as const;

const THAI = /[฀-๿]/;
const english: Decorator[] = [(Story) => <LocaleProvider locale="en">{Story()}</LocaleProvider>];

const names = (lang: Lang) => fileUploadFixtures.nameSets[lang];
/** 1,843,200 bytes reads "1.9 MB". */
const BYTES = fileUploadFixtures.bytes;

const uploadingItems = (lang: Lang): FileUploadItem[] => [
  { id: "u1", name: names(lang)[0], size: BYTES, status: "uploading", progress: 40 },
  { id: "u2", name: names(lang)[1], size: 512_000, status: "uploading" },
  { id: "u3", name: names(lang)[2], size: 2_400_000, status: "uploading", progress: 100 },
];
const doneItems = (lang: Lang): FileUploadItem[] => [
  { id: "d1", name: names(lang)[0], size: BYTES, status: "done" },
  { id: "d2", name: names(lang)[1], size: fileUploadFixtures.missingSize, status: "done" },
];
const failedItems = (lang: Lang): FileUploadItem[] => [
  {
    id: "f1",
    name: names(lang)[0],
    size: BYTES,
    status: "failed",
    reason: fileUploadFixtures[lang].reason,
  },
];
const fullItems = (lang: Lang): FileUploadItem[] => [
  { id: "x1", name: names(lang)[0], size: BYTES, status: "uploading", progress: 40 },
  { id: "x2", name: names(lang)[1], size: 512_000, status: "done" },
  { id: "x3", name: names(lang)[2], size: 640_000, status: "done" },
  {
    id: "x4",
    name: names(lang)[3],
    size: 1_000_000,
    status: "failed",
    reason: fileUploadFixtures[lang].reason,
  },
  { id: "x5", name: names(lang)[4], size: 300_000, status: "uploading" },
];

/** A `File` of the given type and size; the bytes are one letter, the size is set on the object. */
function fileOf(name: string, size: number, type = "image/png") {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

const inputOf = (root: HTMLElement) =>
  root.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
const zoneOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(".ds-file-upload__zone") as HTMLElement;
const regionOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(".ds-file-upload > [role='status']") as HTMLElement;
const driverOf = (root: HTMLElement) => {
  const host = root.querySelector("[data-mock-host]");
  const driver = host ? drivers.get(host) : undefined;
  if (!driver) throw new Error("the story has no mock host");
  return driver;
};

/**
 * A pick, as the browser sends it. `applyAccept: false` lets a wrong type reach the component,
 * which is what a person can do with the "All files" choice of the system picker.
 */
const pickFiles = (input: HTMLInputElement, files: File[]) =>
  userEvent.setup({ applyAccept: false }).upload(input, files);

/**
 * Counts the opens of the system picker without opening it: the listener sees both
 * `input.click()` and a label's activation, and `preventDefault` stops the picker.
 */
function countOpens(input: HTMLInputElement) {
  const state = { count: 0 };
  const listener = (event: Event) => {
    state.count += 1;
    event.preventDefault();
  };
  input.addEventListener("click", listener);
  return { state, stop: () => input.removeEventListener("click", listener) };
}

const rejectedLines = (root: HTMLElement) =>
  Array.from(root.querySelectorAll(".ds-file-upload__rejected")).map((el) => el.textContent);

// Rows 1 and 2: the empty control, its one Tab stop and its three ways to open the picker.
const playEmpty =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ args, canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const label = fileUploadFixtures[lang].label;
    const input = inputOf(canvasElement);
    const choose = canvas.getByRole("button", { name: t.chooseName(label) });

    // Row 1.
    await expect(canvas.getByText(label)).toBeVisible();
    await expect(canvas.getByText(t.limits)).toBeVisible();
    await expect(choose).toHaveTextContent(t.choose);
    await expect(choose.querySelector(".ds-button__icon svg")).not.toBeNull();
    await expect(choose).toHaveAccessibleDescription(t.limits);
    await expect(canvasElement.querySelector("ul")).toBeNull();

    // Row 2: one Tab stop; Enter, Space and a press on the label each ask the input to open.
    const opens = countOpens(input);
    await userEvent.tab();
    await expect(choose).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await userEvent.click(canvasElement.querySelector(".ds-field__label") as HTMLElement);
    await expect(opens.state.count).toBe(3);
    opens.stop();
    choose.focus();
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await expect(input).toHaveAttribute("multiple");
    await expect(input).toHaveAttribute("tabindex", "-1");
    await expect(input).toHaveAttribute("aria-hidden", "true");
    await expect(input).toHaveClass("sr-only");
    await expect(input).not.toHaveAttribute("role");
    await expect(getComputedStyle(input).display).not.toBe("none");
    await expect(input.accept).toBe("image/png,.png,image/jpeg,.jpg,.jpeg,image/webp,.webp");

    // Row 3: a chosen file becomes a row with a bar, and the status region says so.
    const [first, , third] = [names(lang)[0], names(lang)[1], names(lang)[2]];
    const shop = fileOf(first, BYTES);
    await pickFiles(input, [shop]);
    await expect(args.onFiles).toHaveBeenCalledTimes(1);
    await expect(args.onFiles).toHaveBeenLastCalledWith([shop]);
    const row = await canvas.findByRole("listitem");
    await expect(row).toHaveTextContent("0%");
    await expect(row).toHaveTextContent("1.9 MB");
    await expect(canvas.getByRole("progressbar", { name: first })).toBeVisible();
    await waitFor(() => expect(regionOf(canvasElement)).toHaveTextContent(t.started(first)));

    // Row 15, first run: the status region speaks at each quarter and at the end, not between.
    const driver = driverOf(canvasElement);
    const [id] = driver.ids();
    const region = regionOf(canvasElement);
    await expect(region).toHaveAttribute("role", "status");
    const bar = () => canvas.getByRole("progressbar", { name: first });
    const steps: [number, string][] = [
      [10, t.started(first)],
      [24, t.started(first)],
      [25, t.quarter(first, "25%")],
      [49, t.quarter(first, "25%")],
      [80, t.quarter(first, "75%")],
      [100, t.quarter(first, "100%")],
    ];
    for (const [value, said] of steps) {
      driver.progress(id as string, value);
      await waitFor(() => expect(bar()).toHaveAttribute("aria-valuenow", String(value)));
      await expect(region.textContent).toBe(said);
    }
    driver.done(id as string);
    await waitFor(() => expect(region.textContent).toBe(t.finished(first)));
    await expect(canvas.queryByRole("alert")).toBeNull();

    // Row 4: the same file again; the input is empty after each pick.
    await pickFiles(input, [shop]);
    await expect(input.value).toBe("");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(2));
    await expect(args.onFiles).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(region.textContent).toBe(t.started(first)));

    // Row 15, second run: two files at once, no percent; then one fails and says why.
    await pickFiles(input, [fileOf(third, 1000)]);
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(3));
    await waitFor(() => expect(region.textContent).toBe(t.started(third)));
    const [, second, last] = driver.ids();
    driver.progress(second as string, 60);
    await waitFor(() =>
      expect(canvas.getByRole("progressbar", { name: first })).toHaveAttribute(
        "aria-valuenow",
        "60",
      ),
    );
    await expect(region.textContent).toBe(t.started(third));
    driver.fail(last as string, fileUploadFixtures[lang].reason);
    await waitFor(() =>
      expect(region.textContent).toBe(t.failedSaid(third, fileUploadFixtures[lang].reason)),
    );
    await expect(canvas.queryByRole("alert")).toBeNull();
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Empty: Story = { play: playEmpty("th") };
export const EmptyInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label },
  play: playEmpty("en"),
};

// Rows 7 and 10: three rows in flight, then a pick that runs the list to its limit.
const playUploading =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ args, canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const [one, two, three] = [names(lang)[0], names(lang)[1], names(lang)[2]];

    // Items present at the first render say nothing: the status region starts empty.
    await expect(regionOf(canvasElement)).toBeEmptyDOMElement();

    // Row 10.
    const bars = canvas.getAllByRole("progressbar");
    await expect(bars).toHaveLength(3);
    const rows = canvas.getAllByRole("listitem");
    await expect(canvas.getByRole("progressbar", { name: one })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
    await expect(rows[0]).toHaveTextContent("40%");
    await expect(canvas.getByRole("progressbar", { name: two })).toBeVisible();
    await expect(canvas.getByRole("progressbar", { name: two })).not.toHaveAttribute(
      "aria-valuenow",
    );
    await expect(rows[1]).toHaveTextContent(t.working);
    await expect(canvas.getByRole("progressbar", { name: three })).toBeVisible();
    await expect(rows[2]).toHaveTextContent("100%");
    await expect(rows[2]?.querySelector(".ds-progress__status svg")).toBeNull();
    await expect(canvas.queryByText(t.done)).toBeNull();
    await expect(canvasElement.querySelector(".ds-file-upload__hint")).toBeNull();

    // Row 7: four valid files into a list of three; two fit, two are named.
    const files = ["p4.png", "p5.png", "p6.png", "p7.png"].map((name) => fileOf(name, 1000));
    await pickFiles(inputOf(canvasElement), files);
    await expect(args.onFiles).toHaveBeenCalledTimes(1);
    await expect(args.onFiles).toHaveBeenCalledWith([files[0], files[1]]);
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(5));
    await expect(rejectedLines(canvasElement)).toEqual([
      t.overCount("p6.png"),
      t.overCount("p7.png"),
    ]);
    await expect(canvas.getByText(t.full)).toBeVisible();
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Uploading: Story = {
  args: { items: uploadingItems("th") },
  play: playUploading("th"),
};
export const UploadingInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label, items: uploadingItems("en") },
  play: playUploading("en"),
};

// Rows 11 and 14: finished rows have no bar and no retry, and removing the last one hands focus to Choose.
const playDone =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ args, canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const [one, two] = [names(lang)[0], names(lang)[1]];
    await expect(regionOf(canvasElement)).toBeEmptyDOMElement();
    // The list carries a name, so a screen reader announces what it holds.
    await expect(canvas.getByRole("list", { name: t.listLabel })).toBeVisible();
    const rows = canvas.getAllByRole("listitem");
    await expect(rows).toHaveLength(2);
    for (const row of rows) {
      await expect(row).toHaveTextContent(t.done);
      await expect(row.querySelector(".ds-file-upload__word svg")).not.toBeNull();
    }
    await expect(rows[0]).toHaveTextContent("1.9 MB");
    await expect(rows[1]).toHaveTextContent(t.sizeMissing);
    await expect(canvas.queryByRole("progressbar")).toBeNull();
    await expect(canvas.queryByRole("button", { name: new RegExp(t.retry) })).toBeNull();
    await expect(canvas.getByRole("button", { name: t.removeName(one) })).toBeVisible();
    await expect(canvas.getByRole("button", { name: t.removeName(two) })).toBeVisible();

    // Row 14.
    await userEvent.click(canvas.getByRole("button", { name: t.removeName(one) }));
    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    await expect(args.onRemove).toHaveBeenLastCalledWith("d1");
    await waitFor(() => expect(canvas.getAllByRole("listitem")).toHaveLength(1));
    await userEvent.click(canvas.getByRole("button", { name: t.removeName(two) }));
    await expect(args.onRemove).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(canvasElement.querySelector("ul")).toBeNull());
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: t.chooseName(fileUploadFixtures[lang].label) }),
      ).toHaveFocus(),
    );
    await expect(document.body).not.toHaveFocus();
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Done: Story = { args: { items: doneItems("th") }, play: playDone("th") };
export const DoneInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label, items: doneItems("en") },
  play: playDone("en"),
};

// Rows 12 and 13: a failure keeps its reason beside Retry, and Retry hands focus to Remove.
const playFailed =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ args, canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const name = names(lang)[0];
    const row = canvas.getByRole("listitem");
    await expect(row).toHaveTextContent(t.failed);
    await expect(row.querySelector(".ds-file-upload__word svg")).not.toBeNull();
    await expect(row.querySelector(".ds-file-upload__reason")).toHaveTextContent(
      fileUploadFixtures[lang].reason,
    );
    await expect(canvas.queryByRole("progressbar")).toBeNull();
    const retry = canvas.getByRole("button", { name: t.retryName(name) });
    await expect(retry).toHaveTextContent(t.retry);
    await expect(canvas.getByRole("button", { name: t.removeName(name) })).toBeVisible();

    // Row 13.
    await userEvent.click(retry);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
    await expect(args.onRetry).toHaveBeenCalledWith("f1");
    await waitFor(() => expect(canvas.getByRole("progressbar", { name })).toBeVisible());
    await expect(canvas.queryByRole("button", { name: t.retryName(name) })).toBeNull();
    await expect(canvas.getByRole("button", { name: t.removeName(name) })).toHaveFocus();
    await waitFor(() => expect(regionOf(canvasElement)).toHaveTextContent(t.started(name)));
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Failed: Story = { args: { items: failedItems("th") }, play: playFailed("th") };
export const FailedInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label, items: failedItems("en") },
  play: playFailed("en"),
};

// Rows 5, 6, 9 and 18: what the check before the wait says about a refused file.
const playRejected =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ args, canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const input = inputOf(canvasElement);
    const zone = zoneOf(canvasElement);

    // Row 5: a file at the limit is kept, one byte over is refused with its size and the limit.
    const max = fileOf("max.png", 4_000_000);
    await pickFiles(input, [max, fileOf("big.png", 4_000_001)]);
    await expect(args.onFiles).toHaveBeenCalledTimes(1);
    await expect(args.onFiles).toHaveBeenLastCalledWith([max]);
    const list = await canvas.findByRole("list");
    await expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    await expect(list).toHaveTextContent("max.png");
    await expect(list).toHaveTextContent("4 MB");
    await expect(canvas.getByRole("alert")).toHaveTextContent(t.tooBig("big.png"));
    await expect(rejectedLines(canvasElement)).toEqual([t.tooBig("big.png")]);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(zone).toHaveAttribute("data-invalid");

    // Row 6: a wrong type is named with the fix; an empty type is judged by its extension, and the
    // next pick replaces the lines.
    await pickFiles(input, [fileOf("logo.svg", 1000, "image/svg+xml")]);
    await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent(t.badType("logo.svg")));
    await expect(args.onFiles).toHaveBeenCalledTimes(1);
    const upper = fileOf(t.wideFile, 1000, "");
    await pickFiles(input, [upper]);
    await expect(args.onFiles).toHaveBeenCalledTimes(2);
    await expect(args.onFiles).toHaveBeenLastCalledWith([upper]);
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);

    // Row 9: eight refused files show five lines and a count; Remove clears the lines.
    const texts = Array.from({ length: 8 }, (_, i) => fileOf(`n${i + 1}.txt`, 10, "text/plain"));
    await pickFiles(input, texts);
    await waitFor(() => expect(rejectedLines(canvasElement)).toHaveLength(6));
    await expect(rejectedLines(canvasElement)).toEqual([
      ...[1, 2, 3, 4, 5].map((n) => t.badType(`n${n}.txt`)),
      t.more(3),
    ]);
    await expect(
      canvasElement.querySelectorAll(".ds-file-upload__rejected:not([data-fold])"),
    ).toHaveLength(5);
    await expect(
      canvasElement.querySelectorAll(".ds-file-upload__rejected[data-fold]"),
    ).toHaveLength(1);
    await userEvent.click(canvas.getByRole("button", { name: t.removeName("max.png") }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    await expect(zone).not.toHaveAttribute("data-invalid");
    await expect(input).not.toHaveAttribute("aria-invalid");

    // Row 18: a name that looks like markup or a placeholder stays plain characters.
    const markup = "<img src=x onerror=alert(1)>.txt";
    await pickFiles(input, [
      fileOf(markup, 10, "text/plain"),
      fileOf("{size}.txt", 10, "text/plain"),
    ]);
    await waitFor(() => expect(rejectedLines(canvasElement)).toHaveLength(2));
    const [first, second] = rejectedLines(canvasElement);
    await expect(first).toBe(t.badType(markup));
    await expect(second).toBe(t.badType("{size}.txt"));
    await expect(canvasElement.querySelector("img")).toBeNull();
    await expect(second?.startsWith("{size}.txt:")).toBe(true);
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Rejected: Story = { play: playRejected("th") };
export const RejectedInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label },
  play: playRejected("en"),
};

// Row 8: five files fill the control; Choose stays focusable and opens nothing.
const playFull =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ args, canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const input = inputOf(canvasElement);
    const choose = canvas.getByRole("button", {
      name: t.chooseName(fileUploadFixtures[lang].label),
    });
    const opens = countOpens(input);
    await userEvent.tab();
    await expect(choose).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(choose).toHaveAttribute("aria-disabled", "true");
    await expect(choose).toHaveFocus();
    // Spec row 34 / design 17: the inert Button still draws its line, equal to focus.ring, with the halo.
    await expectFocusBorderForm(choose);
    await expect(choose).toHaveFocus();
    await expect(input).toBeDisabled();
    await userEvent.click(canvasElement.querySelector(".ds-field__label") as HTMLElement);
    await expect(opens.state.count).toBe(0);
    opens.stop();
    await expect(canvas.getByText(t.full)).toBeVisible();
    await expect(choose).toHaveAccessibleDescription(expect.stringContaining(t.full));
    await expect(zoneOf(canvasElement)).toHaveAttribute("data-full");
    await expect(canvas.getAllByRole("listitem")).toHaveLength(5);
    await expect(args.onFiles).not.toHaveBeenCalled();
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Full: Story = { args: { items: fullItems("th") }, play: playFull("th") };
export const FullInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label, items: fullItems("en") },
  play: playFull("en"),
};

// Row 16: disabled takes the picker, Try again and Remove out of reach.
const playDisabled =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = inputOf(canvasElement);
    const opens = countOpens(input);
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
    await userEvent.click(canvasElement.querySelector(".ds-field__label") as HTMLElement);
    await expect(opens.state.count).toBe(0);
    opens.stop();
    await expect(input).toBeDisabled();
    const buttons = canvas.getAllByRole("button");
    await expect(buttons).toHaveLength(3);
    for (const button of buttons) await expect(button).toBeDisabled();
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

/**
 * Text of an inactive control is exempt from the contrast minimum (WCAG 1.4.3), but axe cannot see
 * that the limits line belongs to the disabled input, so it is left out of the a11y scan here.
 */
const inactiveText = { a11y: { context: { exclude: [".ds-field__description"] } } };

export const Disabled: Story = {
  parameters: inactiveText,
  args: { disabled: true, items: failedItems("th") },
  play: playDisabled("th"),
};
export const DisabledInEnglish: Story = {
  parameters: inactiveText,
  decorators: english,
  args: { label: fileUploadFixtures.en.label, disabled: true, items: failedItems("en") },
  play: playDisabled("en"),
};

// Row 17: the caller's error sits under the zone, with the error edge.
const playInvalid =
  (lang: Lang): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const t = TEXT[lang];
    const canvas = within(canvasElement);
    const error = fileUploadFixtures[lang].error;
    await expect(canvas.getByRole("alert")).toHaveTextContent(error);
    await expect(
      canvas.getByRole("button", { name: t.chooseName(fileUploadFixtures[lang].label) }),
    ).toHaveAccessibleDescription(expect.stringContaining(error));
    await expect(zoneOf(canvasElement)).toHaveAttribute("data-invalid");
    await expect(inputOf(canvasElement)).toHaveAttribute("aria-invalid", "true");

    // A refused file adds its line after the caller's error and never replaces it.
    const input = inputOf(canvasElement);
    await pickFiles(input, [fileOf("logo.svg", 1000, "image/svg+xml")]);
    await waitFor(() => expect(rejectedLines(canvasElement)).toEqual([t.badType("logo.svg")]));
    const lines = Array.from(canvas.getByRole("alert").children).map((el) => el.textContent);
    await expect(lines).toEqual([error, t.badType("logo.svg")]);

    // A picker closed without a file sends an empty change, which leaves the lines as they were.
    fireEvent.change(input, { target: { files: [] } });
    await expect(rejectedLines(canvasElement)).toEqual([t.badType("logo.svg")]);
    if (lang === "en") await expect(THAI.test(canvasElement.textContent ?? "")).toBe(false);
  };

export const Invalid: Story = {
  args: { error: fileUploadFixtures.th.error },
  play: playInvalid("th"),
};
export const InvalidInEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label, error: fileUploadFixtures.en.error },
  play: playInvalid("en"),
};

/** One row of each status with the long names of `fixtures`, for a 360 px frame. */
const longItems = (lang: Lang): FileUploadItem[] => {
  const n = fileUploadFixtures.names;
  const [a, b, c] =
    lang === "th" ? [n.longThai, n.longLatin, n.longThai] : [n.longLatin, n.longLatin, n.longLatin];
  return [
    { id: "l1", name: a, size: BYTES, status: "uploading", progress: 40 },
    { id: "l2", name: b, size: fileUploadFixtures.missingSize, status: "done" },
    { id: "l3", name: c, size: BYTES, status: "failed", reason: fileUploadFixtures[lang].reason },
  ];
};

/**
 * `expectLinesClear` reads one screenshot at the device scale of the run, 1 in the test browser.
 * Chromium puts a Thai baseline on a whole pixel, and at 14 px with a 1.7 line height (23.8 px) two
 * lines are 24 px apart, or 23 when the clone's baseline falls between .5 and .7 of a pixel. Then
 * the gap reads 0 whatever the style, and which element it hits depends on how many 23.8 px lines
 * sit above it. This puts the clone's top on a whole pixel first (padding on `el`, or on a row
 * parent when `el` is a flex item in a row), so the helper reads the style's own gap, then puts the
 * padding back. The clone has the classes of `el`, not its inline style, so it keeps the same type.
 */
async function expectLinesClearAtWholePixel(el: HTMLElement) {
  const parent = el.parentElement as HTMLElement;
  const parentStyle = getComputedStyle(parent);
  const inRow = parentStyle.display.includes("flex") && parentStyle.flexDirection.startsWith("row");
  const carrier = inRow ? parent : el;
  const side = inRow ? "paddingTop" : "paddingBottom";
  const before = carrier.style[side];
  const topOfClone = () => {
    const probe = el.cloneNode(false) as HTMLElement;
    probe.textContent = "x";
    el.after(probe);
    const top = probe.getBoundingClientRect().top;
    probe.remove();
    return top;
  };
  const top = topOfClone();
  const base = parseFloat(getComputedStyle(carrier)[side]);
  carrier.style[side] = `${base + Math.ceil(top) - top}px`;
  try {
    await expectLinesClear(el);
  } finally {
    carrier.style[side] = before;
  }
}

// Row 20: long names wrap inside their rows, nothing clips, no mark is cut.
const play360: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const frame = within(canvasElement).getByTestId("frame");
  await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  // Every row sits inside the frame, and everything in a row (name, reason, bar, actions) sits
  // inside the row's box: the actions stay in the row and a long name wraps instead of spilling.
  const edge = frame.getBoundingClientRect();
  const rows = Array.from(frame.querySelectorAll<HTMLElement>(".ds-file-upload__item"));
  await expect(rows).toHaveLength(3);
  for (const row of rows) {
    const box = row.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(edge.left - 0.5);
    await expect(box.right).toBeLessThanOrEqual(edge.right + 0.5);
    for (const part of row.querySelectorAll<HTMLElement>("*")) {
      const inner = part.getBoundingClientRect();
      const name = `${part.localName}.${part.className}`;
      await expect(inner.left, `${name} starts outside its row`).toBeGreaterThanOrEqual(
        box.left - 0.5,
      );
      await expect(inner.right, `${name} ends outside its row`).toBeLessThanOrEqual(
        box.right + 0.5,
      );
      await expect(inner.bottom, `${name} ends below its row`).toBeLessThanOrEqual(
        box.bottom + 0.5,
      );
    }
  }
  const all = (selector: string) => Array.from(frame.querySelectorAll<HTMLElement>(selector));
  const texts = [
    ...all(".ds-progress__label"),
    ...all(".ds-file-upload__name"),
    ...all(".ds-file-upload__reason"),
    ...all(".ds-field__description"),
  ];
  await expect(all(".ds-progress__label")).toHaveLength(1);
  await expect(all(".ds-file-upload__name")).toHaveLength(2);
  await expect(all(".ds-file-upload__reason")).toHaveLength(1);
  await expect(all(".ds-field__description")).toHaveLength(1);
  await expect(all(".ds-file-upload__word")).toHaveLength(2);
  for (const text of [...texts, ...all(".ds-file-upload__word")]) {
    for (let el: HTMLElement | null = text; el; el = el === frame ? null : el.parentElement) {
      const style = getComputedStyle(el);
      await expect(style.overflowX, `${el.className || el.localName} clips on x`).toBe("visible");
      await expect(style.overflowY, `${el.className || el.localName} clips on y`).toBe("visible");
    }
  }
  if (inVitest) {
    for (const text of texts) await expectLinesClearAtWholePixel(text);
    for (const word of all(".ds-file-upload__word")) await expectLabelInkWhole(word);
    for (const selector of [
      ".ds-progress__label",
      ".ds-file-upload__name",
      ".ds-file-upload__reason",
      ".ds-file-upload__word",
    ]) {
      for (const el of all(selector)) {
        await expectFrameCutsNoInk(el, el.closest(".ds-file-upload__item") as HTMLElement);
      }
    }
    for (const el of all(".ds-field__description")) await expectFrameCutsNoInk(el, frame);
  }
};

const render360 = (args: FileUploadProps) => (
  <div data-testid="frame" className="w-[360px] max-w-full">
    <MockHost {...args} />
  </div>
);

export const At360: Story = { args: { items: longItems("th") }, render: render360, play: play360 };
export const At360InEnglish: Story = {
  decorators: english,
  args: { label: fileUploadFixtures.en.label, items: longItems("en") },
  render: render360,
  play: play360,
};

const noop = () => undefined;

/** Row 21: the zone, one uploading row, one done row and one failed row under every profile and mode. */
export const RecipesAndModes: Story = {
  render: () => (
    <Matrix>
      <FileUpload
        label={fileUploadFixtures.th.label}
        limits={IMAGE_UPLOAD_LIMITS}
        items={[
          {
            id: "m1",
            name: fixtures.thaiMarks2 + ".png",
            size: BYTES,
            status: "uploading",
            progress: 40,
          },
          { id: "m2", name: fileUploadFixtures.names.thai, size: BYTES, status: "done" },
          {
            id: "m3",
            name: fileUploadFixtures.names.thaiMarks,
            size: BYTES,
            status: "failed",
            reason: fileUploadFixtures.th.reason,
          },
        ]}
        onFiles={noop}
        onRetry={noop}
        onRemove={noop}
      />
    </Matrix>
  ),
  play: async ({ canvasElement }) => {
    const cells = Array.from(canvasElement.querySelectorAll<HTMLElement>("[data-matrix-cell]"));
    await expect(cells).toHaveLength(6);
    await expect(canvasElement.querySelectorAll(".ds-file-upload")).toHaveLength(6);
    for (const cell of cells) {
      await expect(cell.querySelectorAll(".ds-file-upload")).toHaveLength(1);
      await expect(cell.querySelectorAll("li")).toHaveLength(3);
    }
    const pairs = new Set(
      cells.map((c) => `${c.dataset["matrixProfile"]}-${c.dataset["matrixMode"]}`),
    );
    await expect(pairs.size).toBe(6);
  },
};
