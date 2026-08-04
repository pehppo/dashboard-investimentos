import { Landmark, LineChart, Wallet } from "lucide-react";
import { getPortfolioSnapshot } from "@/lib/actions/chat";
import { formatBRL } from "@/lib/format";
import { InvestmentChat } from "@/components/chat/investment-chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AssistentePage() {
  const snapshot = await getPortfolioSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assistente de aportes</h1>
        <p className="text-muted-foreground">
          Peça sugestões de como dividir um novo aporte com base na sua carteira atual
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sua carteira hoje</CardTitle>
          <CardDescription>
            É exatamente isso que o assistente enxerga pra montar as respostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="size-3.5" />
                Patrimônio total
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatBRL(snapshot.totalInvestido)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LineChart className="size-3.5" />
                Renda Variável (atual)
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatBRL(snapshot.rendaVariavel.totalAtual)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Landmark className="size-3.5" />
                Renda Fixa (investido)
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatBRL(snapshot.rendaFixa.totalInvestido)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversa</CardTitle>
        </CardHeader>
        <CardContent>
          <InvestmentChat />
        </CardContent>
      </Card>
    </div>
  );
}
