import { RendaVariavelTransactionForm } from "@/components/renda-variavel-transaction-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NovaTransacaoRendaVariavelPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Lançar transação
        </h1>
        <p className="text-muted-foreground">
          Renda Variável — ações, FIIs, ETFs e BDRs
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados da transação</CardTitle>
          <CardDescription>
            Se o ticker ainda não existir na sua carteira, ele será criado automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RendaVariavelTransactionForm />
        </CardContent>
      </Card>
    </div>
  );
}
