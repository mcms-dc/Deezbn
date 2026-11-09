import React from 'react';
import { MarketSelector } from './components/MarketSelector';
import { SignalDashboard } from './components/SignalDashboard';
import { PerformanceTracker } from './components/PerformanceTracker';
import { AuthPage } from './components/AuthPage';
import { useDerivAPI } from './hooks/useDerivAPI';
import { useSignalStore } from './store/useSignalStore';

function App() {
  const { isAuthenticated } = useSignalStore();

  // This hook MUST be called unconditionally at the top level
  useDerivAPI(isAuthenticated);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center bg-deriv-bg text-white">
      <header className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 text-white">
          DERIV <span className="text-deriv-accent">LIVE SIGNALS</span>
        </h1>
        <p className="text-deriv-muted text-sm">Real-time digit distribution analysis</p>
      </header>

      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        <MarketSelector />
        <SignalDashboard />
        <PerformanceTracker />
      </div>

      <footer className="mt-20 text-center">
        <p className="text-deriv-muted text-[10px] opacity-50 uppercase tracking-widest mb-2">
          Analysis powered by Z-Test Proportions & Brier Calibration
        </p>
        <p className="text-white text-xs font-medium">App made by Deezbn</p>
      </footer>
    </div>
  );
}

export default App;
