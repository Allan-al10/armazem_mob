# Meu Armazém

App de controle de estoque, vendas e fiado para pequenos comerciantes, com interface pensada para pessoas de 50+ anos.

> **Status:** Fases 0, 1, 2, 3 e 4 concluídas (base acessível, autenticação/cadastro, estoque, vendas e fiado). A próxima é a Fase 5 (avisos push, cron de vencimentos, tutorial e voz).

## Controle de versão

O projeto está em um repositório **Git local**, na branch `main`, com o commit inicial das Fases 0–4. Dependências, builds, estado local do Expo/Convex e `.env.local` ficam fora do versionamento.

Ainda não há `remote` configurado. Para publicar com o nome **`armazem_mob`**, crie um repositório vazio no seu provedor e rode:

```bash
git remote add origin <url-do-repositorio>
git push -u origin main
```

## Requisitos

- Node.js 24+ (testado com 24.21.0)
- npm 11+
- [Expo Go](https://expo.dev/go) no celular ou um emulador Android/iOS
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

Esse comando sobe o backend local em `http://127.0.0.1:3210`, gera os tipos em `convex/_generated/` e observa mudanças nos arquivos.

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

## App

Com o `convex dev` rodando, em outro terminal:

```bash
npm start
```

Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `a`/`i` para abrir no emulador. Para abrir no navegador: `npm run web`.

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
- Avisos automáticos de vencimento (push) ainda não existem; eles entram na Fase 5.

> A impressão, a folha de compartilhamento do PDF, os links de WhatsApp/SMS, o diálogo de pagamento do fiado e os links de ligação/cobrança foram verificados no bundle, mas ainda precisam de um teste em aparelho físico.

## Scripts

| Script | O que faz |
|---|---|
| `npm start` | Inicia o Expo |
| `npm run android` | Abre no emulador/dispositivo Android |
| `npm run ios` | Abre no simulador iOS (macOS) |
| `npm run web` | Abre a versão web |
| `npm run typecheck` | Roda `tsc --noEmit` |
| `npm run lint` | Roda o ESLint (`expo lint`) |
| `npm run convex:dev` | Sobe o backend Convex local |

## Verificações

```bash
npm run typecheck     # typecheck
npm run lint          # ESLint
npx expo-doctor       # diagnostica dependências e configuração
npx convex run health:ping
```

Para validar os bundles sem servidor:

```bash
npx expo export --platform web
npx expo export --platform android
```

O lint está configurado com ESLint 9 + `eslint-config-expo` e passa sem avisos. Ainda não há testes unitários (Jest); as Fases 3 e 4 foram validadas por testes e2e temporários do backend com `ConvexHttpClient` (62 e 66 verificações), removidos depois da execução.

O `expo-doctor` passa nos **21/21 checks**. O `.gitignore` mantém `.expo/`, `.env*.local`, `node_modules/`, `dist/` e `.convex/` fora do repositório.

## Estrutura

```
.
├── convex/              # backend Convex
│   ├── auth.ts          # Convex Auth + provider de senha
│   ├── schema.ts        # authTables + users + stores + products + stockEntries + stockMovements + customers + sales + saleItems + credits + creditPayments
│   ├── products.ts      # list, get e update de produtos
│   ├── stock.ts         # entrada, ajuste, baixa de venda e histórico de estoque
│   ├── customers.ts     # listagem de clientes para sugestões
│   ├── sales.ts         # criação transacional, nota, lista e cancelamento
│   ├── credits.ts       # Quem deve, detalhe do cliente e pagamentos do fiado
│   ├── dashboard.ts     # resumo de vendas do dia e estoque baixo
│   ├── lib.ts           # requireStore (usuário logado + loja)
│   ├── stores.ts        # getMine, create, update e contador de venda
│   └── users.ts         # current
├── src/
│   ├── app/             # rotas do Expo Router
│   │   ├── (auth)/      # login e cadastro
│   │   ├── (setup)/     # cadastro do estabelecimento
│   │   └── (app)/       # Início, mercadoria, estoque, venda, nota, vendas, fiado e Meu cadastro
│   ├── components/      # componentes acessíveis, recibo e diálogos da venda/fiado
│   ├── lib/             # moeda, quantidade, validações, datas, erros, ajuda, nota e fiado
│   ├── theme.ts         # cores, fontes e espaçamentos acessíveis
│   └── assets/          # imagens
├── app.json             # configuração do Expo
├── SPEC.md              # especificação do produto
└── CLAUDE.md            # instruções para agentes
```

## Próximos passos

Seguir o checklist da Seção 9 do `SPEC.md`, uma fase por vez. A próxima é a **Fase 5 (Avisos e ajuda)**: push/cron de vencimentos, tutorial inicial e leitura em voz alta. A barra inferior de 4 abas e a Fase 6 (testes unitários, teste com pessoas 50+ e build final) seguem pendentes.
