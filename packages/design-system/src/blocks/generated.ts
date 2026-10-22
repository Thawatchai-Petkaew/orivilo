// Generated from catalog/blocks/mvp.yaml by scripts/build-blocks.ts.
// Do not edit: run `pnpm --filter @orivilo/design-system blocks`.

export const BLOCK_REGISTRY_VERSION = 1;

export const BLOCK_MODULES = {
  "brand": { th: "แบรนด์", en: "Brand" },
  "design-system": { th: "ระบบออกแบบ", en: "Design system" },
} as const;

export const BLOCKS = [
  {
    id: "reference-images",
    kind: "source",
    module: "design-system",
    name: { th: "ภาพอ้างอิง", en: "Reference images" },
    output: "palette",
    inputs: [
      {
        id: "images",
        required: true,
        answer: "images",
        label: { th: "ภาพ", en: "Images" },
        question: { th: "มีภาพที่ชอบหรืออยากให้ใกล้เคียงไหม", en: "Which images do you like or want to be close to?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["starter-colours"],
  },
  {
    id: "screenshot",
    kind: "source",
    module: "design-system",
    name: { th: "ภาพหน้าจอ", en: "Screenshot" },
    output: "palette",
    inputs: [
      {
        id: "images",
        required: true,
        answer: "images",
        label: { th: "ภาพหน้าจอ", en: "Screenshots" },
        question: { th: "มีหน้าจอที่แคปมาจากแอปหรือเว็บไหนไหม", en: "Do you have screenshots from an app or a site?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["starter-colours"],
  },
  {
    id: "sample-website",
    kind: "source",
    module: "design-system",
    name: { th: "เว็บไซต์ตัวอย่าง", en: "Sample website" },
    output: "palette",
    inputs: [
      {
        id: "screenshot",
        required: true,
        answer: "images",
        label: { th: "ภาพหน้าเว็บ", en: "Page screenshot" },
        question: { th: "แคปหน้าเว็บตัวอย่างมาให้ดูหน่อย", en: "Upload a screenshot of the sample site" },
        from: [],
        options: [
        ],
      },
      {
        id: "link",
        required: false,
        answer: "url",
        label: { th: "ลิงก์", en: "Link" },
        question: { th: "ลิงก์ของเว็บนี้คืออะไร เก็บไว้เป็นที่มา", en: "What is the site's link? It is kept as the source" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["starter-colours"],
  },
  {
    id: "typed-colours",
    kind: "source",
    module: "design-system",
    name: { th: "สีที่พิมพ์มา", en: "Typed colours" },
    output: "palette",
    inputs: [
      {
        id: "colours",
        required: true,
        answer: "colours",
        label: { th: "สี", en: "Colours" },
        question: { th: "มีสีที่ใช้อยู่แล้วไหม พิมพ์รหัสสีมาได้เลย", en: "Any colours you already use? Type their hex codes" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["starter-colours"],
  },
  {
    id: "existing-logo",
    kind: "source",
    module: "brand",
    name: { th: "โลโก้ที่มีอยู่", en: "Existing logo" },
    output: "palette",
    inputs: [
      {
        id: "file",
        required: true,
        answer: "images",
        label: { th: "ไฟล์โลโก้", en: "Logo file" },
        question: { th: "มีไฟล์โลโก้ที่ใช้อยู่ไหม", en: "Do you have the logo file you use now?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["starter-colours"],
  },
  {
    id: "brief",
    kind: "source",
    module: "brand",
    name: { th: "บรีฟ", en: "Brief" },
    output: "text",
    inputs: [
      {
        id: "product",
        required: true,
        answer: "text",
        label: { th: "ผลิตภัณฑ์", en: "Product" },
        question: { th: "ผลิตภัณฑ์นี้คืออะไร", en: "What is the product?" },
        from: [],
        options: [
        ],
      },
      {
        id: "goal",
        required: true,
        answer: "long-text",
        label: { th: "เป้าหมาย", en: "Goal" },
        question: { th: "อยากให้ผลิตภัณฑ์นี้ช่วยใครทำอะไรได้", en: "Who should it help" },
        from: [],
        options: [
        ],
      },
      {
        id: "industry",
        required: false,
        answer: "text",
        label: { th: "อุตสาหกรรม", en: "Industry" },
        question: { th: "อยู่ในอุตสาหกรรมไหน", en: "Which industry is it in?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["audience"],
  },
  {
    id: "brand-personality",
    kind: "source",
    module: "brand",
    name: { th: "บุคลิกแบรนด์", en: "Brand personality" },
    output: "text",
    inputs: [
      {
        id: "traits",
        required: true,
        answer: "text",
        label: { th: "บุคลิก", en: "Traits" },
        question: { th: "ถ้าแบรนด์เป็นคน จะเป็นคนแบบไหน บอกมาสามคำ", en: "If the brand were a person" },
        from: [],
        options: [
        ],
      },
      {
        id: "avoid",
        required: false,
        answer: "text",
        label: { th: "ไม่อยากให้เป็น", en: "Not this" },
        question: { th: "มีอะไรที่ไม่อยากให้แบรนด์เป็นไหม", en: "Anything the brand should never feel like?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["mood-theme"],
  },
  {
    id: "platform-languages",
    kind: "source",
    module: "design-system",
    name: { th: "แพลตฟอร์มและภาษา", en: "Platform and languages" },
    output: "text",
    inputs: [
      {
        id: "platform",
        required: true,
        answer: "choice",
        label: { th: "แพลตฟอร์ม", en: "Platform" },
        question: { th: "ใช้บนแพลตฟอร์มไหน", en: "Which platform is it for?" },
        from: [],
        options: [
          { id: "web", th: "เว็บ", en: "Web" },
          { id: "mobile", th: "แอปมือถือ", en: "Mobile app" },
          { id: "both", th: "ทั้งเว็บและแอป", en: "Web and app" },
        ],
      },
      {
        id: "languages",
        required: true,
        answer: "choice",
        label: { th: "ภาษา", en: "Languages" },
        question: { th: "ต้องรองรับภาษาไหน", en: "Which languages must it support?" },
        from: [],
        options: [
          { id: "th-en", th: "ไทยและอังกฤษ", en: "Thai and English" },
          { id: "th", th: "ไทย", en: "Thai" },
          { id: "en", th: "อังกฤษ", en: "English" },
        ],
      },
    ],
    feeds: ["font", "token-set"],
  },
  {
    id: "audience",
    kind: "synthesis",
    module: "brand",
    name: { th: "กลุ่มผู้ใช้", en: "Audience" },
    output: "text",
    inputs: [
      {
        id: "brief",
        required: true,
        answer: "text",
        label: { th: "บรีฟ", en: "Brief" },
        question: { th: "ต่อสายจากบรีฟ หรือเล่าสั้นๆ ว่าผลิตภัณฑ์คืออะไร", en: "Connect the brief" },
        from: ["brief"],
        options: [
        ],
      },
      {
        id: "users",
        required: true,
        answer: "text",
        label: { th: "ผู้ใช้หลัก", en: "Main users" },
        question: { th: "ใครคือผู้ใช้หลัก", en: "Who are the main users?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["mood-theme"],
  },
  {
    id: "mood-theme",
    kind: "synthesis",
    module: "brand",
    name: { th: "มู้ดและธีม", en: "Mood and theme" },
    output: "text",
    inputs: [
      {
        id: "personality",
        required: true,
        answer: "text",
        label: { th: "บุคลิกแบรนด์", en: "Brand personality" },
        question: { th: "ต่อสายจากบุคลิกแบรนด์ หรือบอกบุคลิกสามคำ", en: "Connect the brand personality" },
        from: ["brand-personality"],
        options: [
        ],
      },
      {
        id: "audience",
        required: false,
        answer: "text",
        label: { th: "กลุ่มผู้ใช้", en: "Audience" },
        question: { th: "ต่อสายจากกลุ่มผู้ใช้ ถ้ามี", en: "Connect the audience" },
        from: ["audience"],
        options: [
        ],
      },
      {
        id: "feeling",
        required: true,
        answer: "text",
        label: { th: "ความรู้สึก", en: "Feeling" },
        question: { th: "อยากให้คนใช้รู้สึกแบบไหน", en: "How should people feel when they use it?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["font", "icon", "shape-spacing"],
  },
  {
    id: "starter-colours",
    kind: "decision",
    module: "design-system",
    name: { th: "สีตั้งต้น", en: "Starter colours" },
    output: "palette",
    inputs: [
      {
        id: "primary",
        required: true,
        answer: "colours",
        label: { th: "สีหลัก", en: "Primary" },
        question: { th: "สีหลักคือสีไหน หรือต่อสายจากแหล่งสี", en: "What is the primary colour? Or connect a colour source" },
        from: ["typed-colours", "reference-images", "screenshot", "sample-website", "existing-logo"],
        options: [
        ],
      },
      {
        id: "secondary",
        required: false,
        answer: "colours",
        label: { th: "สีรอง", en: "Secondary" },
        question: { th: "มีสีรองไหม", en: "Is there a secondary colour?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["token-set"],
  },
  {
    id: "font",
    kind: "decision",
    module: "design-system",
    name: { th: "ฟอนต์", en: "Font" },
    output: "type",
    inputs: [
      {
        id: "mood",
        required: true,
        answer: "text",
        label: { th: "มู้ด", en: "Mood" },
        question: { th: "ต่อสายจากมู้ดและธีม หรือบอกมู้ดที่ต้องการ", en: "Connect the mood and theme" },
        from: ["mood-theme"],
        options: [
        ],
      },
      {
        id: "languages",
        required: true,
        answer: "choice",
        label: { th: "ภาษา", en: "Languages" },
        question: { th: "ฟอนต์ต้องรองรับภาษาไหน", en: "Which languages must the font support?" },
        from: ["platform-languages"],
        options: [
          { id: "th-en", th: "ไทยและอังกฤษ", en: "Thai and English" },
          { id: "th", th: "ไทย", en: "Thai" },
          { id: "en", th: "อังกฤษ", en: "English" },
        ],
      },
      {
        id: "wanted",
        required: false,
        answer: "text",
        label: { th: "ฟอนต์ที่อยากใช้", en: "Wanted font" },
        question: { th: "มีฟอนต์ที่อยากใช้อยู่แล้วไหม", en: "Is there a font you already want?" },
        from: [],
        options: [
        ],
      },
    ],
    feeds: ["token-set"],
  },
  {
    id: "icon",
    kind: "decision",
    module: "design-system",
    name: { th: "ไอคอน", en: "Icons" },
    output: "image",
    inputs: [
      {
        id: "mood",
        required: true,
        answer: "text",
        label: { th: "มู้ด", en: "Mood" },
        question: { th: "ต่อสายจากมู้ดและธีม หรือบอกมู้ดที่ต้องการ", en: "Connect the mood and theme" },
        from: ["mood-theme"],
        options: [
        ],
      },
      {
        id: "style",
        required: false,
        answer: "choice",
        label: { th: "สไตล์", en: "Style" },
        question: { th: "ชอบไอคอนแบบไหน", en: "Which icon style do you like?" },
        from: [],
        options: [
          { id: "rounded-stroke", th: "เส้นขอบมน", en: "Rounded stroke" },
          { id: "square-stroke", th: "เส้นขอบเหลี่ยม", en: "Square stroke" },
          { id: "solid", th: "ทึบ", en: "Solid" },
        ],
      },
    ],
    feeds: ["token-set"],
  },
  {
    id: "shape-spacing",
    kind: "decision",
    module: "design-system",
    name: { th: "รูปทรงและระยะห่าง", en: "Shape and spacing" },
    output: "profile",
    inputs: [
      {
        id: "mood",
        required: true,
        answer: "text",
        label: { th: "มู้ด", en: "Mood" },
        question: { th: "ต่อสายจากมู้ดและธีม หรือบอกมู้ดที่ต้องการ", en: "Connect the mood and theme" },
        from: ["mood-theme"],
        options: [
        ],
      },
      {
        id: "density",
        required: false,
        answer: "choice",
        label: { th: "ความแน่น", en: "Density" },
        question: { th: "อยากให้หน้าจอแน่นแค่ไหน", en: "How dense should screens be?" },
        from: [],
        options: [
          { id: "compact", th: "แน่น", en: "Compact" },
          { id: "comfortable", th: "พอดี", en: "Comfortable" },
          { id: "spacious", th: "โปร่ง", en: "Spacious" },
        ],
      },
    ],
    feeds: ["token-set"],
  },
  {
    id: "token-set",
    kind: "output",
    module: "design-system",
    name: { th: "ชุด token และโปรไฟล์", en: "Token set and profile" },
    output: "profile",
    inputs: [
      {
        id: "colours",
        required: true,
        answer: "colours",
        label: { th: "สี", en: "Colours" },
        question: { th: "ต่อสายจากสีตั้งต้น", en: "Connect the starter colours" },
        from: ["starter-colours"],
        options: [
        ],
      },
      {
        id: "font",
        required: true,
        answer: "text",
        label: { th: "ฟอนต์", en: "Font" },
        question: { th: "ต่อสายจากฟอนต์", en: "Connect the font" },
        from: ["font"],
        options: [
        ],
      },
      {
        id: "icon",
        required: true,
        answer: "text",
        label: { th: "ไอคอน", en: "Icons" },
        question: { th: "ต่อสายจากไอคอน", en: "Connect the icons" },
        from: ["icon"],
        options: [
        ],
      },
      {
        id: "shape",
        required: true,
        answer: "text",
        label: { th: "รูปทรง", en: "Shape" },
        question: { th: "ต่อสายจากรูปทรงและระยะห่าง", en: "Connect the shape and spacing" },
        from: ["shape-spacing"],
        options: [
        ],
      },
      {
        id: "platform",
        required: false,
        answer: "text",
        label: { th: "แพลตฟอร์ม", en: "Platform" },
        question: { th: "ต่อสายจากแพลตฟอร์มและภาษา ถ้ามี", en: "Connect the platform and languages" },
        from: ["platform-languages"],
        options: [
        ],
      },
    ],
    feeds: ["two-directions"],
  },
  {
    id: "two-directions",
    kind: "output",
    module: "design-system",
    name: { th: "สองทิศทาง", en: "Two directions" },
    output: "profile",
    inputs: [
      {
        id: "tokens",
        required: true,
        answer: "text",
        label: { th: "ชุด token", en: "Token set" },
        question: { th: "ต่อสายจากชุด token และโปรไฟล์", en: "Connect the token set and profile" },
        from: ["token-set"],
        options: [
        ],
      },
    ],
    feeds: [],
  },
] as const;
