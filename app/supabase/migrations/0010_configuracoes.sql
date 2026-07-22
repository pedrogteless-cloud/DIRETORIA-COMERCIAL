-- Configurações gerais do portal em pares chave/valor. Hoje guarda os
-- números de WhatsApp da digitadora/recebedora de pedidos de cada fábrica
-- (pra onde o representante manda o PDF do pedido). Leitura liberada pro
-- anon (o portal precisa ler o número no envio); edição só pelo diretor.
create table if not exists configuracoes (
  chave text primary key,
  valor text
);

alter table configuracoes enable row level security;

create policy "authenticated full access" on configuracoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "anon read access" on configuracoes
  for select using (true);

insert into configuracoes (chave, valor) values
  ('whatsapp_pedidos_eusebio', ''),
  ('whatsapp_pedidos_timon', '')
on conflict (chave) do nothing;
