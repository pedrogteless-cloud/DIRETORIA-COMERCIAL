-- Agenda a checagem diária de lembrete do Telegram.
-- Requer as extensões pg_cron e pg_net (ative em Database → Extensions no
-- painel do Supabase antes de aplicar esta migration).
--
-- SUBSTITUA os dois placeholders abaixo antes de aplicar:
--   <PROJECT_REF>     -- referência do seu projeto Supabase (ex: abcdefgh)
--   <ANON_OU_SERVICE_KEY> -- uma chave do projeto, só para autenticar a chamada HTTP

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'lembrete-quinzena-diario',
  '0 11 * * *', -- 11:00 UTC = 08:00 em America/Fortaleza (UTC-3)
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/telegram-remind',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <ANON_OU_SERVICE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
