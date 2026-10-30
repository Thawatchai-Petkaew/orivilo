/**
 * The web app's own copy in every locale (spec ORV-39): the home page, the layout and the page
 * metadata. Thai defines the shape; English is typed against it. Component copy lives in the
 * design system's catalog.
 */
import type { Locale } from "@orivilo/design-system";

const th = {
  app: {
    title: "ORIVILO",
    description: "จากเจตนาทางธุรกิจ สู่ผลิตภัณฑ์ดิจิทัลที่มีชีวิต",
    languageSwitch: "ภาษา",
    nav: "เมนูหลัก",
    home: "ORIVILO หน้าแรก",
    studio: "สตูดิโอ",
    account: "บัญชี",
  },
  home: {
    headline: "จากเจตนาทางธุรกิจ สู่ผลิตภัณฑ์ดิจิทัลที่มีชีวิต",
    tagline: "Brand-to-Product Platform ที่ทุกชิ้นงานสืบย้อนไปถึงเหตุผลของมันได้",
    openWorkspace: "เปิดหน้าอ้างอิง: เวิร์กสเปซของทีม",
    openDirections: "ลองเขียนบรีฟแล้วดูสองทิศทางบนหน้าจอเดียวกัน",
    openAccount: "ลงชื่อเข้าใช้และดูเวิร์กสเปซของคุณ",
    realHeading: "สิ่งที่มีจริงตอนนี้",
    notYetHeading: "สิ่งที่ยังไม่มี",
    schemaLine: "Design Profile schema v{version}. แผนงานทั้งหมดอยู่ใน",
    backlogLink: "backlog ใน Jira (ORV)",
    real: [
      {
        story: "E2-1",
        what: "Token ชั้น primitive, semantic, component พร้อม CSS ที่ generate และ test",
      },
      {
        story: "E2-2",
        what: "Profile {count} ชุด ({list}) สลับได้ใน Storybook และตรวจ contrast ทุกคู่",
      },
      { story: "E2-3", what: "Shell นี้ใช้ profile neutral และตามโหมดสีของเครื่อง" },
      {
        story: "E2-4",
        what: "Component ชุดแรก 10 ตัว (ปุ่ม, ช่องกรอก, select, checkbox, tooltip, popover, tabs) ใน Storybook ผ่าน 3 profile และ 2 โหมด",
      },
      {
        story: "E2-5",
        what: "Dialog (จับ focus, pending, error) และ Card (bento) ใน Storybook ผ่าน 3 profile และ 2 โหมด",
      },
      {
        story: "E2-6",
        what: "Table (เรียง, เลือกแถว, loading, ว่าง, ผิดพลาด, ยุบเป็นบล็อกที่ 360 px) ใน Storybook ผ่าน 3 profile และ 2 โหมด",
      },
      {
        story: "E2-7",
        what: "หน้าตัวอย่างเต็ม 3 หน้าใน Storybook (ฟอร์มตั้งค่า, บันทึกการตัดสินใจแบบ bento, หน้า landing) ประกอบจาก component ที่มีอยู่เท่านั้น",
      },
      {
        story: "E2-8",
        what: "หน้าอ้างอิง (เวิร์กสเปซของทีม พร้อมสร้างโปรเจกต์และเก็บถาวร) ที่ /workspace ประกอบจาก component ที่มีอยู่ พิสูจน์แล้วกับข้อมูลยาว จอ 360 px ข้อผิดพลาด และ overlay ใน 2 profile",
      },
      {
        story: "E2-11",
        what: "หน้า /directions: เขียนบรีฟหรือเลือกตัวอย่าง ระบบอ่านตามกฎ (ยังไม่ใช้ AI) แล้วเสนอสองทิศทางพร้อมคำในบรีฟที่เป็นเหตุผล และดูหน้าจอเดียวกันในแต่ละทิศทาง",
      },
      {
        story: "E2-12",
        what: "เมื่อลงชื่อเข้าใช้ บันทึกทิศทางเป็นฉบับร่าง อนุมัติเป็นฉบับที่แก้ไม่ได้ และส่งออกหรือนำเข้าเป็นไฟล์ที่เปิดแล้วได้หน้าตาเดิม",
      },
      {
        story: "E4-1 ถึง E4-3",
        what: "กระดาน Studio ใน Storybook: node, พอร์ต, สาย, toolbar, controls, เมนูคลิกขวา, command menu, คีย์ลัดทุกตัวจากทะเบียนคำสั่ง",
      },
      {
        story: "E2-16",
        what: "ทุกข้อความใน component และหน้านี้มาจาก catalog ภาษา (ไทย, อังกฤษ) สลับได้จากปุ่มด้านบนและใน Storybook",
      },
    ],
    notYet: [
      "Shell ของ Studio พร้อม navigation ยังไม่มี หน้านี้เป็นรายการสถานะ: epic E4",
      "กระดาน Studio ยังไม่อยู่ในแอป มีใน Storybook เท่านั้น: E4-4 ถึง E4-8",
      "หน้าตัวอย่างที่ /workspace เป็นข้อมูลตัวอย่างภาษาไทยอย่างเดียว จนกว่า shell จริงจะมาแทน: E4-0, E4-8",
      "การตีความ brief ตอนนี้เป็นแบบกฎเท่านั้น ยังไม่ใช้ AI และหน้าจอบอกไว้ตามจริง",
    ],
  },
  account: {
    title: "บัญชี, ORIVILO",
    heading: "บัญชีและเวิร์กสเปซ",
    signedOut: "ลงชื่อเข้าใช้ด้วยบัญชี Google แล้วระบบจะสร้างเวิร์กสเปซของคุณเองให้ในครั้งแรก",
    signInWithGoogle: "ลงชื่อเข้าใช้ด้วย Google",
    signedInAs: "ลงชื่อเข้าใช้อยู่ในชื่อ {email}",
    workspace: "เวิร์กสเปซของคุณ: {name}",
    signOut: "ออกจากระบบ",
    notConfigured:
      "ยังลงชื่อเข้าใช้ในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่า Google และฐานข้อมูล",
    problem: "ทำไม่สำเร็จ",
    failed: "ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้ ลองใหม่อีกครั้ง",
    limitReason: "มีการลงชื่อเข้าใช้จากเครือข่ายนี้ถี่เกินไป",
    limitRetry: "ลองใหม่ได้ในอีก {wait}",
  },
  wait: {
    seconds: { one: "{n} วินาที", other: "{n} วินาที" },
    minutes: { one: "{n} นาที", other: "{n} นาที" },
    hours: { one: "{n} ชั่วโมง", other: "{n} ชั่วโมง" },
  },
  directions: {
    title: "สองทิศทาง, ORIVILO",
    heading: "สองทิศทางจากบรีฟเดียว",
    description: "เขียนบรีฟแล้วดูสองทิศทางบนหน้าจอเดียวกัน (E2-11) อ่านตามกฎ ยังไม่ใช้ AI",
  },
  saved: {
    heading: "บันทึกทิศทาง",
    name: "ชื่อทิศทาง",
    nameHint: "ชื่อที่ทีมจะเห็นในรายการทิศทางที่บันทึกไว้",
    defaultName: "ทิศทางใหม่",
    saveDraft: "บันทึกฉบับร่าง",
    saving: "กำลังบันทึกฉบับร่าง",
    approve: "อนุมัติฉบับร่าง",
    approving: "กำลังอนุมัติ",
    newDirection: "เริ่มทิศทางใหม่",
    nothingToSave: "เขียนบรีฟจนระบบเสนอทิศทางได้ก่อน แล้วจึงบันทึก",
    unsaved: "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก",
    upToDate: "ตรงกับฉบับที่บันทึกไว้",
    savedDraft: "บันทึกฉบับร่างของ {name} แล้ว",
    approved: "อนุมัติ {name} เป็นฉบับที่ {number} แล้ว ฉบับนี้แก้ไขไม่ได้อีก",
    approveSaveFirst: "บันทึกฉบับร่างก่อน แล้วจึงอนุมัติ",
    approveAdminOnly: "ผู้ดูแลหรือเจ้าของเวิร์กสเปซเท่านั้นที่อนุมัติได้",
    opened: "เปิด {name}, {version} แล้ว",
    openedApproved:
      "เปิด {name}, {version} ที่อนุมัติแล้ว ถ้าแก้แล้วบันทึก ระบบจะสร้างฉบับร่างใหม่ และ{version}ยังเหมือนเดิม",
    replayWarning: "ฉบับนี้ให้ผลไม่ตรงกับตอนบันทึก ({reason}) สิ่งที่เห็นคือผลจากกฎชุดปัจจุบัน",
    listHeading: "ทิศทางที่บันทึกไว้",
    listEmpty: "ยังไม่มีทิศทางที่บันทึกไว้ บันทึกฉบับร่างแรกจากด้านบน หรือนำเข้าไฟล์",
    draft: "ฉบับร่าง",
    version: "ฉบับที่ {number}",
    approvedBadge: "อนุมัติแล้ว",
    problem: "ทำไม่สำเร็จ",
    attention: "โปรดตรวจดู",
    editing: "กำลังแก้",
    open: "เปิด",
    openLabel: "เปิด {name}, {version}",
    export: "ส่งออกไฟล์",
    exportLabel: "ส่งออก {name}, {version} เป็นไฟล์",
    exported: "ส่งออก {name}, {version} เป็นไฟล์ {file} แล้ว",
    import: "นำเข้าไฟล์",
    importing: "กำลังนำเข้า",
    importHint: "ไฟล์ .json ที่ส่งออกจาก ORIVILO จะเป็นทิศทางใหม่ในสถานะฉบับร่าง",
    imported: "นำเข้า {name} เป็นฉบับร่างใหม่แล้ว",
    signedOut:
      "ลงชื่อเข้าใช้เพื่อบันทึก อนุมัติ และส่งออกทิศทาง ตอนนี้ยังลองเขียนบรีฟได้ แต่จะไม่ถูกบันทึก",
    signIn: "ไปหน้าลงชื่อเข้าใช้",
    notConfigured: "ยังบันทึกทิศทางในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่าฐานข้อมูล",
    errors: {
      "signed-out": "เซสชันหมดอายุ ลงชื่อเข้าใช้อีกครั้งแล้วลองใหม่",
      forbidden: "บัญชีนี้ไม่มีสิทธิ์ทำสิ่งนี้ในเวิร์กสเปซนี้",
      "not-configured": "ยังบันทึกทิศทางในสภาพแวดล้อมนี้ไม่ได้ เพราะยังไม่ได้ตั้งค่าฐานข้อมูล",
      "not-found": "ไม่พบทิศทางนี้ในเวิร์กสเปซของคุณ",
      "no-draft": "ไม่มีฉบับร่างให้อนุมัติ บันทึกฉบับร่างก่อน",
      "invalid-input": "ข้อมูลไม่ครบ ตรวจชื่อทิศทางแล้วลองใหม่",
      "ai-failed": "AI อ่านบรีฟไม่สำเร็จ จึงใช้การอ่านตามกฎแทน",
      "ai-not-configured": "สภาพแวดล้อมนี้ยังไม่ได้ตั้งค่า AI จึงใช้การอ่านตามกฎ",
      "invalid-file": "ไฟล์นี้ไม่ใช่ไฟล์ทิศทางของ ORIVILO หรือถูกแก้ไข ลองส่งออกใหม่อีกครั้ง",
      "resolver-changed": "ไฟล์นี้สร้างด้วยกฎรุ่นอื่น ผลจะไม่เหมือนเดิม จึงไม่นำเข้า",
      "profile-missing": "ทิศทางที่เลือกไม่มีในชุดโปรไฟล์ปัจจุบัน",
      "fingerprint-mismatch":
        "ผลที่ได้ไม่ตรงกับลายนิ้วมือที่บันทึกไว้ ไฟล์อาจถูกแก้ไข จึงไม่นำเข้า",
      "rate-limited": "ส่งคำขอถี่เกินไป จึงยังไม่ได้ทำรายการนี้ ลองใหม่ได้ในอีก {wait}",
      "ai-rate-limited":
        "ใช้ AI อ่านบรีฟครบจำนวนที่กำหนดแล้ว จึงใช้การอ่านตามกฎแทน อ่านด้วย AI ได้อีกครั้งในอีก {wait}",
      failed: "ทำไม่สำเร็จ ลองอีกครั้ง",
    },
    replayReasons: {
      "resolver-changed": "กฎเปลี่ยนรุ่น",
      "profile-missing": "ไม่มีโปรไฟล์นี้แล้ว",
      "fingerprint-mismatch": "ผลต่างจากเดิม",
    },
  },
  failure: {
    reference: "รหัสอ้างอิง: {requestId}",
    network: "ติดต่อ ORIVILO ไม่ได้ ตรวจการเชื่อมต่อแล้วลองอีกครั้ง",
  },
  workspace: {
    title: "เวิร์กสเปซ, ORIVILO",
    description: "หน้าอ้างอิง: เวิร์กสเปซของทีมพร้อมสร้างโปรเจกต์ (E2-8) ข้อมูลตัวอย่างภาษาไทย",
  },
};

