/**
 * The ORV-126 proxy questions the business intake asks or lists as still to ask (ORV-281 tech
 * notes section 4), and the two of Brand personality (ORV-291, `identity-frame-1`). ORV-126 "Missing strategy" is the home of the copy, and `questions.test.ts`
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
  {
    id: "identity-frame.proxy.person",
    key: "business.question.person",
    en: "If your brand were a person, which three words would people use to describe them?",
    th: "ถ้าแบรนด์ของคุณเป็นคนคนหนึ่ง คนอื่นจะใช้คำสามคำใดบรรยายเขา",
  },
  {
    id: "identity-frame.proxy.never",
    key: "business.question.never",
    en: "How should your brand never feel?",
    th: "แบรนด์ของคุณไม่ควรให้ความรู้สึกแบบไหน",
  },
] as const;

export type ProxyQuestion = (typeof PROXY_QUESTIONS)[number];
export type ProxyQuestionId = ProxyQuestion["id"];

/**
 * The ORV-126 start question the Brand architecture view asks (ORV-291, `architecture-derive-1`;
 * ORV-126 "The start question" is the home of the copy). Not a proxy question: it is an input of
 * `situation`, so it stays out of `PROXY_QUESTIONS`.
 */
export const START_QUESTIONS = [
  {
    id: "situation.sub-brands",
    key: "business.question.subBrands",
    en: "Does this brand sit above or below other brands?",
    th: "แบรนด์นี้อยู่เหนือหรืออยู่ใต้แบรนด์อื่นหรือไม่",
  },
] as const;
