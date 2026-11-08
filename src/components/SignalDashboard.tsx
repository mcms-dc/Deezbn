import React from 'react';
import { useSignalStore } from '../store/useSignalStore';
import { SignalCard } from './SignalCard';

export const SignalDashboard: React.FC = () => {
  const { signals, connectionStatus } = useSignalStore();

  // Group signals by category
  const overUnder = signals.filter(s => s.type === 'OVER' || s.type === 'UNDER');
  const evenOdd = signals.filter(s => s.type === 'EVEN' || s.type === 'ODD');

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' :
          connectionStatus === 'ANALYZING' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <span className="text-xs font-mono text-deriv-muted">{connectionStatus}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Over/Under Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-deriv-muted text-xs font-bold uppercase tracking-widest mb-2">Over / Under</h2>
          {overUnder.length > 0 ? (
            overUnder.slice(0, 2).map((s, i) => <SignalCard key={i} signal={s} />)
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-700 rounded-xl text-deriv-muted text-sm">
              NO STRONG OVER/UNDER SIGNAL
            </div>
          )}
        </div>

        {/* Even/Odd Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-deriv-muted text-xs font-bold uppercase tracking-widest mb-2">Even / Odd</h2>
          {evenOdd.length > 0 ? (
            evenOdd.slice(0, 1).map((s, i) => <SignalCard key={i} signal={s} />)
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-700 rounded-xl text-deriv-muted text-sm">
              NO STRONG EVEN/ODD SIGNAL
            </div>
          )}
        </div>
      </div>

      {signals.length === 0 && connectionStatus === 'CONNECTED' && (
        <div className="mt-8 text-center text-deriv-muted text-sm italic">
          Analyzing market distribution...
        </div>
      )}
    </div>
  );
};
