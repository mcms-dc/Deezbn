import React from 'react';
import { useSignalStore } from '../store/useSignalStore';

const markets = [
  { name: 'Volatility 10 Index', symbol: 'R_10' },
  { name: 'Volatility 10 (1s) Index', symbol: '1HZ10V' },
  { name: 'Volatility 25 Index', symbol: 'R_25' },
  { name: 'Volatility 25 (1s) Index', symbol: '1HZ25V' },
  { name: 'Volatility 50 Index', symbol: 'R_50' },
  { name: 'Volatility 50 (1s) Index', symbol: '1HZ50V' },
  { name: 'Volatility 75 Index', symbol: 'R_75' },
  { name: 'Volatility 75 (1s) Index', symbol: '1HZ75V' },
  { name: 'Volatility 100 Index', symbol: 'R_100' },
  { name: 'Volatility 100 (1s) Index', symbol: '1HZ100V' },
];

export const MarketSelector: React.FC = () => {
  const { selectedMarket, setMarket } = useSignalStore();

  return (
    <div className="flex flex-col gap-2 mb-8">
      <label className="text-deriv-muted text-sm font-medium uppercase tracking-wider">
        Select Market / Index
      </label>
      <select
        value={selectedMarket}
        onChange={(e) => setMarket(e.target.value)}
        className="bg-deriv-card text-white p-3 rounded-lg border border-gray-700 focus:border-deriv-accent outline-none transition-all cursor-pointer"
      >
        {markets.map(m => (
          <option key={m.symbol} value={m.symbol}>{m.name}</option>
        ))}
      </select>
    </div>
  );
};
