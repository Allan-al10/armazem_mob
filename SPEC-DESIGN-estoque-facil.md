# Estoque Fácil — Especificação de Design

Documento de referência para montar (ou reconstruir) todo o design do aplicativo **Estoque Fácil**, a partir do projeto já criado (`estoque-facil.jsx` e `logo-estoque-facil.svg`).

---

## 1. Visão geral

**O que é:** aplicativo mobile de armazém/estoque para pequenos comerciantes, pensado para pessoas **acima de 50 anos**.

**O que o app faz:**
- Cadastro do usuário e do estabelecimento (aparece nas notas)
- Controle de produtos e estoque (com aviso de estoque baixo)
- **Caixa:** registro de chegada de produtos (quantidade, valor da caixa, custo unitário, preço de venda)
- **Nota de Venda:** vendas com baixa no estoque, forma de pagamento, fiado e envio por WhatsApp/SMS
- **Registro de Vendas:** vendas separadas por mês, com itens vendidos, total, custo e lucro
- **Configurações:** tema claro/escuro, tamanho das letras e símbolos, edição do acesso rápido

**Plataforma:** protótipo em React, com largura de celular (máx. 420 px).

---

## 2. Princípios de design

Estes princípios têm prioridade sobre qualquer decisão estética.

| # | Princípio | Como se aplica |
|---|-----------|----------------|
| 1 | **Alvo de toque grande** | Todo botão tem no mínimo 56 px de altura (64–68 px nos botões principais) |
| 2 | **Nunca só ícone** | Todo ícone vem acompanhado de texto (menu inferior, botões, atalhos) |
| 3 | **Ajuda em todo lugar** | Toda tela tem botão **?** no cabeçalho que abre uma explicação em linguagem simples |
| 4 | **Alto contraste** | Bordas de 2 px bem visíveis em vez de sombras sutis; cores fortes |
| 5 | **Uma coisa por vez** | Coluna única, um objetivo por tela, fluxos numerados (1, 2, 3) quando há passos |
| 6 | **Confirmar o que é destrutivo** | Excluir produto pede confirmação com texto claro |
| 7 | **Feedback visível** | Após salvar, aparece faixa verde com ícone ✓ e frase ("Estoque atualizado!") |
| 8 | **Legibilidade ajustável** | O usuário escolhe o tamanho das letras e símbolos e o tema claro/escuro |
| 9 | **Cor nunca é a única pista** | Alertas combinam cor + ícone + texto (ex.: etiqueta "Baixo" com triângulo) |
| 10 | **Português simples** | Frases curtas, verbos diretos ("Confirmar Entrada", "Marcar como pago") |

---

## 3. Identidade visual

### 3.1 Logo

Três contêineres vistos na **diagonal (projeção isométrica)**, empilhados em **pirâmide**: 2 na base e 1 no topo, todos virados na mesma direção. Um dos contêineres da base está com a **porta aberta**.

**Composição**

| Posição | Cor | Observação |
|---------|-----|------------|
| Base, frente | Azul | Faces fechadas, com nervuras |
| Base, fundo | Laranja | **Porta aberta**: interior escuro com duas caixas de carga (amarela e laranja) e a porta girada para fora, à esquerda |
| Topo | Vermelho | Apoiado sobre os dois da base |

**Cores das faces de cada contêiner** (face longa / face da porta / teto / nervuras)

| Contêiner | Face longa | Face da porta | Teto | Nervuras |
|-----------|-----------|---------------|------|----------|
| Azul | `#1B5FA6` | `#134A82` | `#4C93DB` | `#3E83CC` |
| Laranja | `#F28C28` | `#C9610A` | `#FFB566` | `#DB7418` |
| Vermelho | `#D63A2F` | `#A82A21` | `#EE6A5F` | `#B8302A` |

**Detalhes**
- Barras de trava da porta: amarelo `#F2B705`, traço de 2,2
- Interior do contêiner aberto: `#0B2A4A` (fundo) e `#14416E` (parede de trás)
- Porta aberta (aba): laranja `#F5A04A`, nervuras `#C9610A`
- Linha branca de 1 px separando as faces (`stroke-linejoin: round`)
- Fundo: quadrado branco `#FFFFFF`, canto arredondado `rx = 28`, viewBox `0 0 120 120`

