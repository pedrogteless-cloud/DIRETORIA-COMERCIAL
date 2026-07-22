-- Descrição do produto, junto das cores em produtos_cores (metadados do
-- produto que sobrevivem à troca mensal da tabela de preços). Aparece no
-- portal do representante. produtos_cores já tem leitura anon (0009).
alter table produtos_cores add column if not exists descricao text;

-- cores deixou de ser obrigatório: dá pra cadastrar um produto só com
-- descrição, sem cores ainda (o editor de Produtos faz upsert dos dois).
alter table produtos_cores alter column cores drop not null;
