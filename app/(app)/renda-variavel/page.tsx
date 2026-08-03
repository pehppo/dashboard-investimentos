import Link from "next/link";
import { after } from "next/server";
import { LineChart, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { refreshQuotesIfStale, getLatestQuotes } from "@/lib/actions/quotes";
import { formatBRL, formatPercent, formatDate } from "@/lib/format";
import { Position, RvType, TxType, TX_TYPE_LABELS, RV_TYPE_LABELS } from "@/lib/types";
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
import { DeleteTransactionButton } from "@/components/investments/delete-transaction-button";
import { EditTransactionDialog } from "@/components/investments/edit-transaction-dialog";

interface RvTransactionRow {
  id: string;
  tx_date: string;
  tx_type: TxType;
  quantity: number | null;
  unit_price: number | null;
  amount: number;
  fees: number;
  notes: string | null;
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
        "id, tx_date, tx_type, quantity, unit_price, amount, fees, notes, asset_id, assets!inner(ticker, rv_type)",
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
  const [currentPrices, { data: { session } }] = await Promise.all([
    getLatestQuotes(tickers),
    supabase.auth.getSession(),
  ]);
  after(() => refreshQuotesIfStale(tickers, session?.access_token));

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
  const totalProventos = transactions
    .filter((tx) => tx.tx_type === "provento")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Renda Variável
        </h1>
        <p className="text-muted-foreground">Ações, FIIs, ETFs e BDRs</p>
      </div>

      {openPositions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <Wallet className="size-3.5" />
                Proventos recebidos
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums text-success">
                {formatBRL(totalProventos)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {openPositions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Posições</CardTitle>
            <CardDescription>
              Quanto você tem de cada ativo hoje, pela cotação atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço atual</TableHead>
                    <TableHead className="text-right">Valor atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openPositions.map((p) => {
                    const price = p.ticker ? currentPrices[p.ticker] : undefined;
                    const value = price != null ? price * p.quantity_held : null;
                    return (
                      <TableRow key={p.asset_id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/renda-variavel/${p.asset_id}`}
                            className="underline underline-offset-4"
                          >
                            {p.ticker}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {p.rv_type ? RV_TYPE_LABELS[p.rv_type] : "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.quantity_held}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {price != null ? formatBRL(price) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {value != null ? formatBRL(value) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
                    <TableHead className="text-right">Valor total</TableHead>
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
                            variant={
                              tx.tx_type === "provento"
                                ? "secondary"
                                : tx.tx_type === "compra"
                                  ? "default"
                                  : "outline"
                            }
                            className={
                              tx.tx_type === "provento"
                                ? "bg-success/15 text-success"
                                : undefined
                            }
                          >
                            {TX_TYPE_LABELS[tx.tx_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(tx.tx_date)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tx.quantity ?? "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {tx.unit_price != null ? formatBRL(tx.unit_price) : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatBRL(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {currentPrice != null ? formatBRL(currentPrice) : "—"}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {(tx.tx_type === "compra" || tx.tx_type === "venda") && (
                              <EditTransactionDialog
                                transactionId={tx.id}
                                ticker={ticker ?? ""}
                                txType={tx.tx_type}
                                txDate={tx.tx_date}
                                quantity={tx.quantity}
                                unitPrice={tx.unit_price}
                                fees={tx.fees}
                                notes={tx.notes}
                              />
                            )}
                            <DeleteTransactionButton transactionId={tx.id} />
                          </div>
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
