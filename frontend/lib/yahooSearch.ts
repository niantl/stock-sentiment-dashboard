export async function searchYahooSymbol(query: string): Promise<string> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Search failed");

  const json = await res.json();
  const quotes = json.quotes as any[];

  if (!quotes || quotes.length === 0) {
    throw new Error("No results found");
  }

  // Prefer NSE, then BSE, else first result
  const nse = quotes.find((q) => q.symbol?.endsWith(".NS"));
  if (nse) return nse.symbol;

  const bse = quotes.find((q) => q.symbol?.endsWith(".BO"));
  if (bse) return bse.symbol;

  return quotes[0].symbol; // fallback (US etc.)
}