export type WebMessages = typeof th;

const en: WebMessages = {
  app: {
    title: "ORIVILO",
    description: "From business intent to living digital products.",
    languageSwitch: "Language",
    nav: "Main",
    home: "ORIVILO home",
    studio: "Studio",
    account: "Account",
  },
  home: {
    headline: "From business intent to living digital products",
    tagline: "A Brand-to-Product Platform where every artifact traces back to its reasons",
    openWorkspace: "Open the reference screen: team workspace",
    openDirections: "Write a brief and see two directions on the same screen",
    openAccount: "Sign in and see your workspace",
    realHeading: "What exists today",
    notYetHeading: "What does not exist yet",
    schemaLine: "Design Profile schema v{version}. The whole plan is in the",
    backlogLink: "Jira backlog (ORV)",
    real: [
      {
        story: "E2-1",
        what: "Primitive, semantic and component token layers with generated, tested CSS",
      },
      {
        story: "E2-2",
        what: "{count} profiles ({list}), switchable in Storybook, every contrast pair checked",
      },
      {
        story: "E2-3",
        what: "This shell runs the neutral profile and follows the device colour mode",
      },
      {
        story: "E2-4",
        what: "The first 10 components (button, input, select, checkbox, tooltip, popover, tabs) in Storybook under 3 profiles and 2 modes",
      },
      {
        story: "E2-5",
        what: "Dialog (focus trap, pending, error) and Card (bento) in Storybook under 3 profiles and 2 modes",
      },
      {
        story: "E2-6",
        what: "Table (sort, row selection, loading, empty, error, blocks at 360 px) in Storybook under 3 profiles and 2 modes",
      },
      {
        story: "E2-7",
        what: "3 full example pages in Storybook (settings form, bento decision log, landing) composed from existing components only",
      },
      {
        story: "E2-8",
        what: "The reference screen (team workspace with project creation and archiving) at /workspace, composed from existing components, proven with long data, a 360 px screen, errors and overlays under 2 profiles",
      },
      {
        story: "E2-11",
        what: "The /directions page: write a brief or pick a sample, the rules read it (no AI yet), two directions come back with the brief's words as reasons, and the same screen shows under each",
      },
      {
        story: "E2-12",
        what: "Signed in, save a direction as a draft, approve it into a version that never changes, and export or import it as a file that opens with the same look",
      },
      {
        story: "E4-1 to E4-3",
        what: "The Studio board in Storybook: nodes, ports, edges, toolbar, controls, context menu, command menu, every shortcut from the command registry",
      },
      {
        story: "E2-16",
        what: "Every string in the components and on this page comes from a locale catalog (Thai, English), switchable from the button above and in Storybook",
      },
    ],
    notYet: [
      "The Studio shell with navigation does not exist; this page is a status list: epic E4",
      "The Studio board is not in the app yet, only in Storybook: E4-4 to E4-8",
      "The example screen at /workspace is Thai fixture data only until the real shell replaces it: E4-0, E4-8",
      "Brief interpretation is rule-based only, with no AI yet, and the screen says so",
    ],
  },
  account: {
    title: "Account, ORIVILO",
    heading: "Account and workspace",
    signedOut:
      "Sign in with your Google account; the first time, your own workspace is created for you.",
    signInWithGoogle: "Sign in with Google",
    signedInAs: "Signed in as {email}",
    workspace: "Your workspace: {name}",
    signOut: "Sign out",
    notConfigured: "Sign-in is not available here yet: Google and the database are not set up.",
    problem: "Not done",
    failed: "You cannot sign in right now. Try again.",
    limitReason: "Too many sign-in attempts from this network.",
    limitRetry: "Try again in {wait}.",
  },
  wait: {
    seconds: { one: "{n} second", other: "{n} seconds" },
    minutes: { one: "{n} minute", other: "{n} minutes" },
    hours: { one: "{n} hour", other: "{n} hours" },
  },
  directions: {
    title: "Two directions, ORIVILO",
    heading: "Two directions from one brief",
    description:
      "Write a brief and see two directions on the same screen (E2-11). Read by rules, no AI yet.",
  },
  saved: {
    heading: "Save this direction",
    name: "Direction name",
    nameHint: "The name your team sees in the list of saved directions",
    defaultName: "New direction",
    saveDraft: "Save draft",
    saving: "Saving the draft",
    approve: "Approve the draft",
    approving: "Approving",
    newDirection: "Start a new direction",
    nothingToSave: "Write a brief until a direction is offered, then save it",
    unsaved: "There are unsaved changes",
    upToDate: "Matches the saved version",
    savedDraft: "Saved the draft of {name}",
    approved: "Approved {name} as version {number}. It can no longer change.",
    approveSaveFirst: "Save the draft first, then approve it",
    approveAdminOnly: "Only a workspace admin or owner can approve",
    opened: "Opened {name}, {version}",
    openedApproved:
      "Opened {name}, {version}, which is approved. Saving your edits creates a new draft and {version} stays as it is.",
    replayWarning:
      "This version no longer gives the result it was saved with ({reason}). What you see comes from the current rules.",
    listHeading: "Saved directions",
    listEmpty: "No saved directions yet. Save a first draft above, or import a file.",
    draft: "Draft",
    version: "Version {number}",
    approvedBadge: "Approved",
    problem: "Not done",
    attention: "Check this",
    editing: "Editing",
    open: "Open",
    openLabel: "Open {name}, {version}",
    export: "Export file",
    exportLabel: "Export {name}, {version} as a file",
    exported: "Exported {name}, {version} as {file}",
    import: "Import a file",
    importing: "Importing",
    importHint: "A .json file exported from ORIVILO becomes a new direction, as a draft",
    imported: "Imported {name} as a new draft",
    signedOut:
      "Sign in to save, approve and export directions. You can still try briefs here, but nothing is saved.",
    signIn: "Go to sign in",
    notConfigured:
      "Directions cannot be saved in this environment yet: the database is not set up.",
    errors: {
      "signed-out": "Your session has ended. Sign in again and retry.",
      forbidden: "This account is not allowed to do this in this workspace.",
      "not-configured":
        "Directions cannot be saved in this environment yet: the database is not set up.",
      "not-found": "This direction was not found in your workspace.",
      "no-draft": "There is no draft to approve. Save a draft first.",
      "invalid-input": "Something is missing. Check the direction name and retry.",
      "ai-failed": "AI could not read the brief, so the rules' reading is used.",
      "ai-not-configured": "AI is not set up in this environment, so the rules read the brief.",
      "invalid-file":
        "This is not an ORIVILO direction file, or it was edited. Export it again and retry.",
      "resolver-changed":
        "This file was made with other rules and would not give the same result, so it was not imported.",
      "profile-missing": "The chosen direction is not in the current set of profiles.",
      "fingerprint-mismatch":
        "The result does not match the saved fingerprint. The file may have been edited, so it was not imported.",
      "rate-limited":
        "Too many requests in a short time, so this was not done. Try again in {wait}.",
      "ai-rate-limited":
        "You have reached the limit for AI readings, so the rules' reading is used. AI can read again in {wait}.",
      failed: "That did not work. Try again.",
    },
    replayReasons: {
      "resolver-changed": "the rules changed",
      "profile-missing": "the profile is gone",
      "fingerprint-mismatch": "the result differs",
    },
  },
  failure: {
    reference: "Reference: {requestId}",
    network: "Could not reach ORIVILO. Check your connection, then try again.",
  },
  workspace: {
    title: "Workspace, ORIVILO",
    description:
      "The reference screen: a team workspace with project creation (E2-8). Thai fixture data.",
  },
};

export const webMessages: Record<Locale, WebMessages> = { th, en };
