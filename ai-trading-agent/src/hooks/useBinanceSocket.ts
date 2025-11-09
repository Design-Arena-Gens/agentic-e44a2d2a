import { useEffect, useRef } from "react";
import type { LivePriceUpdate } from "@/lib/types";

interface Options {
  onMessage?: (update: LivePriceUpdate) => void;
}

const STREAM_URL = "wss://stream.binance.com:9443/ws/ethusdt@kline_1m";

export function useBinanceSocket({ onMessage }: Options = {}) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return () => undefined;
    }

    const socket = new WebSocket(STREAM_URL);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const kline = payload.k;
        if (kline) {
          onMessage?.({
            price: Number(kline.c),
            volume: Number(kline.v),
            time: Number(kline.T),
          });
        }
      } catch (error) {
        console.error("Binance socket parse error", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Binance socket error", error);
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [onMessage]);
}
