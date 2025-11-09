import { NextResponse } from "next/server";
import type { Timeframe } from "@/lib/types";

const INTERVAL_MAP: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

const SYMBOL = "ETHUSDT";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const interval = (searchParams.get("interval") as Timeframe) ?? "1m";
  const limit = Number(searchParams.get("limit") ?? "500");

  if (!INTERVAL_MAP[interval]) {
    return NextResponse.json({ error: "Unsupported interval" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL_MAP[interval]}&limit=${limit}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = (await response.json()) as Array<[
      number,
      string,
      string,
      string,
      string,
      string,
      string,
      number,
      string,
      string,
      string,
      string,
    ]>;

    const candles = data.map((item) => ({
      openTime: item[0],
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      volume: Number(item[5]),
      closeTime: item[6],
      quoteVolume: Number(item[7]),
      trades: Number(item[8]),
    }));

    return NextResponse.json({ interval, candles });
  } catch (error) {
    console.error("Failed to fetch candles", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
