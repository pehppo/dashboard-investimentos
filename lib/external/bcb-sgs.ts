import { createClient } from "@/lib/supabase/server";
import { createDeferredClient } from "@/lib/supabase/deferred";
import { annualizeDailyRate, type RendaFixaRates } from "@/lib/calc/rendafixa";

type SupabaseLike = Awaited<ReturnType<typeof createClient>>;

export const BCB_SERIES = {
  CDI_DIARIO: 12,
  META_SELIC: 432,
  IPCA_12M: 13522,
} as const;

const STALE_HOURS = 24;

function parseBrDate(d: string) {
  const [day, month, year] = d.split("/");
  return `${year}-${month}-${day}`;
}

async function fetchLatestFromBcb(seriesCode: number) {
  const res = await fetch(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`BCB SGS série ${seriesCode} respondeu ${res.status}`);
  }
  const data = (await res.json()) as { data: string; valor: string }[];
  if (data.length === 0) return null;
  return { refDate: parseBrDate(data[0].data), value: Number(data[0].valor) };
}

async function getCachedIndexRow(supabase: SupabaseLike, seriesCode: number) {
  const { data } = await supabase
    .from("index_series")
    .select("value, fetched_at")
    .eq("series_code", seriesCode)
    .order("ref_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// Leitura rápida, só no cache — nunca chama a API do BCB. Usada no caminho
// que bloqueia a renderização da página, pra navegação não esperar rede externa.
export async function getCachedIndexValue(seriesCode: number): Promise<number | null> {
  const supabase = await createClient();
  const cached = await getCachedIndexRow(supabase, seriesCode);
  return cached?.value ?? null;
}

// Busca na API do BCB só se o cache estiver velho, e grava. Chamada em segundo
// plano (via `after()`) depois da resposta já ter sido enviada — não bloqueia nada.
// `accessToken`: obrigatório quando chamado de dentro de `after()` (lá não dá
// pra ler cookies, então usamos um cliente à parte autenticado via bearer token).
export async function refreshIndexValueIfStale(
  seriesCode: number,
  accessToken?: string,
): Promise<void> {
  const supabase = accessToken ? createDeferredClient(accessToken) : await createClient();
  const cached = await getCachedIndexRow(supabase, seriesCode);

  const isStale =
    !cached ||
    Date.now() - new Date(cached.fetched_at).getTime() > STALE_HOURS * 60 * 60 * 1000;

  if (!isStale) return;

  try {
    const fresh = await fetchLatestFromBcb(seriesCode);
    if (!fresh) return;

    const { error } = await supabase
      .from("index_series")
      .upsert(
        { series_code: seriesCode, ref_date: fresh.refDate, value: fresh.value },
        { onConflict: "series_code,ref_date" },
      );
    if (error) {
      console.error("refreshIndexValueIfStale: falha ao gravar cache", error);
    }
  } catch (err) {
    // API do BCB fora do ar: degrada graciosamente, mantém o último valor em cache.
    console.error("refreshIndexValueIfStale: falha ao buscar série BCB", err);
  }
}

export async function getRendaFixaRates(): Promise<RendaFixaRates> {
  const [cdiDaily, selicAnnual, ipca12m] = await Promise.all([
    getCachedIndexValue(BCB_SERIES.CDI_DIARIO),
    getCachedIndexValue(BCB_SERIES.META_SELIC),
    getCachedIndexValue(BCB_SERIES.IPCA_12M),
  ]);

  return {
    cdiAnnualPct: cdiDaily != null ? annualizeDailyRate(cdiDaily) : null,
    selicAnnualPct: selicAnnual,
    ipca12mPct: ipca12m,
  };
}

export async function refreshRendaFixaRatesIfStale(accessToken?: string): Promise<void> {
  await Promise.all([
    refreshIndexValueIfStale(BCB_SERIES.CDI_DIARIO, accessToken),
    refreshIndexValueIfStale(BCB_SERIES.META_SELIC, accessToken),
    refreshIndexValueIfStale(BCB_SERIES.IPCA_12M, accessToken),
  ]);
}
