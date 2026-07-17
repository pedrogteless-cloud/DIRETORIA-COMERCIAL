-- Cores disponíveis por produto, vindas do catálogo (não do PDF de preços).
-- Fica numa tabela separada porque tabela_precos é substituída todo mês
-- (upload novo apaga tudo) e cor é um dado do produto, não da tabela de
-- preços vigente — não pode sumir só porque saiu uma tabela de preço nova.
create table if not exists produtos_cores (
  produto text primary key,
  cores text not null
);

alter table produtos_cores enable row level security;

create policy "authenticated full access" on produtos_cores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

alter table tabela_precos add column if not exists cores text;
