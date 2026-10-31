import { useState } from "react";
import { useDesignProfile } from "../../boundary/DesignProfileBoundary";
import type { CommandId } from "../../commands/index";
import { fillHeight } from "../matrix";
import { CanvasBoard, type CanvasBoardProps, type CommandContext } from "./CanvasBoard";
import type { BoardNode, Graph } from "./graph";

export interface StatefulProps extends Omit<CanvasBoardProps, "graph" | "onChange"> {
  initial: Graph;
  height?: number | undefined;
  /**
   * The board fills the viewport height when it is taller than `height` (spec ORV-189,
   * `fill-height-1`); `false` keeps `height`, for a story that proves a bound on the height.
   */
  fill?: boolean | undefined;
  /** Called with every graph the board emits, for play functions that read positions. */
  onGraph?: ((graph: Graph) => void) | undefined;
}

/**
 * The shell's side of the controlled board for stories: the graph in state, `onChange` writing
 * it back, `board.add-node` adding a note where asked and `node.rename` renaming in place.
 * Undo and redo are reported to `onCommand` only; a real history is the shell's (E4-6).
 */
export function Stateful({ initial, height = 520, fill = true, onGraph, ...rest }: StatefulProps) {
  const [graph, setGraph] = useState(initial);
  const update = (next: Graph) => {
    setGraph(next);
    onGraph?.(next);
  };
  const onCommand = (command: CommandId, context: CommandContext) => {
    rest.onCommand?.(command, context);
    if (command === "board.add-node") {
      const node: BoardNode = {
        id: `note-${graph.nodes.length + 1}`,
        type: "orivilo",
        position: context.position ?? { x: 0, y: 0 },
        data: { title: "โน้ตใหม่", kind: "note", inputs: [], outputs: [] },
      };
      update({ ...graph, nodes: [...graph.nodes, node] });
    }
    if (command === "node.rename" && context.nodeId) {
      update({
        ...graph,
        nodes: graph.nodes.map((n) =>
          n.id === context.nodeId
            ? { ...n, data: { ...n.data, title: `${n.data.title} (แก้)` } }
            : n,
        ),
      });
    }
  };
  return (
    <div style={{ height: fill ? fillHeight(height) : height }} className="relative">
      <CanvasBoard {...rest} graph={graph} onChange={update} onCommand={onCommand} />
    </div>
  );
}

/**
 * One board per matrix cell, each region named by its cell so the six landmarks stay distinct
 * (the a11y addon's landmark-unique rule).
 */
export function MatrixBoard(props: StatefulProps) {
  const scope = useDesignProfile();
  const id = typeof scope?.profile === "string" ? scope.profile : scope?.profile.id;
  return <Stateful {...props} label={`${props.label}, ${id ?? "neutral"} ${scope?.mode ?? ""}`} />;
}
