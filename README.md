# Estoque Fácil

App de controle de estoque, vendas e fiado para pequenos comerciantes, com interface pensada para pessoas de 50+ anos.

> **Status:** Fases 0 a 5 concluídas no código e reformulação visual **Estoque Fácil** implementada (tema claro/escuro, escala de fonte, quatro abas Início/Produtos/Caixa/Nota, acesso rápido e resumo geral de vendas). A Fase 6 ainda depende de três validações externas: teste com pessoas de 50+, build final no EAS e teste do push em aparelho físico. Os testes do app usam o deployment Convex na nuvem `dynamic-swan-561`, o mesmo da produção; `amiable-stork-958` fica disponível para desenvolvimento do backend. O relatório atualizado está em [RELATORIO.md](RELATORIO.md).

## Controle de versão

O projeto está no GitHub em **https://github.com/Allan-al10/armazem_mob**, na branch `main`, com os commits das Fases 0–5 e da reformulação visual. Dependências, builds, estado local do Expo/Convex e os arquivos `.env*.local` ficam fora do versionamento; `.env.production` é versionado.

Para enviar novas alterações:

```bash
git push origin main
```

## Requisitos

- Node.js 24+ (testado com 24.21.0)
- npm 11+
- [Expo Go](https://expo.dev/go) no celular ou um emulador Android/iOS para o app normal
- Um **development build** e uma conta EAS para testar push remoto de verdade (veja abaixo)
- (Opcional) conta Convex para usar um deployment na nuvem

## Instalação

```bash
npm install
```

## Backend (Convex)

O projeto usa o **deployment Convex na nuvem `dynamic-swan-561`** para testes e produção. O `.env.local` guarda apenas `CONVEX_DEPLOYMENT=dev:amiable-stork-958` (ignorado pelo Git), usado pelo `npx convex dev` para desenvolver o backend. O `.env.development.local` aponta o app em teste para as URLs públicas de `dynamic-swan-561`; as URLs de produção ficam em `.env.production` e nos perfis `development`, `preview` e `production` do `eas.json`.

Para desenvolver o backend, deixe rodando em um terminal:

```bash
npx convex dev
```

Esse comando sincroniza as funções com o deployment de desenvolvimento `amiable-stork-958`, gera os tipos em `convex/_generated/` e observa mudanças nos arquivos. Ele também publica os cron jobs de `convex/crons.ts`: atualização de fiados atrasados no minuto UTC 5 e envio de avisos no minuto UTC 10, de hora em hora. O envio só acontece quando a hora local configurada pela loja coincide com o horário escolhido.

Para apenas testar o app, não é necessário rodar `npx convex dev`: o app usa `dynamic-swan-561`. Mudanças em `convex/` só aparecem no app depois de `npx convex deploy`.

Para publicar as funções no deployment de produção:

```bash
npx convex deploy
```

Em CI ou em terminal não interativo, use `npx convex deploy --yes`.

Para testar rapidamente:

```bash
npx convex run health:ping
# "ok"
```

### Autenticação

O app usa **Convex Auth** com e-mail e senha.

- As chaves `JWT_PRIVATE_KEY` e `JWKS` ficam configuradas **no deployment**, não no `.env.local`.
- Nos deployments `dynamic-swan-561` (teste/produção) e `amiable-stork-958` (desenvolvimento do backend), elas já estão configuradas. Se criar um novo deployment, rode:

  ```bash
  npx @convex-dev/auth --prod
  ```

- Se trocar para outro deployment de desenvolvimento, rode novamente na raiz:

  ```bash
  npx @convex-dev/auth --skip-git-check
  ```

- No celular, a sessão é guardada no `expo-secure-store`; na web, no `localStorage`.
- O cadastro tem duas etapas: primeiro os dados da pessoa, depois os dados do estabelecimento.

### Ambientes e teste no celular

- **Teste/desenvolvimento do app:** `npx expo start` carrega `.env.development.local`, que aponta para `dynamic-swan-561` (o mesmo deployment da produção). O `.env.local` guarda apenas `CONVEX_DEPLOYMENT=dev:amiable-stork-958` para o `npx convex dev`. Os dois arquivos são ignorados pelo Git.
- **Produção:** `.env.production` e os perfis `development`, `preview` e `production` do `eas.json` apontam para `https://dynamic-swan-561.convex.cloud` e `https://dynamic-swan-561.convex.site`. O backend já está publicado e com as chaves JWT configuradas.
- O arquivo `.env.local` é carregado também em produção e tem prioridade sobre `.env.production`; por isso ele não deve conter `EXPO_PUBLIC_CONVEX_*`. Use `.env.development.local` para os valores de desenvolvimento.
- Para testar no celular físico, o app usa `dynamic-swan-561`; não é necessário configurar IP local. Ao trocar de deployment, faça logout ou limpe os dados do app, porque a sessão antiga pertence ao outro deployment.
- Para gerar um build de produção, use `npx eas-cli@latest build --profile production`.

### Notificações push (development build)

O **Expo Go não recebe push remoto no Android desde o SDK 53** e não serve para validar o toque na notificação. O app detecta esse caso e mostra uma mensagem explicando. Para testar de verdade:

1. Crie uma conta em https://expo.dev e entre na CLI:

   ```bash
   npx eas-cli@latest login
   ```

2. Vincule/crie o projeto EAS na raiz. Isso grava `extra.eas.projectId` no `app.json`:

   ```bash
   npx eas-cli@latest init
   ```

   Se preferir não alterar o `app.json`, defina `EXPO_PUBLIC_EAS_PROJECT_ID` no `.env.local` com o ID do projeto.

3. Configure as credenciais de push (FCM para Android e APNs para iOS). O EAS guia a criação durante o build ou por `npx eas-cli@latest credentials`.
4. Gere e instale um **development build**:

   ```bash
   npx eas-cli@latest build --profile development --platform android
   ```

   O perfil `development` já está em `eas.json` e gera um APK com `expo-dev-client`. Para iOS, use `--platform ios` em uma conta Apple configurada.
5. Com o app instalado, inicie o servidor para o development build:

   ```bash
   npx expo start --dev-client
   ```

6. Entre no app, abra **Configurações** e toque em **Ativar avisos neste celular**. Aceite a permissão do sistema.

Também é possível gerar o build localmente com `npx expo run:android` (requer Android Studio/SDK) ou `npx expo run:ios` (macOS). O projeto **ainda não tem `extra.eas.projectId` configurado**, então esse vínculo é o primeiro passo para testar o push. O cron e o Expo Push Service já estão implementados; o que falta é a credencial do aplicativo.

## App

Com o `convex dev` rodando, em outro terminal:

```bash
npm start
```

Para o app normal no **Expo Go**, escaneie o QR code ou pressione `a`/`i` para abrir no emulador. Se o `expo-dev-client` estiver instalado e você quiser forçar o Expo Go, use `npx expo start --go`. Para abrir o development build com push, use `npx expo start --dev-client`. Para abrir no navegador: `npm run web`.

### Primeiro acesso

1. Abra o app e toque em **Criar minha conta**.
2. Preencha nome completo, telefone, e-mail e uma senha com pelo menos 8 caracteres.
3. No passo 2, cadastre os dados do estabelecimento, incluindo um CNPJ válido.
4. Depois de salvar, você chega ao **Início**.

Para sair, use **Sair da conta** no Início. Os dados do estabelecimento continuam salvos.

### Navegação

A barra inferior tem quatro abas grandes, com ícone e texto: **Início**, **Produtos**, **Caixa** e **Nota**. Cada aba usa alvos de toque de pelo menos 56 dp, contraste alto e altura ajustada à escala de fonte do aparelho. **Fiado**, **Vendas**, **Configurações**, **Meu cadastro**, o detalhe de produto e a nota abrem acima das abas, com o botão **Voltar** no cabeçalho. O **Fiado** também pode ser adicionado ao acesso rápido da tela inicial e é aberto pelo aviso de contas em aberto.

### Aparência

- **Configurações → Aparência:** escolha o tema **Claro** ou **Escuro** e o tamanho **Normal**, **Grande** ou **Muito grande**. A escolha vale para todas as telas e fica salva no aparelho.
- **Acesso rápido:** em Configurações, escolha até seis atalhos, use **↑** e **↓** para mudar a ordem e **×** para remover. Os atalhos escolhidos aparecem na tela inicial.
- A fonte usada é a **Atkinson Hyperlegible**, indicada para baixa visão, e o app respeita a escala de fonte do sistema além do ajuste interno.

### Estoque

- **Caixa (chegou mercadoria):** escolha um produto existente ou crie um novo, informe a quantidade, o valor total da caixa e o preço de venda. O custo por unidade é calculado automaticamente e pode ser corrigido. Se o preço de venda ficar abaixo do custo, o app pede confirmação.
- **Produtos:** busque pelo nome, veja quantidade e preço e toque no produto para editar o preço, ajustar o estoque (sempre com motivo), ver o histórico de entradas, saídas, cancelamentos e ajustes ou excluir o produto com confirmação. A exclusão preserva o histórico de vendas.
- O aviso **Estoque baixo** aparece quando a quantidade chega ao limite do produto (padrão: 5, editável no detalhe). O Início mostra quantos produtos precisam de reposição.
- Quantidades aceitam casas decimais apenas para produtos vendidos por quilo (kg).

### Vendas

- **Nova venda:** o fluxo tem 4 passos. No primeiro, informe o nome do cliente (obrigatório) e, se quiser, o telefone. Se o cliente já comprou antes, toque na sugestão para reaproveitar o cadastro.
- **Produtos:** busque pelo nome, toque em **Adicionar** e confira a quantidade com os botões grandes **−** e **+**. Em produtos por quilo, cada toque soma ou diminui 0,5 kg; use **Corrigir** para digitar a quantidade exata. **Alterar preço** vale só para aquela venda e mostra o desconto ou aumento antes de confirmar.
- **Resumo e pagamento:** confira os itens e o total. Escolha **Dinheiro**, **Cartão**, **Pix** ou **Fiado**. No dinheiro, o campo **Valor recebido** é opcional e mostra o troco. No fiado, o formulário pede telefone, endereço e a data combinada (veja a seção **Fiado**).
- **Estoque:** ao concluir, a venda, os itens, a baixa do estoque e o número sequencial são gravados na mesma transação. Se faltar estoque, nada é gravado e o app avisa quanto existe.
- **Nota:** mostra os dados da loja, número, data, cliente, itens, total, pagamento e, no fiado, a data combinada para pagamento, além do rodapé "Comprovante simples, não substitui documento fiscal." É possível enviar por WhatsApp ou SMS, imprimir e salvar/compartilhar em PDF. Na web, a impressão abre a janela do navegador; no celular, há botões separados para imprimir e para compartilhar o PDF.
- **Registro de vendas:** a tela **Vendas** tem duas visões. Em **Por mês**, use as setas para trocar de mês e veja **total vendido**, **custo**, **lucro**, **número de vendas**, **itens vendidos no mês** e **a receber (fiado)**. Em **Resumo geral**, veja o total de todas as vendas e uma linha por mês com barra proporcional, custo e lucro; toque no mês para abri-lo. Cada venda mostra os itens, quantidades, preços, custo e lucro. Vendas canceladas continuam visíveis, mas ficam fora do resumo financeiro.
- **Cancelamento:** abra a nota no **Registro de vendas** e toque em **Cancelar venda**. A venda fica marcada como cancelada e os produtos voltam ao estoque; a venda não é apagada. Em venda fiado sem pagamento, o fiado também é apagado; depois do primeiro pagamento, o cancelamento é bloqueado.
- **Início:** o cartão **Vendas de [mês]** mostra total, custo, lucro, número de vendas e a comparação com o mês anterior, e abre o **Registro de vendas**. O cartão **Fiados para cobrar** mostra clientes, total em aberto e vencimentos próximos, e abre **Quem deve**. Vendas canceladas não entram nos totais.

### Fiado

- Na venda, escolha **Fiado**. Confira o nome, digite telefone e endereço, escolha a data combinada (**Em 7**, **Em 15** ou **Em 30 dias**, padrão 7) e, se quiser, uma observação. Telefone, endereço e data são obrigatórios.
- O fiado entra em **Quem deve**, no Início, com o total em aberto e uma etiqueta de vencimento em texto: "Em dia", "Vence hoje", "Vence em 3 dias" ou "Atrasado há 2 dias".
- Toque no cliente para ver o saldo total, as compras em aberto e o histórico. **Registrar pagamento** aceita o valor todo ou uma parte em dinheiro, cartão ou Pix; **Usar o saldo todo** preenche o valor restante. O saldo cai na hora e o fiado fica quitado quando chega a zero.
- O app bloqueia pagamento maior que o saldo, zero ou negativo.
- **Ligar** abre o telefone e **Cobrar no WhatsApp** abre uma mensagem educada pronta com o saldo e o vencimento.
- A nota da venda fiado mostra a data combinada. O cancelamento da venda só é permitido enquanto nenhum pagamento foi registrado; depois disso, o botão de cancelar não aparece e o servidor também bloqueia a ação.
- Avisos automáticos de vencimento (push) são configurados em **Configurações**; veja a seção abaixo.

### Configurações, avisos e tutorial

- **Configurações** abre pela engrenagem no topo do Início. Lá você escolhe tema, tamanho das letras e símbolos, edita o acesso rápido, liga/desliga os avisos de fiado, escolhe a antecedência (1, 2, 3, 5 ou 7 dias) e o horário (6h, 8h, 10h, 12h ou 18h), ativa o aparelho e revê o tutorial.
- **Padrões:** avisos ligados, 3 dias de antecedência, 8h e fuso de Brasília (`-180`). O fuso real do aparelho é enviado ao registrar o token e atualizado quando o app registra o aparelho novamente.
- **Como funciona:** um cron do Convex roda de hora em hora, atualiza os fiados vencidos e verifica se é a hora local escolhida pela loja. Quando é, monta um aviso por cliente e envia pelo Expo Push Service. O aviso cobre o prazo configurado (3 dias por padrão), 1 dia antes, o dia do vencimento e todos os dias de atraso. O campo `lastReminderAt` impede repetir o mesmo fiado no mesmo dia local.
- **Ao tocar na notificação**, o app abre o detalhe do cliente em **Quem deve**, onde você pode ver as compras, registrar pagamento ou cobrar.
- **Tutorial:** na primeira visita ao Início, Caixa, Produtos, Nota e Fiado, aparece um guia de 4 cartões. Você pode pular a qualquer momento ou tocar em **Rever tutorial** nas Configurações. O tutorial fica salvo por aparelho.
- **Leitura em voz alta:** o botão **Ouvir esta ajuda** aparece na janela de ajuda de todas as telas, e o tutorial também tem **Ouvir esta explicação**. A voz usa `expo-speech` em português do Brasil; no iOS, o aparelho precisa estar sem o modo silencioso.
- **Permissão:** quando o projeto EAS está configurado, o app pede a permissão de notificações ao entrar. Se você negar, a tela Configurações mostra o status, permite tentar de novo e abre os ajustes do sistema. No Expo Go o push remoto não está disponível; use um development build.

> O push remoto, o toque na notificação, a permissão do sistema, o tutorial e a voz no celular, a impressão, a folha de compartilhamento do PDF, os links de WhatsApp/SMS e o diálogo de pagamento do fiado foram verificados no bundle, mas ainda precisam de um teste em aparelho físico. O push exige um development build com projeto EAS/FCM/APNs configurado.

## Scripts

| Script | O que faz |
|---|---|
| `npm start` | Inicia o Expo |
| `npm run android` | Abre no emulador/dispositivo Android |
| `npm run ios` | Abre no simulador iOS (macOS) |
| `npm run web` | Abre a versão web |
| `npm run typecheck` | Roda `tsc --noEmit` |
| `npm run lint` | Roda o ESLint (`expo lint`) |
| `npm test` | Roda os testes unitários e do Convex (Vitest) |
| `npm run test:watch` | Roda os testes em modo watch |
| `npm run convex:dev` | Sobe o backend Convex local |

## Verificações

```bash
npm run typecheck     # typecheck
npm run lint          # ESLint
npm test              # Vitest (unitários + Convex)
npx expo-doctor       # diagnostica dependências e configuração
npx convex run health:ping
```

Para validar os bundles sem servidor:

```bash
npx expo export --platform web
npx expo export --platform android
```

O lint está configurado com ESLint 9 + `eslint-config-expo` e passa sem avisos. O **Vitest** roda 7 arquivos e **47 testes** cobrindo moeda, saldo de fiado, vendas/baixa de estoque, lembretes, horário, configurações, datas, cálculo de custo/lucro do registro, agrupamento mensal do resumo geral e preferências de tema/fonte/acesso rápido; os testes do Convex usam `convex-test` em edge-runtime. As Fases 3 e 4 também foram validadas por testes e2e temporários do backend com `ConvexHttpClient` (62 e 66 verificações), removidos depois da execução.

O `expo-doctor` passa nos **21/21 checks**. Os bundles web e Android e o deploy local do Convex foram verificados. A interface reformulada também foi percorrida por um roteiro Playwright temporário no Chrome, em viewport de 420×900: cadastro, criação da loja, Início, Configurações com tema **Escuro** e letra **Muito grande** e **Resumo geral** de vendas, sem erros de console, `pageerror` ou requisições falhas. O push remoto real, o toque na notificação e a voz ainda dependem de um development build em aparelho físico. O `.gitignore` mantém `.expo/`, `.env*.local`, `node_modules/`, `dist/`, `.convex/` e `coverage/` fora do repositório.

## Estrutura

```
.
├── convex/              # backend Convex
│   ├── auth.ts          # Convex Auth + provider de senha
│   ├── schema.ts        # authTables + users + stores + products + stockEntries + stockMovements + customers + sales + saleItems + credits + creditPayments + pushTokens
│   ├── crons.ts         # cron de atrasados e envio de avisos
│   ├── reminders.ts     # configurações, tokens, coleta e envio de push
│   ├── products.ts      # list, get e update de produtos
│   ├── stock.ts         # entrada, ajuste, baixa de venda e histórico de estoque
│   ├── customers.ts     # listagem de clientes para sugestões
│   ├── sales.ts         # criação transacional, nota, lista, registro mensal e cancelamento
│   ├── credits.ts       # Quem deve, detalhe do cliente e pagamentos do fiado
│   ├── dashboard.ts     # resumo de vendas do dia e estoque baixo
│   ├── lib.ts           # requireStore (usuário logado + loja)
│   ├── stores.ts        # getMine, create, update e contador de venda
│   ├── users.ts         # current
│   ├── sales.test.ts    # testes de venda/estoque com convex-test
│   └── reminders.test.ts # testes de avisos, horário e configurações
├── src/
│   ├── app/             # rotas do Expo Router
│   │   ├── (auth)/      # login e cadastro
│   │   ├── (setup)/     # cadastro do estabelecimento
│   │   └── (app)/       # Stack autenticado: abas, detalhes, configurações e Meu cadastro
│   │       └── (tabs)/  # barra inferior: Início, Produtos, Caixa e Nota
│   ├── components/      # componentes acessíveis, tutorial, logo, cartões e diálogos
│   ├── lib/             # moeda, quantidade, validações, datas, registro de vendas, preferências, erros, ajuda, nota, fiado, push e tutorial
│   ├── theme.ts         # temas claro/escuro, fontes e espaçamentos acessíveis
│   ├── themeContext.tsx # preferências de tema, escala de fonte e acesso rápido
│   └── assets/          # imagens
├── app.json             # configuração do Expo
├── eas.json             # perfis de development/preview/production
├── vitest.config.mts    # projetos unit e convex do Vitest
├── RELATORIO.md         # o que foi concluído e o que depende de terceiros
├── SPEC.md              # especificação do produto
└── CLAUDE.md            # instruções para agentes
```

## Próximos passos

A Fase 5 está concluída no código e a reformulação visual foi implementada. O que falta é **validação externa**: testar a interface em aparelho físico (push, voz, impressão/PDF, compartilhamento e links), configurar o deployment Convex de produção, vincular o projeto EAS com credenciais FCM/APNs, gerar o build final e fazer o teste com pessoas de 50+. O detalhamento está em [RELATORIO.md](RELATORIO.md).
