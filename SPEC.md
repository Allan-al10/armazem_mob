# SPEC: App de Armazém para 50+ ("Meu Armazém")

App mobile de controle de estoque, vendas e fiado para pequenos comerciantes, com foco em pessoas acima de 50 anos.

> **Como usar este arquivo:** coloque-o na raiz do projeto existente (`SPEC.md`). Ele serve de referência para você e para o agente de código (Claude Code). O projeto **já foi criado**, então nada aqui manda recriar a estrutura: a Seção 0 define como adaptar a spec ao que já existe.

---

## 0. Ponto de partida: projeto já existente

### 0.1 Regras para quem for implementar (você ou o agente)

1. **Não recriar nem sobrescrever** o que já existe. Primeiro inspecionar, depois adaptar.
2. **Respeitar as convenções atuais** do repositório (nomes de pastas, gerenciador de pacotes, estilo de código, versão do Expo/React Native/Convex).
3. **Mudanças pequenas e verificáveis:** uma fase ou tarefa por vez, rodando o app a cada etapa.
4. **Antes de instalar qualquer dependência nova**, verificar se já existe algo equivalente no projeto.
5. Se algo desta spec conflitar com o que já está no projeto, **vale o projeto**, e a divergência deve ser anotada na Seção 12.

### 0.2 Diagnóstico inicial (Fase 0, antes de qualquer código)

O agente deve levantar e registrar na Seção 12 ("Estado atual do projeto"):

- [x] Estrutura de pastas (`apps/`, `packages/`, `convex/`, etc.) e se é de fato monorepo
- [x] Gerenciador de pacotes (pnpm, npm, yarn ou bun) e arquivo de workspaces
- [x] Versões: Node, Expo SDK, React Native, Convex
- [x] Se usa Expo Router ou React Navigation
- [x] Se o Convex já está inicializado: existe `convex/schema.ts`? Já há tabelas, funções ou autenticação?
- [x] Se há autenticação configurada (Convex Auth ou outra)
- [x] Biblioteca de UI/estilo já usada (StyleSheet, NativeWind, Tamagui, etc.)
- [x] Scripts disponíveis no `package.json` (start, lint, test, typecheck)
- [x] Se há testes configurados
- [x] Variáveis de ambiente existentes (`.env`, `.env.local`) e o que ainda falta
- [x] O app e o backend rodam hoje sem erros? (`npx convex dev` e o start do Expo)

**Resultado esperado:** um parágrafo curto dizendo o que já existe, o que falta e quais fases da Seção 9 podem ser puladas ou reduzidas.

### 0.3 Estrutura-alvo (adaptar ao que já existe)

Referência de como o repositório deve ficar. Se o projeto já tem uma organização diferente, mantê-la e apenas mapear:

```
meu-armazem/
├── package.json            # workspaces
├── apps/
│   └── mobile/             # app Expo (telas, componentes, tema)
├── convex/                 # schema.ts, funções, crons.ts, auth
├── packages/
│   └── shared/             # tipos, validações (zod), formatadores de moeda, CNPJ e telefone
├── SPEC.md                 # este arquivo
├── CLAUDE.md               # instruções curtas para o agente (ver Seção 13)
└── README.md               # passo a passo de instalação
```

---

## 1. Objetivo

Permitir que o dono de um pequeno armazém:

1. Registre a chegada de mercadorias (caixas) com custo e preço de venda.
2. Emita notas de venda e envie ao cliente por WhatsApp ou SMS.
3. Dê baixa automática no estoque a cada venda.
4. Registre a forma de pagamento, incluindo **fiado**, com aviso quando o vencimento estiver chegando.

Tudo com uma interface simples, poucos passos por tarefa e ajuda disponível em qualquer tela.

---

## 2. Princípios de usabilidade (público 50+)

Estes princípios são **requisitos**, não sugestões.

- **Texto grande:** mínimo de 18 sp no corpo, 24 sp ou mais em títulos. Respeitar o tamanho de fonte do sistema.
- **Botões grandes:** área de toque mínima de 56 dp, com espaço entre botões para evitar toque errado.
- **Alto contraste:** texto escuro sobre fundo claro (razão mínima 7:1 quando possível). Nunca usar cor como única informação (ex.: "Pago" e "Fiado" têm texto e ícone, não só verde e vermelho).
- **Uma tarefa por tela:** fluxos em passos curtos ("Passo 2 de 4"), com botões grandes **Voltar** e **Continuar**.
- **Sem gestos escondidos:** nada de arrastar para apagar, pressionar e segurar ou menus ocultos. Tudo é botão visível.
- **Linguagem do dia a dia:** "Chegou mercadoria", "Nova venda", "Quem deve". Evitar SKU, ledger, sync.
- **Confirmar antes de ações importantes:** "Você vai dar baixa de 3 unidades de Arroz. Confirma?" com **Sim, confirmar** e **Não, voltar**.
- **Desfazer e corrigir:** toda venda e entrada pode ser cancelada ou corrigida depois, com o estoque ajustado automaticamente.
- **Botão de ajuda "?" em todas as telas** (Seção 7).
- **Teclado certo para cada campo:** numérico para quantidade, telefone e valores; máscara automática para CNPJ, telefone e dinheiro (R$ 0,00).
- **Navegação fixa:** barra inferior com no máximo 4 ícones grandes com texto: **Início, Vender, Estoque, Fiado**.
- **Idioma:** português do Brasil, moeda em reais, datas dd/mm/aaaa.

