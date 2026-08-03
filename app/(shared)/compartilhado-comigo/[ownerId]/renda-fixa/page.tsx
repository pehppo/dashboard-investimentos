import Link from "next/link";
import { after } from "next/server";
import { Landmark, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRendaFixaRates, refreshRendaFixaRatesIfStale } from "@/lib/external/bcb-sgs";
import { estimateRendaFixaValue } from "@/lib/calc/rendafixa";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";
import { Position, formatIndexador } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SharedRendaFixaPage({
  params,
}: {
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", ownerId)
    .eq("asset_class", "renda_fixa")
    .order("purchase_date", { ascending: false });

  const positions = (data ?? []) as Position[];
  const [rates, { data: { session } }] = await Promise.all([
    getRendaFixaRates(),
    supabase.auth.getSession(),
  ]);
  after(() => refreshRendaFixaRatesIfStale(session?.access_token));

  const rows = positions.map((p) => {
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
    return { ...p, estimated };
  });

  const totalInvestido = rows.reduce((sum, r) => sum + r.net_invested, 0);
  const totalEstimado = rows.reduce((sum, r) => sum + (r.estimated ?? r.net_invested), 0);
  const rendimento = totalEstimado - totalInvestido;
  const rendimentoPct = totalInvestido > 0 ? rendimento / totalInvestido : 0;
  const isPositivo = rendimento >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Renda Fixa</h1>
        <p className="text-muted-foreground">CDB, Tesouro Direto, LCI e LCA</p>
      </div>

      {rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <Wallet className="size-3.5" />
                Total investido
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatBRL(totalInvestido)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <TrendingUp className="size-3.5" />
                Previsão de retorno
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatBRL(totalEstimado)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                {isPositivo ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                Rendimento estimado
              </CardDescription>
              <CardTitle
                className={cn(
                  "text-2xl tabular-nums",
                  isPositivo ? "text-success" : "text-destructive",
                )}
              >
                {isPositivo ? "+" : ""}
                {formatBRL(rendimento)}{" "}
                <span className="text-base font-medium">
                  ({isPositivo ? "+" : ""}
                  {formatPercent(rendimentoPct)})
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Títulos</CardTitle>
          <CardDescription>
            Valor estimado projetado com a última taxa publicada até o vencimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Landmark className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum título lançado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emissor / Produto</TableHead>
                    <TableHead>Indexador</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor investido</TableHead>
                    <TableHead className="text-right">Valor estimado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p.asset_id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/compartilhado-comigo/${ownerId}/renda-fixa/${p.asset_id}`}
                          className="underline underline-offset-4"
                        >
                          {p.issuer}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {p.rf_product}
                        </span>
                      </TableCell>
                      <TableCell>
                        {p.indexador && p.indexador_rate != null
                          ? formatIndexador(p.indexador, p.indexador_rate)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {p.maturity_date ? formatDate(p.maturity_date) : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(p.net_invested)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {p.estimated != null ? formatBRL(p.estimated) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
