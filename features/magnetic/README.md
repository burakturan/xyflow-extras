# Magnetic

![Magnetic drag in action](../../assets/magnetic.gif)

React Flow lets you drag a node, but the other nodes just sit there and overlap.
This makes them move. Drag a node into the others and they slide out of the way,
then stay where they land.

Copy the `lib` folder into your project. The only thing it needs is `@xyflow/react`.

```tsx
import { useMagneticDrag } from './lib';
import './lib/magnetic.css';

const { hostRef, onNodeDragStart, onNodeDrag, onNodeDragStop } = useMagneticDrag(setNodes);

<div ref={hostRef}>
  <ReactFlow
    onNodeDragStart={onNodeDragStart}
    onNodeDrag={onNodeDrag}
    onNodeDragStop={onNodeDragStop}
    {/* your nodes and edges */}
  />
</div>
```

The push is plain math in `lib/repel.ts`. The slide between steps is CSS, so there
is no animation loop eating your frames.

`Demo.tsx` and `AgentNode.tsx` are just the dummy scene used to show it off.
