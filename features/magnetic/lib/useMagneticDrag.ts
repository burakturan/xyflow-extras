/**
 * useMagneticDrag connects the repel math in repel.ts to React Flow's drag events. While you drag a
 * node, the ones it touches slide out of the way and stay where they land. The smooth slide is done
 * with CSS, not JavaScript, so there is no animation loop. We only call setNodes when a node really
 * needs to move.
 *
 * @example
 * const { hostRef, onNodeDragStart, onNodeDrag, onNodeDragStop } = useMagneticDrag(setNodes);
 * <div ref={hostRef}>
 *   <ReactFlow onNodeDragStart={...} onNodeDrag={...} onNodeDragStop={...} />
 * </div>
 */

import { useCallback, useEffect, useRef } from 'react';
import type { Node, OnNodeDrag } from '@xyflow/react';
import { computeRepulsion, type RepelOptions } from './repel';

/** Generic over your node type, so you can pass the setter from useNodesState<MyNode> as is. The
 *  repel math only reads id and position, so any node type works. */
type SetNodes<N extends Node> = (updater: (prev: N[]) => N[]) => void;

/** A bit longer than the CSS slide, so we never drop the class while a node is still gliding. */
const SETTLE_MS = 260;

export function useMagneticDrag<N extends Node = Node>(setNodes: SetNodes<N>, opts: RepelOptions = {}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const dragId = useRef<string | null>(null);
  const frame = useRef<number | null>(null);
  const settle = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const onNodeDragStart = useCallback<OnNodeDrag>((_, node) => {
    dragId.current = node.id;
    if (settle.current != null) { window.clearTimeout(settle.current); settle.current = null; }
    hostRef.current?.classList.add('magnetic-repelling');
  }, []);
  const onNodeDrag = useCallback<OnNodeDrag>(() => {
    if (dragId.current == null || frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const id = dragId.current;
      if (id == null) return;
      setNodes((prev) => {
        const moves = computeRepulsion(prev, id, optsRef.current);
        if (!moves.size) return prev;
        return prev.map((n) => {
          const p = moves.get(n.id);
          return p ? { ...n, position: p } : n; // keep the same object so React Flow skips it
        });
      });
    });
  }, [setNodes]);
  const onNodeDragStop = useCallback<OnNodeDrag>(() => {
    dragId.current = null;
    if (frame.current != null) { cancelAnimationFrame(frame.current); frame.current = null; }
    settle.current = window.setTimeout(() => {
      settle.current = null;
      hostRef.current?.classList.remove('magnetic-repelling');
    }, SETTLE_MS);
  }, []);
  useEffect(() => () => {
    if (frame.current != null) cancelAnimationFrame(frame.current);
    if (settle.current != null) window.clearTimeout(settle.current);
  }, []);
  return { hostRef, onNodeDragStart, onNodeDrag, onNodeDragStop };
}
