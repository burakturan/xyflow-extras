import { useState } from 'react';
import { MagneticDemo } from '../features/magnetic/Demo';
import { SpiderDemo } from '../features/spider/Demo';

/**
 * The shell. A floating segmented bar switches between the self-contained feature demos. Each feature
 * lives in its own folder under features/; add one here as a new segment. The bar styling stays small
 * and clean (Tailwind only) so the demos themselves are the focus.
 */
const FEATURES = [
  { id: 'magnetic', label: 'Magnetic', Demo: MagneticDemo },
  { id: 'spider', label: 'Spider-web', Demo: SpiderDemo },
] as const;

type FeatureId = (typeof FEATURES)[number]['id'];

export default function App() {
  const [active, setActive] = useState<FeatureId>('magnetic');
  const Demo = FEATURES.find((f) => f.id === active)!.Demo;

  return (
    <div className="relative h-screen w-screen">
      <Demo />

      {/* Floating segmented switch · feature picker */}
      <div className="absolute left-1/2 top-5 z-50 -translate-x-1/2">
        <div className="inline-flex gap-0.5 rounded-[10px] border border-black/5 bg-slate-100/90 p-0.5 shadow-[0_4px_18px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur">
          {FEATURES.map((f) => {
            const on = f.id === active;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActive(f.id)}
                className={[
                  'rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors',
                  on
                    ? 'bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.12)]'
                    : 'cursor-pointer text-slate-500 hover:bg-white/70 hover:text-slate-700',
                ].join(' ')}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