---

## 3. Stack

| Item | Escolha |
|---|---|
| App mobile | React Native com **Expo** (TypeScript) |
| Backend e banco | **Convex** |
| Monorepo | Um único repositório (workspaces do gerenciador já usado no projeto) |
| Autenticação | Convex Auth (ou a que já estiver configurada) |
| Notas em PDF | `expo-print` |
| Compartilhar nota | `expo-sharing` e deep links `whatsapp://` e `sms:` |
| Avisos no celular | `expo-notifications` |
| Voz (ajuda) | `expo-speech` |
| Formulários | `react-hook-form` com `zod` |

Usar o que o projeto já tem; só adicionar o que faltar.

### Rodar localmente

1. `<gerenciador> install` na raiz.
2. `npx convex dev` (backend em desenvolvimento).
3. Iniciar o Expo (script do app mobile) e abrir no celular com **Expo Go** ou em emulador.
4. O README deve conter esses passos de forma simples.

---

## 4. Fluxo geral de telas

```
Abertura
 ├─ Primeiro acesso → Cadastro do usuário → Dados do estabelecimento → Início
 └─ Já cadastrado   → Entrar (e-mail e senha, ou PIN) → Início

Início (4 botões grandes)
 ├─ Chegou mercadoria  → módulo Caixa
 ├─ Nova venda         → módulo Nota de compra e Pagamento
 ├─ Estoque            → lista de produtos
 └─ Quem deve (fiado)  → lista de fiados e vencimentos
```

O **Início** também mostra um resumo curto: vendas de hoje, produtos com estoque baixo e fiados que vencem em breve.

---

## 5. Módulos

### 5.1 Cadastro do usuário e do estabelecimento (início do app)

**Passo 1, seus dados:** nome completo, telefone, e-mail, senha (ou PIN de 4 a 6 dígitos como alternativa).

**Passo 2, dados do estabelecimento** (usados no cabeçalho da nota):

- Nome do estabelecimento
- CNPJ (validação do dígito verificador)
- Nome do proprietário
- Telefone
- Endereço (rua, número, bairro, cidade, UF)

Editáveis depois em **Meu cadastro**. O cadastro é feito uma única vez.

### 5.2 Caixa (entrada de produtos)

> **Premissa:** "Caixa" é a **caixa de mercadoria que chegou** do fornecedor, e não o caixa registradora. Se a intenção for outra, ajustar.

**Tela "Chegou mercadoria"** (um produto por vez, com botão **Adicionar outro produto**):

| Campo | Detalhe |
|---|---|
| Produto | Escolher da lista ou **Criar novo** (nome, unidade: unidade, kg, pacote) |
| Quantidade de unidades que chegou | Número inteiro (ou decimal para kg) |
| Valor total da caixa | R$ pago pela caixa inteira |
| **Valor unitário de compra** | **Calculado automaticamente** = valor total ÷ quantidade (editável) |
| **Preço de venda** | Valor por unidade cobrado do cliente |
| Lucro por unidade | Texto simples: "Você ganha R$ 1,20 em cada unidade (30%)" |
| Data de chegada | Padrão: hoje |
| Fornecedor | Opcional |

**Regras:**

- Ao confirmar, o estoque do produto aumenta pela quantidade informada.
- O produto guarda o último custo unitário e o preço de venda atual. Cada entrada fica no histórico (para saber quanto custou cada lote).
- Se o preço de venda for menor que o custo unitário, avisar "Atenção: você vai vender abaixo do que pagou" e pedir confirmação.

### 5.3 Nota de compra (saída de produtos / venda)

**Passos da "Nova venda":**

1. **Cliente:** nome (obrigatório), telefone (opcional, mas necessário para enviar a nota e para fiado). Sugerir clientes já cadastrados ao digitar.
2. **Produtos:** buscar por nome e tocar para adicionar. Quantidade com botões grandes **+** e **−**. O preço de venda vem preenchido (alterar só com confirmação, para desconto).
3. **Resumo:** produto, quantidade, valor unitário, subtotal por item e **total geral** em fonte bem grande.
4. **Pagamento** (Seção 5.4).
5. **Nota pronta:** exibir a nota e botões **Enviar por WhatsApp**, **Enviar por SMS**, **Imprimir/Salvar PDF** e **Concluir**.

**Regras:**

- Ao concluir a venda, **dar baixa no estoque** de cada item.
- Não permitir vender mais que o estoque ("Só tem 4 unidades de Arroz"). Permitir estoque negativo é opção configurável, desligada por padrão.
- Cada nota recebe número sequencial (ex.: 000123).
- Venda cancelada devolve os itens ao estoque e fica marcada "Cancelada" (não é apagada).

**Conteúdo da nota:**

- **Cabeçalho:** nome do estabelecimento, CNPJ, nome do proprietário, telefone, endereço.
- Número da nota, data e hora.
- Nome do cliente.
- Itens: produto, quantidade, valor unitário, subtotal.
- Total geral e forma de pagamento (se fiado: data combinada).
- Mensagem de agradecimento.
- Rodapé: "Comprovante simples, não substitui documento fiscal."

**Envio:**

- **MVP (sem custo):** gerar a nota em PDF e em texto formatado, abrir o WhatsApp (`whatsapp://send?phone=...&text=...`) ou o app de SMS (`sms:...?body=...`) com número e mensagem prontos. O dono só toca em "enviar". O PDF vai pela folha de compartilhamento.
- **Futuro:** envio automático via WhatsApp Business API ou provedor de SMS, chamado por uma `action` do Convex (exige conta empresarial, aprovação de modelos e custo por mensagem).

