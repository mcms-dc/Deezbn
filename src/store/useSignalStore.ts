import { create } from 'zustand';

export type Signal = {
  type: 'OVER' | 'UNDER' | 'EVEN' | 'ODD';
  threshold?: number;
  direction: string;
  confidence: number;
  strength: 'Min' | 'Strong' | 'Very Strong' | 'None';
  timestamp: number;
};

export type SignalPerformance = {
  type: 'OVER' | 'UNDER' | 'EVEN' | 'ODD';
  predicted: string;
  actual: number;
  success: boolean;
  confidence: number;
  timestamp: number;
};

interface SignalState {
  selectedMarket: string;
  setMarket: (market: string) => void;
  digits: number[];
  addDigit: (digit: number) => void;
  setDigits: (digits: number[]) => void;
  signals: Signal[];
  setSignals: (signals: Signal[]) => void;
  connectionStatus: 'CONNECTED' | 'ANALYZING' | 'DISCONNECTED';
  setConnectionStatus: (status: 'CONNECTED' | 'ANALYZING' | 'DISCONNECTED') => void;
  performance: SignalPerformance[];
  recordResult: (prediction: Signal, actualDigit: number) => void;
}

export const useSignalStore = create<SignalState>((set) => ({
  selectedMarket: 'R_100',
  setMarket: (market) => set({ selectedMarket: market, digits: [], performance: [] }),
  digits: [],
  addDigit: (digit) => set((state) => {
    // When adding a digit, we can check the last generated signal's result
    // This is handled in the hook to keep the store pure
    return {
      digits: [...state.digits, digit].slice(-500)
    };
  }),
  setDigits: (digits) => set({ digits }),
  signals: [],
  setSignals: (signals) => set({ signals }),
  connectionStatus: 'DISCONNECTED',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  performance: [],
  recordResult: (prediction, actualDigit) => set((state) => {
    const isSuccess = (prediction.type === 'EVEN' && actualDigit % 2 === 0) ||
                      (prediction.type === 'ODD' && actualDigit % 2 !== 0) ||
                      (prediction.type === 'UNDER' && actualDigit < (prediction.threshold || 0)) ||
                      (prediction.type === 'OVER' && actualDigit > (prediction.threshold || 0));

    const newRecord: SignalPerformance = {
      type: prediction.type,
      predicted: prediction.direction,
      actual: actualDigit,
      success: isSuccess,
      confidence: prediction.confidence,
      timestamp: Date.now(),
    };

    return {
      performance: [...state.performance, newRecord].slice(-100)
    };
  }),
}));