**Geometria isométrica** (para regerar o logo)
- Eixo longo (t) → direita/cima: `(0,866 ; −0,5)`
- Eixo curto (u) → esquerda/cima: `(−0,866 ; −0,5)`
- Altura (h) → vertical
- Dimensões do contêiner: comprimento **38**, largura **18**, altura **17**
- Posição na pirâmide (t, u, nível): fundo `(0, 1, 0)`, frente `(0, 0, 0)`, topo `(0, 0,5, 1)`
- Ordem de desenho (pintor): fundo → frente → topo
- Enquadramento automático: o desenho é escalado e centralizado com **margem de 15** no quadrado de 120

**Onde aparece**
- Tela de cadastro: 96 px, com o texto "Estoque Fácil" abaixo (22 px, negrito, cor `primaryInk`)
- Cabeçalho das telas principais (sem botão voltar): 40 px
- Arquivo avulso: `logo-estoque-facil.svg` (512 × 512)

### 3.2 Paleta de cores

A paleta nasce da logo: **azul** (principal), **laranja** (destaque), **amarelo** (avisos e apoio), **vermelho** (alertas). O verde existe só para confirmações, porque é a cor que as pessoas associam a "deu certo".

| Token | Tema claro | Tema escuro | Uso |
|-------|-----------|-------------|-----|
| `bg` | `#F4F6F9` | `#0F1419` | Fundo das telas |
| `card` | `#FFFFFF` | `#1A212A` | Cartões, campos, menu inferior |
| `primary` | `#1B5FA6` | `#2F6FB8` | **Fundos** de botões principais (texto branco por cima) |
| `primaryInk` | `#1B5FA6` | `#7DB7F0` | Texto, ícones e bordas azuis sobre cartões |
| `header` | `#154A82` | `#13263D` | Fundo do cabeçalho das telas |
| `accent` | `#D9650A` | `#E0701A` | Laranja: Caixa, custo, botão Pix |
| `yellow` | `#F2B705` | `#F2B705` | Atalho da Nota (ícone escuro por cima) |
| `success` | `#2E7D4F` | `#3A9D66` | Confirmações, lucro, "pago" |
| `successBg` | `#E3F2E8` | `#17301F` | Fundo de faixas de sucesso |
| `danger` | `#C62F26` | `#E5594F` | Estoque baixo, fiado, excluir, vencido |
| `dangerBg` | `#FBE6E4` | `#3A1B19` | Fundo de alertas vermelhos |
| `warn` | `#F2B705` | `#F2B705` | Borda de avisos (fiado vencendo) |
| `warnBg` | `#FFF3CC` | `#3A3112` | Fundo de avisos amarelos |
| `warnInk` | `#7A5200` | `#F5C84B` | Texto sobre fundo de aviso |
| `text` | `#1D2733` | `#EEF1F4` | Texto principal |
| `textMuted` | `#566170` | `#9AA6B4` | Texto secundário, rótulos |
| `border` | `#D5DBE3` | `#2C3641` | Bordas de cartões e campos |

**Regras de uso**
- Fundo com texto branco → usar `primary`, `accent`, `success`, `danger` ou `header`.
- Texto/ícone azul sobre cartão → usar **`primaryInk`** (no escuro fica mais claro para manter o contraste).
- Amarelo nunca leva texto branco: o ícone por cima é `#1D2733`.
- Cor exclusiva de marca (não muda com o tema): verde do WhatsApp `#25925A`.

### 3.3 Tipografia

- **Fonte única:** *Atkinson Hyperlegible* (pesos 400 e 700), criada para máxima legibilidade. Importada do Google Fonts; alternativa: `system-ui, sans-serif`.
- A hierarquia é feita **só por peso e tamanho**, sem segunda fonte.

| Papel | Tamanho base | Peso |
|-------|-------------|------|
| Título do cabeçalho | 22 | 700 |
| Título do cadastro ("Bem-vindo!") | 24 | 700 |
| Número grande (valor do mês, quantidade) | 30–38 | 700 |
| Nome do produto / cliente / botão grande | 17–18 | 700 |
| Texto de ajuda (modal) | 18 (entrelinha 1,55) | 400 |
| Campo de formulário | 17 | 400 |
| Texto secundário | 14–15 | 400 |
| Rótulo de seção (CAIXA ALTA) | 15 | 700, cor `textMuted` |
| Rótulo do menu inferior | 13 | 400 (700 quando ativo) |