### 5.4 Pagamento

Tela com 4 botões grandes, cada um com ícone e texto:

- **Dinheiro:** campo opcional "Valor recebido" e cálculo de troco.
- **Cartão:** débito ou crédito (opcional).
- **Pix:** só registra a forma de pagamento.
- **Fiado:** abre o formulário abaixo.

**Formulário do fiado:**

| Campo | Obrigatório |
|---|---|
| Nome do cliente | Sim (vem da venda, editável) |
| Telefone | Sim |
| Endereço | Sim |
| **Data combinada para pagamento** | Sim (seletor grande, com atalhos: "Em 7 dias", "Em 15 dias", "Em 30 dias") |
| Observação | Não |

O fiado pode ser pago aos poucos. Cada pagamento recebido é registrado (valor, data, forma) e o saldo devedor é atualizado.

### 5.5 Fiado e avisos de vencimento

**Tela "Quem deve":**

- Clientes com saldo devedor, ordenados pelo vencimento mais próximo.
- Etiquetas em texto: **Vence hoje**, **Vence em 3 dias**, **Atrasado há 5 dias**, **Em dia**.
- Ao abrir um cliente: compras em aberto, histórico de pagamentos e botões **Registrar pagamento**, **Ligar** e **Cobrar no WhatsApp** (mensagem educada pronta).

**Avisos:**

- Tarefa agendada (cron do Convex) roda todo dia (padrão 8h, horário de Brasília) e identifica fiados que vencem **em 3 dias, em 1 dia, hoje** e **atrasados**.
- Notificação push (`expo-notifications`, token salvo no Convex): "Maria Souza deve R$ 85,00. Vence amanhã."
- O **Início** mostra o quadro "Fiados para cobrar".
- Dias de antecedência e horário alteráveis em **Configurações**.

### 5.6 Estoque

- Lista com nome, quantidade e preço de venda; busca em campo grande.
- Aviso de **estoque baixo** (limite por produto, padrão 5).
- Detalhe do produto: histórico de entradas e saídas, editar preço, **Ajustar estoque** (perdas, quebras, contagem), sempre com motivo.

---

## 6. Modelo de dados (Convex)

Dinheiro sempre em **centavos (inteiros)**.

| Tabela | Campos principais |
|---|---|
| `stores` | `ownerId`, `tradeName`, `cnpj`, `ownerName`, `phone`, `address{street, number, district, city, state}` |
| `products` | `storeId`, `name`, `unit`, `stockQty`, `lastUnitCostCents`, `salePriceCents`, `lowStockThreshold`, `active` |
| `stockEntries` | `storeId`, `productId`, `quantity`, `boxTotalCostCents`, `unitCostCents`, `salePriceCents`, `arrivedAt`, `supplier?` |
| `customers` | `storeId`, `name`, `phone?`, `address?` |
| `sales` | `storeId`, `number`, `customerId`, `customerName`, `totalCents`, `paymentMethod` (`cash`, `card`, `pix`, `credit_account`), `status` (`completed`, `canceled`), `createdAt` |
| `saleItems` | `saleId`, `productId`, `productName`, `quantity`, `unitPriceCents`, `unitCostCents`, `subtotalCents` |
| `credits` (fiado) | `storeId`, `saleId`, `customerId`, `customerName`, `phone`, `address`, `totalCents`, `paidCents`, `dueDate`, `status` (`open`, `paid`, `overdue`), `lastReminderAt?` |
| `creditPayments` | `creditId`, `amountCents`, `method`, `paidAt` |
| `stockMovements` | `productId`, `type` (`entry`, `sale`, `cancel`, `adjustment`), `quantity`, `reason?`, `refId`, `createdAt` |
| `pushTokens` | `userId`, `storeId`, `token`, `platform`, `createdAt`, `updatedAt` |
| `stores` (avisos) | `remindersEnabled`, `reminderDaysBefore`, `reminderHour`, `reminderTimezoneOffsetMinutes` |

`unitCostCents` em `saleItems` guarda o custo **no momento da venda**, o que permite calcular lucro depois.

**Índices sugeridos:** `products` por `storeId` e nome; `credits` por `storeId` e `dueDate`; `sales` por `storeId` e `createdAt`.

**Funções principais:**

- **Mutations:** `stores.create`, `products.create`, `stockEntries.register`, `sales.create` (grava venda, itens e baixa **na mesma transação**), `sales.cancel`, `credits.registerPayment`, `stock.adjust`.
- **Queries:** `products.list`, `sales.get`, `credits.listOpen`, `dashboard.summary`.
- **Cron (`crons.ts`):** `reminders.refreshOverdueCredits` e `reminders.sendDueReminders`, de hora em hora, com envio no horário local configurado pela loja.

> Se o `schema.ts` do projeto já tiver tabelas, **estender** em vez de substituir, e manter nomes existentes quando fizerem a mesma função.

---

## 7. Ajuda dentro do app

- **Botão "?" fixo no canto superior direito** de todas as telas, grande, com o texto "Ajuda" ao lado do ícone.
- Ao tocar, abre uma janela com explicação curta da tela atual, em passos numerados e frases curtas.
- **Ícones "i" ao lado de campos que geram dúvida** (ex.: "Valor unitário: é quanto cada unidade custou. O app calcula dividindo o valor da caixa pela quantidade.").
- **Leitura em voz alta** do texto de ajuda (`expo-speech`).
- Primeira vez em cada módulo: mini guia de 3 a 4 cartões, com "Pular" sempre visível. Reabrível em **Configurações > Rever tutorial**.
- Textos de ajuda centralizados em um único arquivo (`help.ts`).

