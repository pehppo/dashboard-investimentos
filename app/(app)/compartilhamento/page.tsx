import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { GrantShareForm } from "@/components/sharing/grant-share-form";
import { RevokeShareButton } from "@/components/sharing/revoke-share-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ShareRow {
  id: string;
  viewer_id: string;
  created_at: string;
}

export default async function CompartilhamentoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sharesData } = await supabase
    .from("portfolio_shares")
    .select("id, viewer_id, created_at")
    .eq("owner_id", user?.id ?? "")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  const shares = (sharesData ?? []) as ShareRow[];
  const viewerIds = shares.map((s) => s.viewer_id);

  // portfolio_shares referencia auth.users, não profiles diretamente — sem FK
  // pro PostgREST embutir o join, então busca os profiles à parte e casa em JS.
  const { data: profilesData } =
    viewerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", viewerIds)
      : { data: [] };

  const profilesById = new Map((profilesData ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Compartilhamento
        </h1>
        <p className="text-muted-foreground">
          Dê acesso somente leitura à sua carteira para outro usuário cadastrado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compartilhar com alguém</CardTitle>
          <CardDescription>
            A pessoa precisa já ter uma conta no app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GrantShareForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quem tem acesso à sua carteira</CardTitle>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Você ainda não compartilhou sua carteira com ninguém.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share) => {
                  const profile = profilesById.get(share.viewer_id);
                  return (
                    <TableRow key={share.id}>
                      <TableCell>
                        {profile?.display_name ?? profile?.email ?? "-"}
                      </TableCell>
                      <TableCell>{formatDate(share.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <RevokeShareButton shareId={share.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
