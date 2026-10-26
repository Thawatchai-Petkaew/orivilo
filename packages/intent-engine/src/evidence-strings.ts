/** Every key under the ORV-128 spec "Strings", Thai and English, word for word. Row 29 reads all of them. */
export const EVIDENCE_STRINGS = {
  // labels on an item
  "evidence.fromModel": {
    th: "AI อ่านค่านี้ ({model}) โปรดตรวจสอบก่อนนำไปใช้",
    en: "Read by AI ({model}). Check it before you use it.",
  },
  "evidence.measured": {
    th: "วัดจากข้อมูลที่คุณให้มา",
    en: "Measured from what you gave us",
  },
  "evidence.belowFloor": {
    th: "ยังไม่แน่ชัดพอจะนำไปใช้: {reason}",
    en: "Too uncertain to use: {reason}",
  },
  // questions (also in QUESTION_KEYS)
  "evidence.conflict": {
    th: "ข้อมูลที่คุณให้มาชี้ไปสองทางในเรื่อง{subject} แบบไหนใกล้กับแบรนด์ของคุณมากกว่า",
    en: "Your inputs point two ways on {subject}. Which is closer to your brand?",
  },
  "evidence.toolDefault": {
    th: "ค่านี้ดูเหมือนเป็นค่าเริ่มต้นของเครื่องมือที่สร้างหน้านี้ คุณเลือกเอง หรือให้เราตัดออกไปก่อน",
    en: "This looks like a default of the tool that made the page. Did you choose it, or should we set it aside?",
  },
  "evidence.similarTo": {
    th: "ค่านี้ใกล้เคียงกับสีของ {brand} หากใช้ แบรนด์ของคุณอาจดูคล้ายแบรนด์นั้น",
    en: "This is close to the colours of {brand}. Using it may make your brand look like theirs.",
  },
  "culture.yellow": {
    th: "ในไทย สีเหลืองมักถูกเชื่อมโยงกับสถาบันพระมหากษัตริย์ คนอาจมองแบรนด์ของคุณในแง่นี้ ยังคงใช้สีนี้ไหม",
    en: "In Thailand, yellow is widely linked with the monarchy, so people may read your brand that way. Keep it?",
  },
  "culture.political": {
    th: "ในไทย สีแดงหรือสีเหลืองที่ใช้เพียงสีเดียวเคยเป็นสัญลักษณ์ของกลุ่มการเมืองตั้งแต่ปี 2548 บางคนอาจมองแบรนด์ของคุณในแง่นี้ ยังคงใช้สีนี้ไหม",
    en: "In Thailand, red or yellow used alone has stood for political movements since 2005, so some people may read your brand that way. Keep it?",
  },
  "industry.confirm": {
    th: "ข้อใดใกล้เคียงกับธุรกิจของคุณที่สุด",
    en: "Which of these is closest to your business?",
  },
  // report lines
  "industry.byNameOnly": {
    th: "ประเภทธุรกิจจับคู่จากชื่อใน TSIC เท่านั้น จึงอาจพลาดคำที่ใช้กันทั่วไป",
    en: "Business type is matched by TSIC names only, so everyday words may be missed.",
  },
  "report.conflictsNotChecked": {
    th: "ยังไม่ได้ตรวจว่าผลการอ่านขัดแย้งกันหรือไม่",
    en: "Readings that disagree are not checked yet.",
  },
  // refusals and the not-measured line
  "read.refused.robots": {
    th: "เว็บไซต์นี้ขอไม่ให้โปรแกรมอัตโนมัติอ่านหน้านี้ เราจึงไม่ได้อ่าน",
    en: "This site asks automated readers not to read this page, so we did not read it.",
  },
  "read.refused.address": {
    th: "เราอ่านได้เฉพาะที่อยู่เว็บสาธารณะเท่านั้น",
    en: "We can read only public web addresses.",
  },
  "read.notRead.competitor": {
    th: "หน้านี้เป็นของคู่แข่ง เราจึงเก็บไว้เพียงที่อยู่เว็บและไม่ได้อ่าน การอ่านหน้าเว็บของคู่แข่งต้องรอการตรวจสอบทางกฎหมายก่อน",
    en: "This is a competitor's page, so we kept its address and did not read it. Reading competitor pages waits for a legal review.",
  },
  "read.notMeasured": {
    th: "ไม่ได้วัด: {what} เพราะไม่ได้แสดงผลหน้าเว็บ ({reason})",
    en: "Not measured: {what}. The page was not rendered ({reason}).",
  },
  // reason no-renderer
  "read.notRendered.none": {
    th: "ยังไม่ได้ตั้งค่าตัวแสดงผล",
    en: "no renderer is set up",
  },
  // reason render-failed
  "read.notRendered.failed": {
    th: "ตัวแสดงผลเริ่มทำงานไม่สำเร็จ",
    en: "the renderer did not start",
  },
  // reason render-budget
  "read.notRendered.budget": {
    th: "หน้าเว็บใช้เวลานานเกินไป",
    en: "the page took too long",
  },
  // reason snapshot-invalid
  "read.notRendered.invalid": {
    th: "ใช้ผลจากตัวแสดงผลไม่ได้",
    en: "the renderer's result could not be used",
  },
  // reasons below the floor
  "quality.fewWords": {
    th: "ข้อความมีไม่ถึง 20 คำ",
    en: "the text has fewer than 20 words",
  },
  "quality.pageIncomplete": {
    th: "บางส่วนของหน้าเว็บโหลดไม่สำเร็จ",
    en: "part of the page did not load",
  },
  "quality.imageSmall": {
    th: "ภาพมีด้านสั้นไม่ถึง 512 พิกเซล",
    en: "the image is under 512 px on its short side",
  },
  "quality.imageBlurred": {
    th: "ภาพไม่คมชัด",
    en: "the image is blurred",
  },
} as const satisfies Record<string, { th: string; en: string }>;

/** The keys a flag's questionId may hold (spec row 29). A subset of EVIDENCE_STRINGS. */
export const QUESTION_KEYS = [
  "evidence.conflict",
  "evidence.toolDefault",
  "evidence.similarTo",
  "culture.yellow",
  "culture.political",
  "industry.confirm",
] as const;
