import { notFound } from "next/navigation";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRendaFixaRates, refreshRendaFixaRatesIfStale } from "@/lib/external/bcb-sgs";
import { estimateRendaFixaValue } from "@/lib/calc/rendafixa";
import { formatBRL, formatDate } from "@/lib/format";
import { Position, Transaction, formatIndexador, TX_TYPE_LABELS } from "@/lib/types";
import { DeleteTransactionButton } from "@/components/investments/delete-transaction-button";
import { DeleteAssetButton } from "@/components/investments/delete-asset-button";
import { EditRendaFixaDialog } from "@/components/investments/edit-renda-fixa-dialog";
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

export default async function AtivoRendaFixaPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id ?? "";

  const [{ data: position }, { data: txs }] = await Promise.all([
    supabase
      .from("positions")
      .select("*")
      .eq("asset_id", assetId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("*")
      .eq("asset_id", assetId)
      .eq("user_id", userId)
      .order("tx_date", { ascending: false }),
  ]);

  if (!position) {
    notFound();
  }

  const pos = position as Position;
  const transactions = (txs ?? []) as Transaction[];
  const rates = await getRendaFixaRates();
  after(() => refreshRendaFixaRatesIfStale(session?.access_token));

  const estimated =
    pos.indexador && pos.indexador_rate != null && pos.purchase_date
      ? estimateRendaFixaValue(
          {
            indexador: pos.indexador,
            indexadorRate: pos.indexador_rate,
            principal: pos.net_invested,
            purchaseDate: pos.purchase_date,
            maturityDate: pos.maturity_date,
          },
          rates,
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{pos.issuer}</h1>
          <Badge variant="secondary">{pos.rf_product}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {pos.indexador && pos.indexador_rate != null && pos.purchase_date && (
            <EditRendaFixaDialog
              assetId={pos.asset_id}
              issuer={pos.issuer ?? ""}
              rfProduct={pos.rf_product ?? "CDB"}
              indexador={pos.indexador}
              indexadorRate={pos.indexador_rate}
              principalAmount={pos.net_invested}
              purchaseDate={pos.purchase_date}
              maturityDate={pos.maturity_date}
            />
          )}
          <DeleteAssetButton assetId={pos.asset_id} redirectTo="/renda-fixa" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Indexador</CardDescription>
            <CardTitle>
              {pos.indexador && pos.indexador_rate != null
                ? formatIndexador(pos.indexador, pos.indexador_rate)
                : "-"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vencimento</CardDescription>
            <CardTitle>
              {pos.maturity_date ? formatDate(pos.maturity_date) : "-"}
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
        <Card>
          <CardHeader>
            <CardDescription>Valor estimado no vencimento</CardDescription>
            <CardTitle className="tabular-nums">
              {estimated != null ? formatBRL(estimated) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de aportes</CardTitle>
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
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.tx_date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TX_TYPE_LABELS[tx.tx_type]}
                      </Badge>
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
