import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate } from "@/lib/format";
import { Position, Transaction, RV_TYPE_LABELS, TX_TYPE_LABELS } from "@/lib/types";
import { DeleteTransactionButton } from "@/components/investments/delete-transaction-button";
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

export default async function AtivoRendaVariavelPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const supabase = await createClient();

  const [{ data: position }, { data: txs }] = await Promise.all([
    supabase.from("positions").select("*").eq("asset_id", assetId).maybeSingle(),
    supabase
      .from("transactions")
      .select("*")
      .eq("asset_id", assetId)
      .order("tx_date", { ascending: false }),
  ]);

  if (!position) {
    notFound();
  }

  const pos = position as Position;
  const transactions = (txs ?? []) as Transaction[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{pos.ticker}</h1>
        <Badge variant="secondary">
          {pos.rv_type ? RV_TYPE_LABELS[pos.rv_type] : "-"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Quantidade</CardDescription>
            <CardTitle className="tabular-nums">{pos.quantity_held}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Preço médio</CardDescription>
            <CardTitle className="tabular-nums">
              {pos.avg_price ? formatBRL(pos.avg_price) : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Valor investido</CardDescription>
            <CardTitle className="tabular-nums">
              {formatBRL(pos.net_invested)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de transações</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma transação lançada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Taxas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.tx_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.tx_type === "compra" ? "default" : "outline"}
                      >
                        {TX_TYPE_LABELS[tx.tx_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tx.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tx.unit_price ? formatBRL(tx.unit_price) : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(tx.fees)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatBRL(tx.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteTransactionButton transactionId={tx.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
