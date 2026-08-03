"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rendaFixaAssetSchema } from "@/lib/validation";

export type RendaFixaActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function createRendaFixaAsset(
  _prevState: RendaFixaActionState,
  formData: FormData,
): Promise<RendaFixaActionState> {
  const parsed = rendaFixaAssetSchema.safeParse({
    issuer: formData.get("issuer"),
    rf_product: formData.get("rf_product"),
    indexador: formData.get("indexador"),
    indexador_rate_pct: formData.get("indexador_rate_pct"),
    principal_amount: formData.get("principal_amount"),
    purchase_date: formData.get("purchase_date"),
    maturity_date: formData.get("maturity_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const {
    issuer,
    rf_product,
    indexador,
    indexador_rate_pct,
    principal_amount,
    purchase_date,
    maturity_date,
  } = parsed.data;

  if (new Date(maturity_date) <= new Date(purchase_date)) {
    return { error: "Data de vencimento deve ser depois da data de compra" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada, faça login novamente" };
  }

  const indexador_rate = indexador_rate_pct / 100;

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      user_id: user.id,
      asset_class: "renda_fixa",
      issuer,
      rf_product,
      indexador,
      indexador_rate,
      purchase_date,
      maturity_date,
      principal_amount,
    })
    .select("id")
    .single();

  if (assetError || !asset) {
    return { error: "Não foi possível cadastrar o título" };
  }

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: user.id,
    asset_id: asset.id,
    tx_type: "aporte",
    tx_date: purchase_date,
    amount: principal_amount,
    fees: 0,
  });

  if (txError) {
    return { error: "Título criado, mas houve erro ao registrar o aporte" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-fixa");
  redirect("/renda-fixa");
}

export async function updateRendaFixaAsset(
  assetId: string,
  _prevState: RendaFixaActionState,
  formData: FormData,
): Promise<RendaFixaActionState> {
  const parsed = rendaFixaAssetSchema.safeParse({
    issuer: formData.get("issuer"),
    rf_product: formData.get("rf_product"),
    indexador: formData.get("indexador"),
    indexador_rate_pct: formData.get("indexador_rate_pct"),
    principal_amount: formData.get("principal_amount"),
    purchase_date: formData.get("purchase_date"),
    maturity_date: formData.get("maturity_date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const {
    issuer,
    rf_product,
    indexador,
    indexador_rate_pct,
    principal_amount,
    purchase_date,
    maturity_date,
  } = parsed.data;

  if (new Date(maturity_date) <= new Date(purchase_date)) {
    return { error: "Data de vencimento deve ser depois da data de compra" };
  }

  const indexador_rate = indexador_rate_pct / 100;
  const supabase = await createClient();

  const { error: assetError } = await supabase
    .from("assets")
    .update({
      issuer,
      rf_product,
      indexador,
      indexador_rate,
      purchase_date,
      maturity_date,
      principal_amount,
    })
    .eq("id", assetId);

  if (assetError) {
    return { error: "Não foi possível atualizar o título" };
  }

  // Mantém o aporte original (ledger) em sincronia com o valor investido/data
  // editados — cada título de renda fixa tem um único aporte inicial.
  const { data: originalTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("asset_id", assetId)
    .eq("tx_type", "aporte")
    .order("tx_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (originalTx) {
    const { error: txError } = await supabase
      .from("transactions")
      .update({ tx_date: purchase_date, amount: principal_amount })
      .eq("id", originalTx.id);

    if (txError) {
      return { error: "Título atualizado, mas houve erro ao ajustar o aporte" };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-fixa");
  return { success: true };
}
