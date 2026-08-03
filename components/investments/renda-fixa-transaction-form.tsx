"use client";

import { useActionState } from "react";
import { createRendaFixaAsset } from "@/lib/actions/renda-fixa";
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

const today = new Date().toISOString().slice(0, 10);

export function RendaFixaTransactionForm() {
  const [state, formAction, pending] = useActionState(
    createRendaFixaAsset,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issuer">Emissor</Label>
          <Input id="issuer" name="issuer" placeholder="Banco XP" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rf_product">Produto</Label>
          <Select name="rf_product" defaultValue="CDB" required>
            <SelectTrigger id="rf_product" className="w-full">
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
          <Label htmlFor="indexador">Indexador</Label>
          <Select name="indexador" defaultValue="cdi_pct" required>
            <SelectTrigger id="indexador" className="w-full">
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
          <Label htmlFor="indexador_rate_pct">
            Taxa (%)
          </Label>
          <Input
            id="indexador_rate_pct"
            name="indexador_rate_pct"
            type="number"
            step="any"
            min="0"
            placeholder="Ex: 98 (=98% do CDI) ou 6 (=IPCA+6%)"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="principal_amount">Valor investido (R$)</Label>
        <Input
          id="principal_amount"
          name="principal_amount"
          type="number"
          step="any"
          min="0"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="purchase_date">Data de compra</Label>
          <Input
            id="purchase_date"
            name="purchase_date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maturity_date">Data de vencimento</Label>
          <Input id="maturity_date" name="maturity_date" type="date" required />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando..." : "Lançar título"}
      </Button>
    </form>
  );
}
