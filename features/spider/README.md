# Spider-web

![Spider-web in action](../../assets/spider.gif)

React Flow draws the edges you define, but it has no notion of "connect to whatever
is near me as I move." This adds that. Drag a node and it spins live threads to the
nearest nodes, like a web being drawn between them. The nearer a node, the stronger
the thread. Each thread grabs the side facing the neighbour. Let go and the closest
few threads settle into real edges, the rest fade.

Copy the `lib` folder into your project. The only thing it needs is `@xyflow/react`.

```tsx
import { useSpiderWeb } from './lib';

const [nodes, , onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges] = useEdgesState<Edge>([]);
const { threads, onNodeDragStart, onNodeDrag, onNodeDragStop } = useSpiderWeb(nodes, setEdges);

// the live threads render as transient edges next to your real ones
const threadEdges = threads.map((t) => ({
  id: t.id, source: t.source, target: t.target,
  sourceHandle: t.sourceSide, targetHandle: t.targetSide, animated: true,
  style: { strokeWidth: 1 + t.strength * 2, opacity: 0.25 + t.strength * 0.6 },
}));

<ReactFlow
  edges={[...edges, ...threadEdges]}
  onNodeDragStart={onNodeDragStart}
  onNodeDrag={onNodeDrag}
  onNodeDragStop={onNodeDragStop}
  {/* your nodes */}
/>
```

The web is plain math in `lib/useSpiderWeb.ts`: nearest-within-reach picks the
threads, geometry picks which side each one grabs. Your node needs a handle on each
side (id = `top`/`right`/`bottom`/`left`) so a thread can leave one card's right and
enter the other's left.

`Demo.tsx` reuses the agent card from the magnetic feature as the dummy scene.
