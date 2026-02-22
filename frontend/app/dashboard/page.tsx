"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
//import PriceChart from "@/components/PriceChart";

const BACKEND_URL = "http://localhost:8000"; // <-- change if needed

type Candle = {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") || "INFY";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [input, setInput] = useState(initialSymbol);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [priceData, setPriceData] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [technicalSignal, setTechnicalSignal] = useState<string>("");
  const [candles, setCandles] = useState<any[]>([]);

  async function loadStock(sym: string) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/api/stock?symbol=${encodeURIComponent(sym)}`);
      if (!res.ok) throw new Error("API failed");

      const json = await res.json();

      // Set top cards data
      setPriceData(json.price_data);
      setSentiment(json.sentiment);
      setTechnicalSignal(json.technical_signal);

      // Map candle data to lightweight-charts format
      const mapped = (json.candle_data as Candle[]).map((c) => ({
        time: c.Date,        // "YYYY-MM-DD" works as BusinessDay
        open: c.Open,
        high: c.High,
        low: c.Low,
        close: c.Close,
      }));

      setCandles(mapped);
    } catch (e) {
      console.error(e);
      setError("Could not load stock data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStock(symbol);
  }, [symbol]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="p-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search stock (e.g. INFY, TCS, AAPL)"
            className="flex-1 px-4 py-2 rounded bg-gray-800 border border-gray-700 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                setSymbol(input.trim().toUpperCase());
              }
            }}
          />
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              if (input.trim()) {
                setSymbol(input.trim().toUpperCase());
              }
            }}
          >
            Search
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">StockSent Dashboard</h1>
          <span className="text-gray-400">Market Overview</span>
        </div>

        {loading && (
          <div className="text-gray-400 mb-4">Loading...</div>
        )}

        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}

        {!loading && !error && priceData && (
          <>
            {/* Price Card */}
            <div className="bg-gray-800 rounded-xl p-6 flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold">{symbol}</h2>
                <p className="text-gray-400">Market</p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-bold">
                  ${priceData.current_price}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* PE + PB */}
              <div className="bg-gray-800 rounded-xl p-6 grid grid-cols-2 divide-x divide-gray-700">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-sm mb-1">PE Ratio</p>
                  <p className="text-3xl font-bold">{priceData.pe_ratio ?? "-"}</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <p className="text-gray-400 text-sm mb-1">PB Ratio</p>
                  <p className="text-3xl font-bold">{priceData.pb_ratio ?? "-"}</p>
                </div>
              </div>

              {/* 52W Range */}
              <div className="bg-gray-800 rounded-xl p-6">
                <p className="text-gray-400 text-sm mb-2">52W Range</p>

                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>${priceData.low_52w ?? "-"}</span>
                  <span>${priceData.high_52w ?? "-"}</span>
                </div>

                <p className="text-center text-sm text-gray-400 mt-3">
                  Current: ${priceData.current_price}
                </p>
              </div>
            </div>

            {/* Sentiment + Technical */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Sentiment */}
              <div className="bg-gray-800 rounded-xl p-6">
                <p className="text-gray-400 text-sm mb-2">Market Sentiment</p>

                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${Math.min(
                        Math.max((sentiment?.sentiment_score + 1) * 50, 0),
                        100
                      )}%`,
                    }}
                  ></div>
                </div>

                <p className="text-center mt-3 font-semibold text-green-400">
                  {sentiment?.sentiment_label ?? "Neutral"}
                </p>
              </div>

              {/* Technical Signal */}
              <div className="bg-gray-800 rounded-xl p-6 flex flex-col justify-center items-center">
                <p className="text-gray-400 text-sm mb-3">Technical Signal</p>

                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white">
                  {technicalSignal}
                </span>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-gray-800 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Price Chart</h3>

              <div className="bg-gray-900 rounded-lg p-2 h-[380px]">
                
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}