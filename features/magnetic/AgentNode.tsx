/**
 * A light agent card used as a custom React Flow node. A node is just a React component, so this
 * one shows an avatar, a name, a role, an online dot, and a footer with the model and its logo.
 * All the data here is dummy. Styled with Tailwind, nothing else needed.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

/** Accent is a name, not a class string. That way the Tailwind classes stay written out in full, so
 *  the build never strips them. Add a colour here to make it available. */
export type AgentAccent = 'amber' | 'sky' | 'violet' | 'emerald' | 'rose' | 'slate';

const ACCENT_TEXT: Record<AgentAccent, string> = {
  amber: 'text-amber-500',
  sky: 'text-sky-500',
  violet: 'text-violet-500',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
  slate: 'text-slate-500',
};

export type AgentData = {
  name: string;
  role: string;
  /** Picks the footer logo and where the model line comes from. */
  engine: 'claude' | 'cursor';
  model: string;
  online?: boolean;
  accent?: AgentAccent;
};

// Node type (data + the 'agent' tag). Named *Type so it never collides with the component.
export type AgentNodeType = Node<AgentData, 'agent'>;

const LOGO: Record<AgentData['engine'], string> = {
  claude: '/claude.svg',
  cursor: '/cursor.png',
};

function AgentNodeImpl({ data }: NodeProps<AgentNodeType>) {
  const initial = data.name.trim().charAt(0).toUpperCase();
  const accentText = ACCENT_TEXT[data.accent ?? 'slate'];
  const handle = data.name.toLowerCase().replace(/\s+/g, '');
  const statusLabel = data.online ? 'online' : 'offline';
  return (
    <div
      role="group"
      aria-label={`${data.name} · ${data.role} · ${statusLabel}`}
      className="w-60 overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      {/* A handle on each side, id = side name. The spider-web feature attaches a thread to the side
          facing the neighbour (left/right/top/bottom); a source+target pair per side lets a thread
          leave one card's right and enter the other's left, etc. Tiny + neutral, don't clutter. */}
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
        const pos = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left }[side];
        return (
          <span key={side}>
            <Handle id={side} type="source" position={pos} className="!size-1.5 !border-slate-300 !bg-white" />
            <Handle id={side} type="target" position={pos} className="!size-1.5 !border-slate-300 !bg-white" />
          </span>
        );
      })}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="relative inline-flex">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold ${accentText}`}>
            {initial}
          </span>
          <span
            title={statusLabel}
            aria-label={statusLabel}
            className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-white ${data.online ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-800">{data.name}</div>
          <div className="truncate text-[11px] leading-snug text-slate-500">{data.role}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-3 py-1.5">
        <img src={LOGO[data.engine]} alt="" aria-hidden className="size-3 shrink-0 object-contain" />
        <span className="truncate text-[10px] font-medium text-slate-400">{data.model}</span>
        <span className="ml-auto text-[10px] text-slate-300">@{handle}</span>
      </div>
    </div>
  );
}

export const AgentNode = memo(AgentNodeImpl);
