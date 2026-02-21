"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [symbol, setSymbol] = useState("");

  function handleSearch() {
    if (!symbol.trim()) return;
    router.push(`/dashboard?symbol=${symbol.toUpperCase()}`);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">StockSent</h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter stock symbol (e.g. TSLA, TCS)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="px-4 py-2 rounded bg-gray-800 border border-gray-700 outline-none"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
        >
          Search
        </button>
      </div>
    </div>
  );
}