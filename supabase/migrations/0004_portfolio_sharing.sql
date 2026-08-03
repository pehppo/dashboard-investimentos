-- Compartilhamento de carteira (somente leitura). Ver plano em
-- C:\Users\Usuario\.claude\plans\iterative-shimmying-torvalds.md — Fase D.

create table public.portfolio_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (owner_id, viewer_id),
  check (owner_id <> viewer_id)
);
alter table public.portfolio_shares enable row level security;

-- Sem policy de delete: revogar é update (revoked_at = now()), mantém histórico.
create policy shares_select on public.portfolio_shares
  for select to authenticated using (owner_id = auth.uid() or viewer_id = auth.uid());

create policy shares_insert on public.portfolio_shares
  for insert to authenticated with check (owner_id = auth.uid());

create policy shares_update on public.portfolio_shares
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- security definer evita recursão: a policy de assets/transactions chama essa
-- função, que por sua vez consulta portfolio_shares (que tem sua própria RLS).
create function public.can_view_portfolio(target_owner uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_owner = auth.uid()
    or exists (
      select 1 from public.portfolio_shares
      where owner_id = target_owner
        and viewer_id = auth.uid()
        and revoked_at is null
    );
$$;
revoke all on function public.can_view_portfolio(uuid) from public;
grant execute on function public.can_view_portfolio(uuid) to authenticated;

-- Troca só as policies de SELECT. Insert/update/delete continuam exigindo
-- user_id = auth.uid(), sem mudança — compartilhado é somente leitura de
-- forma estrutural (RLS), não por lógica de aplicação.
drop policy assets_select on public.assets;
create policy assets_select on public.assets
  for select to authenticated using (public.can_view_portfolio(user_id));

drop policy tx_select on public.transactions;
create policy tx_select on public.transactions
  for select to authenticated using (public.can_view_portfolio(user_id));
