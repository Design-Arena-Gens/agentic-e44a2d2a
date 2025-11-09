"use client";

import type { TimeframeAnalysis } from "@/lib/analysisEngine";
import type { TradeSignal } from "@/lib/types";
import { useTradingState } from "@/lib/store";

interface SignalsPanelProps {
  consolidated: TradeSignal[];
  perTimeframe: TimeframeAnalysis[];
  onFeedback: (signal: TradeSignal, outcome: "win" | "loss" | "breakeven") => void;
}

export function SignalsPanel({ consolidated, perTimeframe, onFeedback }: SignalsPanelProps) {
  const { signalHistory } = useTradingState((state) => ({
    signalHistory: state.signalHistory,
  }));

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.65)] p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">AI Trading Signals</h3>
        <div className="text-[11px] text-slate-500">Adaptive ML feedback enabled</div>
      </div>

      <div className="mt-4 space-y-3">
        {consolidated.length === 0 ? (
          <div className="rounded border border-dashed border-slate-700 p-4 text-xs text-slate-400">
            Waiting for confluence...
          </div>
        ) : (
          consolidated.map((signal) => (
            <div
              key={signal.id}
              className="flex flex-col gap-3 rounded-lg border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.7)] p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${signal.type === "buy" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
                  >
                    {signal.type.toUpperCase()}
                  </span>
                  <span className="text-slate-300">${signal.price.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(signal.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-indigo-300">
                  {(signal.confidence * 100).toFixed(1)}%
                </div>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-300">
                {signal.reason.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                Feedback:
                <button
                  type="button"
                  onClick={() => onFeedback(signal, "win")}
                  className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-300 hover:bg-emerald-500/30"
                >
                  Win
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(signal, "breakeven")}
                  className="rounded bg-slate-500/10 px-2 py-1 text-slate-300 hover:bg-slate-500/30"
                >
                  Flat
                </button>
                <button
                  type="button"
                  onClick={() => onFeedback(signal, "loss")}
                  className="rounded bg-rose-500/10 px-2 py-1 text-rose-300 hover:bg-rose-500/30"
                >
                  Loss
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Multi-Timeframe Breakdown
        </h4>
        <div className="mt-2 grid gap-2 text-[11px] text-slate-300">
          {perTimeframe.map((entry) => (
            <div
              key={entry.timeframe}
              className="flex items-center justify-between rounded border border-[rgba(148,163,184,0.12)] bg-[rgba(15,23,42,0.4)] px-3 py-2"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <span className="rounded bg-slate-700/60 px-2 py-[2px] text-[10px] uppercase tracking-wide">
                  {entry.timeframe}
                </span>
                <span>RSI {entry.features.at(-1)?.rsi.toFixed(1) ?? "--"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                Zones {entry.zones.length}
                <span className="h-4 w-px bg-slate-700" />
                Signals {entry.signals.length}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Recent Signal Outcomes
        </h4>
        <div className="mt-2 space-y-1 text-[11px] text-slate-400">
          {signalHistory.slice(0, 6).map((signal) => (
            <div
              key={`${signal.id}-history`}
              className="flex items-center justify-between rounded border border-[rgba(148,163,184,0.1)] bg-[rgba(15,23,42,0.35)] px-3 py-2"
            >
              <span>
                {signal.timeframe} {signal.type.toUpperCase()} @ ${signal.price.toFixed(2)}
              </span>
              <span className="flex items-center gap-2">
                {signal.outcome && (
                  <span
                    className={`rounded px-2 py-[2px] uppercase ${signal.outcome === "win" ? "bg-emerald-500/20 text-emerald-300" : signal.outcome === "loss" ? "bg-rose-500/20 text-rose-300" : "bg-slate-500/20 text-slate-200"}`}
                  >
                    {signal.outcome}
                  </span>
                )}
                {new Date(signal.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {signalHistory.length === 0 && <div>No feedback yet.</div>}
        </div>
      </div>
    </div>
  );
}
