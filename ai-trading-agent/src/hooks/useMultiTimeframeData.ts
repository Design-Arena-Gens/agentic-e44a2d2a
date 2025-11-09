import useSWR from "swr";
import type { Candle, Timeframe } from "@/lib/types";

const fetchTimeframes = async (
  timeframes: Timeframe[]
): Promise<Partial<Record<Timeframe, Candle[]>>> => {
  const results = await Promise.all(
    timeframes.map(async (timeframe) => {
      const limit = timeframe === "1m" ? 600 : 500;
      const response = await fetch(
        `/api/candles?interval=${timeframe}&limit=${limit}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch timeframe ${timeframe}`);
      }
      const payload = await response.json();
      return [timeframe, payload.candles as Candle[]] as const;
    })
  );

  return Object.fromEntries(results);
};

export function useMultiTimeframeData(timeframes: Timeframe[]) {
  const { data, error, isLoading, mutate } = useSWR(
    ["multi-timeframes", ...timeframes],
    () => fetchTimeframes(timeframes),
    {
      refreshInterval: 40_000,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data ?? {},
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
