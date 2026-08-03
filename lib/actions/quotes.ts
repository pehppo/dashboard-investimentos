import { createClient } from "@/lib/supabase/server";
import { createDeferredClient } from "@/lib/supabase/deferred";
import { fetchQuotes, fetchHistoricalPrices } from "@/lib/external/brapi";

const STALE_MINUTES = 15;
const MIN_HISTORY_POINTS = 5;

// Chamada a partir de Server Components — não é uma server action de formulário,
// por isso não leva "use server" (evitamos expor um endpoint mutável desnecessário).
// `accessToken`: passe quando chamado de dentro de `after()` (lá não dá pra ler
// cookies, então usamos um cliente à parte autenticado via bearer token).
export async function refreshQuotesIfStale(tickers: string[], accessToken?: string) {
  if (tickers.length === 0) return;
  const supabase = accessToken ? createDeferredClient(accessToken) : await createClient();

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

export interface PricePoint {
  date: string;
  price: number;
}

// Lê o histórico de preço cacheado; se ainda houver poucos pontos (ativo
// recém-lançado ou nunca visitado antes), busca o histórico direto no brapi.dev
// e grava no cache — assim o gráfico já nasce com profundidade em vez de
// depender só do acúmulo orgânico das consultas de cotação atual a cada 15min.
// Quando o mercado está fechado, brapi.dev pode devolver o mesmo `as_of` em
// polls sucessivos (regularMarketTime não muda) e cada poll grava uma linha
// nova em price_quotes — sem constraint de unicidade na tabela. Deduplicamos
// aqui na leitura (mantendo a última gravação) em vez de mudar o schema.
function dedupeByDate(points: PricePoint[]): PricePoint[] {
  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.price);
  return Array.from(byDate, ([date, price]) => ({ date, price })).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export async function getPriceHistory(ticker: string): Promise<PricePoint[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("price_quotes")
    .select("price, as_of")
    .eq("ticker", ticker)
    .order("as_of", { ascending: true });

  const existing = dedupeByDate(
    (data ?? []).map((row) => ({ date: row.as_of, price: row.price })),
  );

  // Conta dias distintos, não linhas: várias consultas de cotação atual no
  // mesmo dia (a cada 15min) não contam como profundidade de histórico —
  // senão o gráfico fica travado só com pontos intradiários de hoje/ontem.
  const distinctDays = new Set(existing.map((p) => p.date.slice(0, 10))).size;
  if (distinctDays >= MIN_HISTORY_POINTS) return existing;

  try {
    const historical = await fetchHistoricalPrices(ticker);
    if (historical.length === 0) return existing;

    const existingDays = new Set(existing.map((p) => p.date.slice(0, 10)));
    const newPoints = historical.filter((p) => !existingDays.has(p.date.slice(0, 10)));

    if (newPoints.length > 0) {
      const { error } = await supabase.from("price_quotes").insert(
        newPoints.map((p) => ({
          ticker,
          price: p.price,
          as_of: p.date,
          source: "brapi_historico",
        })),
      );
      if (error) console.error("getPriceHistory: falha ao gravar histórico", error);
    }

    return dedupeByDate([...existing, ...newPoints]);
  } catch (err) {
    console.error("getPriceHistory: falha ao buscar histórico", err);
    return existing;
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