---

## 8. Requisitos não funcionais

- **Conexão:** o Convex precisa de internet. Mostrar mensagem simples sem conexão e **não perder o que foi digitado**. Venda totalmente offline fica para o futuro.
- **Segurança e LGPD:** dados de clientes só acessíveis pelo dono da loja (checar `storeId` em toda função do Convex). Senha nunca em texto aberto. Aviso simples de privacidade no cadastro.
- **Erros:** mensagens em português claro, dizendo o que fazer ("Faltou o telefone do cliente. Digite para continuar."), sem códigos técnicos.
- **Desempenho:** telas abrem em até 2 segundos em Android de entrada.
- **Plataformas:** Android primeiro, iOS pelo mesmo código.
- **Testes:** unitários para cálculos (custo unitário, total, troco, saldo do fiado) e para a baixa de estoque.

---

## 9. Plano de implementação (checklist)

Marcar conforme concluir. Fases já cobertas pelo projeto existente (ver Seção 0.2) podem ser puladas.

### Fase 0: Diagnóstico
- [x] Levantar o estado atual do projeto e preencher a Seção 12
- [x] Garantir que app e Convex rodam localmente — app OK (`tsc` + export web); Convex OK em deployment local anônimo (`health:ping` → `"ok"`)
- [x] Criar/atualizar `CLAUDE.md` e `README.md`

### Fase 1: Base
- [x] Tema acessível (fontes grandes, cores de alto contraste, espaçamentos)
- [x] Componentes base: `BigButton`, `MoneyInput`, `ScreenHeader` com "?", `ConfirmDialog`, `StepIndicator`
- [x] Formatadores e validações em `src/lib` (adaptação de `packages/shared`: moeda, CNPJ, telefone, data)
- [x] Autenticação e cadastro do usuário
- [x] Cadastro do estabelecimento

### Fase 2: Estoque
- [x] Schema: `products`, `stockEntries`, `stockMovements`
- [x] Tela "Chegou mercadoria" com custo unitário automático
- [x] Lista de estoque, busca, estoque baixo e ajuste

### Fase 3: Vendas
- [x] Schema: `customers`, `sales`, `saleItems`
- [x] Fluxo "Nova venda" (cliente, produtos, resumo)
- [x] Baixa de estoque transacional e cancelamento
- [x] Nota em PDF e texto, envio por WhatsApp e SMS

> Fase 3 concluída em 23/10/2026. A tela de pagamento (dinheiro com troco, cartão e Pix) foi antecipada para a Fase 3 junto do fluxo de venda. O fiado foi concluído na Fase 4 (24/10/2026).

### Fase 4: Pagamento e fiado
- [x] Tela de formas de pagamento (dinheiro com troco, cartão, Pix) — antecipada na Fase 3
- [x] Formulário de fiado com data de pagamento
- [x] Schema: `credits`, `creditPayments`
- [x] Tela "Quem deve" e registro de pagamentos parciais

> Fase 4 concluída em 24/10/2026. O pagamento parcial, o cancelamento de venda fiado sem pagamento, a nota com vencimento e o cartão de fiados no Início também foram entregues. Avisos push/cron e tutorial/voz foram concluídos na Fase 5.

### Fase 5: Avisos e ajuda
- [x] Registro do token de push e permissões
- [x] Cron de vencimentos e notificações (envio diário no horário da loja)
- [x] Ajuda contextual, ícones "i", tutorial inicial, leitura em voz alta

> Fase 5 concluída em 27/10/2026. O cron roda de hora em hora para respeitar o horário local escolhido por cada loja e envia uma vez por dia; o padrão é 8h de Brasília. O push remoto depende de um development build com projeto EAS configurado e ainda precisa ser validado em aparelho físico.

### Fase 6: Acabamento
- [x] Testes unitários dos cálculos (Vitest + convex-test; 29 testes)
- [ ] Teste com pessoas reais de 50+ anos e ajustes
- [ ] Build final (EAS Build)

---

## 10. Critérios de aceite do MVP

1. Uma pessoa de 50+ anos, sem treinamento, consegue **registrar uma venda em até 2 minutos**, usando só a ajuda do app.
2. Registrar uma chegada de mercadoria mostra o valor unitário correto e aumenta o estoque.
3. Concluir uma venda reduz o estoque exatamente pelas quantidades vendidas, e cancelar devolve.
4. A nota mostra nome do estabelecimento, CNPJ, nome do proprietário, telefone e endereço, e abre no WhatsApp ou SMS pronta para enviar.
5. Fiado exige nome, telefone, endereço e data de pagamento; o saldo cai a cada pagamento registrado.
6. Um fiado que vence em 3 dias, 1 dia ou hoje gera notificação no celular e aparece destacado no Início.
7. Todas as telas têm botão "?" funcionando.
8. O projeto roda inteiro na máquina local seguindo apenas o README.

---

## 11. Perguntas em aberto

