-- Tabela de preços (representantes) — é uma foto do mês vigente, não um
-- histórico: quando sai uma tabela nova, o app apaga tudo e regrava (ver
-- UploadPrecosModal.jsx), então não há coluna de período/quinzena aqui.

create table if not exists tabela_precos (
  id uuid primary key default gen_random_uuid(),
  produto text not null,
  tamanho text not null,
  pillow numeric(12,2),
  colchao numeric(12,2),
  colchao_altura text,
  base_box numeric(12,2),
  base_box_altura text,
  conjunto numeric(12,2),
  conjunto_altura text,
  validade date,
  created_at timestamptz not null default now()
);

alter table tabela_precos enable row level security;

create policy "authenticated full access" on tabela_precos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
