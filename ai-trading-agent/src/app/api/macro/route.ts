import { NextResponse } from "next/server";

interface FearGreedResponse {
  data: Array<{ value: string }>;
}

interface GlobalData {
  data: {
    market_cap_percentage: Record<string, number>;
  };
}

function computeReturns(prices: Array<[number, number]>): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1][1];
    const current = prices[i][1];
    returns.push(Math.log(current / prev));
  }
  return returns;
}

function pearsonCorrelation(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  const meanA = a.reduce((acc, val) => acc + val, 0) / a.length;
  const meanB = b.reduce((acc, val) => acc + val, 0) / b.length;
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA ** 2;
    denomB += diffB ** 2;
  }
  if (denomA === 0 || denomB === 0) {
    return 0;
  }
  return numerator / Math.sqrt(denomA * denomB);
}

function computeVolatility(returns: number[]): number {
  if (returns.length === 0) {
    return 0;
  }
  const mean = returns.reduce((acc, val) => acc + val, 0) / returns.length;
  const variance =
    returns.reduce((acc, val) => acc + (val - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(365) * 100;
}

function scoreNewsMomentum(titles: string[]): number {
  if (titles.length === 0) {
    return 0;
  }
  const positiveKeywords = ["growth", "bull", "breakout", "surge", "rally"];
  const negativeKeywords = ["fall", "dump", "hack", "sell-off", "bear"];
  let score = 0;
  titles.forEach((title) => {
    const lower = title.toLowerCase();
    if (positiveKeywords.some((keyword) => lower.includes(keyword))) {
      score += 1;
    }
    if (negativeKeywords.some((keyword) => lower.includes(keyword))) {
      score -= 1;
    }
  });
  return Math.max(-1, Math.min(1, score / titles.length));
}

export async function GET() {
  try {
    const [ethResponse, btcResponse, globalResponse, fearGreedResponse, newsResponse] =
      await Promise.all([
        fetch(
          "https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false",
          { cache: "no-store" }
        ),
        fetch(
          "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false",
          { cache: "no-store" }
        ),
        fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" }),
        fetch("https://api.alternative.me/fng/?limit=1", { cache: "no-store" }),
        fetch(
          "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=ETH",
          { cache: "no-store" }
        ),
      ]);

    if (
      !ethResponse.ok ||
      !btcResponse.ok ||
      !globalResponse.ok ||
      !fearGreedResponse.ok ||
      !newsResponse.ok
    ) {
      throw new Error("Upstream API failure");
    }

    const [ethData, btcData, globalData, fearGreedData, newsData] = await Promise.all([
      ethResponse.json(),
      btcResponse.json(),
      globalResponse.json() as Promise<GlobalData>,
      fearGreedResponse.json() as Promise<FearGreedResponse>,
      newsResponse.json(),
    ]);

    const [ethHistoryResponse, btcHistoryResponse] = await Promise.all([
      fetch(
        "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=10",
        { cache: "no-store" }
      ),
      fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=10",
        { cache: "no-store" }
      ),
    ]);

    if (!ethHistoryResponse.ok || !btcHistoryResponse.ok) {
      throw new Error("Historical data unavailable");
    }

    const ethHistory = await ethHistoryResponse.json();
    const btcHistory = await btcHistoryResponse.json();

    const ethReturns = computeReturns(ethHistory.prices);
    const btcReturns = computeReturns(btcHistory.prices);
    const correlation = pearsonCorrelation(ethReturns.slice(-200), btcReturns.slice(-200));

    const volatilityIndex = computeVolatility(ethReturns.slice(-200));

    const headlines: string[] = (newsData.Data ?? [])
      .slice(0, 8)
      .map((item: { title: string }) => item.title);

    const newsMomentum = scoreNewsMomentum(headlines);

    const dominance = globalData.data.market_cap_percentage;

    const payload = {
      timestamp: Date.now(),
      btcPrice: btcData.market_data?.current_price?.usd ?? 0,
      ethPrice: ethData.market_data?.current_price?.usd ?? 0,
      btcDominance: dominance?.btc ?? 0,
      ethDominance: dominance?.eth ?? 0,
      marketCapChange24h: ethData.market_data?.market_cap_change_percentage_24h ?? 0,
      fearGreedIndex: Number(fearGreedData.data?.[0]?.value ?? null) || null,
      newsMomentum,
      newsHeadlines: headlines,
      btcCorrelation: Number.isFinite(correlation) ? Number(correlation.toFixed(3)) : 0,
      volatilityIndex: Number.isFinite(volatilityIndex)
        ? Number(volatilityIndex.toFixed(2))
        : 0,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Macro endpoint failed", error);
    return NextResponse.json({ error: "Failed to aggregate macro data" }, { status: 500 });
  }
}
