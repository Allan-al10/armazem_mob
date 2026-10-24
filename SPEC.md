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
| `pushTokens` / `settings` | token de notificação, dias de aviso, horário, política de estoque negativo |

`unitCostCents` em `saleItems` guarda o custo **no momento da venda**, o que permite calcular lucro depois.

**Índices sugeridos:** `products` por `storeId` e nome; `credits` por `storeId` e `dueDate`; `sales` por `storeId` e `createdAt`.

**Funções principais:**

- **Mutations:** `stores.create`, `products.create`, `stockEntries.register`, `sales.create` (grava venda, itens e baixa **na mesma transação**), `sales.cancel`, `credits.registerPayment`, `stock.adjust`.
- **Queries:** `products.list`, `sales.get`, `credits.listOpen`, `dashboard.summary`.
- **Cron (`crons.ts`):** `credits.sendDueReminders`, diário.

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

> Fase 4 concluída em 24/10/2026. O pagamento parcial, o cancelamento de venda fiado sem pagamento, a nota com vencimento e o cartão de fiados no Início também foram entregues. Avisos push/cron e tutorial/voz continuam na Fase 5.

### Fase 5: Avisos e ajuda
- [ ] Registro do token de push e permissões
- [ ] Cron diário de vencimentos e notificações
- [ ] Ajuda contextual, ícones "i", tutorial inicial, leitura em voz alta

### Fase 6: Acabamento
- [ ] Testes unitários dos cálculos
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

## 12. Estado atual do projeto (Fase 4 — 24/10/2026)

> Diagnóstico atualizado ao fim da Fase 4. Divergências em relação à spec estão anotadas no fim desta seção.

- **Estrutura de pastas:** projeto Expo **flat** na raiz (`C:\Users\allan\myapp`), **não é monorepo**. Não existem `apps/` nem `packages/`. O código fica em `src/` e o backend em `convex/`:
  - `src/app/` — rotas do Expo Router:
    - `(auth)/login.tsx` e `(auth)/signup.tsx` — entrada e cadastro em duas etapas.
    - `(setup)/loja.tsx` — cadastro do estabelecimento (passo 2).
    - `(app)/inicio.tsx` — Início com resumo do dia (vendas, estoque baixo e fiado) e atalhos.
    - `(app)/meu-cadastro.tsx` — edição dos dados do estabelecimento.
    - `(app)/chegou-mercadoria.tsx` — registro de mercadoria que chegou (produto novo ou existente).
    - `(app)/estoque/index.tsx` — lista, busca e aviso de estoque baixo.
    - `(app)/estoque/[id].tsx` — detalhe, edição de preço/aviso, ajuste e histórico.
    - `(app)/vender.tsx` — fluxo real de Nova venda em 4 passos: cliente, produtos, resumo e pagamento.
    - `(app)/nota/[id].tsx` — recibo da venda, envio por WhatsApp/SMS, impressão/PDF e cancelamento.
    - `(app)/vendas.tsx` — vendas recentes, com resumo do dia e reabertura da nota.
    - `(app)/fiado.tsx` — lista "Quem deve", total em aberto e clientes ordenados pelo vencimento.
    - `(app)/fiado/[id].tsx` — detalhe do cliente, compras em aberto, pagamentos, Ligar e Cobrar no WhatsApp.
    - `index.tsx` — redireciona conforme login e existência de loja.
  - `src/components/` — `BigButton`, `TextField`, `MoneyInput`, `ProductPicker`, `ChoiceRow`, `Screen`, `ScreenHeader`, `HelpModal`, `ConfirmDialog`, `StepIndicator`, `ErrorBanner`, `SummaryCard` (clicável quando recebe `onPress`), `SaleReceipt`, `SalePriceDialog`, `SaleQuantityDialog`, `CreditPaymentDialog`, `ComingSoon`, `StoreForm`, `LoadingScreen`.
  - `src/lib/` — `money.ts`, `quantity.ts`, `validation.ts`, `date.ts`, `errors.ts`, `help.ts`, `sale.ts` (texto/HTML da nota, links e rótulos), `credit.ts` (saldo, etiqueta de vencimento e mensagem de cobrança), `types.ts`, `api.ts`, `convex.ts`, `storage.ts`.
  - `src/theme.ts` — cores, fontes, espaçamentos, raios e alvos de toque.
  - `src/assets/` — `img1.png` e `img2.png`.
  - `convex/` — `schema.ts` (authTables + `users` + `stores` + `products` + `stockEntries` + `stockMovements` + `customers` + `sales` + `saleItems` + `credits` + `creditPayments`), `auth.ts`, `auth.config.ts`, `http.ts`, `users.ts`, `stores.ts`, `products.ts`, `stock.ts`, `customers.ts`, `sales.ts`, `credits.ts`, `dashboard.ts`, `lib.ts`, `health.ts`, `validators.ts` e `_generated/`.
