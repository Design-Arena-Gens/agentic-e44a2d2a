"use client";

import { useMemo } from "react";
import { useTradingState } from "@/lib/store";

export function RSIControls() {
  const { rsiConfig, setRsiConfig } = useTradingState((state) => ({
    rsiConfig: state.rsiConfig,
    setRsiConfig: state.setRsiConfig,
  }));

  const sliders = useMemo(
    () => [
      {
        label: "Period",
        value: rsiConfig.period,
        min: 4,
        max: 40,
        step: 1,
        onChange: (value: number) => setRsiConfig({ period: value }),
      },
      {
        label: "Smoothing",
        value: rsiConfig.smoothing,
        min: 1,
        max: 10,
        step: 1,
        onChange: (value: number) => setRsiConfig({ smoothing: value }),
      },
      {
        label: "Overbought",
        value: rsiConfig.overbought,
        min: 55,
        max: 90,
        step: 1,
        onChange: (value: number) => setRsiConfig({ overbought: value }),
      },
      {
        label: "Oversold",
        value: rsiConfig.oversold,
        min: 10,
        max: 45,
        step: 1,
        onChange: (value: number) => setRsiConfig({ oversold: value }),
      },
    ],
    [rsiConfig, setRsiConfig]
  );

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.65)] p-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">RSI Controls</h3>
        <div className="text-xs text-slate-400">
          {rsiConfig.period} / {rsiConfig.smoothing}
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {sliders.map((slider) => (
          <label key={slider.label} className="block text-xs uppercase tracking-wide text-slate-400">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span>{slider.label}</span>
              <span className="text-slate-300">{slider.value}</span>
            </div>
            <input
              type="range"
              className="w-full"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={slider.value}
              onChange={(event) => slider.onChange(Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
