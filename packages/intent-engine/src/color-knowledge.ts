import { knowledgeEntrySchema, type KnowledgeEntry } from "./knowledge";

/**
 * What the color node knows (ORV-20, ADR 0005). Ten entries in our own words, Thai and English,
 * drawn from the team's brand CI method (§3 and §5) and the brand spec v1.1. Status is `draft`:
 * nobody has verified them yet, so `freshness` reports them as unverified. The thresholds and
 * the preference order are hypotheses (confidence at most 0.4), not findings.
 */

const method = (title: string) => ({ kind: "team", title, license: "own-words" }) as const;

type Draft = Pick<KnowledgeEntry, "id" | "kind" | "statement" | "do" | "avoid" | "severity"> &
  Pick<KnowledgeEntry, "keywords" | "sources" | "confidence" | "confidenceBasis" | "relations">;

const entry = (draft: Draft): KnowledgeEntry =>
  knowledgeEntrySchema.parse({
    schemaVersion: "1.0",
    version: 1,
    status: "draft",
    appliesTo: { topics: ["color"], industries: [], audiences: [], personality: {} },
    verifiedAt: null,
    verifiedBy: null,
    ...draft,
  });

export const COLOR_KNOWLEDGE: readonly KnowledgeEntry[] = [
  entry({
    id: "color.audit-the-category",
    kind: "principle",
    statement: {
      th: "บันทึกสีเด่นของคู่แข่งแต่ละราย กลุ่มสีที่แออัดคือสิ่งที่ต้องเลี่ยงสำหรับสีลายเซ็น ช่องว่างคือที่ที่ความแตกต่างได้มาง่าย",
      en: "Record each competitor's dominant hue. The crowd is what to avoid for the signature; the gap is where distinctiveness is cheap.",
    },
    do: [
      {
        th: "ตรวจกลุ่มคู่แข่งในหมวดก่อนเลือกสีลายเซ็น",
        en: "Audit the category lineup before picking the signature hue.",
      },
    ],
    avoid: [
      {
        th: "เลือกสีลายเซ็นตามรสนิยมอย่างเดียวโดยไม่ดูหมวด",
        en: "Pick the signature from taste alone, without looking at the category.",
      },
    ],
    severity: "should",
    keywords: ["category audit", "hue", "competitors", "distinctiveness"],
    sources: [
      method("brand-ci-method.md §5.1"),
      {
        kind: "article",
        title: "How to choose brand colors",
        url: "https://madegooddesigns.com/how-to-choose-brand-colors",
        license: "link-only",
      },
    ],
    confidence: 0.6,
    confidenceBasis: "single-source",
    relations: [],
  }),
  entry({
    id: "color.hue-families",
    kind: "guideline",
    statement: {
      th: "แบ่งวงสีเป็นสิบช่วงตามมุม HSL และแยกค่าไร้สีออกมา หากมีสองรายการในช่วงเดียวกัน ช่วงนั้นถือว่าแออัด",
      en: "Ten HSL hue bands plus an achromatic split. Two lineup entries in one band make it crowded.",
    },
    do: [
      {
        th: "จัดสีของคู่แข่งแต่ละรายเข้าช่วงสีหนึ่งช่วงก่อนนับความแออัด",
        en: "Classify each lineup color into one band before counting the crowd.",
      },
    ],
    avoid: [{ th: "เทียบเฉดสีด้วยตา", en: "Compare hues by eye." }],
    severity: "should",
    keywords: ["hue", "HSL", "bands", "crowded"],
    sources: [method("ORV-20 spec, category audit")],
    confidence: 0.3,
    confidenceBasis: "hypothesis",
    relations: [{ type: "supports", to: "color.audit-the-category" }],
  }),
  entry({
    id: "color.roles-before-values",
    kind: "principle",
    statement: {
      th: "กำหนดบทบาทก่อนค่าสี ได้แก่ พื้นหลัง หมึก สีลายเซ็นหนึ่งสี สีปุ่มหลัก สีกลาง และสีสถานะ โหมดมืดเป็นส่วนของจานสี และสีลายเซ็นคงเดิม",
      en: "Roles first: canvas, ink, one signature, one action, neutrals, feedback. Dark mode is part of the palette and the signature stays the same.",
    },
    do: [
      {
        th: "ตั้งชื่อบทบาทก่อนเลือกค่าสี และออกแบบสองโหมดไปพร้อมกัน",
        en: "Name the role before choosing its value, and design both modes together.",
      },
    ],
    avoid: [
      {
        th: "เลือกสีก่อนแล้วค่อยหางานให้สีนั้น",
        en: "Choose a color first and find a job for it afterwards.",
      },
    ],
    severity: "should",
    keywords: ["roles", "palette", "dark mode", "signature"],
    sources: [method("brand-ci-method.md §5.2 and §5.6")],
    confidence: 0.6,
    confidenceBasis: "single-source",
    relations: [],
  }),
  entry({
    id: "color.expressive-signature",
    kind: "guideline",
    statement: {
      th: "แบรนด์ที่มีความโดดเด่น 55 ขึ้นไปใช้สีลายเซ็นสว่างและสดจัดที่รองรับตัวอักษรสีเข้ม ต่ำกว่า 55 ใช้สีลายเซ็นเข้มที่รองรับตัวอักษรสีอ่อน",
      en: "Expressive 55 or more takes one light, high-chroma signature that carries ink. Under 55, a deep signature that carries paper.",
    },
    do: [
      {
        th: "ดูแกนความโดดเด่นเพื่อเลือกสีลายเซ็นแบบสว่างหรือแบบเข้ม",
        en: "Read the expressive axis to choose a light or a deep signature.",
      },
    ],
    avoid: [
      {
        th: "ใช้สีลายเซ็นเข้มกับแบรนด์ที่โดดเด่นสูงโดยไม่มีเหตุผล",
        en: "Put a deep signature on a high-expressive brand without a reason.",
      },
    ],
    severity: "may",
    keywords: ["expressive", "signature", "light", "deep"],
    sources: [method("brand-ci-method.md §3 (expressive row)")],
    confidence: 0.3,
    confidenceBasis: "hypothesis",
    relations: [{ type: "supports", to: "color.roles-before-values" }],
  }),
  entry({
    id: "color.light-chroma-gamut",
    kind: "principle",
    statement: {
      th: "ใน sRGB สีสดจัดที่สว่างมีอยู่เฉพาะช่วงเหลืองถึงฟ้าอมเขียว สีลายเซ็นสว่างสดจัดจึงมาจากช่วงนี้",
      en: "In sRGB, high chroma at high lightness exists only from yellow to cyan, so a light high-chroma signature comes from that arc.",
    },
    do: [
      {
        th: "เลือกสีลายเซ็นสว่างจากช่วงเหลืองถึงฟ้าอมเขียว",
        en: "Take a light signature from the yellow to cyan arc.",
      },
    ],
    avoid: [
      {
        th: "ขอสีน้ำเงินหรือม่วงที่สว่างและสดแล้วหวังว่าหน้าจอจะแสดงได้",
        en: "Ask for a light, vivid blue or violet and expect the screen to show it.",
      },
    ],
    severity: "should",
    keywords: ["gamut", "chroma", "sRGB", "OKLCH"],
    sources: [
      {
        kind: "article",
        title: "CSS Color Module Level 4",
        url: "https://www.w3.org/TR/css-color-4/",
        license: "link-only",
      },
    ],
    confidence: 0.6,
    confidenceBasis: "single-source",
    relations: [{ type: "refines", to: "color.expressive-signature" }],
  }),
  entry({
    id: "color.warm-leans-hue",
    kind: "guideline",
    statement: {
      th: "ความอบอุ่น 50 ขึ้นไปเลือกตัวเลือกที่อุ่นกว่า (เขียวมะนาวก่อนฟ้าอมเขียว ม่วงแดงก่อนเขียวน้ำทะเล) และเลื่อนสีกลาง: 25 ลงไปเย็น 75 ขึ้นไปอุ่น ช่วงกลางใกล้เป็นกลาง",
      en: "Warm 50 or more prefers the warmer candidate (lime over cyan, magenta over teal). Warm also moves neutrals: 25 or less cool, 75 or more warm, near in between.",
    },
    do: [
      {
        th: "ให้แกนความอบอุ่นเรียงตัวเลือกสีลายเซ็นและเลือกกลุ่มสีกลาง",
        en: "Let the warm axis order the signature candidates and pick the neutral family.",
      },
    ],
    avoid: [
      {
        th: "ใช้สีกลางโทนอุ่นกับแบรนด์ที่ได้คะแนนโทนเย็น",
        en: "Use warm neutrals for a brand that scored cool.",
      },
    ],
    severity: "may",
    keywords: ["warm", "neutral", "lime", "magenta"],
    sources: [method("brand-ci-method.md §3 (warm row)")],
    confidence: 0.3,
    confidenceBasis: "hypothesis",
    relations: [],
  }),
  entry({
    id: "color.premium-canvas",
    kind: "guideline",
    statement: {
      th: "ความพรีเมียม 60 ขึ้นไปใช้พื้นหลังออฟไวต์นุ่มใต้การ์ดสีขาว ต่ำกว่า 60 ใช้พื้นหลังสีขาวสว่าง",
      en: "Premium 60 or more takes a soft off-white canvas under white cards. Under 60, a bright white canvas.",
    },
    do: [{ th: "เลือกพื้นหลังจากแกนความพรีเมียม", en: "Choose the canvas from the premium axis." }],
    avoid: [
      {
        th: "ผสมพื้นหลังนุ่มกับพื้นหลังสว่างในจานสีเดียว",
        en: "Mix a soft canvas and a bright canvas in one palette.",
      },
    ],
    severity: "may",
    keywords: ["premium", "canvas", "off-white"],
    sources: [method("brand-ci-method.md §3 (premium row)")],
    confidence: 0.3,
    confidenceBasis: "hypothesis",
    relations: [],
  }),
  entry({
    id: "color.semantics-separate",
    kind: "guideline",
    statement: {
      th: "สีสำเร็จ เตือน อันตราย ข้อมูล การเลือก และโฟกัส ต้องไม่ใช้สีแบรนด์ โหนดสีไม่กำหนดสีสถานะหรือโฟกัส",
      en: "Success, warning, danger, info, selection and focus are never the brand accent. The color node never sets feedback or focus.",
    },
    do: [
      {
        th: "ให้สีสถานะ การเลือก และโฟกัส ใช้ค่าของตัวเอง",
        en: "Keep feedback, selection and focus on their own values.",
      },
    ],
    avoid: [
      {
        th: "ใช้สีลายเซ็นกับข้อผิดพลาดหรือคำเตือน",
        en: "Use the signature color for an error or a warning.",
      },
    ],
    severity: "must",
    keywords: ["semantic", "feedback", "focus", "selection"],
    sources: [method("brand-ci-method.md §5.4"), method("DESIGN.md §8")],
    confidence: 0.7,
    confidenceBasis: "single-source",
    relations: [],
  }),
  entry({
    id: "color.action-is-functional",
    kind: "principle",
    statement: {
      th: "สีปุ่มหลักวัดจากความเข้มต่างและความแยกจากสีลายเซ็นและสีสถานะ ไม่ใช่จากช่องว่างของหมวด แต่ละชุดสีลายเซ็นจับคู่สีปุ่มหลักใกล้ฝั่งตรงข้ามของสีลายเซ็น",
      en: "The action color is judged on contrast and on separation from the signature and feedback, not on the category gap. Each signature set pairs it near the signature's opposite hue.",
    },
    do: [
      {
        th: "เทียบสีปุ่มหลักกับสีลายเซ็นและสีสถานะ",
        en: "Check the action color against the signature and against feedback.",
      },
    ],
    avoid: [{ th: "ตรวจหมวดเพื่อเลือกสีปุ่มหลัก", en: "Audit the category for the action color." }],
    severity: "should",
    keywords: ["action", "button", "contrast", "separation"],
    sources: [method("orivilo-brand-spec-v1.1.md §5 (owner-approved hypothesis)")],
    confidence: 0.3,
    confidenceBasis: "hypothesis",
    relations: [],
  }),
  entry({
    id: "color.contrast-computed",
    kind: "guideline",
    statement: {
      th: "ตัวอักษรต้องมีอัตราส่วนความเข้ม 4.5 ต่อ 1 ขอบของตัวควบคุม 3 ต่อ 1 ทั้งสองโหมด คำนวณด้วยสคริปต์ ไม่ตัดสินด้วยตา",
      en: "Text 4.5:1, control boundaries 3:1, in both modes, computed by script and not judged by eye.",
    },
    do: [
      {
        th: "คำนวณทุกคู่สีของตัวอักษรและตัวควบคุมทั้งโหมดสว่างและมืด",
        en: "Compute every text and control pair in light and dark.",
      },
    ],
    avoid: [
      { th: "อนุมัติคู่สีเพียงเพราะดูอ่านออก", en: "Approve a pair because it looks readable." },
    ],
    severity: "must",
    keywords: ["contrast", "WCAG", "4.5:1", "3:1"],
    sources: [
      method("brand-ci-method.md §5.5"),
      {
        kind: "article",
        title: "WCAG 2.2, 1.4.3 Contrast (Minimum)",
        url: "https://www.w3.org/TR/WCAG22/#contrast-minimum",
        license: "link-only",
      },
      {
        kind: "article",
        title: "WCAG 2.2, 1.4.11 Non-text Contrast",
        url: "https://www.w3.org/TR/WCAG22/#non-text-contrast",
        license: "link-only",
      },
    ],
    confidence: 0.85,
    confidenceBasis: "multiple-sources",
    relations: [],
  }),
];

export const COLOR_KNOWLEDGE_IDS: readonly string[] = COLOR_KNOWLEDGE.map((e) => e.id);
