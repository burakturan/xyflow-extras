/**
 * Spider-web. React Flow lets you drag a node, but it has no notion of "connect to whatever is near
 * me as I move." This adds that. While you drag a node it spins live threads to the nearest other
 * nodes, like a web being drawn between them. The nearer a node, the stronger the thread (more opaque
 * and thicker). Each thread grabs the side facing the neighbour, so it reads as a web, not a line
 * through the middle. Let go and the web settles: the closest few threads become real edges, the rest
 * fade. Same shape as the magnetic hook, driven from the three onNodeDrag* callbacks.
 *
 * @example
 * const [nodes, , onNodesChange] = useNodesState(initialNodes);
 * const [edges, setEdges] = useEdgesState<Edge>([]);
 * const { threads, onNodeDragStart, onNodeDrag, onNodeDragStop } = useSpiderWeb(nodes, setEdges);
 * // render `threads` as transient edges next to your real ones, then wire the three callbacks.
 * <ReactFlow onNodeDragStart={...} onNodeDrag={...} onNodeDragStop={...} />
 */

import { useCallback, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

/** The four edges a thread can attach to · which one is chosen by where the neighbour actually sits. */
export type Side = 'left' | 'right' | 'top' | 'bottom';

export type SpiderThread = {
  id: string;
  source: string;
  target: string;
  /** 0..1 · how close (1 = touching radius), drives opacity + width. */
  strength: number;
  /** Which edge of each node the thread grabs · a neighbour to the right attaches right→left, etc.
   *  This is what makes it read like a web: threads leave from the side facing the other node. */
  sourceSide: Side;
  targetSide: Side;
};

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

function rectOf(n: Node): Rect {
  const w = n.measured?.width ?? n.width ?? 240;
  const h = n.measured?.height ?? n.height ?? 90;
  return { x: n.position.x, y: n.position.y, w, h };
}

function centre(r: Rect): Pt {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const OPPOSITE: Record<Side, Side> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };

/** Pick the side a thread leaves `a` through to reach `b`: the axis on which the rects are most
 *  separated wins (so a tall card beside a short one still pairs left↔right, not top/bottom). The
 *  thread enters `b` through the opposite side. */
function pickSides(a: Rect, b: Rect): { sourceSide: Side; targetSide: Side } {
  const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
  const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
  const ca = centre(a);
  const cb = centre(b);
  const sourceSide: Side = gapX >= gapY ? (cb.x >= ca.x ? 'right' : 'left') : (cb.y >= ca.y ? 'bottom' : 'top');
  return { sourceSide, targetSide: OPPOSITE[sourceSide] };
}

export type SpiderOptions = {
  /** Threads only spin to nodes within this distance (px). Beyond it, no web. */
  reach?: number;
  /** Keep at most this many threads (the nearest ones) while dragging. */
  maxThreads?: number;
  /** On drop, the nearest this-many threads become permanent edges. */
  keepOnDrop?: number;
};

export function useSpiderWeb(
  nodes: Node[],
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  opts: SpiderOptions = {},
) {
  // Reach is the snap radius · a neighbour beyond it gets NO thread (the web only spans what's truly
  // near). Kept tighter than the canvas is wide so threads break once a node is dragged away.
  const reach = opts.reach ?? 300;
  const maxThreads = opts.maxThreads ?? 5;
  const keepOnDrop = opts.keepOnDrop ?? 2;

  const [threads, setThreads] = useState<SpiderThread[]>([]);
  const draggingId = useRef<string | null>(null);

  // Recompute the live web. `self` is the dragged node WITH its live position (React Flow's 2nd
  // callback arg, fresher than the `nodes` state, which lags during a drag); the others come from the
  // node list. Each thread also records WHICH SIDE it grabs (by geometry), so it leaves through the
  // edge facing the neighbour — the thing that makes it read as a web, not centre-to-centre lines.
  const spin = useCallback((self: Node, others: Node[]) => {
    const ra = rectOf(self);
    const c0 = centre(ra);
    const near = others
      .filter((n) => n.id !== self.id)
      .map((n) => { const rb = rectOf(n); return { n, rb, d: dist(c0, centre(rb)) }; })
      .filter((x) => x.d <= reach)
      .sort((a, b) => a.d - b.d)
      .slice(0, maxThreads)
      .map(({ n, rb, d }) => {
        const { sourceSide, targetSide } = pickSides(ra, rb);
        return {
          id: `web-${self.id}-${n.id}`,
          source: self.id,
          target: n.id,
          strength: Math.max(0, 1 - d / reach),
          sourceSide,
          targetSide,
        };
      });
    setThreads(near);
  }, [reach, maxThreads]);

  const onNodeDragStart = useCallback((_e: unknown, node: Node) => {
    draggingId.current = node.id;
    spin(node, nodes);
  }, [nodes, spin]);

  const onNodeDrag = useCallback((_e: unknown, node: Node) => {
    // node carries the LIVE position as it moves; nodes provides the (static) others.
    spin(node, nodes);
  }, [nodes, spin]);

  const onNodeDragStop = useCallback(() => {
    // Settle the web: the nearest few threads become real edges, the rest vanish.
    setThreads((live) => {
      const keep = [...live].sort((a, b) => b.strength - a.strength).slice(0, keepOnDrop);
      if (keep.length) {
        setEdges((eds) => {
          const have = new Set(eds.map((e) => e.id));
          const add = keep
            .map((t) => ({
              id: `${t.source}->${t.target}`, source: t.source, target: t.target,
              sourceHandle: t.sourceSide, targetHandle: t.targetSide,
            }))
            .filter((e) => !have.has(e.id));
          return add.length ? [...eds, ...add] : eds;
        });
      }
      return [];
    });
    draggingId.current = null;
  }, [keepOnDrop, setEdges]);

  return { threads, onNodeDragStart, onNodeDrag, onNodeDragStop };
}
