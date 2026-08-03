import { RendaFixaTransactionForm } from "@/components/investments/renda-fixa-transaction-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NovoTituloRendaFixaPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lançar título</h1>
        <p className="text-muted-foreground">
          Renda Fixa — CDB, Tesouro Direto, LCI e LCA
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados do título</CardTitle>
          <CardDescription>
            A taxa é sempre em % — ex: 98 para &quot;98% do CDI&quot;, 6 para
            &quot;IPCA+6%&quot;, 12 para &quot;12% a.a. prefixado&quot;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RendaFixaTransactionForm />
        </CardContent>
      </Card>
    </div>
  );
}
