"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteAsset(assetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", assetId);

  if (error) {
    throw new Error("Não foi possível excluir o ativo");
  }

  revalidatePath("/dashboard");
  revalidatePath("/renda-fixa");
  revalidatePath("/renda-variavel");
}
