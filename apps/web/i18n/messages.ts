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
  },
  home: {
    headline: "จากเจตนาทางธุรกิจ สู่ผลิตภัณฑ์ดิจิทัลที่มีชีวิต",
    tagline: "Brand-to-Product Platform ที่ทุกชิ้นงานสืบย้อนไปถึงเหตุผลของมันได้",
    openWorkspace: "เปิดหน้าอ้างอิง: เวิร์กสเปซของทีม",
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
      "การตีความ brief ยังไม่มี; เมื่อมาจะเป็นแบบกฎก่อนและบอกตามจริง: E2-10",
    ],
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
  },
  home: {
    headline: "From business intent to living digital products",
    tagline: "A Brand-to-Product Platform where every artifact traces back to its reasons",
    openWorkspace: "Open the reference screen: team workspace",
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
      "Brief interpretation does not exist; when it comes it is rule-based first and says so: E2-10",
    ],
  },
  workspace: {
    title: "Workspace, ORIVILO",
    description:
      "The reference screen: a team workspace with project creation (E2-8). Thai fixture data.",
  },
};

export const webMessages: Record<Locale, WebMessages> = { th, en };
