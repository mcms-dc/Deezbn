import { useEffect, useRef } from 'react';
import { useSignalStore } from '../store/useSignalStore';
import { SignalEngine } from '../lib/SignalEngine';

const APP_ID = '1089'; // Default public App ID, user can change in env

export const useDerivAPI = (isAuthenticated: boolean) => {
  const {
    selectedMarket,
    addDigit,
    setDigits,
    setConnectionStatus,
    setSignals
  } = useSignalStore();

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const connect = () => {
      setConnectionStatus('ANALYZING');
      const socket = new WebSocket(`wss://api.derivws.com/trading/v1/options/ws/public?app_id=${APP_ID}`);

      socket.onopen = () => {
        setConnectionStatus('CONNECTED');

        // 1. Get Historical Data
        socket.send(JSON.stringify({
          ticks_history: selectedMarket,
          adjust_start_time: 1,
          count: 500,
          end: 'latest',
          style: 'ticks',
        }));

        // 2. Subscribe to Live Ticks
        socket.send(JSON.stringify({
          ticks: selectedMarket,
          subscribe: 1,
        }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.candles) {
          // Handle history
          const histDigits = data.candles.map((c: any) => {
            const quote = c.quote.toString();
            return parseInt(quote[quote.length - 1]);
          });
          setDigits(histDigits);
        }

        if (data.tick) {
          // Handle live tick
          const quote = data.tick.quote.toString();
          const digit = parseInt(quote[quote.length - 1]);

          // VALIDATION: Check the previous signal against this actual digit
          const currentSignals = useSignalStore.getState().signals;
          if (currentSignals.length > 0) {
            // We record the result for the strongest signal present when the tick arrived
            const strongest = currentSignals[0];
            useSignalStore.getState().recordResult(strongest, digit);
          }

          addDigit(digit);
        }
      };

      socket.onclose = () => {
        setConnectionStatus('DISCONNECTED');
        setTimeout(connect, 5000); // Auto-reconnect
      };

      socket.onerror = () => {
        setConnectionStatus('DISCONNECTED');
      };

      ws.current = socket;
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, [selectedMarket, isAuthenticated]);


  // Continuous Analysis Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const digits = useSignalStore.getState().digits;
      if (digits.length > 0) {
        const signals = SignalEngine.analyze(digits);
        setSignals(signals);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);
};