### 3.4 Escala de letras e símbolos (acessibilidade)

Opção nas Configurações, aplicada a **todo** o app:

| Opção | Fator |
|-------|-------|
| Normal | 1,00 |
| Grande | 1,15 |
| Muito grande | 1,30 |

- Letras: `fs(n) = arredondar(n × fator)`
- Ícones: `is(n) = arredondar(n × (1 + (fator − 1) × 1,3))` — os símbolos crescem um pouco mais que as letras.
- **Regra de implementação:** todo `fontSize` e todo `size` de ícone deve passar por `fs()` / `is()`.

### 3.5 Forma e espaçamento

| Elemento | Valor |
|----------|-------|
| Largura do app | máx. 420 px, centralizado, canto arredondado 20, borda de 1 px |
| Padding de tela | 20 px |
| Cartão | borda 2 px, raio 16, padding 16 |
| Botão principal | altura mín. 60, raio 16, texto 18 negrito |
| Botão secundário | altura mín. 52–56, raio 14, texto 16 negrito |
| Campo de formulário | altura mín. 56, raio 14, borda 2 px, texto 17, margem inferior 20 |
| Espaço entre cartões | 12 px |
| Espaço entre seções | 24 px |

---

## 4. Componentes

### 4.1 Cabeçalho de tela (`ScreenHeader`)
- Fundo `header`, padding `18 × 16`, itens alinhados com espaço de 12.
- **Esquerda:** botão voltar (círculo de 40 px, fundo branco 15% transparente, seta branca) **ou**, na tela inicial, o logo de 40 px.
- **Centro:** título (22 px, branco, negrito).
- **Direita (opcional):** botão de ação (ex.: engrenagem) e botão **?** de ajuda, ambos círculos de 40 px.

### 4.2 Menu inferior (`BottomNav`)
- 4 itens: **Início · Produtos · Caixa · Nota**
- Borda superior de 2 px, altura mín. 64 por item.
- Ícone 24 px + rótulo 13 px. Ativo: cor `primaryInk`, ícone mais grosso e rótulo em negrito.

### 4.3 Janela de ajuda (`HelpModal`)
- Folha que sobe da parte de baixo, sobre fundo escurecido (`rgba(36,41,43,0.55)`); tocar fora fecha.
- Canto superior arredondado 24, borda de topo 3 px na cor `primary`.
- Cabeçalho: círculo azul com **?** + título (20 px) + botão **X**.
- Texto 18 px, aceita quebras de linha e marcadores "•".
- Botão **"Entendi"** em largura total, altura 56.

### 4.4 Botão de atalho grande (`BigActionButton`)
- Largura total, altura mín. 68, cartão com borda 2 px.
- Quadrado de ícone 44 px (raio 12) com a cor do atalho + título 17 negrito + subtítulo 13 + seta `>` à direita.

### 4.5 Seletores de opção (`TypeButton`)
- Botões lado a lado (altura mín. 64), com ícone opcional acima do texto.
- Inativo: fundo `card`, borda `border`. **Ativo:** fundo e borda na cor da opção, texto branco.
- Usado em: Tema, Tamanho do texto, Entrada/Saída, Forma de pagamento, Produto existente/novo, abas do Registro de Vendas.

### 4.6 Contador (`StepperButton`)
- Círculo de 56 px com ícone **+** ou **−** (26 px, traço grosso), cor semântica (verde aumenta, vermelho diminui).
- O número fica entre os dois botões (34–38 px, negrito).

### 4.7 Cartão de produto (`ProductCard`)
- Quadrado de ícone 52 px, nome (17 negrito), quantidade em estoque (15), preço de venda (14).
- **Estoque baixo** (quantidade ≤ mínimo): borda vermelha + etiqueta "⚠ Baixo".

### 4.8 Campo de formulário
- Rótulo acima (15, negrito, `textMuted`), campo de 56 px.
- Campos numéricos usam teclado numérico (`inputMode`); telefone usa teclado de telefone; data usa seletor nativo.
- No tema escuro, `colorScheme: dark` para o seletor de data/lista.

### 4.9 Faixas de feedback
- **Sucesso:** fundo `successBg`, borda `success`, ícone ✓ + frase; some após ~1,8 s.
- **Alerta de estoque baixo:** fundo `dangerBg`, borda `danger`, triângulo de aviso.
- **Fiado vencendo:** fundo `warnBg`, borda `warn`, relógio.

