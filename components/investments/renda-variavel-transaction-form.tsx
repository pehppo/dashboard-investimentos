"use client";

import { useActionState } from "react";
import { createRendaVariavelTransaction } from "@/lib/actions/transactions";
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

export function RendaVariavelTransactionForm() {
  const [state, formAction, pending] = useActionState(
    createRendaVariavelTransaction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ticker">Ticker</Label>
          <Input
            id="ticker"
            name="ticker"
            placeholder="PETR4"
            className="uppercase"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rv_type">Tipo</Label>
          <Select name="rv_type" defaultValue="acao" required>
            <SelectTrigger id="rv_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acao">Ação</SelectItem>
              <SelectItem value="fii">FII</SelectItem>
              <SelectItem value="etf">ETF</SelectItem>
              <SelectItem value="bdr">BDR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tx_type">Operação</Label>
          <Select name="tx_type" defaultValue="compra" required>
            <SelectTrigger id="tx_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compra">Compra</SelectItem>
              <SelectItem value="venda">Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tx_date">Data</Label>
          <Input
            id="tx_date"
            name="tx_date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantidade</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="any"
            min="0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_price">Preço unitário (R$)</Label>
          <Input
            id="unit_price"
            name="unit_price"
            type="number"
            step="any"
            min="0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fees">Taxas / corretagem (R$)</Label>
        <Input
          id="fees"
          name="fees"
          type="number"
          step="any"
          min="0"
          defaultValue={0}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Input id="notes" name="notes" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Salvando..." : "Lançar transação"}
      </Button>
    </form>
  );
}
