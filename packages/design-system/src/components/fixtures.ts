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
