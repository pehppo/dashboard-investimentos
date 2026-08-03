import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CompartilhadoComigoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sharesData } = await supabase
    .from("portfolio_shares")
    .select("owner_id")
    .eq("viewer_id", user?.id ?? "")
    .is("revoked_at", null);

  const ownerIds = (sharesData ?? []).map((s) => s.owner_id);

  // portfolio_shares referencia auth.users, não profiles diretamente — sem FK
  // pro PostgREST embutir o join, então busca os profiles à parte.
  const { data: profilesData } =
    ownerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", ownerIds)
      : { data: [] };

  const profiles = profilesData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Compartilhado comigo
        </h1>
        <p className="text-muted-foreground">
          Carteiras de outros usuários que compartilharam acesso com você
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carteiras disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Users className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Ninguém compartilhou uma carteira com você ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/compartilhado-comigo/${p.id}/dashboard`}
                  className="flex items-center justify-between rounded-md border px-4 py-3 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{p.display_name ?? p.email}</span>
                  <span className="text-primary underline underline-offset-4">
                    Ver carteira
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