- **Gerenciador de pacotes / workspaces:** **npm** (`package-lock.json`), sem workspaces. Não há `bun.lock`, `pnpm-lock.yaml` nem `yarn.lock`.
- **Versões:** Node **24.21.0**, npm **11.19.0**, Expo SDK **57** (`expo ~57.0.31`), React Native **0.86.3**, React **19.2.3**, TypeScript **~6.0.3**, Convex **^1.47.0**, `@convex-dev/auth` **^0.0.96**, `@auth/core` **^0.41.3**, `expo-print` **~57.0.2**, `expo-sharing` **~57.0.24**, `expo-secure-store` **~57.0.4**, ESLint **^9.0.0** e `eslint-config-expo` **~57.0.2**.
- **Navegação:** **Expo Router ~57.0.29**, com `typedRoutes` ativado em `app.json`, raiz em `src/app` e `src/app/_layout.tsx` com `ConvexAuthProvider` e `Stack.Protected`. Há layouts de grupo para `(auth)`, `(setup)` e `(app)`. A barra inferior de 4 abas ainda não existe; o Início tem os quatro atalhos grandes e as telas reais de estoque e vendas já estão ligadas a ele.
- **Convex (schema, funções, auth):** **inicializado em deployment local anônimo** (modo beta, sem conta) em `http://127.0.0.1:3210`. O `schema.ts` contém `authTables`, `users` (índices `email` e `phone`), `stores` (índices `by_owner` e `by_cnpj`, contador opcional `nextSaleNumber`), `products` (índices `by_store` e `by_store_and_nameQuery`), `stockEntries` (índices `by_store` e `by_product`), `stockMovements` (índices `by_store` e `by_product`, campo opcional `refId`), `customers` (índices `by_store` e `by_store_and_nameQuery`), `sales` (índices `by_store`, `by_store_and_createdAt` e `by_customer`), `saleItems` (índice `by_sale`), `credits` (índices `by_store`, `by_store_and_dueDate`, `by_customer` e `by_sale`; guarda total, pago, vencimento, telefone/endereço copiados, status, observação e `lastReminderAt` opcional) e `creditPayments` (índice `by_credit`; valor, forma e data). Funções publicadas: `health:ping`, `users:current`, `stores:getMine`, `stores:create`, `stores:update`, `products:list`, `products:get`, `products:update`, `stock:registerEntry`, `stock:adjust`, `stock:history`, `customers:list`, `sales:create`, `sales:get`, `sales:listRecent`, `sales:cancel`, `credits:debtors`, `credits:byCustomer`, `credits:getBySale`, `credits:registerPayment` e `dashboard:summary`. Todas as funções de loja usam `requireStore` (`convex/lib.ts`), que exige usuário logado e loja; vendas, clientes, fiados, itens e produtos são conferidos contra o `storeId`. O `.env.local` contém `CONVEX_DEPLOYMENT=anonymous:anonymous-agent`, `EXPO_PUBLIC_CONVEX_URL` e `EXPO_PUBLIC_CONVEX_SITE_URL`.
- **Autenticação:** **Convex Auth com e-mail e senha** (`Password` provider). O cadastro chama `signIn("password", { flow: "signUp", name, phone, ... })`; o `profile` grava nome, e-mail e telefone na tabela `users`. A sessão é persistida com `expo-secure-store` no celular e `localStorage` na web. As chaves `JWT_PRIVATE_KEY` e `JWKS` ficam no deployment, não no `.env.local`. PIN de 4 a 6 dígitos ainda não foi implementado; a senha atende à alternativa "ou PIN" da spec.
- **UI/estilo em uso:** **StyleSheet** nativo do React Native com tema centralizado em `src/theme.ts`. Sem NativeWind, Tamagui ou biblioteca de componentes. Cores de alto contraste, corpo mínimo de 18 sp, títulos de 24–34 sp, botões de 64 dp, campos de 60 dp e alvos de toque de pelo menos 56 dp (com `hitSlop` nos ícones "i").
- **Scripts e testes disponíveis:** `start`, `android`, `ios`, `web`, `typecheck`, `lint` (`expo lint`) e `convex:dev`. O ESLint 9 foi configurado com `eslint-config-expo` em `eslint.config.js`; `npx expo lint` e `npx eslint .` passam sem avisos. **Não há** Jest nem testes unitários automatizados; as Fases 3 e 4 foram validadas por testes e2e temporários via `ConvexHttpClient` (62 e 66 verificações), removidos após a execução.
- **Variáveis de ambiente:** `.env.local` presente (gerado pelo Convex) com `CONVEX_DEPLOYMENT`, `EXPO_PUBLIC_CONVEX_URL` e `EXPO_PUBLIC_CONVEX_SITE_URL`; não há `.env` versionável. O `.gitignore` ignora `.env*.local`, `.expo/` e `.convex/`.
- **O que já está pronto:**
  - Cadastro de usuário em 2 etapas, login, logout e sessão persistente.
  - Cadastro do estabelecimento com validação de CNPJ (dígitos verificadores), telefone e UF; edição em Meu cadastro.
  - Queries/mutations protegidas por `getAuthUserId`; `stores.create/update` conferem o dono e bloqueiam CNPJ duplicado.
  - **Estoque (Fase 2):** "Chegou mercadoria" aceita produto existente ou novo, quantidade (decimal só para kg), valor da caixa, custo unitário automático (editável), preço de venda, aviso de lucro/prejuízo, data Hoje/Ontem e fornecedor opcional. Salvar cria o produto (se novo), soma o estoque, grava o lote em `stockEntries` e o movimento em `stockMovements` na mesma mutation. Produto duplicado é bloqueado pelo nome normalizado (sem acentos e sem diferenciar maiúsculas).
  - Lista de estoque com busca por nome, quantidade, preço e aviso "Estoque baixo" (limite padrão 5, editável). Detalhe do produto com edição de preço/limite, ajuste de estoque com motivo obrigatório (perda/quebra, contagem ou outro) e histórico de entradas, saídas, cancelamentos e ajustes.
  - **Vendas (Fase 3):**
    - Clientes com nome obrigatório e telefone opcional; sugestões de clientes já cadastrados ao digitar, reaproveitamento pelo nome normalizado e atualização do telefone ao corrigir na venda.
    - "Nova venda" em 4 passos: Cliente → Produtos → Resumo → Pagamento. Busca de produto, carrinho com botões grandes −/+ (0,5 kg por toque em produtos por quilo), diálogo para corrigir a quantidade exata e diálogo de alteração de preço com confirmação e aviso de desconto/aumento.
    - Pagamento em Dinheiro, Cartão, Pix ou Fiado. No dinheiro, o campo "Valor recebido" calcula o troco no cliente; o servidor não persiste valor recebido nem troco. O fiado abre o formulário da Fase 4.
    - Conclusão transacional: grava `sales`, `saleItems`, movimentos de `saida`, baixa o estoque de cada produto e incrementa `stores.nextSaleNumber` na mesma mutation. Se faltar estoque, nada é gravado. Itens guardam nome, unidade, preço e custo do momento da venda; dinheiro fica em centavos inteiros.
    - Nota com cabeçalho da loja (nome, CNPJ, proprietário, telefone e endereço), número sequencial com 6 dígitos, data/hora, cliente, itens, total, forma de pagamento e, no fiado, o vencimento combinado, agradecimento e rodapé "Comprovante simples, não substitui documento fiscal."
    - Envio da nota por WhatsApp (`https://wa.me/...`) e SMS (`sms:`), com texto pronto. Impressão na web pela janela do navegador; no celular, "Imprimir nota" abre a impressão do sistema e "Salvar ou compartilhar PDF" gera o arquivo com `expo-print` e abre a folha de compartilhamento com `expo-sharing`.
    - Cancelamento marca a venda como `Cancelada`, devolve os itens ao estoque e grava movimentos do tipo `cancelamento`; a venda não é apagada e a nota passa a mostrar o aviso de cancelada. Em venda fiado sem nenhum pagamento, o fiado também é apagado; depois do primeiro pagamento, o cancelamento é bloqueado.
    - Lista de vendas recentes em `/vendas`, com resumo de hoje e reabertura da nota. O cartão "Vendas de hoje" no Início usa `dashboard.summary`, desconta vendas canceladas e abre a lista ao toque.
  - Ajuda contextual com "?" em todas as telas, "i" nos campos e textos centralizados em `src/lib/help.ts`.
  - Componentes e utilitários de moeda, quantidade, CNPJ, telefone, data, erros amigáveis e nota (texto/HTML).
  - **Fiado (Fase 4):**
    - Formulário no passo de pagamento com nome vindo da venda (editável), telefone e endereço obrigatórios, data combinada por atalhos grandes "Em 7 / 15 / 30 dias" (padrão 7) e observação opcional. O nome editado atualiza o cadastro do cliente; nome duplicado é bloqueado.
    - `credits` guarda total, valor pago, vencimento, telefone/endereço copiados, status (`open`/`paid`/`overdue`), observação e a venda de origem; `creditPayments` guarda cada pagamento com valor, forma (dinheiro, cartão ou Pix) e data. A venda, o fiado e a baixa de estoque são gravados na mesma transação.
    - Tela "Quem deve" (`/fiado`) agrupa por cliente, soma o saldo, ordena pelo vencimento mais próximo e mostra etiquetas em texto: "Vence hoje", "Vence amanhã", "Vence em X dias", "Atrasado há X dias" ou "Em dia".
    - Detalhe do cliente (`/fiado/[id]`) mostra saldo total, compras em aberto, histórico de pagamentos, ações Ligar e Cobrar no WhatsApp (com mensagem pronta) e o diálogo "Registrar pagamento" (parcial ou total, com "Usar o saldo todo"). Pagamento acima do saldo é bloqueado; ao quitar, o status vira `paid`.
    - A nota da venda fiado mostra o vencimento; o cancelamento é permitido apenas enquanto não houver pagamento. O cartão "Fiados para cobrar" no Início mostra clientes, total em aberto e vencimentos próximos.
    - O atraso é derivado da data na interface; o status `overdue` e o campo `lastReminderAt` ficam reservados para o cron/avisos da Fase 5.
