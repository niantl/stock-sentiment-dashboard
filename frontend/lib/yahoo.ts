import { CandlestickData , UTCTimestamp } from "lightweight-charts";

type RangeKey = "1D" | "1W" | "1M" | "1Y" | "ALL";

const rangeMap: Record<RangeKey, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  "ALL": { range: "5y", interval: "1mo" },
};

export async function fetchYahooCandlesBySymbol(
  yahooSymbol: string,
  rangeKey: RangeKey
): Promise<CandlestickData[]> {
  const { range, interval } = rangeMap[rangeKey];

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch candles");

  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("No chart data");

  const timestamps: number[] = result.timestamp;
  const quotes = result.indicators.quote[0];

  const candles: CandlestickData[] = timestamps
    .map((t, i) => ({
      time: t as UTCTimestamp,
      open: quotes.open[i],
      high: quotes.high[i],
      low: quotes.low[i],
      close: quotes.close[i],
    }))
    .filter((c) => c.open && c.high && c.low && c.close);

  return candles;
}