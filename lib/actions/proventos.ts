"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { proventoSchema } from "@/lib/validation";

export type ProventoActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function createProvento(
  assetId: string,
  _prevState: ProventoActionState,
  formData: FormData,
): Promise<ProventoActionState> {
  const parsed = proventoSchema.safeParse({
    amount: formData.get("amount"),
    tx_date: formData.get("tx_date"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { amount, tx_date, notes } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada, faça login novamente" };
  }

  const { data: asset } = await supabase
    .from("assets")
    .select("id")
    .eq("id", assetId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!asset) {
    return { error: "Ativo não encontrado" };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    asset_id: assetId,
    tx_type: "provento",
    tx_date,
    amount,
    fees: 0,
    notes: notes || null,
  });

  if (error) {
    return { error: "Não foi possível lançar o provento" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-variavel");
  return { success: true };
}
