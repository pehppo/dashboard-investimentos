"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { updateTransaction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EditTransactionDialogProps {
  transactionId: string;
  ticker: string;
  txType: "compra" | "venda";
  txDate: string;
  quantity: number | null;
  unitPrice: number | null;
  fees?: number;
  notes?: string | null;
}

export function EditTransactionDialog({
  transactionId,
  ticker,
  txType,
  txDate,
  quantity,
  unitPrice,
  fees,
  notes,
}: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const updateWithId = updateTransaction.bind(null, transactionId);
  const [state, formAction, pending] = useActionState(updateWithId, null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fecha o diálogo quando a action assíncrona termina com sucesso
    if (state?.success) setOpen(false);
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
        Editar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar transação — {ticker}</DialogTitle>
          <DialogDescription>
            O ticker não pode ser alterado aqui; exclua e lance de novo se
            precisar mudar o ativo.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_tx_type">Operação</Label>
              <Select name="tx_type" defaultValue={txType} required>
                <SelectTrigger id="edit_tx_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_tx_date">Data</Label>
              <Input
                id="edit_tx_date"
                name="tx_date"
                type="date"
                defaultValue={txDate}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_quantity">Quantidade</Label>
              <Input
                id="edit_quantity"
                name="quantity"
                type="number"
                step="any"
                min="0"
                defaultValue={quantity ?? undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_unit_price">Preço unitário (R$)</Label>
              <Input
                id="edit_unit_price"
                name="unit_price"
                type="number"
                step="any"
                min="0"
                defaultValue={unitPrice ?? undefined}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_fees">Taxas / corretagem (R$)</Label>
            <Input
              id="edit_fees"
              name="fees"
              type="number"
              step="any"
              min="0"
              defaultValue={fees ?? 0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes">Observações (opcional)</Label>
            <Input id="edit_notes" name="notes" defaultValue={notes ?? ""} />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