### 4.10 Cartão de resumo (`StatCard`)
- Rótulo pequeno em caixa alta (13) + valor grande (21) na cor semântica. Dois por linha.

---

## 5. Navegação e mapa de telas

```
Cadastro (1º acesso)
   └─> Início ─┬─ Configurações ─┬─ Editar dados do estabelecimento
               │                 └─ Editar acesso rápido
               ├─ Produtos ──> Detalhe do produto
               ├─ Caixa (chegada de produtos)
               ├─ Nota de Venda ──> Nota gerada (WhatsApp / SMS)
               ├─ Registro de Vendas (Por mês | Resumo geral)
               └─ Contas de Fiado
```

- **Menu inferior fixo:** Início, Produtos, Caixa, Nota.
- Telas fora do menu (Fiados, Vendas, Configurações, Meus dados) abrem pelo **Acesso Rápido**, pelos cartões da tela inicial ou pelas Configurações e sempre têm botão **voltar**.

---

## 6. Telas

### 6.1 Cadastro (primeiro acesso)
- Sem cabeçalho nem menu. Logo 96 px, "Estoque Fácil", "Bem-vindo!" e uma frase explicando que os dados aparecerão nas notas.
- **Campos:** Seu nome\* · Nome do estabelecimento\* · CNPJ · Telefone · Endereço
- Botão **"Começar a Usar"** só fica ativo com os campos obrigatórios (\*) preenchidos.
- A mesma tela, em modo edição, serve para "Meus Dados" (botão **"Salvar Alterações"**).

### 6.2 Início
Ordem dos blocos:
1. Cabeçalho com o **nome do estabelecimento** + engrenagem + ?
2. Dois cartões: **produtos cadastrados** e **itens no total**
3. **Resumo de vendas do mês atual** (cartão clicável → Registro de Vendas)
   - Título "VENDAS DE {MÊS}", total em 30 px, variação ▲/▼ em % sobre o mês anterior
   - Três mini-cartões: Custo · Lucro · Vendas
4. Alerta vermelho de **estoque baixo** (se houver)
5. Alerta de **fiado a receber** (amarelo se algum vence em até 3 dias; clicável → Fiados)
6. **ACESSO RÁPIDO** + botão "Editar" + botões grandes configuráveis

### 6.3 Produtos e detalhe
- **Lista:** busca em campo grande + cartões de produto. Vazio: "Nenhum produto encontrado."
- **Detalhe:** ícone grande, nome, aviso de estoque baixo, cartões **Preço de compra** e **Preço de venda** (verde), contador de quantidade (+/−) e botão vermelho **Excluir** com confirmação ("Tem certeza que deseja excluir…?" → Cancelar / Excluir).

### 6.4 Caixa — chegada de produtos
- Alternador **Produto existente | Produto novo**.
- Existente: lista de produtos. Novo: nome, unidade (un, cx, rl, kg, lt) e estoque mínimo.
- **Campos:** Quantidade recebida · Valor total da caixa (R$) · Valor unitário de compra (R$) · Valor de venda por unidade (R$)
- Se só o total for informado, o unitário é **sugerido** (total ÷ quantidade) no rótulo e no campo.
- Botão laranja **"Confirmar Entrada"**: soma ao estoque e atualiza custo e preço de venda.

### 6.5 Nota de Venda
1. **Adicionar produtos:** lista (só com estoque > 0), quantidade e preço unitário (já vem preenchido, editável) → botão "Adicionar à venda".
2. **Itens da venda:** cada linha com `qtd × preço = subtotal` e botão **X** para remover; **Total** em destaque.
3. **Nome do cliente** (opcional).
4. **Forma de pagamento:** Cartão · Dinheiro · Pix · Fiado (4 botões com ícone).
5. **Se Fiado:** bloco vermelho com nome do cliente\*, telefone, endereço e **data combinada de pagamento**\*.
6. Botão verde **"Finalizar Venda"** (exige itens; no fiado, exige nome e data).

**Ao finalizar:** o estoque é baixado, a venda é registrada (com o **custo** de cada item) e abre a **Nota Gerada**.

### 6.6 Nota gerada
- Faixa de sucesso "Venda registrada e estoque atualizado!"
- Cartão com a nota em texto:

