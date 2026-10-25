import { describe, expect, it } from "vitest";
import { messagesFor } from "../../i18n/messages/index";
import { deleteMessage } from "./delete-message";

const en = messagesFor("en");
const th = messagesFor("th");

describe("deleteMessage", () => {
  it("uses the singular for one node, one edge and one stale node", () => {
    expect(deleteMessage(en, { nodes: 1, edges: 1, stale: 1 })).toBe(
      "Deleted 1 node and 1 edge, 1 downstream node is stale",
    );
  });

  it("uses the plural for many, with no space before the comma", () => {
    const line = deleteMessage(en, { nodes: 2, edges: 3, stale: 4 });
    expect(line).toBe("Deleted 2 nodes and 3 edges, 4 downstream nodes are stale");
    expect(line).not.toContain(" ,");
  });

  it("reads a lone edge delete without a stale clause", () => {
    expect(deleteMessage(en, { nodes: 0, edges: 1, stale: 2 })).toBe("Deleted 1 edge");
    expect(deleteMessage(en, { nodes: 0, edges: 5, stale: 0 })).toBe("Deleted 5 edges");
  });

  it("joins the Thai line without a stray space too", () => {
    expect(deleteMessage(th, { nodes: 1, edges: 2, stale: 2 })).toBe(
      "ลบ 1 node และ 2 สาย, 2 node ปลายทางล้าสมัย",
    );
  });
});