1. "Caixa" é a caixa de mercadoria recebida (como assumido) ou haverá também caixa diário (abertura, fechamento, dinheiro em mãos)?
2. Um único usuário por estabelecimento ou funcionários com acesso limitado?
3. Envio da nota: abrir o WhatsApp com mensagem pronta atende, ou é obrigatório envio automático?
4. Venda por peso (kg, g) é necessária desde o início?
5. Precisa de nota fiscal oficial (NF-e/NFC-e)? Esta spec trata apenas de **comprovante simples**.
6. O app precisa funcionar sem internet na primeira versão?
7. Relatórios (vendas do mês, lucro, mais vendidos)? Fora do MVP, mas o modelo já guarda custo por item.

---

## 12. Estado atual do projeto (Fase 5 — 27/10/2026)

> Diagnóstico atualizado ao fim da Fase 5. Divergências em relação à spec estão anotadas no fim desta seção.

- **Estrutura de pastas:** projeto Expo **flat** na raiz (`C:\Users\allan\myapp`), **não é monorepo**. Não existem `apps/` nem `packages/`. O código fica em `src/` e o backend em `convex/`:
  - `src/app/` — rotas do Expo Router:
    - `(auth)/login.tsx` e `(auth)/signup.tsx` — entrada e cadastro em duas etapas.
    - `(setup)/loja.tsx` — cadastro do estabelecimento (passo 2).
    - `(app)/inicio.tsx` — Início com resumo do dia (vendas, estoque baixo e fiado), atalhos e Configurações.
    - `(app)/configuracoes.tsx` — avisos de fiado, ativação do push, dias/horário e Rever tutorial.
    - `(app)/meu-cadastro.tsx` — edição dos dados do estabelecimento.
    - `(app)/chegou-mercadoria.tsx` — registro de mercadoria que chegou (produto novo ou existente).
    - `(app)/estoque/index.tsx` — lista, busca e aviso de estoque baixo.
    - `(app)/estoque/[id].tsx` — detalhe, edição de preço/aviso, ajuste e histórico.
    - `(app)/vender.tsx` — fluxo real de Nova venda em 4 passos: cliente, produtos, resumo e pagamento.
    - `(app)/nota/[id].tsx` — recibo da venda, envio por WhatsApp/SMS, impressão/PDF e cancelamento.
    - `(app)/vendas.tsx` — vendas recentes, com resumo do dia e reabertura da nota.
    - `(app)/fiado.tsx` — lista "Quem deve", total em aberto e clientes ordenados pelo vencimento.
    - `(app)/fiado/[id].tsx` — detalhe do cliente, compras em aberto, pagamentos, Ligar e Cobrar no WhatsApp.
    - `(app)/_layout.tsx` — Stack autenticado; registra o push e abre o fiado ao tocar na notificação.
    - `index.tsx` — redireciona conforme login e existência de loja.
  - `src/components/` — `BigButton`, `TextField`, `MoneyInput`, `ProductPicker`, `ChoiceRow`, `Screen`, `ScreenHeader`, `HelpModal`, `TutorialModal`, `ReadAloudButton`, `ConfirmDialog`, `StepIndicator`, `ErrorBanner`, `SummaryCard` (clicável quando recebe `onPress`), `SaleReceipt`, `SalePriceDialog`, `SaleQuantityDialog`, `CreditPaymentDialog`, `ComingSoon`, `StoreForm`, `LoadingScreen`.
  - `src/lib/` — `money.ts`, `quantity.ts`, `validation.ts`, `date.ts`, `errors.ts`, `help.ts`, `sale.ts` (texto/HTML da nota, links e rótulos), `credit.ts` (saldo, etiqueta de vencimento e mensagem de cobrança), `types.ts`, `api.ts`, `convex.ts`, `storage.ts`, `push.ts`, `push.web.ts`, `pushTypes.ts`, `usePushRegistration.ts`, `useTutorial.ts`, `tutorialStorage.ts`, `money.test.ts` e `credit.test.ts`.
  - `src/theme.ts` — cores, fontes, espaçamentos, raios e alvos de toque.
  - `src/assets/` — `img1.png` e `img2.png`.
  - `convex/` — `schema.ts` (authTables + `users` + `stores` + `products` + `stockEntries` + `stockMovements` + `customers` + `sales` + `saleItems` + `credits` + `creditPayments` + `pushTokens`), `crons.ts`, `reminders.ts`, `auth.ts`, `auth.config.ts`, `http.ts`, `users.ts`, `stores.ts`, `products.ts`, `stock.ts`, `customers.ts`, `sales.ts`, `credits.ts`, `dashboard.ts`, `lib.ts`, `health.ts`, `validators.ts`, `sales.test.ts`, `reminders.test.ts` e `_generated/`.
  - Raiz: `app.json`, `eas.json`, `vitest.config.mts`, `eslint.config.js`, `SPEC.md` e `README.md`.
