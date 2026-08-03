"use client";

import { useState } from "react";
import { LineChart, Landmark, Plus, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RendaVariavelTransactionForm } from "@/components/investments/renda-variavel-transaction-form";
import { RendaFixaTransactionForm } from "@/components/investments/renda-fixa-transaction-form";

type Step = "choose" | "renda_variavel" | "renda_fixa";

export function NewInvestmentButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setStep("choose");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Lançar investimento"
        className="group fixed bottom-6 right-6 z-20 flex h-12 items-center gap-2 rounded-full bg-primary pl-3.5 pr-3.5 text-primary-foreground shadow-lg transition-all hover:pr-5 hover:shadow-xl"
      >
        <Plus className="size-5 shrink-0" />
        <span className="grid max-w-0 grid-cols-[0fr] overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:max-w-xs group-hover:grid-cols-[1fr]">
          <span className="overflow-hidden">Lançar investimento</span>
        </span>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          {step === "choose" && (
            <>
              <DialogHeader>
                <DialogTitle>Lançar investimento</DialogTitle>
                <DialogDescription>
                  Escolha a categoria do lançamento
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <button
                  type="button"
                  onClick={() => setStep("renda_variavel")}
                  className="flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors hover:border-primary hover:bg-accent"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <LineChart
                      className="size-5"
                      style={{ color: "var(--chart-1)" }}
                    />
                  </span>
                  <span className="font-medium">Renda Variável</span>
                  <span className="text-xs text-muted-foreground">
                    Ações, FIIs, ETFs, BDRs
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("renda_fixa")}
                  className="flex flex-col items-center gap-3 rounded-lg border p-6 text-center transition-colors hover:border-primary hover:bg-accent"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Landmark
                      className="size-5"
                      style={{ color: "var(--chart-2)" }}
                    />
                  </span>
                  <span className="font-medium">Renda Fixa</span>
                  <span className="text-xs text-muted-foreground">
                    CDB, Tesouro, LCI, LCA
                  </span>
                </button>
              </div>
            </>
          )}

          {step === "renda_variavel" && (
            <>
              <DialogHeader>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2 text-muted-foreground"
                  onClick={() => setStep("choose")}
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <DialogTitle>Renda Variável</DialogTitle>
                <DialogDescription>Ações, FIIs, ETFs e BDRs</DialogDescription>
              </DialogHeader>
              <RendaVariavelTransactionForm />
            </>
          )}

          {step === "renda_fixa" && (
            <>
              <DialogHeader>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit -ml-2 text-muted-foreground"
                  onClick={() => setStep("choose")}
                >
                  <ChevronLeft className="size-4" />
                  Voltar
                </Button>
                <DialogTitle>Renda Fixa</DialogTitle>
                <DialogDescription>
                  CDB, Tesouro Direto, LCI e LCA
                </DialogDescription>
              </DialogHeader>
              <RendaFixaTransactionForm />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
