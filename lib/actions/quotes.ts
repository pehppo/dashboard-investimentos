import { createClient } from "@/lib/supabase/server";
import { fetchQuotes } from "@/lib/external/brapi";

const STALE_MINUTES = 15;

// Chamada a partir de Server Components — não é uma server action de formulário,
// por isso não leva "use server" (evitamos expor um endpoint mutável desnecessário).
export async function refreshQuotesIfStale(tickers: string[]) {
  if (tickers.length === 0) return;
  const supabase = await createClient();

  const { data: latest } = await supabase
    .from("price_quotes")
    .select("ticker, as_of")
    .in("ticker", tickers)
    .order("as_of", { ascending: false });

  const staleOrMissing = tickers.filter((ticker) => {
    const row = latest?.find((r) => r.ticker === ticker);
    return (
      !row ||
      Date.now() - new Date(row.as_of).getTime() > STALE_MINUTES * 60_000
    );
  });

  if (staleOrMissing.length === 0) return;

  try {
    const fresh = await fetchQuotes(staleOrMissing);
    if (fresh.length === 0) return;

    const { error } = await supabase.from("price_quotes").insert(
      fresh.map((q) => ({
        ticker: q.ticker,
        price: q.price,
        as_of: q.asOf,
        source: "brapi",
      })),
    );
    if (error) {
      console.error("refreshQuotesIfStale: falha ao gravar cache", error);
    }
  } catch (err) {
    // brapi.dev fora do ar ou token ausente: degrada graciosamente,
    // mantém o último valor em cache (se houver) em vez de quebrar a página.
    console.error("refreshQuotesIfStale: falha ao buscar cotações", err);
  }
}

export async function getLatestQuotes(
  tickers: string[],
): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("price_quotes")
    .select("ticker, price, as_of")
    .in("ticker", tickers)
    .order("as_of", { ascending: false });

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!(row.ticker in map)) map[row.ticker] = row.price;
  }
  return map;
}