- **Gerenciador de pacotes / workspaces:** **npm** (`package-lock.json`), sem workspaces. Não há `bun.lock`, `pnpm-lock.yaml` nem `yarn.lock`.
- **Versões:** Node **24.21.0**, npm **11.19.0**, Expo SDK **57** (`expo ~57.0.31`), React Native **0.86.3**, React **19.2.3**, TypeScript **~6.0.3**, Convex **^1.47.0**, `@convex-dev/auth` **^0.0.96**, `@auth/core` **^0.41.3**, `expo-notifications` **~57.0.24**, `expo-speech` **~57.0.3**, `expo-dev-client` **~57.0.20**, `expo-print` **~57.0.2**, `expo-sharing` **~57.0.24**, `expo-secure-store` **~57.0.4**, Vitest **^5.0.5**, `convex-test` **^0.0.65**, ESLint **^9.0.0** e `eslint-config-expo` **~57.0.2**.
- **Navegação:** **Expo Router ~57.0.29**, com `typedRoutes` ativado em `app.json`, raiz em `src/app` e `src/app/_layout.tsx` com `ConvexAuthProvider` e `Stack.Protected`. Há layouts de grupo para `(auth)`, `(setup)` e `(app)`. A barra inferior de 4 abas ainda não existe; o Início tem os quatro atalhos grandes e as telas reais de estoque e vendas já estão ligadas a ele.
- **Convex (schema, funções, auth):** **inicializado em deployment local anônimo** (modo beta, sem conta) em `http://127.0.0.1:3210`. O `schema.ts` contém `authTables`, `users` (índices `email` e `phone`), `stores` (índices `by_owner` e `by_cnpj`, contador opcional `nextSaleNumber`), `products` (índices `by_store` e `by_store_and_nameQuery`), `stockEntries` (índices `by_store` e `by_product`), `stockMovements` (índices `by_store` e `by_product`, campo opcional `refId`), `customers` (índices `by_store` e `by_store_and_nameQuery`), `sales` (índices `by_store`, `by_store_and_createdAt` e `by_customer`), `saleItems` (índice `by_sale`), `credits` (índices `by_store`, `by_store_and_dueDate`, `by_customer` e `by_sale`; guarda total, pago, vencimento, telefone/endereço copiados, status, observação e `lastReminderAt` opcional), `creditPayments` (índice `by_credit`) e `pushTokens` (índices `by_user`, `by_store` e `by_token`; token, plataforma e timestamps).
  - `stores` ganhou os campos opcionais `remindersEnabled`, `reminderDaysBefore`, `reminderHour` e `reminderTimezoneOffsetMinutes`; quando ausentes, valem `true`, `3`, `8` e `-180` (Brasília).
  - Funções publicadas: `health:ping`, `users:current`, `stores:getMine`, `stores:create`, `stores:update`, `products:list`, `products:get`, `products:update`, `stock:registerEntry`, `stock:adjust`, `stock:history`, `customers:list`, `sales:create`, `sales:get`, `sales:listRecent`, `sales:cancel`, `credits:debtors`, `credits:byCustomer`, `credits:getBySale`, `credits:registerPayment`, `dashboard:summary`, `reminders:settings`, `reminders:updateSettings`, `reminders:registerPushToken` e `reminders:unregisterPushToken`.
  - Funções internas: `reminders:refreshOverdueCredits`, `reminders:collectDueReminders`, `reminders:markRemindersSent`, `reminders:removePushTokens` e `reminders:sendDueReminders`. `convex/crons.ts` agenda `refreshOverdueCredits` no minuto UTC 5 e `sendDueReminders` no minuto UTC 10, **de hora em hora**. O envio só ocorre quando a hora local da loja coincide com `reminderHour`; `lastReminderAt` evita repetir no mesmo dia local.
  - Todas as funções de loja usam `requireStore` (`convex/lib.ts`), que exige usuário logado e loja; vendas, clientes, fiados, itens e produtos são conferidos contra o `storeId`. O `.env.local` contém `CONVEX_DEPLOYMENT=anonymous:anonymous-agent`, `EXPO_PUBLIC_CONVEX_URL` e `EXPO_PUBLIC_CONVEX_SITE_URL`.
