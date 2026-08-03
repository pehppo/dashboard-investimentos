-- price_quotes e index_series são caches de dados públicos de mercado (não
-- pertencem a um usuário específico), então qualquer usuário autenticado pode
-- gravar uma atualização de cache com segurança — não é dado sensível.
-- A migration 0001 só previa policy de SELECT; sem INSERT/UPDATE, o refresh
-- de cotações e taxas falhava silenciosamente (RLS bloqueando a escrita).

create policy quotes_insert on public.price_quotes
  for insert to authenticated with check (true);

create policy quotes_update on public.price_quotes
  for update to authenticated using (true) with check (true);

create policy index_series_insert on public.index_series
  for insert to authenticated with check (true);

create policy index_series_update on public.index_series
  for update to authenticated using (true) with check (true);
