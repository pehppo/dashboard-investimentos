"use client";

import { useActionState } from "react";
import { grantShare } from "@/lib/actions/sharing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GrantShareForm() {
  const [state, formAction, pending] = useActionState(grantShare, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="share_email">E-mail do usuário</Label>
        <Input
          id="share_email"
          name="email"
          type="email"
          placeholder="pessoa@exemplo.com"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Compartilhando..." : "Compartilhar"}
      </Button>
      {state?.error && (
        <p className="text-sm text-destructive sm:basis-full">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-success sm:basis-full">
          Carteira compartilhada com sucesso.
        </p>
      )}
    </form>
  );
}