- **Autenticação:** **Convex Auth com e-mail e senha** (`Password` provider). O cadastro chama `signIn("password", { flow: "signUp", name, phone, ... })`; o `profile` grava nome, e-mail e telefone na tabela `users`. A sessão é persistida com `expo-secure-store` no celular e `localStorage` na web. As chaves `JWT_PRIVATE_KEY` e `JWKS` ficam no deployment, não no `.env.local`. PIN de 4 a 6 dígitos ainda não foi implementado; a senha atende à alternativa "ou PIN" da spec.
- **UI/estilo em uso:** **StyleSheet** nativo do React Native com tema centralizado em `src/theme.ts`. Sem NativeWind, Tamagui ou biblioteca de componentes. Cores de alto contraste, corpo mínimo de 18 sp, títulos de 24–34 sp, botões de 64 dp, campos de 60 dp e alvos de toque de pelo menos 56 dp (com `hitSlop` nos ícones "i"). O tutorial usa cartões grandes, "Pular" sempre visível e leitura em voz alta em `pt-BR`; o mesmo botão de voz aparece na janela de ajuda.
- **Scripts e testes disponíveis:** `start`, `android`, `ios`, `web`, `typecheck`, `lint` (`expo lint`), `test` (`vitest run`), `test:watch` e `convex:dev`. Os testes usam **Vitest** com dois projetos: `unit` (Node, `src/**/*.test.ts`) e `convex` (edge-runtime + `convex-test`, `convex/**/*.test.ts`). São **4 arquivos e 29 testes** cobrindo moeda, saldo de fiado, vendas/baixa de estoque, lembretes, horário, repetição e configurações. O ESLint 9 com `eslint-config-expo` está em `eslint.config.js`; `npx expo lint` passa sem avisos. Não há Jest nem testes de interface automatizados.
- **Variáveis de ambiente:** `.env.local` presente (gerado pelo Convex) com `CONVEX_DEPLOYMENT`, `EXPO_PUBLIC_CONVEX_URL` e `EXPO_PUBLIC_CONVEX_SITE_URL`; não há `.env` versionável. O `.gitignore` ignora `.env*.local`, `.expo/`, `.convex/`, `dist/` e `coverage/`. Para o push, o `projectId` do EAS pode vir de `extra.eas.projectId` no `app.json`, de `Constants.easConfig` em um build EAS ou da variável `EXPO_PUBLIC_EAS_PROJECT_ID`; **o projeto ainda não tem `extra.eas.projectId` configurado**, então o registro de push fica desativado com uma mensagem explicativa até esse vínculo ser feito.
- **O que já está pronto:**
  - **Fases 0–4:** cadastro/login/sessão, cadastro e edição da loja, estoque com entrada/ajuste/histórico/estoque baixo, vendas em 4 passos com baixa transacional, cancelamento com devolução, nota em texto/PDF/WhatsApp/SMS, fiado com data, pagamentos parciais, Quem deve, cobrança por WhatsApp e resumo no Início.
  - **Avisos (Fase 5):** tela **Configurações** com avisos ligados/desligados, antecedência (1, 2, 3, 5 ou 7 dias), horário (6h, 8h, 10h, 12h ou 18h), ativação do aparelho e status da permissão. Padrões: ligado, 3 dias, 8h e fuso de Brasília (`-180`); o fuso real do aparelho é enviado ao registrar o token e atualizado a cada registro. Com o projeto EAS configurado, o app cria o canal Android `credit-reminders`, pede permissão, obtém o Expo Push Token e salva em `pushTokens`; no logout, remove o token. O cron horário atualiza fiados vencidos, monta um aviso por cliente agrupando as compras, envia pelo Expo Push Service e evita repetir no mesmo dia. O aviso identifica vencimento em 3 dias (ou no valor configurado), 1 dia, hoje e atrasados; ao tocar, abre `/fiado/[id]`.
  - **Ajuda e tutorial (Fase 5):** botão "? Ajuda" em todas as telas, ícones "i" nos campos, textos centralizados em `src/lib/help.ts`, leitura em voz alta da ajuda e do tutorial com `expo-speech` em `pt-BR`, tutorial de 4 cartões na primeira visita ao Início, Chegou mercadoria, Estoque, Vender e Fiado (com "Pular tutorial" sempre visível) e o botão **Rever tutorial** em Configurações. Os tutoriais são guardados por aparelho em `appStorage`.
- **Verificações executadas (Fase 5):**
  - `npm run typecheck` (`tsc --noEmit`) → **passou**, sem erros.
  - `npm run lint` (`expo lint`) → **passou sem avisos**.
  - `npm test` (`vitest run`) → **4 arquivos, 29 testes, todos passaram**; inclui o novo teste do cron de atrasados e da atualização de fuso.
  - `npx expo export --platform web` → **passou**; bundle SPA gerado em `dist/`.
  - `npx expo export --platform android` → **passou**; bundle Hermes Android gerado em `dist/`.
  - `npx expo-doctor` → **21/21 checks**, sem problemas detectados.
  - `npx convex run health:ping` → **`"ok"`**; `npx convex run reminders:refreshOverdueCredits` e `npx convex run reminders:sendDueReminders` executaram sem erro no deployment local.
  - As Fases 3 e 4 foram validadas por testes e2e temporários via `ConvexHttpClient` (62 e 66 verificações), removidos depois da execução; os testes unitários atuais permanecem no repositório.
  - **Não validado em aparelho físico:** push remoto real, abertura do app pelo toque na notificação, permissão do sistema em Android/iOS, tutorial e voz no celular, impressão/PDF, folha de compartilhamento e deep links de WhatsApp/SMS. O push remoto exige **development build** e projeto EAS/FCM/APNs configurados; o Expo Go não é suficiente no Android desde o SDK 53. O `eas.json` já tem perfis `development`, `preview` e `production`, mas falta vincular o projeto EAS.
