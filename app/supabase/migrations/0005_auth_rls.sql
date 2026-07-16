-- Login e senha: troca as políticas abertas (qualquer um com a anon key)
-- por políticas que exigem um usuário autenticado do Supabase Auth.
--
-- As Edge Functions do Telegram continuam funcionando sem login: elas usam
-- a service role key, que ignora RLS por completo.

drop policy if exists "anon full access" on quinzenas;
drop policy if exists "anon full access" on comissoes_vendedor;
drop policy if exists "anon full access" on vendedores_ocultos;
drop policy if exists "anon full access" on carteira_snapshots;
drop policy if exists "anon full access" on carteira_vendedor;
drop policy if exists "anon full access" on datas_pagamento;

create policy "authenticated full access" on quinzenas
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on comissoes_vendedor
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on vendedores_ocultos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on carteira_snapshots
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on carteira_vendedor
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on datas_pagamento
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
