/**
 * Magnetic repel. React Flow lets you drag a node, but it does not push the others out of the way.
 * This adds that. The node you drag becomes the pusher. Any node it touches slides away until there
 * is GAP space between them. A pushed node can push its own neighbours too, for a few passes, so a
 * crowd opens up instead of one node getting stuck. Pure functions, no React, easy to test.
 */

import type { Node } from '@xyflow/react';

export type Rect = { x: number; y: number; w: number; h: number };

export type RepelOptions = {
  /** Space a pushed node keeps from the pusher, in px. */
  gap?: number;
  /** How many extra passes a pushed node may use to clear its own neighbours. Keeps chains short. */
  passes?: number;
  /** A node only gets a new target once it has drifted this far (px). Keeps React updates rare; pair
   *  it with a CSS transition so the node glides between steps. */
  step?: number;
  /** Default node size when React Flow has not measured it yet. */
  fallbackSize?: { w: number; h: number };
};

const DEFAULTS = { gap: 18, passes: 3, step: 8, fallbackSize: { w: 240, h: 120 } };

/** The node's box. Uses the measured size when React Flow has it, the fallback size before that. */
export function nodeRect(n: Node, fallback = DEFAULTS.fallbackSize): Rect {
  const w = Number(n.width ?? n.measured?.width ?? fallback.w);
  const h = Number(n.height ?? n.measured?.height ?? fallback.h);
  return {
    x: n.position.x,
    y: n.position.y,
    w: Number.isFinite(w) ? w : fallback.w,
    h: Number.isFinite(h) ? h : fallback.h,
  };
}

/** Smallest move that restores `gap` between pusher and node. Null when they are already clear. */
function separation(pusher: Rect, node: Rect, gap: number): { x: number; y: number } | null {
  const ox = (pusher.w + node.w) / 2 + gap - Math.abs(node.x + node.w / 2 - (pusher.x + pusher.w / 2));
  if (ox <= 0) return null;
  const oy = (pusher.h + node.h) / 2 + gap - Math.abs(node.y + node.h / 2 - (pusher.y + pusher.h / 2));
  if (oy <= 0) return null;
  if (ox <= oy) {
    return { x: (node.x + node.w / 2 >= pusher.x + pusher.w / 2 ? 1 : -1) * ox, y: 0 };
  }
  return { x: 0, y: (node.y + node.h / 2 >= pusher.y + pusher.h / 2 ? 1 : -1) * oy };
}

/**
 * Returns the new position for every node the drag is pushing right now. A node is only included
 * once it has to move more than `step`, so small jitter does not trigger updates. It is plain rect
 * math and runs once per animation frame, so it stays fast for a scene of dozens of nodes.
 */
export function computeRepulsion(
  nodes: Node[],
  dragId: string,
  opts: RepelOptions = {},
): Map<string, { x: number; y: number }> {
  const { gap, passes, step, fallbackSize } = { ...DEFAULTS, ...opts };
  const out = new Map<string, { x: number; y: number }>();
  const drag = nodes.find((n) => n.id === dragId);
  if (!drag) return out;
  const rects = new Map<string, Rect>();
  rects.set(dragId, nodeRect(drag, fallbackSize));
  const pushable: Node[] = [];
  for (const n of nodes) {
    if (n.id === dragId || n.dragging) continue;
    pushable.push(n);
    rects.set(n.id, nodeRect(n, fallbackSize));
  }
  if (!pushable.length) return out;
  const moved = new Set<string>();
  let pushers = new Set<string>([dragId]);
  for (let pass = 0; pass <= passes && pushers.size; pass++) {
    const next = new Set<string>();
    for (const pusherId of pushers) {
      const pusherRect = rects.get(pusherId)!;
      for (const n of pushable) {
        if (n.id === pusherId) continue;
        const r = rects.get(n.id)!;
        const mtv = separation(pusherRect, r, gap);
        if (!mtv) continue;
        r.x += mtv.x;
        r.y += mtv.y;
        moved.add(n.id);
        next.add(n.id);
      }
    }
    pushers = next;
  }

  for (const id of moved) {
    const r = rects.get(id)!;
    const live = pushable.find((n) => n.id === id)!.position;
    if (Math.abs(r.x - live.x) < step && Math.abs(r.y - live.y) < step) continue;
    out.set(id, { x: Math.round(r.x), y: Math.round(r.y) });
  }
  return out;
}
