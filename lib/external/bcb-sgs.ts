import { createClient } from "@/lib/supabase/server";
import { annualizeDailyRate, type RendaFixaRates } from "@/lib/calc/rendafixa";

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

export async function getLatestIndexValue(
  seriesCode: number,
): Promise<number | null> {
  const supabase = await createClient();
  const { data: cached } = await supabase
    .from("index_series")
    .select("value, fetched_at")
    .eq("series_code", seriesCode)
    .order("ref_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isStale =
    !cached ||
    Date.now() - new Date(cached.fetched_at).getTime() >
      STALE_HOURS * 60 * 60 * 1000;

  if (!isStale) return cached.value;

  try {
    const fresh = await fetchLatestFromBcb(seriesCode);
    if (!fresh) return cached?.value ?? null;

    const { error } = await supabase
      .from("index_series")
      .upsert(
        { series_code: seriesCode, ref_date: fresh.refDate, value: fresh.value },
        { onConflict: "series_code,ref_date" },
      );
    if (error) {
      console.error("getLatestIndexValue: falha ao gravar cache", error);
    }

    return fresh.value;
  } catch (err) {
    // API do BCB fora do ar: degrada graciosamente para o último valor em cache.
    console.error("getLatestIndexValue: falha ao buscar série BCB", err);
    return cached?.value ?? null;
  }
}

export async function getRendaFixaRates(): Promise<RendaFixaRates> {
  const [cdiDaily, selicAnnual, ipca12m] = await Promise.all([
    getLatestIndexValue(BCB_SERIES.CDI_DIARIO),
    getLatestIndexValue(BCB_SERIES.META_SELIC),
    getLatestIndexValue(BCB_SERIES.IPCA_12M),
  ]);

  return {
    cdiAnnualPct: cdiDaily != null ? annualizeDailyRate(cdiDaily) : null,
    selicAnnualPct: selicAnnual,
    ipca12mPct: ipca12m,
  };
}
