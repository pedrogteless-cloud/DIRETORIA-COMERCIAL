-- Preços promocionais (ex: catálogo "Dia dos Pais"), separados da tabela de
-- preços normal porque são genuinamente outra lista de preços (descontada),
-- não uma reformatação da mesma tabela — os catálogos promocionais vêm em
-- layout de marketing (Canva) por campanha, então cada campanha é lançada
-- manualmente aqui (não dá pra extrair texto de forma confiável de um PDF
-- desenhado como peça gráfica, ao contrário da tabela de representantes,
-- que é exportada de planilha).
create table if not exists tabela_promocional (
  id uuid primary key default gen_random_uuid(),
  campanha text not null,
  produto text not null,
  tamanho text not null,
  colchao numeric,
  base_box numeric,
  conjunto numeric,
  cores text,
  created_at timestamptz not null default now()
);

alter table tabela_promocional enable row level security;

create policy "authenticated full access" on tabela_promocional
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
