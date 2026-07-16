-- Comissão dos Vendedores · Grupo Ley — v2
-- Adiciona: dimensão de loja (matriz/filial), carteira pendente (vendas
-- digitadas não faturadas) e calendário de datas de pagamento.

-- 1) Loja em comissoes_vendedor (um vendedor pode vender nas duas lojas
--    na mesma quinzena, então o valor precisa existir por loja)
alter table comissoes_vendedor add column if not exists loja text not null default 'COLCH';
alter table comissoes_vendedor drop constraint if exists comissoes_vendedor_quinzena_id_codigo_key;
alter table comissoes_vendedor add constraint comissoes_vendedor_quinzena_codigo_loja_key
  unique (quinzena_id, codigo, loja);

-- 2) Data de pagamento real de cada quinzena (pode ser diferente do
--    período coberto — ex: quinzena 01/07-15/07 paga em 15/07 ou depois)
alter table quinzenas add column if not exists data_pagamento date;

-- 3) Carteira pendente: snapshot da carteira de pedidos não faturados
--    por vendedor/loja, tirado do relatório "pendente" do Infobrasil
create table if not exists carteira_snapshots (
  id uuid primary key default gen_random_uuid(),
  data_relatorio date not null,
  loja text not null,
  created_at timestamptz not null default now(),
  unique (data_relatorio, loja)
);

create table if not exists carteira_vendedor (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references carteira_snapshots(id) on delete cascade,
  codigo text not null,
  nome text not null,
  valor_pendente numeric(12,2) not null default 0,
  comissao_potencial numeric(12,2) not null default 0,
  unique (snapshot_id, codigo)
);

alter table carteira_snapshots enable row level security;
alter table carteira_vendedor enable row level security;
create policy "anon full access" on carteira_snapshots for all using (true) with check (true);
create policy "anon full access" on carteira_vendedor for all using (true) with check (true);

-- 4) Calendário de datas de pagamento — o Pedro marca no app quando vai
--    ser a próxima quinzena paga; o bot usa isso pra cobrar o relatório
--    naquele dia. Quando o relatório daquela data é processado, liga-se
--    quinzena_id e marca como cumprida.
create table if not exists datas_pagamento (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  quinzena_id uuid references quinzenas(id) on delete set null,
  notificado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table datas_pagamento enable row level security;
create policy "anon full access" on datas_pagamento for all using (true) with check (true);
