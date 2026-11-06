import type { ChatBasis, ChatReply, ChatRequest } from "./canvas-chat/CanvasChat";
import type { EvidenceItem } from "./evidence-span/span";
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
  /** Thai with stacked marks above the line (a vowel and a tone mark on one letter): the sample for clip checks (L-0018). */
  thaiMarks: "ปิ่นโต้",
  thaiMarks2: "โลโก้",
  /** No spaces: must wrap by `overflow-wrap: anywhere` or truncate with an ellipsis, never overflow. */
  longThai: "บริษัทพัฒนาซอฟต์แวร์เพื่อการออกแบบอัตลักษณ์แบรนด์และผลิตภัณฑ์ดิจิทัลจำกัดมหาชน",
  longLatin: "Anuphan-and-Plex-mixed-identifier-that-never-breaks-on-its-own-2026",
  /** A value the data did not supply; a component shows the placeholder or "ไม่มีข้อมูล", never a blank. */
  missing: undefined,
  missingLabel: "ไม่มีข้อมูล",
} as const;

/**
 * FeaturedIcon story copy (ORV-222): the words that stand beside each tile, one per feedback kind.
 * They are the caller's text, not catalog keys, and they are mock.
 */
export const featuredIconFixtures = {
  th: {
    success: "สร้างหน้าแรกเสร็จแล้ว",
    warning: "ผลนี้เก่ากว่าข้อมูลต้นทาง",
    danger: "สร้างหน้าแรกไม่สำเร็จ",
    info: "ผลนี้มาจากกฎ ไม่ได้มาจากโมเดล",
  },
  en: {
    success: "Home page built",
    warning: "This result is older than its source",
    danger: "Couldn't build the home page",
    info: "This result comes from rules, not a model",
  },
} as const;

/**
 * Breadcrumb story trail (ORV-229): six crumbs, each with a `#` link, in both languages. They are the
 * caller's text, not catalog keys, and they are mock. Crumb 6 is the title of the first decision of
 * the decision-log example.
 */
export const breadcrumbFixtures = {
  trail: [
    { href: "#", th: "หน้าแรก", en: "Home" },
    { href: "#", th: "โปรเจกต์ทั้งหมด", en: "All projects" },
    { href: "#", th: fixtures.mixed, en: "The team's Brand Canvas project" },
    { href: "#", th: "บอร์ด", en: "Board" },
    { href: "#", th: "บันทึกการตัดสินใจ", en: "Decision log" },
    {
      href: "#",
      th: "ใช้ Orbit violet เป็นสีของการกระทำหลัก",
      en: "Use Orbit violet as the main action colour",
    },
  ],
} as const;

/**
 * FileUpload story content (ORV-227): MOCK. No upload path exists, so no file named here was sent
 * anywhere and every progress, done and failed state in a story comes from a story driver. The
 * label, the caller's error and the failure reason are the caller's text, not catalog keys. File
 * names are Thai, Thai with stacked marks, Latin, and the long Thai and long Latin names of
 * `fixtures` with an extension; a size of `undefined` is the missing value.
 */
export const fileUploadFixtures = {
  th: {
    label: "ภาพอ้างอิงแบรนด์",
    error: "เพิ่มภาพอย่างน้อยหนึ่งภาพ",
    reason: "การเชื่อมต่อหลุดระหว่างอัปโหลด ลองอีกครั้ง",
  },
  en: {
    label: "Brand reference images",
    error: "Add at least one image",
    reason: "The connection dropped during the upload. Try again",
  },
  names: {
    thai: "ภาพหน้าร้านบ้านกาแฟ.png",
    thaiMarks: "โลโก้ปิ่นโต้.png",
    latin: "shop-front.png",
    longThai: `${fixtures.longThai}.png`,
    longLatin: `${fixtures.longLatin}.png`,
  },
  /** Five distinct names per language: a Thai set (stacked marks in the second) and a Latin set. */
  nameSets: {
    th: [
      "ภาพหน้าร้านบ้านกาแฟ.png",
      "โลโก้ปิ่นโต้.png",
      "ป้ายร้าน.png",
      "เมนูกาแฟ.png",
      "โต๊ะริมหน้าต่าง.png",
    ],
    en: ["shop-front.png", "logo-mark.png", "signboard.png", "coffee-menu.png", "window-table.png"],
  },
  /** 1,843,200 bytes reads "1.9 MB" (worked example W1). */
  bytes: 1_843_200,
  missingSize: fixtures.missing,
} as const;

