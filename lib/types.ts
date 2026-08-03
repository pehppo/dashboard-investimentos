export type AssetClass = "renda_variavel" | "renda_fixa" | "fundo";
export type RvType = "acao" | "fii" | "etf" | "bdr";
export type IndexadorType = "cdi_pct" | "ipca_mais" | "prefixado" | "selic_pct";
export type FundoType = "fundo_investimento" | "pgbl" | "vgbl";
export type TxType = "compra" | "venda" | "aporte" | "resgate";

export interface Asset {
  id: string;
  user_id: string;
  asset_class: AssetClass;
  ticker: string | null;
  rv_type: RvType | null;
  issuer: string | null;
  rf_product: string | null;
  indexador: IndexadorType | null;
  indexador_rate: number | null;
  purchase_date: string | null;
  maturity_date: string | null;
  principal_amount: number | null;
  fundo_name: string | null;
  fundo_type: FundoType | null;
  nickname: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  asset_id: string;
  tx_type: TxType;
  tx_date: string;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  fees: number;
  notes: string | null;
  created_at: string;
}

export interface Position {
  asset_id: string;
  user_id: string;
  asset_class: AssetClass;
  ticker: string | null;
  rv_type: RvType | null;
  issuer: string | null;
  rf_product: string | null;
  indexador: IndexadorType | null;
  indexador_rate: number | null;
  purchase_date: string | null;
  maturity_date: string | null;
  fundo_name: string | null;
  fundo_type: FundoType | null;
  nickname: string | null;
  quantity_held: number;
  net_invested: number;
  avg_price: number | null;
}

export const RV_TYPE_LABELS: Record<RvType, string> = {
  acao: "Ação",
  fii: "FII",
  etf: "ETF",
  bdr: "BDR",
};

export const TX_TYPE_LABELS: Record<TxType, string> = {
  compra: "Compra",
  venda: "Venda",
  aporte: "Aporte",
  resgate: "Resgate",
};

export const INDEXADOR_LABELS: Record<IndexadorType, string> = {
  cdi_pct: "% do CDI",
  ipca_mais: "IPCA+",
  prefixado: "Prefixado",
  selic_pct: "% da Selic",
};

export function formatIndexador(indexador: IndexadorType, rate: number) {
  const pct = (rate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  switch (indexador) {
    case "cdi_pct":
      return `${pct}% do CDI`;
    case "selic_pct":
      return `${pct}% da Selic`;
    case "ipca_mais":
      return `IPCA+${pct}%`;
    case "prefixado":
      return `${pct}% a.a.`;
  }
}