- **Verificações executadas (Fase 4):**
  - `npm run typecheck` (`tsc --noEmit`) → **passou**, sem erros.
  - `npm run lint` (`expo lint`) → **passou sem avisos**. O ESLint 9 + `eslint-config-expo` está configurado em `eslint.config.js`, com ignores para `dist/`, `.expo/` e `convex/_generated/`.
  - `npx expo export --platform web` → **passou**; bundle SPA gerado em `dist/` (`web.output: "single"`), incluindo as rotas `/fiado`, `/fiado/[id]`, `/vender`, `/vendas` e `/nota/[id]`.
  - `npx expo export --platform android` → **passou**; bundle Hermes Android gerado em `dist/`.
  - Teste e2e da Fase 4 via `ConvexHttpClient` (**66 verificações**) → **passou**: fiado exige telefone, endereço e data; criação transacional e baixa de estoque; agrupamento e ordenação em Quem deve; duas compras do mesmo cliente; pagamentos parciais em dinheiro, cartão e Pix; bloqueio de valor zero, negativo e acima do saldo; quitação, histórico e consulta do fiado pela venda (usada pela nota); cancelamento sem pagamento e bloqueio após pagamento; isolamento entre duas lojas; acesso anônimo bloqueado; limpeza total dos dados temporários. Os arquivos de teste/limpeza foram removidos e o Convex regenerou os tipos sem eles.
  - Teste e2e da Fase 3 (histórico) → **62 verificações** passaram.
  - `npx expo-doctor` → **21/21 checks**, sem problemas detectados, com o projeto já versionado em Git.
  - `npx convex run health:ping` → **`"ok"`**.
  - O backend local escuta em `0.0.0.0:3210`/`3211`; o `.env.local` está apontando para o IP da máquina (`192.168.1.14`) para testar no celular físico. Na web, `localhost` funciona; para outro IP de rede, ajustar `EXPO_PUBLIC_CONVEX_URL`.
  - **Não validado em aparelho físico:** abertura real da impressão/PDF, da folha de compartilhamento, dos deep links de WhatsApp/SMS, do diálogo de pagamento do fiado e dos links `tel:`/WhatsApp de cobrança. Os bundles e as APIs do Expo foram verificados, mas o teste de dispositivo fica pendente.
