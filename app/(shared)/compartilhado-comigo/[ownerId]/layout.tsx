import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OwnerPortfolioLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Checagem explícita (além da RLS) pra dar um 404 limpo em vez de telas
  // vazias quando não há compartilhamento ativo desse dono com esse viewer.
  const { data: share } = await supabase
    .from("portfolio_shares")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("viewer_id", user?.id ?? "")
    .is("revoked_at", null)
    .maybeSingle();

  if (!share) {
    notFound();
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", ownerId)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        Você está vendo a carteira de{" "}
        <strong>{ownerProfile?.display_name ?? ownerProfile?.email}</strong> —
        somente leitura.
      </div>
      {children}
    </div>
  );
}
