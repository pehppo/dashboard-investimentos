"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  rendaVariavelTransactionSchema,
  editRendaVariavelTransactionSchema,
} from "@/lib/validation";

export type TransactionActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function createRendaVariavelTransaction(
  _prevState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const parsed = rendaVariavelTransactionSchema.safeParse({
    ticker: formData.get("ticker"),
    rv_type: formData.get("rv_type"),
    tx_type: formData.get("tx_type"),
    tx_date: formData.get("tx_date"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    fees: formData.get("fees") || 0,
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { ticker, rv_type, tx_type, tx_date, quantity, unit_price, fees, notes } =
    parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada, faça login novamente" };
  }

  // encontra o ativo pelo ticker ou cria um novo
  const { data: existingAsset } = await supabase
    .from("assets")
    .select("id")
    .eq("user_id", user.id)
    .eq("asset_class", "renda_variavel")
    .eq("ticker", ticker)
    .maybeSingle();

  let assetId = existingAsset?.id as string | undefined;

  if (!assetId) {
    const { data: newAsset, error: assetError } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        asset_class: "renda_variavel",
        ticker,
        rv_type,
      })
      .select("id")
      .single();

    if (assetError || !newAsset) {
      return { error: "Não foi possível cadastrar o ativo" };
    }

    assetId = newAsset.id;
  }

  const amount = quantity * unit_price;

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    asset_id: assetId,
    tx_type,
    tx_date,
    quantity,
    unit_price,
    amount,
    fees,
    notes: notes || null,
  });

  if (txError) {
    return { error: "Não foi possível lançar a transação" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-variavel");
  redirect("/renda-variavel");
}

export async function updateTransaction(
  transactionId: string,
  _prevState: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const parsed = editRendaVariavelTransactionSchema.safeParse({
    tx_type: formData.get("tx_type"),
    tx_date: formData.get("tx_date"),
    quantity: formData.get("quantity"),
    unit_price: formData.get("unit_price"),
    fees: formData.get("fees") || 0,
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { tx_type, tx_date, quantity, unit_price, fees, notes } = parsed.data;
  const amount = quantity * unit_price;

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      tx_type,
      tx_date,
      quantity,
      unit_price,
      amount,
      fees,
      notes: notes || null,
    })
    .eq("id", transactionId);

  if (error) {
    return { error: "Não foi possível atualizar a transação" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-variavel");
  return { success: true };
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    throw new Error("Não foi possível excluir a transação");
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-variavel");
}
