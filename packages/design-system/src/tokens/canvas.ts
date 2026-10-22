/**
 * The canvas vocabulary (ADR 0004 item 4, spec E4-1): port kinds with their shape, edge meanings
 * with their dash pattern, and node statuses, read from the semantic source so the components in
 * E4-2 and the Foundations page share one list. Shape and icon carry a port's kind; colour never
 * does alone.
 */
import semantic from "./source/semantic.json" with { type: "json" };

export const PORT_KINDS = ["text", "image", "palette", "type", "profile"] as const;
export type PortKind = (typeof PORT_KINDS)[number];

export const PORT_SHAPES = ["circle", "square", "diamond", "triangle", "hexagon"] as const;
export type PortShape = (typeof PORT_SHAPES)[number];

export const EDGE_MEANINGS = ["input", "reference", "derived"] as const;
export type EdgeMeaning = (typeof EDGE_MEANINGS)[number];

export const NODE_STATUSES = ["running", "stale", "locked"] as const;
export type NodeStatus = (typeof NODE_STATUSES)[number];

/** What a node on the board is (ADR 0004 item 2, catalog CanvasNode variants). */
export const NODE_KINDS = [
  "input-block",
  "knowledge",
  "artifact",
  "reference",
  "direction",
  "note",
  "group",
] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export const PORT_DIRECTIONS = ["input", "output"] as const;
export type PortDirection = (typeof PORT_DIRECTIONS)[number];

interface PortNode {
  $description?: string;
  $extensions?: { orivilo?: { shape?: string } };
}

/** The shape declared for a port kind in semantic.json (`$extensions.orivilo.shape`). */
export function portShape(kind: PortKind): PortShape {
  const node = (semantic.port as Record<string, PortNode>)[kind];
  const shape = node?.$extensions?.orivilo?.shape;
  if (!shape || !(PORT_SHAPES as readonly string[]).includes(shape)) {
    throw new Error(`port.${kind} declares no known shape`);
  }
  return shape as PortShape;
}

/** Thai and English words for the vocabulary, used by labels and accessible names. */
export const CANVAS_WORDS = {
  port: {
    text: { th: "ข้อความ", en: "text" },
    image: { th: "ภาพ", en: "image" },
    palette: { th: "ชุดสี", en: "palette" },
    type: { th: "ตัวอักษร", en: "type" },
    profile: { th: "โปรไฟล์", en: "profile" },
  },
  edge: {
    input: { th: "ป้อนเข้า", en: "input" },
    reference: { th: "อ้างอิง", en: "reference" },
    derived: { th: "สร้างจาก", en: "derived from" },
  },
  status: {
    running: { th: "กำลังทำงาน", en: "running" },
    stale: { th: "ล้าสมัย", en: "stale" },
    locked: { th: "ล็อกแล้ว", en: "locked" },
  },
  node: {
    "input-block": { th: "บล็อกป้อนข้อมูล", en: "input block" },
    knowledge: { th: "ความรู้", en: "knowledge" },
    artifact: { th: "ชิ้นงาน", en: "artifact" },
    reference: { th: "อ้างอิง", en: "reference" },
    direction: { th: "ทิศทาง", en: "direction" },
    note: { th: "โน้ต", en: "note" },
    group: { th: "กลุ่ม", en: "group" },
  },
  direction: {
    input: { th: "พอร์ตรับ", en: "input port" },
    output: { th: "พอร์ตส่ง", en: "output port" },
  },
} as const;
