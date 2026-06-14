import { useCallback } from 'react';
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
import { useMagneticDrag } from './lib';
import './lib/magnetic.css';
import { AgentNode, type AgentNodeType } from './AgentNode';

const nodeTypes = { agent: AgentNode };

/**
 * A dummy scene. The names and roles are made up. Drag one card into another and watch the rest
 * move aside. That push is the magnetic repel, which React Flow does not give you on its own.
 * The cards are 240px wide, so they start far enough apart to look clean. Repel keeps them apart
 * once you start dragging.
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

const initialEdges: Edge[] = [
  { id: 'a-b', source: 'architect', target: 'backend' },
  { id: 'a-f', source: 'architect', target: 'frontend' },
  { id: 'a-q', source: 'architect', target: 'qa' },
];

export function MagneticDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  // Magnetic repel. This one hook is the part React Flow does not give you.
  const { hostRef, onNodeDragStart, onNodeDrag, onNodeDragStop } = useMagneticDrag(setNodes);
  return (
    <div ref={hostRef} className="h-full w-full" style={{ background: '#f0f0f0' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
