import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const range = searchParams.get("range") || "1M";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  // Map ranges to Yahoo params
  const rangeMap: Record<string, { range: string; interval: string }> = {
    "1D": { range: "1d", interval: "5m" },
    "1W": { range: "5d", interval: "15m" },
    "1M": { range: "1mo", interval: "1d" },
    "1Y": { range: "1y", interval: "1wk" },
    "ALL": { range: "5y", interval: "1mo" },
  };

  const { range: yahooRange, interval } = rangeMap[range] || rangeMap["1M"];

  // Build Yahoo URL
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${yahooRange}&interval=${interval}`;

  const res = await fetch(yahooUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Yahoo fetch failed" }, { status: 500 });
  }

  const json = await res.json();
  return NextResponse.json(json);
}