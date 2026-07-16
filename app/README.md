# Comissão dos Vendedores · Grupo Ley

> Antes de editar qualquer coisa (ou apontar o Claude Code pra este repo),
> leia o [`CONTEXT.md`](./CONTEXT.md) — ele reúne as decisões de negócio
> por trás do código, coisas que não cabem em comentário de linha.

Cockpit do diretor comercial: comissão paga por quinzena (matriz + filial) e
carteira pendente de faturamento por vendedor, alimentado por PDF exportado
do Infobrasil — subindo no app ou mandando pelo Telegram.

## O que o app faz

- Lê o PDF do relatório **L2.3.28 (Listagem de Comissão por Vendedor)** direto
  no navegador (pdf.js) — identifica sozinho a loja (COLCH = matriz/Eusébio,
  COLTIM = filial/Timon) e se é uma **quinzena paga** (período curto) ou a
  **carteira pendente** (período largo, desde 01/01 — pedidos ainda não
  faturados por vendedor).
- Ranking por comissão paga, com carteira pendente ao lado — dá pra ver quem
  vendeu bem mas está com faturamento represado, não só quem recebeu mais.
- Filtro matriz / filial / combinado, já que alguns vendedores vendem nas
  duas lojas.
- Calendário de datas de pagamento — marque quando cada quinzena é paga.
- Bot no Telegram: manda o PDF no chat privado e ele processa e atualiza o
  app sozinho; e cobra o envio no dia marcado no calendário.
- Login com e-mail e senha — só quem tem uma conta cadastrada no Supabase
  Auth acessa o dashboard.

## Criando seu login

O app não tem tela de cadastro — só de login — porque é feito pra um usuário
só (você). Crie sua conta direto no painel do Supabase:

1. Painel do Supabase → **Authentication → Users → Add user**
2. Preencha seu e-mail e uma senha, e marque **Auto Confirm User** (assim
   não precisa confirmar por e-mail)
3. Em **Authentication → Providers → Email**, desative "Allow new users to
   sign up" — assim ninguém cria conta própria, só você usa a que já existe
4. Pronto — use esse e-mail/senha na tela de login do app

Se precisar trocar a senha depois, é no mesmo painel (Users → clique no seu
usuário → Reset password), sem precisar tocar no código.

## Ordem de implantação

O Lovable não entra aqui — ele só importa projetos criados dentro dele
mesmo (não aceita zip nem repositório existente). Como o código já está
pronto, o caminho mais direto é:

1. **Supabase (grátis, uns 5 minutos):**
   - Crie um projeto em supabase.com
   - Em *Project Settings → API*, copie a `Project URL` e a `anon public key`
   - Em *SQL Editor*, rode cada arquivo de `supabase/migrations/` **em ordem**
     (0001 até 0005 — pode pular o `0004_cron.sql` até configurar o bot,
     veja a seção abaixo)
   - Crie seu login em *Authentication → Users → Add user* (veja a seção
     "Criando seu login" acima)
2. **Suba este código para um repositório no GitHub** (pode ser privado —
   nada sensível fica no código, os dados ficam no Supabase por trás do login).
3. **Cole a URL + anon key** num `.env` local (copie de `.env.example`) e
   teste:
   ```
   npm install
   npm run dev
   ```
4. **Coloque no ar:** Vercel (vercel.com → Add New → Project → conecte o
   repositório do GitHub, mesmo privado). O projeto vive em `app/` dentro do
   repo, então configure o **Root Directory** como `app` na tela de import.
   Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de
   ambiente do projeto na Vercel, com os mesmos valores do seu `.env`.
5. **Configure o bot do Telegram** (opcional, veja seção abaixo).
6. **Use o Claude Code** (via GitHub App) para qualquer ajuste fino depois.

## Configurando o bot do Telegram

1. No Telegram, fale com **@BotFather** → `/newbot` → siga as instruções →
   você recebe um token (ex: `123456:ABC-...`).
2. Mande uma mensagem qualquer pro seu bot novo (no chat privado), depois
   acesse `https://api.telegram.org/bot<TOKEN>/getUpdates` no navegador —
   o `chat.id` que aparece ali é o seu `TELEGRAM_CHAT_ID`.
3. No painel do Supabase → Edge Functions → Secrets, adicione:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente
   nas functions, não precisa configurar.)
4. Faça o deploy das functions (via Supabase CLI, ou pelo Claude Code):
   ```
   supabase functions deploy telegram-webhook
   supabase functions deploy telegram-remind
   ```
5. Registre o webhook (uma vez só):
   ```
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<PROJECT_REF>.supabase.co/functions/v1/telegram-webhook"
   ```
6. Pra ativar a cobrança automática no dia marcado no calendário: edite
   `supabase/migrations/0004_cron.sql`, troque `<PROJECT_REF>` e
   `<ANON_OU_SERVICE_KEY>` pelos valores reais do seu projeto, ative as
   extensões `pg_cron` e `pg_net` no painel (Database → Extensions), e
   aplique essa migration.

**Ressalva importante:** a extração de texto do PDF dentro da function
`telegram-webhook` usa a lib `unpdf`, que não pôde ser testada aqui (sem
acesso de rede ao registro do Deno/npm neste ambiente). Teste com um PDF
real do Infobrasil antes de confiar no fluxo — se a extração de linhas vier
diferente da versão do navegador, ajuste `extractText` nessa function.

## Estrutura

- `src/lib/extractPdfText.js` — lê o PDF no navegador (pdf.js)
- `src/lib/parseReport.js` — interpreta o texto (período, loja, tipo, vendedores)
- `src/components/UploadModal.jsx` — upload em lote → parse → grava no Supabase
- `src/components/CalendarModal.jsx` — calendário de datas de pagamento
- `supabase/functions/telegram-webhook/` — recebe o PDF pelo Telegram
- `supabase/functions/telegram-remind/` — cobra o envio no dia marcado
- `supabase/functions/_shared/parseReport.ts` — mesma lógica do parser, em Deno
  (mantida manualmente em sincronia com a versão do navegador)
- `supabase/migrations/` — schema completo (comissão por loja, carteira, calendário, cron)

## Se o layout do relatório mudar

O parser espera:
- uma linha `COLCH` ou `COLTIM` logo após o título (identifica a loja)
- uma linha `PERÍODO DE dd/mm/aaaa ATÉ dd/mm/aaaa`
- blocos `VENDEDOR: codigo-nome`, cada um com uma linha de subtotal de 8
  números (o último é a comissão, o penúltimo o total líquido vendido)
- período com mais de 20 dias é tratado como carteira pendente, não quinzena

Se o Infobrasil mudar esse formato, ajuste **as duas cópias** do parser:
`src/lib/parseReport.js` e `supabase/functions/_shared/parseReport.ts`.