/** Collapsible story copy (ORV-203): the caller's label and content, not catalog keys. */
export const collapsibleFixtures = {
  trigger: "รายละเอียดโปรเจกต์",
  content: fixtures.mixed,
  triggerEn: "Project details",
  contentEn: "The team's Brand Canvas project",
} as const;

/**
 * Avatar story content (ORV-224): MOCK people. The names are invented and no real person's photo
 * is used. `picture` is a drawn stand-in (a head and shoulders of two flat shapes) as an inline
 * SVG `data:` URI; its colours are picture content, not style values. `brokenPicture` is a PNG
 * `data:` URI that cannot decode, so a failed load needs no network. Both pass the CSP `img-src`.
 */
const PICTURE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2F6F73"/><circle cx="48" cy="38" r="18" fill="#DCE9E4"/><path d="M12 96a36 34 0 0 1 72 0z" fill="#DCE9E4"/></svg>';

export const avatarFixtures = {
  name: "สมชาย ใจดี",
  nameEn: "Anong Srisuk",
  /** Opens with a leading vowel before its consonant, a name whose first letter is not its first character. */
  namePreBase: "ไพลิน ศรีสุข",
  menuLabel: "เปิดเมนูบัญชีของสมชาย ใจดี",
  menuLabelEn: "Open the account menu for Anong Srisuk",
  newPicture: "โหลดรูปใหม่",
  newPictureEn: "Load a new picture",
  picture: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PICTURE_SVG)}`,
  brokenPicture: "data:image/png;base64,AAAA",
} as const;

/**
 * EvidenceSpan and EvidenceList story content (ORV-211): MOCK evidence items. No brief analyser
 * exists yet, so nothing here was read from a brief by a rule or a model; the `fromModel` flag is a
 * fixture value. A text locator points at the quote's place in `brief` (0 when the quote is not in it).
 */
function mockItem(
  id: string,
  brief: string,
  kind: EvidenceItem["observation"]["kind"],
  subject: string,
  quote: string | undefined,
  fromModel: boolean,
): EvidenceItem {
  const found = quote === undefined ? -1 : brief.indexOf(quote);
  const start = Math.max(found, 0);
  return {
    id,
    inputKind: "brief-text",
    fromModel,
    source: {
      ref: "fixture:brief",
      locator:
        quote === undefined
          ? { kind: "element", path: "brief" }
          : { kind: "text", path: "brief", start, end: start + quote.length },
      contentHash: "0".repeat(64),
      retrievedAt: "2026-11-01T00:00:00.000Z",
      renderer: null,
    },
    observation: { kind, subject, ...(quote === undefined ? {} : { quote }) },
  };
}

const briefTh = "ร้านบ้านกาแฟ อยากให้ลูกค้ารู้สึกอบอุ่นเหมือนมาบ้านเพื่อน ใช้โทนไม้และแสงธรรมชาติ";
const briefEn =
  "Baan Coffee wants guests to feel as warm as at a friend's home, with wood tones and daylight";

export const evidenceFixtures = {
  brief: briefTh,
  briefEn,
  name: mockItem("00000001", briefTh, "brand-name", "name", "ร้านบ้านกาแฟ", false),
  warm: mockItem(
    "00000002",
    briefTh,
    "personality-signal",
    "warm",
    "อยากให้ลูกค้ารู้สึกอบอุ่นเหมือนมาบ้านเพื่อน",
    true,
  ),
  mood: mockItem("00000003", briefTh, "mood-word", "wood", "ใช้โทนไม้และแสงธรรมชาติ", false),
  noQuote: mockItem("00000004", briefTh, "industry-candidate", "coffee-shop", undefined, false),
  markup: mockItem("00000005", briefTh, "text-span", "test", "<b>ตัวหนา</b> ในบรีฟ", false),
  long: mockItem("00000006", briefTh, "brand-name", "company", fixtures.longThai, false),
  nameEn: mockItem("00000011", briefEn, "brand-name", "name", "Baan Coffee", false),
  warmEn: mockItem(
    "00000012",
    briefEn,
    "personality-signal",
    "warm",
    "feel as warm as at a friend's home",
    true,
  ),
  moodEn: mockItem("00000013", briefEn, "mood-word", "wood", "wood tones and daylight", false),
  noQuoteEn: mockItem("00000014", briefEn, "industry-candidate", "coffee-shop", undefined, false),
  /** The facts the caller prints beside an item: the caller's text, not a catalog key. */
  fact: {
    name: "ชื่อแบรนด์: บ้านกาแฟ",
    warm: "บุคลิก: อบอุ่น",
    mood: "อารมณ์: ไม้และแสงธรรมชาติ",
    noQuote: "อุตสาหกรรม: ร้านกาแฟ",
    markup: "ข้อความทดสอบ",
    long: "ชื่อบริษัท",
    nameEn: "Brand name: Baan Coffee",
    warmEn: "Personality: warm",
    moodEn: "Mood: wood and daylight",
    noQuoteEn: "Industry: coffee shop",
  },
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

/** The failed job of the English task-bar fixtures: its reason is the `danger` Alert description. */
const failedJobEn = fixtureTaskJobsEn[0];

/**
 * Alert story copy (ORV-222): the caller's title, description and action per feedback kind, in Thai
 * and English, and the two controls the interaction stories use. They are not catalog keys, and the
 * jobs they describe are mock: nothing here ran. The `danger` description is the failed task-bar
 * job's reason, so the two components say the same thing.
 */
export const alertFixtures = {
  th: {
    success: {
      title: featuredIconFixtures.th.success,
      description: "ดูผลลัพธ์ได้ที่โหนดหน้าแรก",
      action: "ดูผลลัพธ์",
    },
    warning: {
      title: featuredIconFixtures.th.warning,
      description: "โหนดแบรนด์เปลี่ยนแล้ว รันโหนดนี้อีกครั้งเพื่ออัปเดตผล",
      action: "รันอีกครั้ง",
    },
    danger: {
      title: featuredIconFixtures.th.danger,
      description: fixtureJobs.failed.reason,
      action: "ลองอีกครั้ง",
    },
    info: {
      title: featuredIconFixtures.th.info,
      description: "แก้ข้อมูลในโหนดแบรนด์ แล้วรันอีกครั้งเพื่อเปลี่ยนผล",
      action: "เปิดโหนดแบรนด์",
    },
    trigger: "แสดงข้อความ",
    next: "งานถัดไป",
  },
  en: {
    success: {
      title: featuredIconFixtures.en.success,
      description: "See the result in the home page node",
      action: "View the result",
    },
    warning: {
      title: featuredIconFixtures.en.warning,
      description: "The brand node changed. Run this node again to update the result",
      action: "Run again",
    },
    danger: {
      title: featuredIconFixtures.en.danger,
      description: failedJobEn?.state === "failed" ? failedJobEn.reason : "",
      action: "Retry",
    },
    info: {
      title: featuredIconFixtures.en.info,
      description: "Edit the brand node, then run it again to change the result",
      action: "Open the brand node",
    },
    trigger: "Show the message",
    next: "Next job",
  },
} as const;

/** Twelve jobs so the list has to scroll inside the bar. */
export const fixtureManyJobs: readonly TaskJob[] = Array.from({ length: 12 }, (_, i): TaskJob => ({
  id: `job-many-${i}`,
  name: `งานที่ ${i + 1}`,
  basis: "mock",
  state: "done",
}));

/** Cumulative snapshots of `text`, split at grapheme boundaries so Thai never breaks mid-cluster. */
function snapshotsOf(text: string, steps: number): string[] {
  const parts = Array.from(
    new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text),
    (p) => p.segment,
  );
  const size = Math.max(1, Math.ceil(parts.length / steps));
  const out: string[] = [];
  for (let i = size; i < parts.length + size; i += size) out.push(parts.slice(0, i).join(""));
  return out;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(timer), resolve()), { once: true });
  });
}

/**
 * CanvasChat (ORV-105): mock questions and replies, and fixture hosts for `onAsk`. A host streams
 * canned text in cumulative snapshots with a delay; nothing here interprets language or calls a
 * model, and no reply says that AI wrote it. Hosts stop quietly when the signal aborts.
 */
export type ChatHost = (request: ChatRequest, signal: AbortSignal) => AsyncGenerator<ChatReply>;

export const chatFixtures = {
  question: "สรุปโหนดแบรนด์ให้หน่อย",
  questionEn: "Summarise the brand node",
  /** No spaces: the transcript wraps it by word break or overflow-wrap, never clips it. */
  longQuestion: `${fixtures.longThai}${fixtures.longThai}`,
  /** Latin node names inside a Thai sentence. */
  reply: "โหนดแบรนด์มีสีหลักสองสี ฟอนต์หัวข้อคือ Anuphan และยังไม่มีเสียงของแบรนด์",
  replyEn:
    "The brand node has two main colours and Anuphan as the heading font. It has no brand voice yet",
  /** Line breaks from the person or the host are kept. */
  replyLines: "สรุปโหนดแบรนด์\nสีหลักสองสี\nฟอนต์หัวข้อ Anuphan\nยังไม่มีเสียงของแบรนด์",
  longReply: `${fixtures.longThai}${fixtures.longThai}${fixtures.longThai}`,

  /** Streams `text` in `steps` snapshots, `ms` apart, then ends. */
  host: (text: string, basis: ChatBasis = "rules", { steps = 4, ms = 60 } = {}): ChatHost =>
    async function* (_request: ChatRequest, signal: AbortSignal): AsyncGenerator<ChatReply> {
      for (const snapshot of snapshotsOf(text, steps)) {
        await wait(ms, signal);
        if (signal.aborted) return;
        yield { text: snapshot, basis };
      }
    },
  /** Yields the first snapshot of `text`, then holds until the signal aborts. */
  hostHold: (text: string, basis: ChatBasis = "rules"): ChatHost =>
    async function* (_request: ChatRequest, signal: AbortSignal): AsyncGenerator<ChatReply> {
      const [first] = snapshotsOf(text, 4);
      yield { text: first ?? "", basis };
      await wait(60_000, signal);
    },
  /** Throws before any snapshot. */
  hostFail: (message = "upstream timeout 504"): ChatHost =>
    // eslint-disable-next-line require-yield -- a host that fails at once has nothing to yield
    async function* (): AsyncGenerator<ChatReply> {
      throw new Error(message);
    },
  /** Yields one snapshot, then throws. */
  hostFailMidStream: (text: string, message = "stream reset"): ChatHost =>
    async function* (): AsyncGenerator<ChatReply> {
      yield { text: snapshotsOf(text, 4)[0] ?? "", basis: "rules" };
      throw new Error(message);
    },
  /**
   * Yields one snapshot, then waits until `release()` is called, then ends or, with `fail`, throws.
   * For tests that need the reply to end at a moment of their choosing.
   */
  hostLatch: (text: string, { fail = false } = {}): { host: ChatHost; release: () => void } => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    return {
      release: () => release(),
      host: async function* (_request, signal): AsyncGenerator<ChatReply> {
        yield { text: snapshotsOf(text, 4)[0] ?? "", basis: "rules" };
        await Promise.race([gate, wait(60_000, signal)]);
        if (fail) throw new Error("upstream timeout 504");
      },
    };
  },
  /**
   * Yields the first snapshot of `text` at once, then one more snapshot per `next()` call, and ends
   * after the last. For tests that need new text to arrive at a moment of their choosing.
   */
  hostPaced: (
    text: string,
    basis: ChatBasis = "rules",
    steps = 4,
  ): { host: ChatHost; next: () => void } => {
    const waiting: (() => void)[] = [];
    let credit = 0;
    return {
      next: () => {
        const resume = waiting.shift();
        if (resume) resume();
        else credit += 1;
      },
      host: async function* (_request, signal): AsyncGenerator<ChatReply> {
        for (const [i, snapshot] of snapshotsOf(text, steps).entries()) {
          if (i > 0 && credit > 0) credit -= 1;
          else if (i > 0) {
            await new Promise<void>((resolve) => {
              waiting.push(resolve);
              signal.addEventListener("abort", () => resolve(), { once: true });
            });
          }
          if (signal.aborted) return;
          yield { text: snapshot, basis };
        }
      },
    };
  },
  /** Ends after one snapshot whose text is empty: a finished reply with nothing in it. */
  hostBlank: async function* (): AsyncGenerator<ChatReply> {
    yield { text: "", basis: "rules" };
  } as ChatHost,
  /** Ends without a snapshot. */
  hostEmpty: async function* (): AsyncGenerator<ChatReply> {} as ChatHost,
} as const;