```
NOME DO ESTABELECIMENTO
CNPJ: 00.000.000/0000-00
Nome do proprietário - telefone
Endereço
------------------------------
NOTA DE VENDA
Data: dd/mm/aaaa
Cliente: ...
------------------------------
Produto
  qtd un x R$ preço = R$ subtotal
------------------------------
TOTAL: R$ ...
Pagamento: ...
Vencimento combinado: dd/mm/aaaa   (somente fiado)
```

- Botões: **Enviar por WhatsApp** (verde da marca) · **Enviar por SMS** (contorno azul) · **Nova Venda** · **Voltar ao Início**.
- O telefone do cliente é preenchido automaticamente quando a venda é fiado.

### 6.7 Contas de Fiado
- Lista ordenada pelo vencimento mais próximo; cada cartão mostra cliente, telefone, valor, data e botão **"Marcar como pago"**.
- Estados: **normal** (borda neutra) · **vencendo** (0–3 dias, amarelo) · **vencido** (vermelho, "Venceu em …").
- Vazio: "Nenhuma conta de fiado pendente."

### 6.8 Registro de Vendas
- Abas: **Por mês** | **Resumo geral**.
- **Por mês:** setas ← → trocam de mês (mais recente primeiro) e mostram "Mês de Ano". Em seguida:
  - 4 cartões: **Total vendido · Custo · Lucro · Nº de vendas**
  - Faixa "A receber (fiado)" quando houver valor pendente
  - **ITENS VENDIDOS NO MÊS** (produto, quantidade, valor) em ordem do maior valor
  - **VENDAS DO MÊS:** cada venda com cliente, data, itens, total, custo, lucro e etiqueta de pagamento (*Fiado — a receber*, *Fiado — pago* ou a forma usada)
- **Resumo geral:** totais de todas as vendas + uma linha por mês com **barra proporcional** ao maior mês, custo e lucro; tocar abre aquele mês.
- Vazio: "Nenhuma venda registrada ainda…"

### 6.9 Configurações
1. **TEMA:** Claro | Escuro (ícones sol e lua)
2. **TAMANHO DAS LETRAS E SÍMBOLOS:** Normal | Grande | Muito grande + linha de exemplo
3. **ACESSO RÁPIDO NA TELA INICIAL:** lista dos atalhos ativos, cada um com **↑ ↓** (ordem) e **X** (remover); abaixo, "DISPONÍVEIS PARA ADICIONAR" com botão **+ Adicionar** (borda tracejada)
4. **CONTA:** "Editar dados do estabelecimento"

---

## 7. Acesso rápido — catálogo de atalhos

| Chave | Rótulo | Subtítulo | Destino | Cor do ícone |
|-------|--------|-----------|---------|--------------|
| `products` | Ver produtos | Consultar estoque | Produtos | `primary` |
| `caixa` | Registrar Caixa | Chegada de produtos | Caixa | `accent` |
| `nota` | Fazer Nota de Venda | Venda para cliente | Nota | `yellow` (ícone escuro) |
| `vendas` | Registro de Vendas | Vendas por mês, custo e lucro | Vendas | `success` |
| `fiados` | Contas de Fiado | Quem ainda vai pagar | Fiados | `danger` |
| `profile` | Meus dados | Dados do estabelecimento | Cadastro (edição) | `header` |

**Padrão inicial:** Ver produtos, Registrar Caixa, Fazer Nota de Venda, Registro de Vendas.

---

## 8. Regras de negócio que afetam o design

- **Estoque baixo:** `quantidade ≤ estoque mínimo` → borda vermelha, etiqueta "Baixo" e alerta na tela inicial.
- **Fiado vencendo:** faltam ≤ 3 dias → aviso amarelo; data passada → vermelho "Venceu em…".
- **Venda fiado** entra no total vendido; o valor não pago aparece como **"A receber"**.
- **Lucro** = total vendido − custo; o custo de cada item é **gravado no momento da venda** (`custo unitário × quantidade`).
- **Estoque mínimo padrão** de produto novo: 5.
- **Dinheiro:** `R$ 1.234,56` (vírgula decimal), datas `dd/mm/aaaa`.

### Modelos de dados

