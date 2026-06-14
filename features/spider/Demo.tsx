import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  type Edge,
  type OnConnect,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useSpiderWeb } from './lib';
// Reuse the agent card from the magnetic feature — same dummy roster, one source of the node card.
import { AgentNode, type AgentNodeType } from '../magnetic/AgentNode';

const nodeTypes = { agent: AgentNode };

/**
 * A dummy scene. Drag a card around: it spins live "threads" to the nearest cards, stronger the
 * closer they are — a spider's web drawn as you move. Let go and the nearest threads settle into
 * real edges. React Flow draws edges you define; the "connect to whatever is near me, live" part is
 * what this feature adds (companion to magnetic, which pushes nodes apart instead).
 */
const initialNodes: AgentNodeType[] = [
  { id: 'architect', type: 'agent', position: { x: 360, y: 40 },
    data: { name: 'Architect', role: 'System design · planning', engine: 'claude', model: 'Opus 4.8', online: true, accent: 'amber' } },
  { id: 'backend', type: 'agent', position: { x: 40, y: 320 },
    data: { name: 'Backend', role: 'API, modules, data layer', engine: 'claude', model: 'Sonnet 4.6', online: true, accent: 'sky' } },
  { id: 'frontend', type: 'agent', position: { x: 360, y: 320 },
    data: { name: 'Frontend', role: 'UI, components, a11y', engine: 'cursor', model: 'Composer', online: false, accent: 'violet' } },
  { id: 'qa', type: 'agent', position: { x: 680, y: 320 },
    data: { name: 'QA Gate', role: 'Checks before merge', engine: 'claude', model: 'Haiku 4.5', online: false, accent: 'emerald' } },
  { id: 'devops', type: 'agent', position: { x: 360, y: 600 },
    data: { name: 'DevOps', role: 'Deploy, infra, ops', engine: 'cursor', model: 'Composer', online: true, accent: 'rose' } },
];

export function SpiderDemo() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  // Spider-web. This one hook is the part React Flow does not give you.
  const { threads, onNodeDragStart, onNodeDrag, onNodeDragStop } = useSpiderWeb(nodes, setEdges);

  // Live threads render as transient edges, drawn under the settled ones with strength-based opacity.
  const threadEdges = useMemo<Edge[]>(
    () => threads.map((t) => ({
      id: t.id,
      source: t.source,
      target: t.target,
      sourceHandle: t.sourceSide,
      targetHandle: t.targetSide,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 1 + t.strength * 2, opacity: 0.25 + t.strength * 0.6 },
    })),
    [threads],
  );

  return (
    <div className="h-full w-full" style={{ background: '#f0f0f0' }}>
      <ReactFlow
        nodes={nodes}
        edges={[...edges, ...threadEdges]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        defaultEdgeOptions={{ style: { stroke: '#ccc' } }}
        fitView
        fitViewOptions={{ padding: 0.25 }}
      >
        <Background color="#ccc" gap={22} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
