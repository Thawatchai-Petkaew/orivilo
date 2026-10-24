import type { TaskJob } from "./task-bar/TaskBar";

/**
 * Fixture content every component story uses (DESIGN.md §4, rules §Components): Thai, Latin, a
 * long Thai name without spaces, and a missing value. One source so a story cannot drift to
 * content that hides a wrapping or parity defect.
 */
export const fixtures = {
  thai: "บันทึกการเปลี่ยนแปลง",
  latin: "Save changes",
  mixed: "โปรเจกต์ Brand Canvas ของทีม",
  /** No spaces: must wrap by `overflow-wrap: anywhere` or truncate with an ellipsis, never overflow. */
  longThai: "บริษัทพัฒนาซอฟต์แวร์เพื่อการออกแบบอัตลักษณ์แบรนด์และผลิตภัณฑ์ดิจิทัลจำกัดมหาชน",
  longLatin: "Anuphan-and-Plex-mixed-identifier-that-never-breaks-on-its-own-2026",
  /** A value the data did not supply; a component shows the placeholder or "ไม่มีข้อมูล", never a blank. */
  missing: undefined,
  missingLabel: "ไม่มีข้อมูล",
} as const;

export interface FixtureOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Six options, the count at which a Select beats a RadioGroup (DESIGN.md §6). */
export const fixtureOptions: readonly FixtureOption[] = [
  { value: "canvas", label: "Brand Canvas" },
  { value: "design-system", label: "Design System" },
  { value: "product", label: "ผลิตภัณฑ์" },
  { value: "review", label: "ตรวจสอบ" },
  { value: "long", label: fixtures.longThai },
  { value: "archived", label: "เก็บถาวรแล้ว", disabled: true },
];

/**
 * Task bar jobs (ORV-100): mock data for stories, one per state. A failed job's reason says what
 * went wrong and how to fix it. `nodeId` points at a node the story boards may not have.
 */
export const fixtureJobs = {
  queued: {
    id: "job-queued",
    name: "สร้างชุดสีหลัก",
    basis: "rules",
    state: "queued",
  },
  running: {
    id: "job-running",
    name: "ร่างโลโก้ทางเลือก",
    basis: "mock",
    state: "running",
    value: 40,
  },
  runningUnknown: {
    id: "job-running-unknown",
    name: "รวบรวมแนวทางแบรนด์",
    basis: "rules",
    state: "running",
  },
  done: {
    id: "job-done",
    name: "สรุปบรีฟลูกค้า",
    basis: "rules",
    state: "done",
    nodeId: "node-brief",
  },
  failed: {
    id: "job-failed",
    name: "สร้างหน้าแรก",
    basis: "mock",
    state: "failed",
    reason: "ไม่พบโลโก้ในบอร์ด เพิ่มโลโก้ในโหนดแบรนด์แล้วลองอีกครั้ง",
  },
  longName: {
    id: "job-long",
    name: fixtures.longThai,
    basis: "mock",
    state: "done",
  },
  longReason: {
    id: "job-failed-long",
    name: "สร้างคู่มือการใช้งานแบรนด์",
    basis: "rules",
    state: "failed",
    reason: `ข้อมูลที่ใช้สร้างไม่ครบ: ${fixtures.longThai} ยังไม่มีสีหลักและฟอนต์ ตั้งค่าทั้งสองอย่างในโหนดแบรนด์แล้วลองอีกครั้ง`,
  },
} as const satisfies Record<string, TaskJob>;

/** One job per state, newest first, the order a host would pass. */
export const fixtureTaskJobs: readonly TaskJob[] = [
  fixtureJobs.failed,
  fixtureJobs.running,
  fixtureJobs.queued,
  fixtureJobs.done,
];

/** The same four states with English names, for the English story. */
export const fixtureTaskJobsEn: readonly TaskJob[] = [
  {
    id: "job-failed",
    name: "Build the home page",
    basis: "mock",
    state: "failed",
    reason: "No logo found on the board. Add a logo to the brand node, then retry",
  },
  { id: "job-running", name: "Draft logo options", basis: "mock", state: "running", value: 40 },
  { id: "job-queued", name: "Build the main palette", basis: "rules", state: "queued" },
  { id: "job-done", name: "Summarise the client brief", basis: "rules", state: "done" },
];

/** Twelve jobs so the list has to scroll inside the bar. */
export const fixtureManyJobs: readonly TaskJob[] = Array.from({ length: 12 }, (_, i): TaskJob => ({
  id: `job-many-${i}`,
  name: `งานที่ ${i + 1}`,
  basis: "mock",
  state: "done",
}));