```js
Produto = { id, name, qty, min, unit, costPrice, salePrice }

Venda = {
  id, date: "AAAA-MM-DD", client,
  items: [{ productId, name, unit, qty, price, cost }],
  total,
  payment: {
    method: "cartao" | "dinheiro" | "pix" | "fiado",
    fiado: { clientName, phone, address, dueDate, paid } | null
  }
}

Estabelecimento = { ownerName, establishmentName, cnpj, phone, address }

Configurações = {
  theme: "light" | "dark",
  scale: 1 | 1.15 | 1.3,
  quickAccess: ["products", "caixa", "nota", "vendas"]   // ordem = ordem na tela
}
```

---

## 9. Textos de ajuda (botão ?)

Cada tela tem um texto em linguagem simples. Resumo do conteúdo esperado:

| Tela | Deve explicar |
|------|---------------|
| Início | O que é o resumo, o quadro de vendas do mês, os alertas e como editar o acesso rápido |
| Produtos | Busca, borda vermelha/"Baixo" e que a reposição é feita na tela Caixa |
| Detalhe | Preços de compra/venda, ajuste de quantidade e exclusão |
| Caixa | Escolher produto, informar quantidade, valor total e unitário, preço de venda |
| Nota de Venda | Montar a venda, escolher pagamento, preencher o fiado e enviar a nota |
| Registro de Vendas | O que são custo e lucro, trocar de mês, resumo geral e "A receber" |
| Contas de Fiado | Significado das bordas amarela/vermelha e "Marcar como pago" |
| Configurações | Tema, tamanho das letras e edição do acesso rápido |

**Formato:** título curto + 1 a 3 parágrafos curtos, usando "•" para listas. Sempre terminar com o botão "Entendi".

---

## 10. Acessibilidade — checklist

- [ ] Toda área tocável tem ≥ 56 px de altura
- [ ] Todo ícone tem texto junto (ou `aria-label` quando for botão circular)
- [ ] Botões circulares têm `aria-label` ("Voltar", "Ajuda desta tela", "Fechar ajuda"…)
- [ ] Texto com contraste suficiente nos dois temas (usar `primaryInk` no escuro)
- [ ] Estados de alerta usam cor **e** ícone **e** texto
- [ ] Todos os tamanhos passam por `fs()` / `is()` e a tela continua utilizável em "Muito grande"
- [ ] Campos com teclado adequado (numérico, telefone, data)
- [ ] Ações destrutivas pedem confirmação
- [ ] Mensagens de sucesso aparecem após salvar

---

## 11. Como montar o projeto (ordem sugerida)

1. **Tokens:** definir `THEMES` (claro/escuro), `C`, `SCALE`, `fs()`, `is()` e `applyTheme()`; importar a fonte.
2. **Logo:** componente `Logo` (SVG) e arquivo `logo-estoque-facil.svg`.
3. **Componentes base:** `ScreenHeader`, `BottomNav`, `HelpModal`, `BigActionButton`, `TypeButton`, `StepperButton`, `StatCard`, campo + rótulo.
4. **Dados de exemplo:** produtos e vendas iniciais.
5. **Cadastro** (porta de entrada do app).
6. **Início**, **Produtos**, **Detalhe**.
7. **Caixa** e **Nota de Venda** (+ nota gerada com WhatsApp/SMS).
8. **Contas de Fiado** e **Registro de Vendas**.
9. **Configurações** (tema, escala, acesso rápido).
10. **App principal:** estados (`user`, `products`, `sales`, `view`, `settings`), `applyTheme()` a cada renderização, roteamento por `view` e funções de negócio (`receiveStock`, `registerSale`, `markPaid`…).
11. **Revisão:** percorrer o checklist de acessibilidade nos dois temas e nos três tamanhos de letra.

**Arquivos do projeto**

| Arquivo | Conteúdo |
|---------|----------|
| `estoque-facil.jsx` | Aplicativo completo (React) |
| `logo-estoque-facil.svg` | Logo em SVG |
| `SPEC-DESIGN-estoque-facil.md` | Este documento |

---

## 12. Limitações atuais e próximos passos

- **Sem persistência:** dados, vendas e configurações ficam apenas na memória enquanto o app está aberto.
- **Sem login com senha:** o cadastro guarda só os dados do estabelecimento.
- **Aviso de fiado só dentro do app:** não há notificação do celular quando a data se aproxima.
- **Nota enviada como texto:** WhatsApp e SMS recebem a nota em texto simples (não PDF/imagem).

**Ideias futuras:** salvar os dados no aparelho, notificações de vencimento, exportar relatório mensal em PDF, código de barras, foto do produto, fonte ainda maior para uso com leitor de tela.
