"use client";

import { useTransition } from "react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({
  transactionId,
}: {
  transactionId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (confirm("Excluir esta transação?")) {
          startTransition(() => {
            deleteTransaction(transactionId);
          });
        }
      }}
    >
      Excluir
    </Button>
  );
}
