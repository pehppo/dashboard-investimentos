"use client";

import { useActionState, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { createProvento } from "@/lib/actions/proventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const today = new Date().toISOString().slice(0, 10);

export function ProventoDialog({
  assetId,
  ticker,
}: {
  assetId: string;
  ticker: string;
}) {
  const [open, setOpen] = useState(false);
  const createWithId = createProvento.bind(null, assetId);
  const [state, formAction, pending] = useActionState(createWithId, null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fecha o diálogo quando a action assíncrona termina com sucesso
    if (state?.success) setOpen(false);
  }, [state?.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Coins className="size-3.5" />
        Lançar provento
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provento — {ticker}</DialogTitle>
          <DialogDescription>
            Dividendo ou JCP recebido. Não altera sua quantidade ou preço
            médio, só é somado como recebido.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provento_amount">Valor recebido (R$)</Label>
              <Input
                id="provento_amount"
                name="amount"
                type="number"
                step="any"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provento_tx_date">Data</Label>
              <Input
                id="provento_tx_date"
                name="tx_date"
                type="date"
                defaultValue={today}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provento_notes">Observações (opcional)</Label>
            <Input id="provento_notes" name="notes" placeholder="Ex: JCP" />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Salvando..." : "Lançar provento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
