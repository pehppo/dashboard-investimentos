export interface BrapiQuote {
  ticker: string;
  price: number;
  asOf: string;
}

interface BrapiQuoteResult {
  symbol: string;
  regularMarketPrice: number | null;
  regularMarketTime: string | null;
}

interface BrapiResponse {
  results?: BrapiQuoteResult[];
}

export async function fetchQuotes(tickers: string[]): Promise<BrapiQuote[]> {
  if (tickers.length === 0) return [];

  const token = process.env.BRAPI_TOKEN;
  if (!token) return [];

  const url = `https://brapi.dev/api/quote/${tickers.join(",")}?token=${token}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`brapi.dev respondeu ${res.status}`);
  }

  const data = (await res.json()) as BrapiResponse;

  return (data.results ?? [])
    .filter((r) => r.regularMarketPrice != null)
    .map((r) => ({
      ticker: r.symbol,
      price: r.regularMarketPrice as number,
      asOf: r.regularMarketTime ?? new Date().toISOString(),
    }));
}
