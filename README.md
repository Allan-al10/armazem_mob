# Meu Armazém

App de controle de estoque, vendas e fiado para pequenos comerciantes, com interface pensada para pessoas de 50+ anos.

> **Status:** Fases 0, 1, 2, 3, 4 e 5 concluídas no código (base acessível, autenticação/cadastro, estoque, vendas, fiado, avisos push, tutorial e leitura em voz alta). A Fase 6 tem os testes unitários prontos; faltam o teste com pessoas de 50+ e o build final. O push remoto ainda precisa ser validado em um **development build** com projeto EAS/FCM/APNs configurado.

## Controle de versão

O projeto está no GitHub em **https://github.com/Allan-al10/armazem_mob**, na branch `main`, com os commits das Fases 0–4 e da Fase 5. Dependências, builds, estado local do Expo/Convex e `.env.local` ficam fora do versionamento.

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

O projeto está configurado com um **deployment local anônimo** (sem conta). As variáveis `CONVEX_DEPLOYMENT` e `EXPO_PUBLIC_CONVEX_URL` ficam em `.env.local`, gerado automaticamente e ignorado pelo Git.

Em um terminal, deixe rodando:

```bash
npx convex dev
```

Esse comando sobe o backend local em `http://127.0.0.1:3210`, gera os tipos em `convex/_generated/` e observa mudanças nos arquivos. Ele também publica os cron jobs de `convex/crons.ts`: atualização de fiados atrasados no minuto UTC 5 e envio de avisos no minuto UTC 10, de hora em hora. O envio só acontece quando a hora local configurada pela loja coincide com o horário escolhido.

Para testar rapidamente:

```bash
npx convex run health:ping
# "ok"
```

### Autenticação

O app usa **Convex Auth** com e-mail e senha.

- As chaves `JWT_PRIVATE_KEY` e `JWKS` ficam configuradas **no deployment**, não no `.env.local`.
- Se trocar para outro deployment (por exemplo, um projeto na nuvem), rode novamente na raiz:

  ```bash
  npx @convex-dev/auth --skip-git-check
  ```

- No celular, a sessão é guardada no `expo-secure-store`; na web, no `localStorage`.
- O cadastro tem duas etapas: primeiro os dados da pessoa, depois os dados do estabelecimento.

### Testar no celular ou emulador

O backend local escuta em todas as interfaces (`0.0.0.0:3210`). O `.env.local` atual aponta para `http://192.168.1.14:3210`, o IP da máquina, para facilitar o teste no celular físico. Se o IP mudar, ajuste essa variável e reinicie o Expo. Opções:

- **Emulador Android:** troque `EXPO_PUBLIC_CONVEX_URL` para `http://10.0.2.2:3210` no `.env.local`.
- **Celular físico na mesma Wi-Fi:** use o IP da máquina, por exemplo `http://192.168.1.14:3210`, e reinicie o Expo. O IP pode mudar quando você trocar de rede.
- **Web no mesmo computador:** `http://127.0.0.1:3210` também funciona; ajuste se necessário.
- **Mais estável (recomendado para celular):** use um deployment na nuvem:
  1. Crie uma conta em https://dashboard.convex.dev
  2. Rode `npx convex login`
  3. Rode `npx convex dev --configure` e escolha/crie um projeto.
  4. O `.env.local` será atualizado com a URL do deployment na nuvem.
  5. Rode `npx @convex-dev/auth --skip-git-check` para configurar as chaves de autenticação no novo deployment.

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

### Estoque

- **Chegou mercadoria:** escolha um produto existente ou crie um novo, informe a quantidade, o valor total da caixa e o preço de venda. O custo por unidade é calculado automaticamente e pode ser corrigido. Se o preço de venda ficar abaixo do custo, o app pede confirmação.
- **Estoque:** busque pelo nome, veja quantidade e preço e toque no produto para editar o preço, ajustar o estoque (sempre com motivo) e ver o histórico de entradas, saídas, cancelamentos e ajustes.
- O aviso **Estoque baixo** aparece quando a quantidade chega ao limite do produto (padrão: 5, editável no detalhe). O Início mostra quantos produtos precisam de reposição.
- Quantidades aceitam casas decimais apenas para produtos vendidos por quilo (kg).

### Vendas

- **Nova venda:** o fluxo tem 4 passos. No primeiro, informe o nome do cliente (obrigatório) e, se quiser, o telefone. Se o cliente já comprou antes, toque na sugestão para reaproveitar o cadastro.
- **Produtos:** busque pelo nome, toque em **Adicionar** e confira a quantidade com os botões grandes **−** e **+**. Em produtos por quilo, cada toque soma ou diminui 0,5 kg; use **Corrigir** para digitar a quantidade exata. **Alterar preço** vale só para aquela venda e mostra o desconto ou aumento antes de confirmar.
- **Resumo e pagamento:** confira os itens e o total. Escolha **Dinheiro**, **Cartão**, **Pix** ou **Fiado**. No dinheiro, o campo **Valor recebido** é opcional e mostra o troco. No fiado, o formulário pede telefone, endereço e a data combinada (veja a seção **Fiado**).
- **Estoque:** ao concluir, a venda, os itens, a baixa do estoque e o número sequencial são gravados na mesma transação. Se faltar estoque, nada é gravado e o app avisa quanto existe.
- **Nota:** mostra os dados da loja, número, data, cliente, itens, total, pagamento e, no fiado, a data combinada para pagamento, além do rodapé "Comprovante simples, não substitui documento fiscal." É possível enviar por WhatsApp ou SMS, imprimir e salvar/compartilhar em PDF. Na web, a impressão abre a janela do navegador; no celular, há botões separados para imprimir e para compartilhar o PDF.
- **Cancelamento:** abra a nota em **Vendas recentes** e toque em **Cancelar venda**. A venda fica marcada como cancelada e os produtos voltam ao estoque; a venda não é apagada. Em venda fiado sem pagamento, o fiado também é apagado; depois do primeiro pagamento, o cancelamento é bloqueado.
- **Início:** o cartão **Vendas de hoje** mostra o total do dia e abre a lista de vendas recentes. Vendas canceladas não entram no total. O cartão **Fiados para cobrar** mostra clientes, total em aberto e vencimentos próximos, e abre **Quem deve**.

