import Link from "next/link";
import { LineChart, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { refreshQuotesIfStale, getLatestQuotes } from "@/lib/actions/quotes";
import { formatBRL, formatPercent, formatDate } from "@/lib/format";
import { Position, RvType, TxType, TX_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { DeleteTransactionButton } from "@/components/delete-transaction-button";

interface RvTransactionRow {
  id: string;
  tx_date: string;
  tx_type: TxType;
  quantity: number | null;
  unit_price: number | null;
  asset_id: string;
  assets: { ticker: string; rv_type: RvType } | null;
}

export default async function RendaVariavelPage() {
  const supabase = await createClient();

  const [{ data: positionsData }, { data: txData }] = await Promise.all([
    supabase
      .from("positions")
      .select("*")
      .eq("asset_class", "renda_variavel")
      .order("ticker"),
    supabase
      .from("transactions")
      .select(
        "id, tx_date, tx_type, quantity, unit_price, asset_id, assets!inner(ticker, rv_type)",
      )
      .eq("assets.asset_class", "renda_variavel")
      .order("tx_date", { ascending: false }),
  ]);

  const openPositions = ((positionsData ?? []) as Position[]).filter(
    (p) => p.quantity_held !== 0,
  );
  const transactions = (txData ?? []) as unknown as RvTransactionRow[];

  const tickers = Array.from(
    new Set(
      transactions.map((t) => t.assets?.ticker).filter((t): t is string => !!t),
    ),
  );
  await refreshQuotesIfStale(tickers);
  const currentPrices = await getLatestQuotes(tickers);

  const totalInvestido = openPositions.reduce((sum, p) => sum + p.net_invested, 0);
  // quando a cotação não está disponível, mantém o valor investido (sem impacto no resultado)
  const totalAtual = openPositions.reduce((sum, p) => {
    const price = p.ticker ? currentPrices[p.ticker] : undefined;
    const value = price != null ? price * p.quantity_held : p.net_invested;
    return sum + value;
  }, 0);
  const resultado = totalAtual - totalInvestido;
  const resultadoPct = totalInvestido > 0 ? resultado / totalInvestido : 0;
  const isPositivo = resultado >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Renda Variável
        </h1>
        <p className="text-muted-foreground">Ações, FIIs, ETFs e BDRs</p>
      </div>

      {openPositions.length > 0 && (
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
                Valor atual
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatBRL(totalAtual)}
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
                Resultado
              </CardDescription>
              <CardTitle
                className={cn(
                  "text-2xl tabular-nums",
                  isPositivo ? "text-success" : "text-destructive",
                )}
              >
                {isPositivo ? "+" : ""}
                {formatBRL(resultado)}{" "}
                <span className="text-base font-medium">
                  ({isPositivo ? "+" : ""}
                  {formatPercent(resultadoPct)})
                </span>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            Histórico de compras e vendas, com a cotação atual de cada ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <LineChart className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma transação lançada ainda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Operação</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço</TableHead>
                    <TableHead className="text-right">Preço atual</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => {
                    const ticker = tx.assets?.ticker;
                    const currentPrice = ticker ? currentPrices[ticker] : undefined;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/renda-variavel/${tx.asset_id}`}
                            className="underline underline-offset-4"
                          >
                            {ticker ?? "-"}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={tx.tx_type === "compra" ? "default" : "outline"}
                          >
                            {TX_TYPE_LABELS[tx.tx_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(tx.tx_date)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tx.quantity}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tx.unit_price != null ? formatBRL(tx.unit_price) : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {currentPrice != null ? formatBRL(currentPrice) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DeleteTransactionButton transactionId={tx.id} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
