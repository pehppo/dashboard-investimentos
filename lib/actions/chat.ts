import { createClient } from "@/lib/supabase/server";
import { getLatestQuotes } from "@/lib/actions/quotes";
import { Position, formatIndexador } from "@/lib/types";

export interface PortfolioSnapshot {
  totalInvestido: number;
  rendaVariavel: {
    totalInvestido: number;
    totalAtual: number;
    posicoes: {
      ticker: string;
      tipo: string;
      quantidade: number;
      precoMedio: number;
      valorAtual: number;
    }[];
  };
  rendaFixa: {
    totalInvestido: number;
    posicoes: {
      emissor: string;
      produto: string;
      indexador: string;
      valorInvestido: number;
      vencimento: string | null;
    }[];
  };
}

// Fonte de verdade injetada no prompt do assistente — sempre buscada fresca
// (nunca cacheada), pra recomendação nunca ficar baseada em dado velho.
// Valor "atual" da Renda Fixa aqui é o principal investido, não a projeção no
// vencimento (estimateRendaFixaValue) — usar a projeção futura infla o peso
// da RF na alocação de hoje com juros ainda não realizados.
export async function getPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  const supabase = await createClient();
  const { data } = await supabase.from("positions").select("*");
  const positions = (data ?? []) as Position[];
  const open = positions.filter((p) => p.quantity_held !== 0 || p.net_invested !== 0);

  const rv = open.filter((p) => p.asset_class === "renda_variavel");
  const rf = open.filter((p) => p.asset_class === "renda_fixa");

  const tickers = Array.from(
    new Set(rv.map((p) => p.ticker).filter((t): t is string => !!t)),
  );
  const currentPrices = await getLatestQuotes(tickers);

  const rvPosicoes = rv.map((p) => {
    const precoAtual = p.ticker ? currentPrices[p.ticker] : undefined;
    const valorAtual = precoAtual != null ? precoAtual * p.quantity_held : p.net_invested;
    return {
      ticker: p.ticker ?? "-",
      tipo: p.rv_type ?? "-",
      quantidade: p.quantity_held,
      precoMedio: p.avg_price ?? 0,
      valorAtual,
    };
  });

  const rfPosicoes = rf.map((p) => ({
    emissor: p.issuer ?? "-",
    produto: p.rf_product ?? "-",
    indexador:
      p.indexador && p.indexador_rate != null
        ? formatIndexador(p.indexador, p.indexador_rate)
        : "-",
    valorInvestido: p.net_invested,
    vencimento: p.maturity_date,
  }));

  const totalInvestidoRV = rv.reduce((sum, p) => sum + p.net_invested, 0);
  const totalAtualRV = rvPosicoes.reduce((sum, p) => sum + p.valorAtual, 0);
  const totalInvestidoRF = rf.reduce((sum, p) => sum + p.net_invested, 0);

  return {
    totalInvestido: totalInvestidoRV + totalInvestidoRF,
    rendaVariavel: {
      totalInvestido: totalInvestidoRV,
      totalAtual: totalAtualRV,
      posicoes: rvPosicoes,
    },
    rendaFixa: {
      totalInvestido: totalInvestidoRF,
      posicoes: rfPosicoes,
    },
  };
}
