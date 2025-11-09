"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { TradingChart } from "@/components/chart/TradingChart";
import { RSIControls } from "@/components/controls/RSIControls";
import { AlertsManager } from "@/components/alerts/AlertsManager";
import { MacroOverview } from "@/components/macro/MacroOverview";
import { SignalsPanel } from "@/components/dashboard/SignalsPanel";
import { useMultiTimeframeData } from "@/hooks/useMultiTimeframeData";
import { useMacroSnapshot } from "@/hooks/useMacroSnapshot";
import { useBinanceSocket } from "@/hooks/useBinanceSocket";
import { runAnalysis, type TimeframeAnalysis } from "@/lib/analysisEngine";
import { useTradingState } from "@/lib/store";
import { useLearningAgent } from "@/lib/mlAgent";
import type {
  Candle,
  LivePriceUpdate,
  Timeframe,
  TradeSignal,
} from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function TradingDashboard() {
  const learningAgent = useLearningAgent();
  const { data: macroSnapshot, isLoading: macroLoading } = useMacroSnapshot();
  const { data: timeframeData, loading: dataLoading } = useMultiTimeframeData(TIMEFRAMES);
  const {
    rsiConfig,
    setActiveSignals,
    appendSignalHistory,
    alerts,
    toggleAlert,
  } = useTradingState((state) => ({
    rsiConfig: state.rsiConfig,
    setActiveSignals: state.setActiveSignals,
    appendSignalHistory: state.appendSignalHistory,
    alerts: state.alerts,
    toggleAlert: state.toggleAlert,
  }));

  const [livePrice, setLivePrice] = useState<LivePriceUpdate | null>(null);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("5m");

  const handleLivePrice = useCallback((update: LivePriceUpdate) => {
    setLivePrice(update);
  }, []);

  useBinanceSocket({ onMessage: handleLivePrice });

  const datasetsReady = useMemo(
    () =>
      TIMEFRAMES.every(
        (timeframe) => Array.isArray(timeframeData?.[timeframe]) && timeframeData?.[timeframe]?.length
      ),
    [timeframeData]
  );

  const analysisResult = useMemo(() => {
    if (!datasetsReady) {
      return null;
    }
    const dataset = Object.fromEntries(
      TIMEFRAMES.map((timeframe) => [timeframe, timeframeData?.[timeframe] as Candle[]])
    ) as Record<Timeframe, Candle[]>;

    return runAnalysis(dataset, {
      rsiConfig,
      macro: macroSnapshot ?? null,
      learning: learningAgent,
    });
  }, [datasetsReady, timeframeData, rsiConfig, macroSnapshot, learningAgent]);

  useEffect(() => {
    if (!analysisResult) {
      return;
    }
    setActiveSignals(analysisResult.consolidatedSignals);
  }, [analysisResult, setActiveSignals]);

  const timeframeLookup = useMemo(() => {
    if (!analysisResult) {
      return new Map<Timeframe, TimeframeAnalysis>();
    }
    return new Map(
      analysisResult.perTimeframe.map((entry) => [entry.timeframe, entry] as const)
    );
  }, [analysisResult]);

  const chartSource = useMemo(() => {
    if (!analysisResult) {
      return null;
    }
    return (
      timeframeLookup.get(selectedTimeframe) ??
      timeframeLookup.get("5m") ??
      analysisResult.perTimeframe.at(0) ??
      null
    );
  }, [analysisResult, selectedTimeframe, timeframeLookup]);

  useEffect(() => {
    if (!analysisResult || !chartSource) {
      return;
    }

    const activeAlerts = alerts.filter((alert) => alert.active);
    if (activeAlerts.length === 0) {
      return;
    }

    const latestPrice = livePrice?.price ?? chartSource.candles.at(-1)?.close ?? 0;
    const latestFeature = chartSource.features.at(-1);
    const triggered: string[] = [];

    activeAlerts.forEach((alert) => {
      if (alert.type === "price" && latestPrice) {
        if (
          (alert.direction === "above" && latestPrice >= alert.threshold) ||
          (alert.direction === "below" && latestPrice <= alert.threshold)
        ) {
          triggered.push(`${alert.label}: Price ${alert.direction} ${alert.threshold}`);
          toggleAlert(alert.id);
        }
      } else if (alert.type === "rsi" && latestFeature) {
        if (
          (alert.direction === "above" && latestFeature.rsi >= alert.threshold) ||
          (alert.direction === "below" && latestFeature.rsi <= alert.threshold)
        ) {
          triggered.push(`${alert.label}: RSI ${alert.direction} ${alert.threshold}`);
          toggleAlert(alert.id);
        }
      } else if (alert.type === "signal" && analysisResult) {
        const timeframeSignals = timeframeLookup.get(alert.timeframe ?? chartSource.timeframe);
        const hit = timeframeSignals?.signals.some(
          (signal) => signal.confidence * 100 >= alert.threshold
        );
        if (hit) {
          triggered.push(`${alert.label}: Signal confidence ${alert.threshold}%`);
          toggleAlert(alert.id);
        }
      }
    });

    if (triggered.length) {
      startTransition(() => {
        setAlertMessages((prev) => [...triggered, ...prev].slice(0, 6));
      });
      triggered.forEach((message) => {
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("Trading Alert", { body: message });
          }
        }
      });
    }
  }, [analysisResult, alerts, chartSource, livePrice, timeframeLookup, toggleAlert]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        void Notification.requestPermission();
      }
    }
  }, []);

  const handleFeedback = useCallback(
    (signal: TradeSignal, outcome: "win" | "loss" | "breakeven") => {
      learningAgent.updateWithOutcome(signal, outcome);
      appendSignalHistory({ ...signal, outcome });
    },
    [appendSignalHistory, learningAgent]
  );

  return (
    <div className="space-y-6">
      {alertMessages.length > 0 && (
        <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-4 text-xs text-indigo-200">
          <div className="font-semibold uppercase tracking-wide">Triggered Alerts</div>
          <ul className="mt-2 space-y-1">
            {alertMessages.map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {TIMEFRAMES.map((timeframe) => (
              <button
                key={timeframe}
                type="button"
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  timeframe === selectedTimeframe
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>

          {dataLoading || !chartSource ? (
            <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-400">
              Loading multi-timeframe market data...
            </div>
          ) : (
            <TradingChart
              candles={chartSource.candles}
              zones={chartSource.zones}
              signals={chartSource.signals}
              timeframe={chartSource.timeframe}
              livePrice={livePrice}
            />
          )}

          <SignalsPanel
            consolidated={analysisResult?.consolidatedSignals ?? []}
            perTimeframe={analysisResult?.perTimeframe ?? []}
            onFeedback={handleFeedback}
          />
        </div>

        <div className="space-y-4">
          <MacroOverview snapshot={macroSnapshot ?? null} loading={macroLoading} />
          <RSIControls />
          <AlertsManager />
        </div>
      </section>
    </div>
  );
}
