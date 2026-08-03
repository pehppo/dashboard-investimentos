import Link from "next/link";
import { after } from "next/server";
import {
  Landmark,
  LineChart,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { refreshQuotesIfStale, getLatestQuotes } from "@/lib/actions/quotes";
import { getRendaFixaRates, refreshRendaFixaRatesIfStale } from "@/lib/external/bcb-sgs";
import { estimateRendaFixaValue } from "@/lib/calc/rendafixa";
import { formatBRL, formatPercent } from "@/lib/format";
import { Position } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CLASS_LABELS: Record<string, string> = {
  renda_variavel: "Renda Variável",
  renda_fixa: "Renda Fixa",
};

// Ordem fixa por classe (nunca ciclada) — mantém a mesma cor para a mesma classe em toda a tela.
const CLASS_COLORS: Record<string, string> = {
  renda_variavel: "var(--chart-1)",
  renda_fixa: "var(--chart-2)",
};

const CLASS_HREFS: Record<string, string> = {
  renda_variavel: "/renda-variavel",
  renda_fixa: "/renda-fixa",
};

interface ClassStat {
  label: string;
  value: string;
  tone?: "success" | "destructive";
}

function ClassSummaryCard({
  title,
  href,
  color,
  stats,
}: {
  title: string;
  href: string;
  color: string;
  stats: ClassStat[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {title}
          </CardTitle>
          <Link
            href={href}
            className="text-sm text-primary underline underline-offset-4"
          >
            Ver detalhes
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p
                className={cn(
                  "tabular-nums font-semibold",
                  s.tone === "success" && "text-success",
                  s.tone === "destructive" && "text-destructive",
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ClassEmptyCard({
  title,
  color,
  icon,
}: {
  title: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
          <p className="text-sm text-muted-foreground">
            Nenhum investimento ainda.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("positions").select("*");
  const positions = (data ?? []) as Position[];

  const open = positions.filter((p) => p.quantity_held !== 0 || p.net_invested !== 0);
  const totalInvestido = open.reduce((sum, p) => sum + p.net_invested, 0);

  const porClasse = open.reduce<Record<string, number>>((acc, p) => {
    acc[p.asset_class] = (acc[p.asset_class] ?? 0) + p.net_invested;
    return acc;
  }, {});

  const rvPositions = open.filter((p) => p.asset_class === "renda_variavel");
  const rfPositions = open.filter((p) => p.asset_class === "renda_fixa");

  const rvTickers = Array.from(
    new Set(rvPositions.map((p) => p.ticker).filter((t): t is string => !!t)),
  );
  // Lê o que já está em cache pra render ser instantâneo; a atualização das
  // cotações/taxas roda em segundo plano depois da resposta ser enviada.
  const [currentPrices, rates, { data: { session } }] = await Promise.all([
    getLatestQuotes(rvTickers),
    getRendaFixaRates(),
    supabase.auth.getSession(),
  ]);
  const accessToken = session?.access_token;
  after(() => refreshQuotesIfStale(rvTickers, accessToken));
  after(() => refreshRendaFixaRatesIfStale(accessToken));

  const totalInvestidoRV = rvPositions.reduce((sum, p) => sum + p.net_invested, 0);
  const totalAtualRV = rvPositions.reduce((sum, p) => {
    const price = p.ticker ? currentPrices[p.ticker] : undefined;
    const value = price != null ? price * p.quantity_held : p.net_invested;
    return sum + value;
  }, 0);
  const resultadoRV = totalAtualRV - totalInvestidoRV;
  const resultadoRVPct = totalInvestidoRV > 0 ? resultadoRV / totalInvestidoRV : 0;

  const totalInvestidoRF = rfPositions.reduce((sum, p) => sum + p.net_invested, 0);
  const totalEstimadoRF = rfPositions.reduce((sum, p) => {
    const estimated =
      p.indexador && p.indexador_rate != null && p.purchase_date
        ? estimateRendaFixaValue(
            {
              indexador: p.indexador,
              indexadorRate: p.indexador_rate,
              principal: p.net_invested,
              purchaseDate: p.purchase_date,
              maturityDate: p.maturity_date,
            },
            rates,
          )
        : null;
    return sum + (estimated ?? p.net_invested);
  }, 0);
  const rendimentoRF = totalEstimadoRF - totalInvestidoRF;
  const rendimentoRFPct = totalInvestidoRF > 0 ? rendimentoRF / totalInvestidoRF : 0;

  const resultadoGeral = resultadoRV + rendimentoRF;
  const resultadoGeralPct = totalInvestido > 0 ? resultadoGeral / totalInvestido : 0;
  const isPositivoGeral = resultadoGeral >= 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu patrimônio investido
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Wallet className="size-3.5" />
              Patrimônio investido
            </CardDescription>
            <CardTitle className="text-4xl tabular-nums">
              {formatBRL(totalInvestido)}
            </CardTitle>
          </CardHeader>
        </Card>
        {open.length > 0 && (
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                {isPositivoGeral ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                Resultado geral
              </CardDescription>
              <CardTitle
                className={cn(
                  "text-4xl tabular-nums",
                  isPositivoGeral ? "text-success" : "text-destructive",
                )}
              >
                {isPositivoGeral ? "+" : ""}
                {formatBRL(resultadoGeral)}{" "}
                <span className="text-lg font-medium">
                  ({isPositivoGeral ? "+" : ""}
                  {formatPercent(resultadoGeralPct)})
                </span>
              </CardTitle>
              <CardDescription className="pt-1 text-xs">
                Real em Renda Variável + estimado em Renda Fixa
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alocação por classe</CardTitle>
          <CardDescription>
            Distribuição do capital investido entre as classes de ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {open.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <PiggyBank className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Você ainda não lançou nenhum investimento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(porClasse)
                .sort((a, b) => b[1] - a[1])
                .map(([classe, valor]) => {
                  const pct = totalInvestido > 0 ? valor / totalInvestido : 0;
                  const color = CLASS_COLORS[classe] ?? "var(--muted-foreground)";
                  const href = CLASS_HREFS[classe];
                  const row = (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {CLASS_LABELS[classe] ?? classe}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatBRL(valor)} ({formatPercent(pct)})
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(pct * 100, 2)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                  return href ? (
                    <Link
                      key={classe}
                      href={href}
                      className="block rounded-md transition-opacity hover:opacity-70"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div key={classe}>{row}</div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {rvPositions.length > 0 ? (
          <ClassSummaryCard
            title="Renda Variável"
            href="/renda-variavel"
            color={CLASS_COLORS.renda_variavel}
            stats={[
              { label: "Investido", value: formatBRL(totalInvestidoRV) },
              { label: "Atual", value: formatBRL(totalAtualRV) },
              {
                label: "Resultado",
                value: `${resultadoRV >= 0 ? "+" : ""}${formatPercent(resultadoRVPct)}`,
                tone: resultadoRV >= 0 ? "success" : "destructive",
              },
            ]}
          />
        ) : (
          <ClassEmptyCard
            title="Renda Variável"
            color={CLASS_COLORS.renda_variavel}
            icon={<LineChart className="size-5 text-muted-foreground" />}
          />
        )}

        {rfPositions.length > 0 ? (
          <ClassSummaryCard
            title="Renda Fixa"
            href="/renda-fixa"
            color={CLASS_COLORS.renda_fixa}
            stats={[
              { label: "Investido", value: formatBRL(totalInvestidoRF) },
              { label: "Previsão", value: formatBRL(totalEstimadoRF) },
              {
                label: "Rendimento",
                value: `${rendimentoRF >= 0 ? "+" : ""}${formatPercent(rendimentoRFPct)}`,
                tone: rendimentoRF >= 0 ? "success" : "destructive",
              },
            ]}
          />
        ) : (
          <ClassEmptyCard
            title="Renda Fixa"
            color={CLASS_COLORS.renda_fixa}
            icon={<Landmark className="size-5 text-muted-foreground" />}
          />
        )}
      </div>
    </div>
  );
}
