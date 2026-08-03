"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { updateRendaFixaAsset } from "@/lib/actions/renda-fixa";
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
import type { IndexadorType } from "@/lib/types";

interface EditRendaFixaDialogProps {
  assetId: string;
  issuer: string;
  rfProduct: string;
  indexador: IndexadorType;
  indexadorRate: number;
  principalAmount: number;
  purchaseDate: string;
  maturityDate: string | null;
}

export function EditRendaFixaDialog({
  assetId,
  issuer,
  rfProduct,
  indexador,
  indexadorRate,
  principalAmount,
  purchaseDate,
  maturityDate,
}: EditRendaFixaDialogProps) {
  const [open, setOpen] = useState(false);
  const updateWithId = updateRendaFixaAsset.bind(null, assetId);
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
          <DialogTitle>Editar título — {issuer}</DialogTitle>
          <DialogDescription>
            A taxa é sempre em % — ex: 98 para &quot;98% do CDI&quot;
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_issuer">Emissor</Label>
              <Input
                id="edit_issuer"
                name="issuer"
                defaultValue={issuer}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_rf_product">Produto</Label>
              <Select name="rf_product" defaultValue={rfProduct} required>
                <SelectTrigger id="edit_rf_product" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDB">CDB</SelectItem>
                  <SelectItem value="Tesouro Direto">Tesouro Direto</SelectItem>
                  <SelectItem value="LCI">LCI</SelectItem>
                  <SelectItem value="LCA">LCA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_indexador">Indexador</Label>
              <Select name="indexador" defaultValue={indexador} required>
                <SelectTrigger id="edit_indexador" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cdi_pct">% do CDI</SelectItem>
                  <SelectItem value="ipca_mais">IPCA+</SelectItem>
                  <SelectItem value="prefixado">Prefixado</SelectItem>
                  <SelectItem value="selic_pct">% da Selic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_indexador_rate_pct">Taxa (%)</Label>
              <Input
                id="edit_indexador_rate_pct"
                name="indexador_rate_pct"
                type="number"
                step="any"
                min="0"
                defaultValue={indexadorRate * 100}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_principal_amount">Valor investido (R$)</Label>
            <Input
              id="edit_principal_amount"
              name="principal_amount"
              type="number"
              step="any"
              min="0"
              defaultValue={principalAmount}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_purchase_date">Data de compra</Label>
              <Input
                id="edit_purchase_date"
                name="purchase_date"
                type="date"
                defaultValue={purchaseDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_maturity_date">Data de vencimento</Label>
              <Input
                id="edit_maturity_date"
                name="maturity_date"
                type="date"
                defaultValue={maturityDate ?? undefined}
                required
              />
            </div>
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
