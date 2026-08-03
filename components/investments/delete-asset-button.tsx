"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAsset } from "@/lib/actions/assets";
import { Button } from "@/components/ui/button";

export function DeleteAssetButton({
  assetId,
  redirectTo,
}: {
  assetId: string;
  redirectTo?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => {
        if (confirm("Excluir este título? Isso remove todo o histórico dele.")) {
          startTransition(async () => {
            await deleteAsset(assetId);
            if (redirectTo) router.push(redirectTo);
          });
        }
      }}
    >
      <Trash2 className="size-3.5" />
      Excluir
    </Button>
  );
}
