import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic ETH AI Trader",
  description:
    "Autonomous Ethereum trading intelligence with multi-timeframe confluence, ML feedback loops, and macro-on-chain insight.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