- **Divergências em relação à spec:**
  1. A spec assume monorepo (`apps/mobile/`, `packages/shared/`, `convex/`); o projeto é flat. Pela regra 0.1.5, **mantém-se a estrutura atual** e o "shared" virou `src/lib/`.
  2. Autenticação por e-mail e senha; o PIN de 4 a 6 dígitos ainda não existe. A spec permite "senha (ou PIN)".
  3. A navegação fixa com 4 abas ainda não foi criada. O Início já oferece os quatro atalhos grandes, mas a barra inferior continua pendente.
  4. Formulários usam estado controlado + validações compartilhadas em `src/lib/validation.ts`; `react-hook-form` e `zod` ainda não foram adicionados.
  5. `expo-notifications`, `expo-speech` e `expo-dev-client` foram adicionados na Fase 5. Ainda faltam `react-hook-form` e `zod` para as fases seguintes.
  6. O projeto está no GitHub (`Allan-al10/armazem_mob`), na branch `main`, com os commits das Fases 0–4 e da Fase 5. O remote `origin` está configurado.
  7. A saída web foi mudada de `static` para `single` (SPA) para evitar problemas de SSR com o Convex Auth.
  8. O lint está configurado e agora há **29 testes unitários** com Vitest/convex-test; ainda não há testes de interface automatizados.
  9. A data de chegada usa dois botões grandes ("Hoje" e "Ontem") em vez de seletor de calendário. Cobre o caso comum sem dependência nativa e sem digitação de data; datas mais antigas ficam para uma evolução futura.
  10. O campo `products.active` existe e uma entrada reativa o produto, mas ainda não há controle para desativar/reativar na interface. Produtos inativos não aparecem na venda.
  11. A busca do estoque e a busca de produtos na venda são feitas no cliente sobre a lista da loja, com nome normalizado (sem acentos, minúsculas). Para o porte esperado é instantânea e dispensa busca textual no Convex.
  12. Não há exclusão de produto; o caminho disponível é ajustar o estoque para zero. Exclusão definitiva pode entrar junto com relatórios/histórico de compras.
  13. Os tipos de movimento de estoque usam os nomes em português já existentes (`entrada`, `saida`, `ajuste`) e o novo `cancelamento`, em vez dos nomes em inglês sugeridos na spec (`entry`, `sale`, `cancel`, `adjustment`). Pela regra 0.1.5, manteve-se o padrão do projeto.
  14. O número da venda fica em `stores.nextSaleNumber` (opcional para lojas antigas), começa em 1 e não é reaproveitado depois de cancelamento. Não há controle de série, filial ou reinício anual.
  15. O valor recebido em dinheiro e o troco são calculados só na tela e **não são persistidos**; a nota mostra apenas "Dinheiro". Não há caixa diário nem fechamento de caixa nesta fase.
  16. Fiado (Fase 4): o pagamento `credit_account` cria um registro em `credits` na mesma transação da venda. Nome, telefone, endereço e data são obrigatórios; o nome editado atualiza o cadastro do cliente e nomes duplicados são bloqueados. O vencimento aparece na nota.
  17. O envio usa deep links (`https://wa.me/...` e `sms:`) com o texto da nota; não há envio automático por WhatsApp Business API ou provedor de SMS.
  18. A lista de vendas mostra as **30 mais recentes**, sem paginação nem filtros por período. O resumo do Início cobre apenas o dia local do aparelho.
  19. A data combinada do fiado usa atalhos grandes de **7, 15 ou 30 dias** (padrão 7), sem calendário nem digitação, seguindo o padrão já usado na data de chegada.
  20. Pagamentos são registrados por compra fiado (`creditId`), não como um caixa único do cliente. O valor não pode passar do saldo daquela compra e não há comprovante/recibo de pagamento nesta fase.
  21. Cancelamento de venda fiado sem pagamento apaga o `credit` e devolve o estoque. Depois do primeiro pagamento, o cancelamento é bloqueado; não há estorno automático.
  22. O atraso é calculado na interface pela data de vencimento, mas o status `overdue` agora também é atualizado pelo cron horário (`refreshOverdueCredits`). `lastReminderAt` é gravado por compra avisada para impedir repetição no mesmo dia local.
  23. A ajuda contextual com "?" e os ícones "i" já existiam; o tutorial inicial de 4 cartões, a leitura em voz alta (`expo-speech`) e o **Rever tutorial** foram entregues na Fase 5.
  24. O cron da spec era diário; a implementação roda **de hora em hora** e só envia quando a hora local da loja coincide com o horário configurado. Isso permite horários diferentes por loja sem perder o envio diário. O padrão continua 8h de Brasília.
  25. A tela de Configurações oferece **1, 2, 3, 5 ou 7 dias** e **6h, 8h, 10h, 12h ou 18h**; o servidor aceita de 1 a 30 dias e de 0 a 23 horas para permitir ajustes futuros sem migração.
  26. O push remoto exige **development build** e um projeto EAS com credenciais FCM/APNs. O `expo-dev-client` e o `eas.json` estão prontos, mas o `extra.eas.projectId` ainda não foi configurado; no Expo Go o app explica que o push não está disponível. O teste físico do push e do toque na notificação continua pendente.
  27. Os avisos são agrupados por cliente (um push com o saldo total e a contagem de compras) e não há verificação de recibo do Expo Push Service. Tokens com `DeviceNotRegistered` são removidos; falhas temporárias ficam para o próximo dia.
  28. A permissão de notificações é solicitada automaticamente ao entrar no app quando o push está configurado; se for negada, a tela Configurações mostra o status, permite tentar de novo e abre os ajustes do sistema.
  29. O tutorial automático cobre os módulos principais (Início, Chegou mercadoria, Estoque, Vender e Fiado); as telas de detalhe, nota, vendas recentes e Meu cadastro têm ajuda contextual, mas não um tutorial automático. O **Rever tutorial** reabre o tutorial do Início.
- **Fases que podem ser puladas ou reduzidas:** nenhuma fase inteira. As Fases 0, 1, 2, 3, 4 e 5 estão concluídas no código; resta validar o push em um development build físico. A Fase 6 está com os testes unitários concluídos e ainda precisa do teste com pessoas de 50+ e do build final (EAS Build).

---

## 13. Sugestão de `CLAUDE.md` (para colocar na raiz)

```markdown
# Meu Armazém: instruções para o agente

- Leia o SPEC.md antes de qualquer tarefa. Ele é a fonte da verdade do produto.
- O projeto já existe: não recrie estrutura, não sobrescreva arquivos sem ler antes.
- Público final tem 50+ anos: fonte >= 18sp, botões >= 56dp, alto contraste, uma tarefa por tela, botão "?" em toda tela.
- Textos da interface em português do Brasil, linguagem simples.
- Dinheiro sempre em centavos (inteiros). Nunca usar float para valores.
- Toda função do Convex deve checar o storeId do usuário logado.
- Venda + itens + baixa de estoque na MESMA mutation (transação).
- Trabalhe uma fase do checklist (Seção 9 do SPEC.md) por vez e marque o que concluir.
- Após cada etapa: rodar typecheck, lint e testes, e confirmar que o app abre.
```
