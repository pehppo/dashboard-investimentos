-- Fase 1: schema core (profiles, assets, transactions, positions) + RLS somente-dono.
-- Compartilhamento (portfolio_shares) entra na Fase 4, em migration separada.

-- ============================================================
-- ENUMS
-- ============================================================
create type asset_class as enum ('renda_variavel', 'renda_fixa', 'fundo');
create type rv_type as enum ('acao', 'fii', 'etf', 'bdr');
create type indexador_type as enum ('cdi_pct', 'ipca_mais', 'prefixado', 'selic_pct');
create type fundo_type as enum ('fundo_investimento', 'pgbl', 'vgbl');
create type tx_type as enum ('compra', 'venda', 'aporte', 'resgate');

-- ============================================================
-- PROFILES (espelho de auth.users, necessário para lookup de e-mail no compartilhamento futuro)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================
-- ASSETS
-- ============================================================
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_class asset_class not null,

  -- renda variável
  ticker text,
  rv_type rv_type,

  -- renda fixa
  issuer text,
  rf_product text,
  indexador indexador_type,
  indexador_rate numeric,
  purchase_date date,
  maturity_date date,
  principal_amount numeric,

  -- fundos / previdência
  fundo_name text,
  fundo_type fundo_type,

  nickname text,
  created_at timestamptz not null default now(),

  constraint chk_asset_class_fields check (
    (asset_class = 'renda_variavel' and ticker is not null and rv_type is not null)
    or (asset_class = 'renda_fixa' and issuer is not null and rf_product is not null and indexador is not null)
    or (asset_class = 'fundo' and fundo_name is not null and fundo_type is not null)
  )
);

create index idx_assets_user on public.assets(user_id);

-- um ativo de renda variável por ticker por usuário (evita linhas duplicadas para o mesmo ticker)
create unique index idx_assets_user_ticker on public.assets(user_id, ticker)
  where asset_class = 'renda_variavel';

alter table public.assets enable row level security;

create policy assets_select on public.assets
  for select to authenticated using (user_id = auth.uid());

create policy assets_insert on public.assets
  for insert to authenticated with check (user_id = auth.uid());

create policy assets_update on public.assets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy assets_delete on public.assets
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- TRANSACTIONS (ledger, fonte da verdade)
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  tx_type tx_type not null,
  tx_date date not null,
  quantity numeric,
  unit_price numeric,
  amount numeric not null,
  fees numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_tx_user on public.transactions(user_id);
create index idx_tx_asset on public.transactions(asset_id, tx_date);

alter table public.transactions enable row level security;

create policy tx_select on public.transactions
  for select to authenticated using (user_id = auth.uid());

create policy tx_insert on public.transactions
  for insert to authenticated with check (user_id = auth.uid());

create policy tx_update on public.transactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy tx_delete on public.transactions
  for delete to authenticated using (user_id = auth.uid());

-- ============================================================
-- POSITIONS — view derivada (nunca estado mutável duplicado)
-- ============================================================
create view public.positions
with (security_invoker = true) as
select
  a.id as asset_id,
  a.user_id,
  a.asset_class,
  a.ticker,
  a.rv_type,
  a.issuer,
  a.rf_product,
  a.indexador,
  a.indexador_rate,
  a.purchase_date,
  a.maturity_date,
  a.fundo_name,
  a.fundo_type,
  a.nickname,
  sum(case when t.tx_type in ('compra', 'aporte') then coalesce(t.quantity, 0)
           when t.tx_type in ('venda', 'resgate') then -coalesce(t.quantity, 0)
           else 0 end) as quantity_held,
  sum(case when t.tx_type in ('compra', 'aporte') then t.amount
           when t.tx_type in ('venda', 'resgate') then -t.amount
           else 0 end) as net_invested,
  case
    when sum(case when t.tx_type in ('compra', 'aporte') then coalesce(t.quantity, 0) else 0 end) > 0
    then sum(case when t.tx_type in ('compra', 'aporte') then t.amount else 0 end)
         / nullif(sum(case when t.tx_type in ('compra', 'aporte') then coalesce(t.quantity, 0) else 0 end), 0)
    else null
  end as avg_price
from public.assets a
join public.transactions t on t.asset_id = a.id
group by a.id, a.user_id, a.asset_class, a.ticker, a.rv_type, a.issuer, a.rf_product,
         a.indexador, a.indexador_rate, a.purchase_date, a.maturity_date,
         a.fundo_name, a.fundo_type, a.nickname;

grant select on public.positions to authenticated;

-- ============================================================
-- PRICE QUOTES (cache de cotações, renda variável) — Fase 3, criado já para não migrar depois
-- ============================================================
create table public.price_quotes (
  id bigint generated always as identity primary key,
  ticker text not null,
  price numeric not null,
  as_of timestamptz not null,
  fetched_at timestamptz not null default now(),
  source text not null default 'brapi'
);

create index idx_quotes_ticker_time on public.price_quotes(ticker, as_of desc);

alter table public.price_quotes enable row level security;

create policy quotes_select on public.price_quotes
  for select to authenticated using (true);

-- sem policy de insert/update/delete para authenticated/anon:
-- apenas o service_role (usado em server actions/cron) grava, pois bypassa RLS.

-- ============================================================
-- INDEX SERIES (CDI/IPCA, Banco Central SGS) — Fase 3
-- ============================================================
create table public.index_series (
  id bigint generated always as identity primary key,
  series_code integer not null,
  ref_date date not null,
  value numeric not null,
  fetched_at timestamptz not null default now(),
  unique (series_code, ref_date)
);

alter table public.index_series enable row level security;

create policy index_series_select on public.index_series
  for select to authenticated using (true);
