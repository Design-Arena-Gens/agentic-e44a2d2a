"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IPriceLine,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickData,
  CandlestickSeries,
} from "lightweight-charts";
import type {
  Candle,
  LivePriceUpdate,
  SupportResistanceZone,
  Timeframe,
  TradeSignal,
} from "@/lib/types";

interface TradingChartProps {
  candles: Candle[];
  zones: SupportResistanceZone[];
  signals: TradeSignal[];
  timeframe: Timeframe;
  livePrice?: LivePriceUpdate | null;
}

const toTimestamp = (ms: number): UTCTimestamp => Math.floor(ms / 1000) as UTCTimestamp;

export function TradingChart({
  candles,
  zones,
  signals,
  timeframe,
  livePrice,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const zoneLinesRef = useRef<IPriceLine[]>([]);
  const signalLinesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return () => undefined;
    }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#cbd5f5",
      },
      grid: {
        vertLines: { color: "rgba(55, 65, 81, 0.2)" },
        horzLines: { color: "rgba(55, 65, 81, 0.2)" },
      },
      crosshair: {
        mode: 1,
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(2),
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.3)",
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
    });
    resizeObserver.observe(container);

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      zoneLinesRef.current = [];
      signalLinesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }
    const data: CandlestickData<UTCTimestamp>[] = candles.map((candle) => ({
      time: toTimestamp(candle.openTime ?? candle.closeTime),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) {
      return;
    }

    zoneLinesRef.current.forEach((line) => series.removePriceLine(line));
    zoneLinesRef.current = [];

    zones.forEach((zone) => {
      const line = series.createPriceLine({
        price: zone.level,
        color: zone.type === "support" ? "#22c55e" : "#f97316",
        lineWidth: 1,
        axisLabelVisible: true,
        title: `${zone.type === "support" ? "S" : "R"} ${zone.level.toFixed(0)} (${zone.timeframe})`,
      });
      zoneLinesRef.current.push(line);
    });
  }, [zones]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) {
      return;
    }

    signalLinesRef.current.forEach((line) => series.removePriceLine(line));
    signalLinesRef.current = [];

    signals.forEach((signal) => {
      const line = series.createPriceLine({
        price: signal.price,
        color: signal.type === "buy" ? "#4ade80" : "#f87171",
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: `${signal.type.toUpperCase()} ${(signal.confidence * 100).toFixed(0)}%`,
      });
      signalLinesRef.current.push(line);
    });
  }, [signals]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !livePrice) {
      return;
    }
    series.update({
      time: toTimestamp(livePrice.time),
      open: livePrice.price,
      high: livePrice.price,
      low: livePrice.price,
      close: livePrice.price,
    });
  }, [livePrice]);

  return (
    <div className="relative h-96 w-full rounded-xl border border-[rgba(148,163,184,0.2)] bg-[rgba(15,23,42,0.7)] backdrop-blur" data-timeframe={timeframe}>
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded bg-[rgba(15,23,42,0.8)] px-3 py-1 text-xs font-medium text-slate-200">
        <span className="uppercase tracking-wide text-slate-400">TF</span>
        <span>{timeframe}</span>
      </div>
    </div>
  );
}
