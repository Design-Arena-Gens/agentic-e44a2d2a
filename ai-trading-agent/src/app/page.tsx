import { TradingDashboard } from "@/components/dashboard/TradingDashboard";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Agentic Ethereum AI Trading Suite
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Multi-timeframe confluence, adaptive RSI, and macro-aware intelligence for ETH price action.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Powered by Binance market data, Coingecko macro feeds, and adaptive ML reinforcement.
        </div>
      </header>
      <TradingDashboard />
    </main>
  );
}
