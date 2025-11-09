"use client";

import type { MacroSnapshot } from "@/lib/types";

interface MacroOverviewProps {
  snapshot: MacroSnapshot | null;
  loading: boolean;
}

export function MacroOverview({ snapshot, loading }: MacroOverviewProps) {
  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.65)] p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Macro & On-Chain Factors</h3>
        <span className="text-[11px] text-slate-500">
          {snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : "--"}
        </span>
      </div>
      {loading ? (
        <div className="text-xs text-slate-400">Loading macro landscape...</div>
      ) : !snapshot ? (
        <div className="text-xs text-slate-400">Macro data unavailable.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Metric label="ETH Price" value={`$${snapshot.ethPrice.toLocaleString()}`}
            accent
          />
          <Metric label="BTC Price" value={`$${snapshot.btcPrice.toLocaleString()}`} />
          <Metric
            label="Fear & Greed"
            value={snapshot.fearGreedIndex !== null ? snapshot.fearGreedIndex.toString() : "--"}
            tone={snapshot.fearGreedIndex !== null && snapshot.fearGreedIndex > 60 ? "positive" : snapshot.fearGreedIndex !== null && snapshot.fearGreedIndex < 40 ? "negative" : undefined}
          />
          <Metric
            label="ETH Dominance"
            value={`${snapshot.ethDominance.toFixed(2)}%`}
            tone={snapshot.ethDominance > snapshot.btcDominance ? "positive" : undefined}
          />
          <Metric label="BTC Dominance" value={`${snapshot.btcDominance.toFixed(2)}%`} />
          <Metric
            label="24h Market Cap Change"
            value={`${snapshot.marketCapChange24h.toFixed(2)}%`}
            tone={snapshot.marketCapChange24h >= 0 ? "positive" : "negative"}
          />
          <Metric
            label="News Momentum"
            value={formatMomentum(snapshot.newsMomentum)}
            tone={snapshot.newsMomentum > 0 ? "positive" : snapshot.newsMomentum < 0 ? "negative" : undefined}
          />
          <Metric
            label="BTC Correlation"
            value={snapshot.btcCorrelation.toFixed(2)}
            tone={Math.abs(snapshot.btcCorrelation) < 0.4 ? "positive" : undefined}
          />
          <Metric label="Volatility Index" value={snapshot.volatilityIndex.toFixed(2)} />
        </div>
      )}
      {snapshot?.newsHeadlines?.length ? (
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            News Drivers
          </div>
          <ul className="mt-2 space-y-1 text-[11px] text-slate-300">
            {snapshot.newsHeadlines.slice(0, 4).map((headline) => (
              <li key={headline} className="flex gap-2">
                <span className="text-slate-500">•</span>
                <span>{headline}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatMomentum(value: number): string {
  if (value > 0.5) return "Strong +";
  if (value > 0.1) return "Mild +";
  if (value < -0.5) return "Strong -";
  if (value < -0.1) return "Mild -";
  return "Neutral";
}

function Metric({
  label,
  value,
  tone,
  accent,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  accent?: boolean;
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-300"
      : tone === "negative"
        ? "text-rose-300"
        : "text-slate-200";
  return (
    <div
      className={`rounded-lg border border-[rgba(148,163,184,0.12)] px-3 py-2 ${accent ? "bg-[rgba(79,70,229,0.12)]" : "bg-[rgba(15,23,42,0.4)]"}`}
    >
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
