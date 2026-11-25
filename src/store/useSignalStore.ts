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

export interface BotConfig {
  apiToken: string;
  baseStake: number;
  targetProfit: number;
  maxSingleLoss: number;
  duration: number;
  minStrength: 'Min' | 'Strong' | 'Very Strong';
  allowedTypes: Array<'OVER' | 'UNDER' | 'EVEN' | 'ODD'>;
  allowOverlapping: boolean;
}

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

  // Auth State
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  userEmail: string | null;
  setUserEmail: (email: string | null) => void;

  // Deezbn Auto-Trader Bot State
  isBotEnabled: boolean;
  setBotEnabled: (enabled: boolean) => void;
  botStatus: 'IDLE' | 'CONNECTING' | 'AUTHORIZED' | 'TARGET_REACHED' | 'ERROR';
  setBotStatus: (status: 'IDLE' | 'CONNECTING' | 'AUTHORIZED' | 'TARGET_REACHED' | 'ERROR') => void;
  botError: string | null;
  setBotError: (error: string | null) => void;
  accountInfo: { loginid: string; currency: string; balance?: number } | null;
  setAccountInfo: (info: { loginid: string; currency: string; balance?: number } | null) => void;
  botConfig: BotConfig;
  updateBotConfig: (partial: Partial<BotConfig>) => void;
  currentStake: number;
  setCurrentStake: (stake: number) => void;
  totalProfit: number;
  addBotProfit: (profit: number) => void;
  resetBotSession: () => void;
  activeContractCount: number;
  setActiveContractCount: (count: number) => void;
  botLogs: string[];
  addBotLog: (msg: string) => void;
}

export const useSignalStore = create<SignalState>((set, get) => ({
  selectedMarket: 'R_100',
  setMarket: (market) => set({ selectedMarket: market, digits: [], performance: [] }),
  digits: [],
  addDigit: (digit) => set((state) => ({
    digits: [...state.digits, digit].slice(-500)
  })),
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

  isAuthenticated: false,
  setAuthenticated: (status) => set({ isAuthenticated: status }),
  userEmail: null,
  setUserEmail: (email) => set({ userEmail: email }),

  // Bot Defaults (matching deezbn_ws_bot.js)
  isBotEnabled: false,
  setBotEnabled: (enabled) => set({ isBotEnabled: enabled, botError: null }),
  botStatus: 'IDLE',
  setBotStatus: (status) => set({ botStatus: status }),
  botError: null,
  setBotError: (error) => set({ botError: error }),
  accountInfo: null,
  setAccountInfo: (info) => set({ accountInfo: info }),
  botConfig: {
    apiToken: '',
    baseStake: 1,
    targetProfit: 10,
    maxSingleLoss: 200,
    duration: 1,
    minStrength: 'Strong',
    allowedTypes: ['OVER', 'UNDER', 'EVEN', 'ODD'],
    allowOverlapping: false,
  },
  updateBotConfig: (partial) => set((state) => {
    const updated = { ...state.botConfig, ...partial };
    return {
      botConfig: updated,
      currentStake: partial.baseStake !== undefined ? partial.baseStake : state.currentStake,
    };
  }),
  currentStake: 1,
  setCurrentStake: (stake) => set({ currentStake: stake }),
  totalProfit: 0,
  addBotProfit: (profit) => set((state) => ({
    totalProfit: Number((state.totalProfit + profit).toFixed(2))
  })),
  resetBotSession: () => set({
    totalProfit: 0,
    currentStake: get().botConfig.baseStake,
    botLogs: [],
    botError: null,
  }),
  activeContractCount: 0,
  setActiveContractCount: (count) => set({ activeContractCount: count }),
  botLogs: [],
  addBotLog: (msg) => set((state) => ({
    botLogs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...state.botLogs].slice(0, 30)
  })),
}));
