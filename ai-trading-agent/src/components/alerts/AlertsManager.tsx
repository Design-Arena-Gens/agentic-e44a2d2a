"use client";

import { FormEvent, useState } from "react";
import { useTradingState } from "@/lib/store";
import type { AlertCondition, Timeframe } from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function AlertsManager() {
  const { alerts, addAlert, toggleAlert, removeAlert } = useTradingState((state) => ({
    alerts: state.alerts,
    addAlert: state.addAlert,
    toggleAlert: state.toggleAlert,
    removeAlert: state.removeAlert,
  }));

  const [form, setForm] = useState<{
    label: string;
    type: AlertCondition["type"];
    direction: AlertCondition["direction"];
    threshold: number;
    timeframe: Timeframe;
  }>({
    label: "",
    type: "price",
    direction: "above",
    threshold: 0,
    timeframe: "1m",
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.label) {
      return;
    }
    const alert: AlertCondition = {
      id: crypto.randomUUID(),
      label: form.label,
      type: form.type,
      direction: form.direction,
      threshold: form.threshold,
      timeframe: form.type === "signal" ? form.timeframe : undefined,
      active: true,
    };
    addAlert(alert);
    setForm((prev) => ({ ...prev, label: "" }));
  };

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,0.18)] bg-[rgba(15,23,42,0.65)] p-4 backdrop-blur">
      <h3 className="text-sm font-semibold text-slate-200">Alerts</h3>
      <form onSubmit={onSubmit} className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <input
          className="col-span-2"
          placeholder="Alert label"
          value={form.label}
          onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
        />
        <select
          value={form.type}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, type: event.target.value as AlertCondition["type"] }))
          }
        >
          <option value="price">Price</option>
          <option value="rsi">RSI</option>
          <option value="signal">Signal</option>
        </select>
        <select
          value={form.direction}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, direction: event.target.value as AlertCondition["direction"] }))
          }
        >
          <option value="above">Above</option>
          <option value="below">Below</option>
          <option value="cross">Cross</option>
        </select>
        <input
          type="number"
          step="0.1"
          placeholder="Threshold"
          value={form.threshold}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, threshold: Number(event.target.value) }))
          }
        />
        {form.type === "signal" ? (
          <select
            value={form.timeframe}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, timeframe: event.target.value as Timeframe }))
            }
          >
            {TIMEFRAMES.map((timeframe) => (
              <option key={timeframe} value={timeframe}>
                {timeframe}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center text-[11px] text-slate-400">
            {form.type === "price" ? "Price trigger" : "RSI trigger"}
          </div>
        )}
        <button
          type="submit"
          className="col-span-2 rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
        >
          Add Alert
        </button>
      </form>

      <div className="mt-4 space-y-2 text-xs">
        {alerts.length === 0 ? (
          <div className="rounded border border-dashed border-slate-700 p-3 text-center text-slate-500">
            No alerts configured.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-lg border border-[rgba(148,163,184,0.15)] bg-[rgba(15,23,42,0.7)] px-3 py-2"
            >
              <div>
                <div className="font-medium text-slate-200">{alert.label}</div>
                <div className="text-[11px] text-slate-400">
                  {alert.type.toUpperCase()} {alert.direction} {alert.threshold}
                  {alert.timeframe ? ` (${alert.timeframe})` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAlert(alert.id)}
                  className={`rounded px-2 py-1 text-[11px] font-semibold ${alert.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-400"}`}
                >
                  {alert.active ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => removeAlert(alert.id)}
                  className="rounded px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
