import type { Intake } from "./intake";

/**
 * Hand-written fixtures for the `business-read` tests and the view tests (ORV-283). Fictional
 * business, no personal data. `FIXTURE_ANSWER` is written by hand in the shape the schema asks for:
 * it is not a recording of a model call (the recorded set is `eval/recorded.json`, run by the
 * owner). Thai word counts by `word-count-1`: the idea 22, the customers 11, the problem 12, the
 * industry 2, the competitors 10, so a reading on the idea alone is above the floor and one on the
 * problem, the industry or the competitors is below it.
 */
export const FIXTURE_INTAKE = {
  projectName: "ร้านกาแฟตัวอย่าง",
  idea: "บ้านสวนคอฟฟี่ ร้านกาแฟคั่วเองที่ขายเมล็ดกาแฟให้พนักงานออฟฟิศที่อยากดื่มกาแฟดีๆ ที่บ้าน",
  industry: "ร้านกาแฟ",
  customers: "พนักงานออฟฟิศอายุ 25 ถึง 40 ปีที่ทำงานในเมือง",
  problem: "กาแฟสำเร็จรูปรสไม่ดีและร้านกาแฟอยู่ไกลจากบ้าน",
  competitors: "สตาร์บัคส์ กาแฟกระป๋อง และร้านกาแฟหน้าปากซอย",
  value: "คั่วสดทุกสัปดาห์และส่งถึงบ้านภายในสองวัน",
  website: "https://baansuan.example/",
} as const satisfies Intake;

export const FIXTURE_INTAKE_ID = "11111111-1111-4111-8111-111111111111";
export const FIXTURE_SAVED_AT = "2026-11-18T03:04:05.000Z";

const q = (answer: string, text: string) => ({ answer, text });

export const FIXTURE_ANSWER = {
  readings: [
    {
      field: "situation.name",
      value: "บ้านสวนคอฟฟี่",
      quotes: [q("idea", "บ้านสวนคอฟฟี่")],
    },
    {
      field: "business-core.offer",
      value: "ร้านกาแฟคั่วเองที่ขายเมล็ดกาแฟ",
      quotes: [q("idea", "ร้านกาแฟคั่วเองที่ขายเมล็ดกาแฟ")],
    },
    {
      field: "business-core.why",
      value: "อยากดื่มกาแฟดีๆ ที่บ้าน",
      quotes: [q("idea", "อยากดื่มกาแฟดีๆ ที่บ้าน")],
    },
    {
      // A customer named in the idea, and again in the customers answer: two spans.
      field: "audience.customers",
      value: "พนักงานออฟฟิศ",
      quotes: [q("idea", "พนักงานออฟฟิศ"), q("customers", "พนักงานออฟฟิศอายุ 25 ถึง 40 ปี")],
    },
    {
      field: "audience.problem",
      value: "กาแฟสำเร็จรูปรสไม่ดี",
      quotes: [q("problem", "กาแฟสำเร็จรูปรสไม่ดี")],
    },
    {
      field: "competitive-frame.category",
      value: "ร้านกาแฟ",
      quotes: [q("industry", "ร้านกาแฟ")],
    },
    {
      field: "competitive-frame.alternatives",
      value: "สตาร์บัคส์",
      quotes: [q("competitors", "สตาร์บัคส์")],
    },
    {
      field: "competitive-frame.alternatives",
      value: "กาแฟกระป๋อง",
      quotes: [q("competitors", "กาแฟกระป๋อง")],
    },
  ],
} as const;
