/**
 * A small brand board every canvas story starts from (DESIGN.md §11 fixture rule): Thai and Latin
 * titles, the long Thai name without spaces, a node with nothing in it, every port kind, every
 * edge meaning and every status. Fixture data, labelled as such by the stories.
 */
import { fixtures } from "../fixtures";
import type { BoardEdge, BoardNode, Graph, PortSpec } from "./graph";

const text = (id = "text"): PortSpec => ({ id, kind: "text", label: "ข้อความ" });
const image = (id = "image"): PortSpec => ({ id, kind: "image", label: "ภาพ" });
const palette = (id = "palette"): PortSpec => ({ id, kind: "palette", label: "ชุดสี" });
const type = (id = "type"): PortSpec => ({ id, kind: "type", label: "ตัวอักษร" });
const profile = (id = "profile"): PortSpec => ({ id, kind: "profile", label: "โปรไฟล์" });

export const BOARD_NODES: BoardNode[] = [
  {
    id: "brief",
    type: "orivilo",
    position: { x: 0, y: 48 },
    data: {
      title: "บรีฟ",
      kind: "input-block",
      size: "sm",
      summary: "แอปสั่งอาหารสำหรับร้านกาแฟอิสระ โทนอบอุ่น เป็นกันเอง",
      inputs: [],
      outputs: [text()],
    },
  },
  {
    id: "logo",
    type: "orivilo",
    position: { x: 360, y: 0 },
    data: {
      title: "โลโก้",
      kind: "artifact",
      status: "running",
      summary: "สร้างจากบรีฟ รอบที่ 2",
      inputs: [text()],
      outputs: [image()],
    },
  },
  {
    id: "palette",
    type: "orivilo",
    position: { x: 360, y: 288 },
    data: {
      title: fixtures.mixed,
      kind: "artifact",
      missing: ["สีหลัก", "สีรอง"],
      inputs: [image(), text()],
      outputs: [palette()],
    },
  },
  {
    id: "type-direction",
    type: "orivilo",
    position: { x: 360, y: 576 },
    data: {
      title: "Type direction",
      kind: "direction",
      summary: "Anuphan กับ IBM Plex Sans Thai, น้ำหนัก 400 และ 600",
      inputs: [text()],
      outputs: [type()],
    },
  },
  {
    id: "profile",
    type: "orivilo",
    position: { x: 760, y: 240 },
    data: {
      title: "โปรไฟล์ว่าที่ลูกค้า",
      kind: "knowledge",
      status: "locked",
      summary: "ชุดสีและตัวอักษรที่อนุมัติแล้ว รุ่น 3",
      inputs: [palette(), type()],
      outputs: [profile()],
    },
  },
  {
    id: "note",
    type: "orivilo",
    position: { x: 0, y: 400 },
    data: {
      title: "โน้ต",
      kind: "note",
      inputs: [text()],
      outputs: [],
    },
  },
];

export const BOARD_EDGES: BoardEdge[] = [
  {
    id: "e-brief-logo",
    type: "orivilo",
    source: "brief",
    sourceHandle: "text",
    target: "logo",
    targetHandle: "text",
    data: { meaning: "input" },
  },
  {
    id: "e-logo-palette",
    type: "orivilo",
    source: "logo",
    sourceHandle: "image",
    target: "palette",
    targetHandle: "image",
    data: { meaning: "derived" },
  },
  {
    id: "e-brief-type",
    type: "orivilo",
    source: "brief",
    sourceHandle: "text",
    target: "type-direction",
    targetHandle: "text",
    data: { meaning: "reference" },
  },
  {
    id: "e-palette-profile",
    type: "orivilo",
    source: "palette",
    sourceHandle: "palette",
    target: "profile",
    targetHandle: "palette",
    data: { meaning: "input", stale: true },
  },
  {
    id: "e-type-profile",
    type: "orivilo",
    source: "type-direction",
    sourceHandle: "type",
    target: "profile",
    targetHandle: "type",
    data: { meaning: "input" },
  },
];

export const BOARD: Graph = { nodes: BOARD_NODES, edges: BOARD_EDGES };

/** A node with a long Thai title and a long Latin summary for the 360 px story. */
export const LONG_NODE: BoardNode = {
  id: "long",
  type: "orivilo",
  position: { x: 0, y: 0 },
  data: {
    title: fixtures.longThai,
    kind: "knowledge",
    summary: fixtures.longLatin,
    inputs: [text(), image()],
    outputs: [profile()],
  },
};
