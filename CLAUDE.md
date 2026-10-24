# Meu Armazém: instruções para o agente

- Leia o `SPEC.md` antes de qualquer tarefa. Ele é a fonte da verdade do produto.
- O projeto já existe e é **flat** (não é monorepo): rotas em `src/app/`, componentes em `src/components/`, utilitários em `src/lib/`, tema em `src/theme.ts` e backend em `convex/`. Não recrie estrutura nem sobrescreva arquivos sem ler antes.
- Público final tem 50+ anos: fonte >= 18sp, botões >= 56dp, alto contraste, uma tarefa por tela, botão "?" em toda tela.
- Textos da interface em português do Brasil, linguagem simples.
- Dinheiro sempre em centavos (inteiros). Nunca usar float para valores.
- Toda função do Convex deve checar o usuário logado com `getAuthUserId` e, quando houver dados da loja, se o `storeId`/dono pertence a ele.
- Venda + itens + baixa de estoque na MESMA mutation (transação).
- Trabalhe uma fase do checklist (Seção 9 do `SPEC.md`) por vez e marque o que concluir.
- Após cada etapa: rodar `npm run typecheck`, `npm run lint`, garantir que `npx convex dev` sobe sem erros e confirmar que o app abre. Não há testes unitários automatizados; testes e2e temporários devem ser removidos depois da execução.
- Gerenciador de pacotes: **npm**. Use `npx expo install` para dependências Expo/React Native.
- O backend local roda sem conta via `npx convex dev` (deployment `anonymous` em `.env.local`). Para usar a nuvem: `npx convex login`, reconfigurar com `npx convex dev --configure` e rodar `npx @convex-dev/auth --skip-git-check` para gerar as chaves JWT no novo deployment.
