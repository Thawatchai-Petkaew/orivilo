import { fill, type Messages } from "../../i18n/messages/index";

/**
 * The status line after a delete: what went, then how many nodes turned stale. The stale clause
 * starts with its own comma, so it joins without a space; each count picks its singular form.
 */
export function deleteMessage(
  m: Messages,
  { nodes, edges, stale }: { nodes: number; edges: number; stale: number },
): string {
  const b = m.board;
  const parts: string[] = [];
  if (nodes > 0) parts.push(nodes === 1 ? b.deletedNode : fill(b.deletedNodes, { count: nodes }));
  if (edges > 0) {
    const [one, many] = nodes > 0 ? [b.andEdge, b.andEdges] : [b.deletedEdge, b.deletedEdges];
    parts.push(edges === 1 ? one : fill(many, { count: edges }));
  }
  let line = parts.join(" ");
  if (nodes > 0 && stale > 0) {
    line += stale === 1 ? b.staleAfterDeleteOne : fill(b.staleAfterDelete, { count: stale });
  }
  return line;
}
