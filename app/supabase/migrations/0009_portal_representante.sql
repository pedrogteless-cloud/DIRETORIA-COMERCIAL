-- Portal do Representante: app separado (PIN, sem Supabase Auth) onde os
-- representantes baixam material de produto e consultam preço/promoção
-- direto do celular, em vez de pedir foto no grupo do WhatsApp.
--
-- Autenticação dos representantes é por PIN, não por login do Supabase Auth
-- (time de vendas não é tech-savvy o bastante pra fricção de senha/email).
-- A tabela "representantes" guarda o PIN, mas fica fechada pra leitura
-- direta (anon não pode dar select nela) — a checagem roda inteira dentro
-- da function abaixo (security definer), que só devolve nome/código quando
-- o PIN bate. Gerenciar representantes (criar/editar/apagar) continua
-- exclusivo do diretor autenticado, pela Diretoria Comercial.

create table if not exists representantes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text,
  pin text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table representantes enable row level security;

create policy "authenticated full access" on representantes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create or replace function public.checar_acesso_representante(p_pin text)
returns table(id uuid, nome text, codigo text)
language sql
security definer
set search_path = public
as $$
  select id, nome, codigo from representantes where pin = p_pin and ativo = true limit 1;
$$;

revoke all on function public.checar_acesso_representante(text) from public;
grant execute on function public.checar_acesso_representante(text) to anon, authenticated;

-- Material de produto (fotos, catálogos) que o representante pode ver/baixar.
-- Upload continua exclusivo do diretor; leitura é liberada pro anon porque
-- é exatamente o conteúdo que hoje ele manda solto no grupo do WhatsApp.
create table if not exists materiais_produto (
  id uuid primary key default gen_random_uuid(),
  produto text not null,
  tipo text not null default 'foto',
  storage_path text not null,
  nome_arquivo text not null,
  created_at timestamptz not null default now()
);

alter table materiais_produto enable row level security;

create policy "authenticated full access" on materiais_produto
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "anon read access" on materiais_produto
  for select using (true);

-- Preço e promoção precisam ser lidos pelo portal (anon, sem Supabase Auth)
-- — mantém as políticas de authenticated já existentes (upload/gestão segue
-- só com o diretor) e soma uma de leitura pública.
create policy "anon read access" on tabela_precos for select using (true);
create policy "anon read access" on tabela_promocional for select using (true);
create policy "anon read access" on produtos_cores for select using (true);

-- Bucket de storage pro material de produto (fotos, catálogos) — público
-- pra leitura (URL direta, sem precisar de signed URL), upload só pelo
-- diretor autenticado.
insert into storage.buckets (id, name, public)
values ('materiais', 'materiais', true)
on conflict (id) do nothing;

create policy "authenticated upload materiais" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materiais');

create policy "authenticated delete materiais" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materiais');

create policy "authenticated update materiais" on storage.objects
  for update to authenticated
  using (bucket_id = 'materiais');

create policy "public read materiais" on storage.objects
  for select using (bucket_id = 'materiais');
