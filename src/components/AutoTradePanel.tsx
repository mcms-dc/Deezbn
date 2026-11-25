import React from 'react';
import { useSignalStore, type Signal } from '../store/useSignalStore';

const CONTRACT_TYPES: Array<Signal['type']> = ['OVER', 'UNDER', 'EVEN', 'ODD'];
const STRENGTH_OPTIONS: Array<'Min' | 'Strong' | 'Very Strong'> = ['Min', 'Strong', 'Very Strong'];

export const AutoTradePanel: React.FC = () => {
  const {
    isBotEnabled,
    setBotEnabled,
    botStatus,
    botError,
    accountInfo,
    botConfig,
    updateBotConfig,
    currentStake,
    totalProfit,
    resetBotSession,
    activeContractCount,
    botLogs,
  } = useSignalStore();

  const toggleContractType = (type: Signal['type']) => {
    const exists = botConfig.allowedTypes.includes(type);
    const next = exists
      ? botConfig.allowedTypes.filter((t) => t !== type)
      : [...botConfig.allowedTypes, type];
    updateBotConfig({ allowedTypes: next });
  };

  return (
    <div className="w-full max-w-4xl bg-gray-900/70 border border-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Header & Master Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-white">
              DEEZBN <span className="text-deriv-accent">AUTO-TRADER</span>
            </h2>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                botStatus === 'AUTHORIZED'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : botStatus === 'TARGET_REACHED'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : botStatus === 'ERROR'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-gray-800 text-deriv-muted'
              }`}
            >
              {botStatus}
            </span>
          </div>
          <p className="text-xs text-deriv-muted mt-1">
            {accountInfo
              ? `Account: ${accountInfo.loginid} • Currency: ${accountInfo.currency}`
              : 'Executes automatically when live signal threshold is reached'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetBotSession}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
          >
            Reset Session
          </button>

          <button
            onClick={() => setBotEnabled(!isBotEnabled)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition shadow-lg cursor-pointer ${
              isBotEnabled
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-emerald-500/20'
            }`}
          >
            {isBotEnabled ? 'STOP AUTO-TRADE' : 'ALLOW AUTO-TRADE'}
          </button>
        </div>
      </div>

      {botError && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-700 text-red-300 text-xs font-mono">
          {botError}
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* API Token */}
        <div className="md:col-span-3">
          <label className="block text-[11px] uppercase tracking-wider text-deriv-muted mb-1">
            Deriv API Token (Read + Trade scope)
          </label>
          <input
            type="password"
            disabled={isBotEnabled}
            value={botConfig.apiToken}
            onChange={(e) => updateBotConfig({ apiToken: e.target.value })}
            placeholder="Paste your Deriv API token here..."
            className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-sm text-white focus:outline-none focus:border-deriv-accent disabled:opacity-50"
          />
        </div>

        {/* Base Stake */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-deriv-muted mb-1">
            Base Stake ($)
          </label>
          <input
            type="number"
            step="0.5"
            min="0.35"
            disabled={isBotEnabled}
            value={botConfig.baseStake}
            onChange={(e) => updateBotConfig({ baseStake: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-sm text-white disabled:opacity-50"
          />
        </div>

        {/* Target Profit */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-deriv-muted mb-1">
            Target Profit ($)
          </label>
          <input
            type="number"
            step="1"
            min="1"
            disabled={isBotEnabled}
            value={botConfig.targetProfit}
            onChange={(e) => updateBotConfig({ targetProfit: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-sm text-white disabled:opacity-50"
          />
        </div>

        {/* Max Single Loss */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-deriv-muted mb-1">
            Max Loss Reset ($)
          </label>
          <input
            type="number"
            step="5"
            min="1"
            disabled={isBotEnabled}
            value={botConfig.maxSingleLoss}
            onChange={(e) => updateBotConfig({ maxSingleLoss: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-700 text-sm text-white disabled:opacity-50"
          />
        </div>
      </div>

      {/* Signal Trigger Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
        {/* Allowed Signal Types */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-deriv-muted mb-2">
            Execute On Signal Types
          </label>
          <div className="flex flex-wrap gap-2">
            {CONTRACT_TYPES.map((type) => {
              const active = botConfig.allowedTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleContractType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-deriv-accent/20 border-deriv-accent text-white'
                      : 'bg-gray-950 border-gray-800 text-deriv-muted'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Signal Threshold Strength */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-deriv-muted mb-2">
            Minimum Signal Threshold
          </label>
          <div className="flex gap-2">
            {STRENGTH_OPTIONS.map((strength) => (
              <button
                key={strength}
                type="button"
                onClick={() => updateBotConfig({ minStrength: strength })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                  botConfig.minStrength === strength
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-gray-950 border-gray-800 text-deriv-muted'
                }`}
              >
                {strength}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Bot Telemetry */}
      <div className="grid grid-cols-3 gap-3 mt-5 p-3 rounded-xl bg-gray-950 border border-gray-800 text-center">
        <div>
          <div className="text-[10px] uppercase text-deriv-muted">Next Stake</div>
          <div className="text-sm font-mono font-bold text-white">${currentStake.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-deriv-muted">Session Profit</div>
          <div
            className={`text-sm font-mono font-bold ${
              totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {totalProfit >= 0 ? `+$${totalProfit.toFixed(2)}` : `-$${Math.abs(totalProfit).toFixed(2)}`}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-deriv-muted">Active Trades</div>
          <div className="text-sm font-mono font-bold text-amber-400">{activeContractCount}</div>
        </div>
      </div>

      {/* Execution Log */}
      {botLogs.length > 0 && (
        <div className="mt-4 bg-black/60 border border-gray-800 rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1">
          {botLogs.map((log, idx) => (
            <div key={idx} className="text-gray-300">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
