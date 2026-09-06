export interface BrapiQuote {
  ticker: string;
  price: number;
  asOf: string;
}

export interface BrapiHistoricalPoint {
  date: string;
  price: number;
}

interface BrapiHistoricalDataPoint {
  date: number;
  close: number | null;
}

interface BrapiQuoteResult {
  symbol: string;
  regularMarketPrice: number | null;
  regularMarketTime: string | null;
  historicalDataPrice?: BrapiHistoricalDataPoint[];
}

interface BrapiResponse {
  results?: BrapiQuoteResult[];
}

// O plano gratuito da brapi.dev permite só 1 ativo por requisição de cotação
// (pedir vários tickers juntos devolve 400 QUOTES_PER_REQUEST_EXCEEDED e
// nenhum preço é atualizado) — por isso buscamos um por um.
export async function fetchQuotes(tickers: string[]): Promise<BrapiQuote[]> {
  if (tickers.length === 0) return [];

  const token = process.env.BRAPI_TOKEN;
  if (!token) return [];

  const settled = await Promise.allSettled(
    tickers.map((ticker) => fetchQuote(ticker, token)),
  );

  const quotes: BrapiQuote[] = [];
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === "fulfilled") {
      if (result.value) quotes.push(result.value);
    } else {
      console.error(`fetchQuotes: falha ao buscar ${tickers[i]}`, result.reason);
    }
  }
  return quotes;
}

async function fetchQuote(ticker: string, token: string): Promise<BrapiQuote | null> {
  const url = `https://brapi.dev/api/quote/${ticker}?token=${token}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`brapi.dev respondeu ${res.status} para ${ticker}`);
  }

  const data = (await res.json()) as BrapiResponse;
  const result = data.results?.[0];
  if (!result || result.regularMarketPrice == null) return null;

  return {
    ticker: result.symbol,
    price: result.regularMarketPrice,
    asOf: result.regularMarketTime ?? new Date().toISOString(),
  };
}

// Usado só pra popular o gráfico de histórico de preço com mais profundidade
// desde a primeira visita a um ativo, em vez de depender só do acúmulo orgânico
// das consultas de cotação atual (a cada 15min).
// "3mo" é o maior range aceito pelo plano gratuito do brapi.dev (checado em
// produção: 6mo/1y retornam 400 "range não disponível no seu plano" para
// tickers ainda não consultados nesse range — só parecem funcionar quando já
// existe uma resposta em cache do lado do brapi de uma consulta anterior).
export async function fetchHistoricalPrices(
  ticker: string,
  range: string = "3mo",
): Promise<BrapiHistoricalPoint[]> {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return [];

  const url = `https://brapi.dev/api/quote/${ticker}?range=${range}&interval=1d&token=${token}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`brapi.dev (histórico) respondeu ${res.status}`);
  }

  const data = (await res.json()) as BrapiResponse;
  const points = data.results?.[0]?.historicalDataPrice ?? [];

  return points
    .filter((p) => p.close != null)
    .map((p) => ({
      date: new Date(p.date * 1000).toISOString(),
      price: p.close as number,
    }));
}
