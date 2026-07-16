-- Separa "lembrete já enviado hoje" de "quinzena já vinculada/cumprida",
-- que são coisas diferentes: o bot pode já ter cobrado no dia (lembrete)
-- antes do Pedro efetivamente subir os relatórios (cumprida).
alter table datas_pagamento add column if not exists lembrete_enviado boolean not null default false;
