import type { IndexadorType } from "@/lib/types";

const DAYS_PER_YEAR = 365.25;
const BUSINESS_DAYS_PER_YEAR = 252;

export function yearsBetween(start: string | Date, end: string | Date) {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  const days = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(days, 0) / DAYS_PER_YEAR;
}

// Converte a taxa diária do CDI (% ao dia) para uma taxa anualizada (% ao ano),
// usando a convenção de 252 dias úteis do mercado brasileiro.
export function annualizeDailyRate(dailyRatePct: number) {
  return (Math.pow(1 + dailyRatePct / 100, BUSINESS_DAYS_PER_YEAR) - 1) * 100;
}

export interface RendaFixaRates {
  cdiAnnualPct: number | null;
  selicAnnualPct: number | null;
  ipca12mPct: number | null;
}

export interface RendaFixaAssetInput {
  indexador: IndexadorType;
  indexadorRate: number;
  principal: number;
  purchaseDate: string;
  maturityDate: string | null;
}

// Valor estimado ao final do período (vencimento), projetado com a última taxa
// publicada mantida constante — é uma estimativa, não um cálculo histórico exato.
export function estimateRendaFixaValue(
  asset: RendaFixaAssetInput,
  rates: RendaFixaRates,
): number | null {
  if (!asset.maturityDate) return null;

  const years = yearsBetween(asset.purchaseDate, asset.maturityDate);
  const { indexador, indexadorRate, principal } = asset;

  switch (indexador) {
    case "prefixado":
      return principal * Math.pow(1 + indexadorRate, years);

    case "cdi_pct": {
      if (rates.cdiAnnualPct == null) return null;
      const effectiveAnnual = (rates.cdiAnnualPct / 100) * indexadorRate;
      return principal * Math.pow(1 + effectiveAnnual, years);
    }

    case "selic_pct": {
      if (rates.selicAnnualPct == null) return null;
      const effectiveAnnual = (rates.selicAnnualPct / 100) * indexadorRate;
      return principal * Math.pow(1 + effectiveAnnual, years);
    }

    case "ipca_mais": {
      if (rates.ipca12mPct == null) return null;
      const ipcaFactor = 1 + rates.ipca12mPct / 100;
      const spreadFactor = Math.pow(1 + indexadorRate, years);
      const ipcaCompounded = Math.pow(ipcaFactor, years);
      return principal * ipcaCompounded * spreadFactor;
    }

    default:
      return null;
  }
}
