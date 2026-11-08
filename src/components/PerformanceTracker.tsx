import React from 'react';
import { useSignalStore, type SignalPerformance } from '../store/useSignalStore';

export const PerformanceTracker: React.FC = () => {
  const { performance } = useSignalStore();

  const calculateAccuracy = (type: 'OVER' | 'UNDER' | 'EVEN' | 'ODD') => {
    const filtered = performance.filter(p => p.type === type);
    if (filtered.length === 0) return { acc: 0, count: 0 };
    const wins = filtered.filter(p => p.success).length;
    return { acc: (wins / filtered.length) * 100, count: filtered.length };
  };

  const stats = [
    { label: 'Even/Odd', type: 'EVEN' as const }, // Simplified: we'll calculate combined or just one
    { label: 'Over/Under', type: 'OVER' as const },
  ];

  // Special handling for Even/Odd combined
  const eoCombined = {
    ...calculateAccuracy('EVEN'),
    ...calculateAccuracy('ODD'),
    count: calculateAccuracy('EVEN').count + calculateAccuracy('ODD').count,
    acc: ((performance.filter(p => (p.type === 'EVEN' || p.type === 'ODD') && p.success).length) /
          (performance.filter(p => p.type === 'EVEN' || p.type === 'ODD').length || 1)) * 100
  };

  const ouCombined = {
    acc: ((performance.filter(p => (p.type === 'OVER' || p.type === 'UNDER') && p.success).length) /
          (performance.filter(p => p.type === 'OVER' || p.type === 'UNDER').length || 1)) * 100,
    count: performance.filter(p => p.type === 'OVER' || p.type === 'UNDER').length
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 p-6 rounded-2xl bg-deriv-card border border-gray-800">
      <h3 className="text-center text-deriv-muted text-xs font-bold uppercase tracking-widest mb-6">
        Real-Time Strategy Validation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center p-4 rounded-xl bg-black/20 border border-gray-800">
          <span className="text-deriv-muted text-xs mb-1">Even/Odd Accuracy</span>
          <span className={`text-3xl font-black ${eoCombined.acc >= 55 ? 'text-green-400' : 'text-white'}`}>
            {eoCombined.acc.toFixed(1)}%
          </span>
          <span className="text-[10px] text-deriv-muted mt-1">Based on {eoCombined.count} ticks</span>
        </div>

        <div className="flex flex-col items-center p-4 rounded-xl bg-black/20 border border-gray-800">
          <span className="text-deriv-muted text-xs mb-1">Over/Under Accuracy</span>
          <span className={`text-3xl font-black ${ouCombined.acc >= 55 ? 'text-green-400' : 'text-white'}`}>
            {ouCombined.acc.toFixed(1)}%
          </span>
          <span className="text-[10px] text-deriv-muted mt-1">Based on {ouCombined.count} ticks</span>
        </div>
      </div>

      {performance.length > 0 && (
        <div className="mt-6">
          <span className="text-deriv-muted text-[10px] uppercase text-center block mb-2">Recent Results</span>
          <div className="flex justify-center gap-2 overflow-hidden">
            {performance.slice(-10).reverse().map((p, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${p.success ? 'bg-green-500' : 'bg-red-500'}`}
                title={`${p.predicted} -> ${p.actual} (${p.success ? 'Win' : 'Loss'})`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
