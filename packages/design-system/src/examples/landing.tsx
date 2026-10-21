import { Badge, Button, Card, CardTitle } from "../components/index";

/**
 * Marketing tier page example (E2-7): a landing page composed from Base and Application
 * components only, because no marketing section component exists yet (`coverage.md`). Nothing
 * on it claims evidence the product does not have: no testimonial, logo, rating, count or price.
 */
const MODULES = [
  { name: "Discover", text: "เก็บเจตนาทางธุรกิจและข้อจำกัดให้เป็นบรีฟที่ตรวจได้" },
  { name: "Brand", text: "ตัวตนของแบรนด์เป็นชุดการตัดสินใจที่มีเหตุผลกำกับ" },
  {
    name: "Design System",
    text: "token, profile และ component ที่พิสูจน์แล้วว่าทุก state ยังอยู่",
  },
  { name: "Product", text: "หน้าจอจริงจาก component เดิม ภายใต้ profile ที่เลือก" },
  { name: "Build", text: "โค้ดที่ส่งมอบได้ ไม่ใช่ภาพนิ่ง" },
  { name: "Review", text: "ทุกชิ้นงานสืบย้อนไปถึงบรีฟและการตัดสินใจที่สร้างมัน" },
] as const;

const STEPS = [
  {
    title: "เล่าเจตนา",
    text: "บรีฟสั้น ๆ ว่าแบรนด์อยากให้คนรู้สึกอย่างไร และอะไรห้ามเปลี่ยน",
    label: undefined,
  },
  {
    title: "ตีความเป็นทิศทาง",
    text: "ระบบเสนอสองทิศทางจากกฎที่เขียนไว้ พร้อมเหตุผลของแต่ละค่า",
    label: "แบบกฎก่อน",
  },
  {
    title: "ได้ระบบออกแบบที่ใช้ได้จริง",
    text: "profile, token และหน้าจอตัวอย่างที่ทีมนำไปสร้างต่อได้ทันที",
    label: undefined,
  },
] as const;

export function Landing() {
  return (
    <div className="@container flex min-h-dvh w-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <a href="#top" className="flex items-center gap-2 text-label-md text-text-primary">
          <span aria-hidden="true" className="size-2 rounded-check bg-brand-signature" />
          ORIVILO
        </a>
        <nav aria-label="หลัก">
          <ul className="m-0 flex list-none gap-5 p-0 text-body-md">
            <li>
              <a href="#modules" className="text-text-secondary hover:text-text-primary">
                โมดูล
              </a>
            </li>
            <li>
              <a href="#how" className="text-text-secondary hover:text-text-primary">
                วิธีทำงาน
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <div id="top" className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-12">
        <section aria-labelledby="hero-title" className="flex max-w-3xl flex-col gap-6">
          <h1 id="hero-title" className="font-display text-display-lg text-balance">
            จากเจตนาทางธุรกิจ สู่ผลิตภัณฑ์ดิจิทัลที่มีชีวิต
          </h1>
          <p className="max-w-prose text-body-lg text-text-secondary">
            ORIVILO เปลี่ยนบรีฟของแบรนด์ให้เป็นระบบออกแบบและหน้าจอที่ใช้งานได้จริง
            โดยทุกชิ้นงานสืบย้อนไปถึงเหตุผลของมันได้
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="lg">
              เริ่มจากบรีฟของคุณ
            </Button>
            <Button variant="ghost" size="lg">
              ดูวิธีทำงาน
            </Button>
          </div>
        </section>

        <section id="modules" aria-labelledby="modules-title" className="flex flex-col gap-6">
          <h2 id="modules-title" className="text-heading-md text-balance">
            หกโมดูล หนึ่งเส้นทาง
          </h2>
          <ul className="m-0 grid list-none gap-4 p-0 @xl:grid-cols-2 @3xl:grid-cols-3">
            {MODULES.map((module) => (
              <Card as="li" key={module.name}>
                <CardTitle>{module.name}</CardTitle>
                <p className="text-text-secondary">{module.text}</p>
              </Card>
            ))}
          </ul>
        </section>

        <section id="how" aria-labelledby="how-title" className="flex flex-col gap-6">
          <h2 id="how-title" className="text-heading-md text-balance">
            ทำงานอย่างไร
          </h2>
          <ol className="m-0 flex max-w-3xl list-decimal flex-col gap-4 ps-6">
            {STEPS.map((step) => (
              <li key={step.title} className="flex flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2 text-heading-sm">
                  {step.title}
                  {step.label ? <Badge size="sm">{step.label}</Badge> : null}
                </span>
                <span className="max-w-prose text-body-md text-text-secondary">{step.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="mx-auto mt-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 border-t border-border-subtle px-6 py-6 text-body-sm text-text-secondary">
        <span>ORIVILO, 2026</span>
        <a
          href="https://github.com/Thawatchai-Petkaew/orivilo"
          className="text-text-link underline-offset-4 hover:text-text-link-hover hover:underline"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
