import React from 'react';
import type { Signal } from '../store/useSignalStore';

interface SignalCardProps {
  signal: Signal;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Very Strong': return 'text-green-400 border-green-500/50 bg-green-500/10';
      case 'Strong': return 'text-green-300 border-green-400/30 bg-green-400/5';
      case 'Min': return 'text-green-200 border-green-300/20 bg-green-300/5';
      default: return 'text-deriv-muted border-gray-700 bg-transparent';
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${getStrengthColor(signal.strength)}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold uppercase opacity-70">{signal.type}</span>
        <span className="text-[10px] font-mono opacity-50">
          {new Date(signal.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <div className="text-2xl font-black mb-1">{signal.direction}</div>
      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs block opacity-70">Confidence</span>
          <span className="text-lg font-bold">{signal.confidence.toFixed(1)}%</span>
        </div>
        <div className="text-right">
          <span className="text-xs block opacity-70">Strength</span>
          <span className="text-sm font-medium">{signal.strength}</span>
        </div>
      </div>
    </div>
  );
};