- **Divergências em relação à spec:**
  1. A spec assume monorepo (`apps/mobile/`, `packages/shared/`, `convex/`); o projeto é flat. Pela regra 0.1.5, **mantém-se a estrutura atual** e o "shared" virou `src/lib/`.
  2. Autenticação por e-mail e senha; o PIN de 4 a 6 dígitos ainda não existe. A spec permite "senha (ou PIN)".
  3. A navegação fixa com 4 abas ainda não foi criada. O Início já oferece os quatro atalhos grandes, mas a barra inferior continua pendente.
  4. Formulários usam estado controlado + validações compartilhadas em `src/lib/validation.ts`; `react-hook-form` e `zod` ainda não foram adicionados.
  5. Dependências: `expo-print` e `expo-sharing` foram adicionados na Fase 3. Ainda faltam `expo-notifications`, `expo-speech`, `react-hook-form` e `zod` para as fases seguintes.
  6. O projeto agora é um **repositório Git local** na branch `main`, com commit inicial das Fases 0–4. Ainda não há `remote` configurado; dependências, builds, `.expo/`, `.convex/` e `.env.local` ficam fora do versionamento.
  7. A saída web foi mudada de `static` para `single` (SPA) para evitar problemas de SSR com o Convex Auth.
  8. O lint está configurado, mas ainda **não há testes unitários** (Jest) nem testes de interface automatizados; a spec prevê testes na Fase 6.
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
  22. O atraso é calculado na interface pela data de vencimento. O status `overdue` e o campo `lastReminderAt` existem no schema, mas o cron/push da Fase 5 ainda não os atualiza.
  23. A ajuda contextual com "?" e os ícones "i" já existem, mas o tutorial inicial de 3–4 cartões, a leitura em voz alta (`expo-speech`) e a opção "Rever tutorial" continuam na Fase 5.
- **Fases que podem ser puladas ou reduzidas:** nenhuma fase inteira. Fases 0, 1, 2, 3 e 4 estão concluídas; a próxima é a **Fase 5 (avisos e ajuda)**, com push/cron de vencimentos, tutorial inicial e leitura em voz alta. A Fase 6 (testes unitários, teste com pessoas e build final) continua pendente.

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
