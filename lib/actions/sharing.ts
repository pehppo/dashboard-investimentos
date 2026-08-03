"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { grantShareSchema } from "@/lib/validation";

export type GrantShareActionState = {
  error?: string;
  success?: boolean;
} | null;

export async function grantShare(
  _prevState: GrantShareActionState,
  formData: FormData,
): Promise<GrantShareActionState> {
  const parsed = grantShareSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  const { email } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada, faça login novamente" };
  }

  if (email === user.email?.toLowerCase()) {
    return { error: "Você não pode compartilhar com você mesmo" };
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (!viewerProfile) {
    return { error: "Nenhum usuário cadastrado com esse e-mail" };
  }

  // upsert reativa um compartilhamento revogado antes, em vez de esbarrar na
  // unique constraint (owner_id, viewer_id) com um segundo insert.
  const { error } = await supabase
    .from("portfolio_shares")
    .upsert(
      { owner_id: user.id, viewer_id: viewerProfile.id, revoked_at: null },
      { onConflict: "owner_id,viewer_id" },
    );

  if (error) {
    return { error: "Não foi possível compartilhar sua carteira" };
  }

  revalidatePath("/compartilhamento");
  return { success: true };
}

export async function revokeShare(shareId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId);

  if (error) {
    throw new Error("Não foi possível revogar o compartilhamento");
  }

  revalidatePath("/compartilhamento");
}
