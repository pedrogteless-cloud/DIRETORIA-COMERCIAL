-- Comissão dos Vendedores · Grupo Ley
-- Tabelas para armazenar quinzenas importadas do relatório L2.3.28 (Infobrasil)

create table if not exists quinzenas (
  id uuid primary key default gen_random_uuid(),
  data_inicio date not null,
  data_fim date not null,
  created_at timestamptz not null default now(),
  unique (data_inicio, data_fim)
);

create table if not exists comissoes_vendedor (
  id uuid primary key default gen_random_uuid(),
  quinzena_id uuid not null references quinzenas(id) on delete cascade,
  codigo text not null,
  nome text not null,
  comissao numeric(12,2) not null default 0,
  vendas_liquidas numeric(12,2) not null default 0,
  vendas_brutas numeric(12,2) not null default 0,
  unique (quinzena_id, codigo)
);

create table if not exists vendedores_ocultos (
  id uuid primary key default gen_random_uuid(),
  padrao text not null unique
);

insert into vendedores_ocultos (padrao) values ('LEY MOVEIS')
  on conflict (padrao) do nothing;

-- RLS: ferramenta interna sem login por enquanto. Liberado para a chave anon.
-- Se depois adicionar autenticação, troque estas políticas por regras
-- restritas a usuários autenticados do time comercial.
alter table quinzenas enable row level security;
alter table comissoes_vendedor enable row level security;
alter table vendedores_ocultos enable row level security;

create policy "anon full access" on quinzenas for all using (true) with check (true);
create policy "anon full access" on comissoes_vendedor for all using (true) with check (true);
create policy "anon full access" on vendedores_ocultos for all using (true) with check (true);
