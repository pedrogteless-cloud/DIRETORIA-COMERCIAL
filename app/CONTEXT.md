# Contexto do projeto (leia antes de mexer no código)

Este arquivo existe porque o projeto nasceu de uma conversa longa, e boa
parte das decisões de negócio por trás do código não cabem em comentários
de uma linha. Se você é uma sessão nova do Claude Code (ou qualquer pessoa
retomando isso do zero), comece por aqui.

## O que é isso

Cockpit pessoal do diretor comercial do Grupo Ley (fabricante de colchões,
com fábricas em Eusébio/CE e Timon/MA). Ele sobe/envia os relatórios que
tira do ERP (Infobrasil) a cada quinzena, e o app organiza isso em um
ranking de comissão por vendedor, com histórico.

## As duas métricas, e por que elas são diferentes

- **Comissão paga** vem do relatório L2.3.28 filtrado por um período curto
  (a quinzena). Ela só existe sobre **faturamento** — ou seja, mede a
  fábrica (conseguiu produzir/faturar a tempo), não o vendedor.
- **Carteira pendente** vem do mesmo relatório, mas pedido com um período
  bem mais largo (ex: 01/01 até hoje). Representa os pedidos que o
  vendedor já lançou e ainda **não foram faturados** — é essa, e não a
  comissão paga, que o diretor considera a medida real de performance do
  vendedor. Um vendedor pode ter vendido muito bem e aparecer mal na
  comissão só porque a fábrica está com fila de produção.

Por isso o app trata os dois como coisas separadas, lado a lado, em vez de
misturar num número só.

## Por que "carteira" e "quinzena" vêm do mesmo tipo de PDF

O Infobrasil não distingue os dois relatórios por nome — é o **mesmo**
relatório (L2.3.28), só que tirado com um filtro de período diferente. O
parser (`parseReport.js` / `parseReport.ts`) resolve isso com uma
heurística: período acima de 20 dias = carteira; até 20 dias = quinzena
paga. Se um dia o Infobrasil passar a distinguir isso de forma explícita
no arquivo, essa heurística pode ser simplificada — mas por enquanto é
necessária.

## Matriz e filial não são só um filtro visual

COLCH (matriz, Eusébio) e COLTIM (filial, Timon) têm vendedores em comum —
a mesma pessoa vende nas duas lojas, com comissão calculada separadamente
em cada uma. Isso é por que `comissoes_vendedor` tem uma coluna `loja`
como parte da chave, e por que o ranking soma ou separa por loja conforme
o filtro escolhido, em vez de assumir um vendedor = uma loja.

## "LEY MOVEIS" e "LEY COLCHOES" não são vendedores de verdade

São contas internas do próprio grupo (canais de distribuição própria), não
representantes externos. Ficam de fora do ranking via a tabela
`vendedores_ocultos` — mas continuam sendo processadas e salvas
normalmente, só filtradas na visualização. Não apague os dados delas, só
a exibição.

## O que este projeto deliberadamente NÃO faz

Existe um outro sistema interno (uma planilha, "Sistema de Gestão de
Exceções Comerciais") que trata adiantamento de comissão, antecipação de
faturamento e priorização de pedidos. Foi uma decisão explícita manter
este app **sem integração** com aquele sistema — são ferramentas
separadas, mesmo cobrindo um problema relacionado (o represamento de
faturamento).

## Decisões de infraestrutura (e por quê)

- **Sem Lovable neste projeto.** O plano original era construir aqui e
  importar no Lovable pra economizar créditos — só que o Lovable não
  importa projetos existentes (nem zip, nem repo do GitHub), só exporta
  de dentro dele mesmo. Por isso o caminho é Supabase direto + GitHub +
  Vercel.
- **Login único, sem cadastro.** É uma ferramenta de uma pessoa só. RLS
  exige usuário autenticado (`auth.role() = 'authenticated'`); o usuário é
  criado manualmente no painel do Supabase, não por uma tela de signup.
- **Parsing de PDF no navegador, sem IA.** O relatório é texto estruturado
  e sempre no mesmo formato — um parser determinístico (regex) é mais
  confiável e mais barato que IA de visão. IA só entraria como fallback se
  o layout do Infobrasil um dia mudar de forma que o regex não reconheça.
- **Bot do Telegram é o único canal server-side.** As Edge Functions
  (`supabase/functions/`) usam a service role key e por isso ignoram RLS —
  isso é intencional, é como o bot consegue gravar dados sem precisar de
  login.

## O que ainda não foi validado de verdade

A extração de texto do PDF dentro da function `telegram-webhook` usa a
lib `unpdf`, que não pôde ser testada em nenhum ambiente real até agora
(sem Deno disponível para testar). A lógica de parsing em si (regex) já
foi validada contra PDFs reais do Infobrasil — o que falta validar é só a
extração de texto bruto do PDF nesse contexto server-side. Teste isso
antes de confiar no fluxo do bot.
