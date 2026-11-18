/**
 * The six ORV-126 proxy questions the business intake asks or lists as still to ask (ORV-281 tech
 * notes section 4). ORV-126 "Missing strategy" is the home of the copy, and `questions.test.ts`
 * fails when a line here differs from it.
 */
export const PROXY_QUESTIONS = [
  {
    id: "business-core.proxy.offer",
    key: "business.question.offer",
    en: "What do you sell or offer, and to whom?",
    th: "คุณขายหรือให้บริการอะไร และให้ใคร",
  },
  {
    id: "business-core.proxy.why",
    key: "business.question.why",
    en: "Why did you start this? One or two sentences is enough.",
    th: "ทำไมคุณถึงเริ่มทำสิ่งนี้ ตอบสั้น ๆ หนึ่งหรือสองประโยคก็พอ",
  },
  {
    id: "audience.proxy.best-customer",
    key: "business.question.bestCustomer",
    en: "Describe one customer you would like ten more of.",
    th: "เล่าถึงลูกค้าหนึ่งคนที่คุณอยากได้แบบนี้เพิ่มอีกสิบคน",
  },
  {
    id: "audience.proxy.problem",
    key: "business.question.problem",
    en: "What problem were they trying to solve when they found you?",
    th: "ตอนที่เขาเจอคุณ เขากำลังพยายามแก้ปัญหาอะไรอยู่",
  },
  {
    id: "competitive-frame.proxy.instead",
    key: "business.question.instead",
    en: "When a customer does not choose you, who or what do they choose instead?",
    th: "เมื่อลูกค้าไม่เลือกคุณ เขาเลือกใครหรืออะไรแทน",
  },
  {
    id: "positioning.proxy.only",
    key: "business.question.only",
    en: "What does a customer get from you that they cannot get from those alternatives?",
    th: "ลูกค้าได้อะไรจากคุณที่หาไม่ได้จากตัวเลือกอื่นเหล่านั้น",
  },
] as const;

export type ProxyQuestion = (typeof PROXY_QUESTIONS)[number];
export type ProxyQuestionId = ProxyQuestion["id"];
