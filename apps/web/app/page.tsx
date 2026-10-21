import { PROFILES } from "@orivilo/design-system";
import { designProfileSchema } from "@orivilo/intent-engine";

const schemaVersion = designProfileSchema.shape.schemaVersion.value;

/** What exists today, stated as it is (AGENTS.md rule 4). Each line names the story that made it real. */
const real = [
  {
    what: "Token ชั้น primitive, semantic, component พร้อม CSS ที่ generate และ test",
    story: "E2-1",
  },
  {
    what: `Profile ${PROFILES.length} ชุด (${PROFILES.join(", ")}) สลับได้ใน Storybook และตรวจ contrast ทุกคู่`,
    story: "E2-2",
  },
  { what: "Shell นี้ใช้ profile neutral และตามโหมดสีของเครื่อง", story: "E2-3" },
];

const notYet = [
  "Component ที่ใช้ร่วมกัน (ปุ่ม, ช่องกรอก, dialog) ยังไม่มี: E2-4 เป็นต้นไป",
  "Canvas และ node ของ Studio ยังไม่มี: epic E4",
  "การตีความ brief ยังไม่มี; เมื่อมาจะเป็นแบบกฎก่อนและบอกตามจริง: E2-10",
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-label-md text-text-secondary">
          <span aria-hidden="true" className="size-2 rounded-control bg-brand-signature" />
          ORIVILO
        </span>
        <h1 className="font-display text-display-md">
          จากเจตนาทางธุรกิจ สู่ผลิตภัณฑ์ดิจิทัลที่มีชีวิต
        </h1>
        <p className="max-w-prose text-body-lg text-text-secondary">
          Brand-to-Product Platform ที่ทุกชิ้นงานสืบย้อนไปถึงเหตุผลของมันได้
        </p>
      </header>

      <section aria-labelledby="real" className="flex flex-col gap-3">
        <h2 id="real" className="text-heading-sm">
          สิ่งที่มีจริงตอนนี้
        </h2>
        <ul className="flex flex-col gap-2">
          {real.map((item) => (
            <li
              key={item.story}
              className="flex gap-3 rounded-container border border-border-card bg-surface-card p-4"
            >
              <span className="shrink-0 font-mono text-label-sm whitespace-nowrap text-text-secondary">
                {item.story}
              </span>
              <span>{item.what}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="not-yet" className="flex flex-col gap-3">
        <h2 id="not-yet" className="text-heading-sm">
          สิ่งที่ยังไม่มี
        </h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-text-secondary">
          {notYet.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-body-sm text-text-secondary">
          Design Profile schema v{schemaVersion}. แผนงานทั้งหมดอยู่ใน{" "}
          <a
            className="text-text-link underline-offset-4 hover:text-text-link-hover hover:underline"
            href="https://github.com/Thawatchai-Petkaew/orivilo/blob/main/docs/specs/backlog-draft.md"
          >
            backlog draft
          </a>
        </p>
      </section>
    </main>
  );
}