### Fiado

- Na venda, escolha **Fiado**. Confira o nome, digite telefone e endereço, escolha a data combinada (**Em 7**, **Em 15** ou **Em 30 dias**, padrão 7) e, se quiser, uma observação. Telefone, endereço e data são obrigatórios.
- O fiado entra em **Quem deve**, no Início, com o total em aberto e uma etiqueta de vencimento em texto: "Em dia", "Vence hoje", "Vence em 3 dias" ou "Atrasado há 2 dias".
- Toque no cliente para ver o saldo total, as compras em aberto e o histórico. **Registrar pagamento** aceita o valor todo ou uma parte em dinheiro, cartão ou Pix; **Usar o saldo todo** preenche o valor restante. O saldo cai na hora e o fiado fica quitado quando chega a zero.
- O app bloqueia pagamento maior que o saldo, zero ou negativo.
- **Ligar** abre o telefone e **Cobrar no WhatsApp** abre uma mensagem educada pronta com o saldo e o vencimento.
- A nota da venda fiado mostra a data combinada. O cancelamento da venda só é permitido enquanto nenhum pagamento foi registrado; depois disso, o botão de cancelar não aparece e o servidor também bloqueia a ação.
- Avisos automáticos de vencimento (push) são configurados em **Configurações**; veja a seção abaixo.

### Configurações, avisos e tutorial

- **Configurações** fica em **Sua conta**, no Início. Lá você liga/desliga os avisos, escolhe a antecedência (1, 2, 3, 5 ou 7 dias) e o horário (6h, 8h, 10h, 12h ou 18h), ativa o aparelho e revê o tutorial.
- **Padrões:** avisos ligados, 3 dias de antecedência, 8h e fuso de Brasília (`-180`). O fuso real do aparelho é enviado ao registrar o token e atualizado quando o app registra o aparelho novamente.
- **Como funciona:** um cron do Convex roda de hora em hora, atualiza os fiados vencidos e verifica se é a hora local escolhida pela loja. Quando é, monta um aviso por cliente e envia pelo Expo Push Service. O aviso cobre o prazo configurado (3 dias por padrão), 1 dia antes, o dia do vencimento e todos os dias de atraso. O campo `lastReminderAt` impede repetir o mesmo fiado no mesmo dia local.
- **Ao tocar na notificação**, o app abre o detalhe do cliente em **Quem deve**, onde você pode ver as compras, registrar pagamento ou cobrar.
- **Tutorial:** na primeira visita ao Início, Chegou mercadoria, Estoque, Vender e Fiado, aparece um guia de 4 cartões. Você pode pular a qualquer momento ou tocar em **Rever tutorial** nas Configurações. O tutorial fica salvo por aparelho.
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

O lint está configurado com ESLint 9 + `eslint-config-expo` e passa sem avisos. O **Vitest** roda 4 arquivos e **29 testes** cobrindo moeda, saldo de fiado, vendas/baixa de estoque, lembretes, horário e configurações; os testes do Convex usam `convex-test` em edge-runtime. As Fases 3 e 4 também foram validadas por testes e2e temporários do backend com `ConvexHttpClient` (62 e 66 verificações), removidos depois da execução.

O `expo-doctor` passa nos **21/21 checks**. Os bundles web e Android e o deploy local do Convex foram verificados; o push remoto real, o toque na notificação e a voz ainda dependem de um development build em aparelho físico. O `.gitignore` mantém `.expo/`, `.env*.local`, `node_modules/`, `dist/`, `.convex/` e `coverage/` fora do repositório.

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
│   ├── sales.ts         # criação transacional, nota, lista e cancelamento
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
│   │   └── (app)/       # Início, configurações, mercadoria, estoque, venda, nota, vendas, fiado e Meu cadastro
│   ├── components/      # componentes acessíveis, tutorial, leitura em voz alta, recibo e diálogos
│   ├── lib/             # moeda, quantidade, validações, datas, erros, ajuda, nota, fiado, push e tutorial
│   ├── theme.ts         # cores, fontes e espaçamentos acessíveis
│   └── assets/          # imagens
├── app.json             # configuração do Expo
├── eas.json             # perfis de development/preview/production
├── vitest.config.mts    # projetos unit e convex do Vitest
├── SPEC.md              # especificação do produto
└── CLAUDE.md            # instruções para agentes
```

## Próximos passos

A Fase 5 está concluída no código. O próximo passo é **validar o push remoto em um development build** (projeto EAS, credenciais FCM/APNs e aparelho físico) e revisar a experiência de permissão/tutorial com pessoas de 50+. Depois, concluir a **Fase 6**: teste com pessoas reais de 50+ anos e build final com EAS Build. Os testes unitários da Fase 6 já estão no repositório. A barra inferior de 4 abas continua pendente.
