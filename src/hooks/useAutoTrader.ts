import { useEffect, useRef } from 'react';
import { useSignalStore, type Signal } from '../store/useSignalStore';

const APP_ID = '1089';

const STRENGTH_RANK: Record<Signal['strength'], number> = {
  None: 0,
  Min: 1,
  Strong: 2,
  'Very Strong': 3,
};

export const useAutoTrader = () => {
  const {
    isBotEnabled,
    setBotEnabled,
    setBotStatus,
    setBotError,
    setAccountInfo,
    botConfig,
    signals,
    selectedMarket,
  } = useSignalStore();

  const wsRef = useRef<WebSocket | null>(null);
  const activeContractsRef = useRef<Set<number>>(new Set());
  const lastTradedSignalRef = useRef<string>('');
  const currencyRef = useRef<string>('USD');

  // 1. Manage Authorized Trading WebSocket when Auto-Trade is toggled ON/OFF
  useEffect(() => {
    if (!isBotEnabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      activeContractsRef.current.clear();
      useSignalStore.getState().setActiveContractCount(0);
      setBotStatus('IDLE');
      return;
    }

    if (!botConfig.apiToken.trim()) {
      setBotError('Please enter your Deriv API Token first.');
      setBotEnabled(false);
      return;
    }

    setBotStatus('CONNECTING');
    const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    wsRef.current = socket;

    socket.onopen = () => {
      useSignalStore.getState().addBotLog('Connected to Deriv Trading WS. Authorizing...');
      socket.send(JSON.stringify({ authorize: botConfig.apiToken.trim() }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const store = useSignalStore.getState();

      if (data.error) {
        const errMsg = `${data.error.code}: ${data.error.message}`;
        store.addBotLog(`[ERROR] ${errMsg}`);
        store.setBotError(errMsg);
        if (data.msg_type === 'authorize') {
          store.setBotStatus('ERROR');
          store.setBotEnabled(false);
        }
        return;
      }

      // 1. Authorization confirmed
      if (data.msg_type === 'authorize') {
        currencyRef.current = data.authorize.currency || 'USD';
        store.setAccountInfo({
          loginid: data.authorize.loginid,
          currency: currencyRef.current,
          balance: data.authorize.balance,
        });
        store.setBotStatus('AUTHORIZED');
        store.addBotLog(`Authorized as ${data.authorize.loginid} (${currencyRef.current})`);
      }

      // 2. Direct buy confirmation
      if (data.msg_type === 'buy') {
        const contractId = data.buy.contract_id;
        activeContractsRef.current.add(contractId);
        store.setActiveContractCount(activeContractsRef.current.size);
        store.addBotLog(
          `[BOUGHT] #${contractId} | Stake: $${data.buy.buy_price} | Payout: $${data.buy.payout}`
        );
      }

      // 3. Contract settlement update (deezbn_ws_bot.js logic)
      if (data.msg_type === 'proposal_open_contract') {
        const contract = data.proposal_open_contract;
        if (contract.is_sold) {
          activeContractsRef.current.delete(contract.contract_id);
          store.setActiveContractCount(activeContractsRef.current.size);

          const profit = Number(contract.profit);
          store.addBotProfit(profit);
          const updatedTotalProfit = useSignalStore.getState().totalProfit;
          const cfg = useSignalStore.getState().botConfig;

          if (profit > 0) {
            store.addBotLog(`[WIN] #${contract.contract_id} | +$${profit} | Session: $${updatedTotalProfit}`);
            store.setCurrentStake(cfg.baseStake);
          } else {
            const lossAmount = Math.abs(profit);
            store.addBotLog(`[LOSS] #${contract.contract_id} | -$${lossAmount} | Session: $${updatedTotalProfit}`);

            if (lossAmount >= cfg.maxSingleLoss) {
              store.addBotLog(`Loss ($${lossAmount}) >= Max ($${cfg.maxSingleLoss}). Resetting stake.`);
              store.setCurrentStake(cfg.baseStake);
            } else {
              const nextStake = Number((useSignalStore.getState().currentStake + lossAmount).toFixed(2));
              store.setCurrentStake(nextStake);
            }
          }

          // Check Target Profit stop condition
          if (updatedTotalProfit >= cfg.targetProfit) {
            store.addBotLog(`🎉 Target Profit ($${cfg.targetProfit}) reached! Stopping Auto-Trader.`);
            store.setBotStatus('TARGET_REACHED');
            store.setBotEnabled(false);
          }
        }
      }
    };

    socket.onclose = () => {
      if (useSignalStore.getState().isBotEnabled) {
        useSignalStore.getState().addBotLog('Trading WebSocket closed.');
        setBotStatus('IDLE');
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [isBotEnabled]);

  // 2. React to Signal Thresholds from SignalEngine
  useEffect(() => {
    const store = useSignalStore.getState();
    if (!store.isBotEnabled || store.botStatus !== 'AUTHORIZED') return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (signals.length === 0) return;

    const { botConfig: cfg, currentStake } = store;

    // Prevent overlapping trades unless allowed
    if (!cfg.allowOverlapping && activeContractsRef.current.size > 0) {
      return;
    }

    // Find first signal matching user's selected contract types & minimum strength threshold
    const minRank = STRENGTH_RANK[cfg.minStrength];
    const matchingSignal = signals.find(
      (s) =>
        cfg.allowedTypes.includes(s.type) &&
        STRENGTH_RANK[s.strength] >= minRank
    );

    if (!matchingSignal) return;

    // Deduplicate: don't fire twice on the exact same signal instance
    const signalKey = `${selectedMarket}-${matchingSignal.type}-${matchingSignal.threshold ?? ''}-${matchingSignal.timestamp}`;
    if (lastTradedSignalRef.current === signalKey) return;
    lastTradedSignalRef.current = signalKey;

    executeDirectBuy(matchingSignal, currentStake, selectedMarket, cfg.duration);
  }, [signals, selectedMarket]);

  const executeDirectBuy = (
    signal: Signal,
    stake: number,
    symbol: string,
    duration: number
  ) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const contractMap: Record<Signal['type'], string> = {
      OVER: 'DIGITOVER',
      UNDER: 'DIGITUNDER',
      EVEN: 'DIGITEVEN',
      ODD: 'DIGITODD',
    };

    const contractType = contractMap[signal.type];
    const stakeToUse = Number(stake.toFixed(2));

    const parameters: Record<string, any> = {
      amount: stakeToUse,
      basis: 'stake',
      contract_type: contractType,
      currency: currencyRef.current,
      duration,
      duration_unit: 't',
      symbol,
    };

    // DIGITOVER / DIGITUNDER require the digit barrier (threshold)
    if ((signal.type === 'OVER' || signal.type === 'UNDER') && signal.threshold !== undefined) {
      parameters.barrier = String(signal.threshold);
    }

    const buyPayload = {
      buy: 1,
      subscribe: 1,
      price: stakeToUse,
      parameters,
    };

    useSignalStore.getState().addBotLog(
      `Signal Triggered: ${signal.direction} (${signal.strength}, ${signal.confidence}%) -> Buying ${contractType} @ $${stakeToUse}`
    );
    socket.send(JSON.stringify(buyPayload));
  };
};
