-- A policy original (0001) liberava select em profiles pra qualquer
-- authenticated (using (true)) — qualquer usuário logado conseguia listar
-- e-mail e nome de todo mundo cadastrado, sem nenhuma relação de
-- compartilhamento. Restringe a: o próprio perfil, ou perfil de quem tem
-- relação de compartilhamento ativa (como owner ou como viewer) com o
-- usuário atual — cobre os únicos consumidores reais (header, tela de
-- compartilhamento, "compartilhado comigo").
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or exists (
      select 1 from public.portfolio_shares
      where revoked_at is null
        and (
          (owner_id = auth.uid() and viewer_id = profiles.id)
          or (viewer_id = auth.uid() and owner_id = profiles.id)
        )
    )
  );

-- grantShare precisa localizar o id de um usuário pelo e-mail antes de
-- qualquer relação de compartilhamento existir — por isso não pode
-- depender da policy acima. Expõe só o id via função security definer,
-- sem dar select de tabela inteira.
create function public.find_user_id_by_email(target_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.profiles where email ilike target_email limit 1;
$$;
revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to authenticated;
