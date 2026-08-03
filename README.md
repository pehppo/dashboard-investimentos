# Dashboard de Investimentos

Aplicação pessoal para controlar e lançar investimentos: renda variável
(ações, FIIs, ETFs, BDRs), renda fixa (CDB, Tesouro Direto, LCI, LCA) e, no
futuro, fundos/previdência.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript) + Tailwind CSS + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) — Postgres, Auth (e-mail/senha + Google) e RLS
- [brapi.dev](https://brapi.dev) — cotações de ações/FIIs/ETFs em tempo real
- [Banco Central (SGS)](https://dadosabertos.bcb.gov.br/) — taxas de CDI, Selic e IPCA usadas na projeção de renda fixa

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.local.example` para `.env.local` e preencha:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   BRAPI_TOKEN=
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` vêm de Project Settings → API no painel do Supabase.
   - `BRAPI_TOKEN` é gratuito, gerado em [brapi.dev](https://brapi.dev). Sem ele, as cotações em tempo real ficam indisponíveis (o resto do app funciona normalmente).

3. Aplique as migrations em `supabase/migrations/` (na ordem, pelo SQL Editor do Supabase ou via Supabase CLI).

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura do projeto

```
app/
  (auth)/           páginas públicas de login e cadastro
  (app)/            páginas autenticadas (dashboard, renda variável, renda fixa)
  auth/callback/    troca de código OAuth/e-mail por sessão (Supabase)
components/
  auth/             formulários e botões de autenticação
  layout/           navegação, tema (claro/escuro)
  investments/      formulários de lançamento e botões de exclusão
  ui/               componentes shadcn/ui (não editar manualmente — regenerar via `npx shadcn add`)
lib/
  actions/          server actions (mutações e leituras usadas pelas páginas)
  calc/             fórmulas de cálculo (valuation de renda fixa)
  external/         clientes de APIs externas (brapi.dev, Banco Central)
  supabase/         clientes Supabase (browser, servidor, middleware)
supabase/migrations/ schema do banco (SQL, aplicado manualmente por enquanto)
```

## Autenticação com Google

Requer configurar um OAuth Client ID no Google Cloud Console e habilitar o
provider Google no painel do Supabase (Authentication → Providers → Google),
usando como redirect URI: `https://<seu-projeto>.supabase.co/auth/v1/callback`.
