"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { revokeShare } from "@/lib/actions/sharing";
import { Button } from "@/components/ui/button";

export function RevokeShareButton({ shareId }: { shareId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (confirm("Revogar o acesso desse usuário à sua carteira?")) {
          startTransition(() => revokeShare(shareId));
        }
      }}
    >
      <Trash2 className="size-3.5" />
      Revogar
    </Button>
  );
}
