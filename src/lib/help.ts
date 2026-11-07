export type HelpContent = {
    title: string;
    steps: string[];
};

export const helpTexts: Record<string, HelpContent> = {
    login: {
        title: "Como entrar no app",
        steps: [
            "Digite o e-mail que você usou no cadastro.",
            "Digite sua senha. Se quiser conferir, toque em Mostrar.",
            "Toque no botão grande Entrar.",
            "Se ainda não tem conta, toque em Criar minha conta.",
        ],
    },
    signup: {
        title: "Como criar sua conta",
        steps: [
            "Este é o passo 1 de 2. Agora são os seus dados.",
            "Digite seu nome completo e um telefone com DDD.",
            "Digite um e-mail que você usa sempre.",
            "Crie uma senha com pelo menos 8 caracteres e repita no campo de confirmação.",
            "No passo 2 você cadastra os dados do estabelecimento que aparecem na nota.",
        ],
    },
    store: {
        title: "Dados do estabelecimento",
        steps: [
            "Estes dados aparecem no cabeçalho da nota enviada ao cliente.",
            "O CNPJ tem 14 números. O app confere se ele é válido.",
            "Preencha o endereço completo: rua, número, bairro, cidade e UF.",
            "Você pode corrigir tudo depois em Meu cadastro.",
        ],
    },
    home: {
        title: "Tela de início",
        steps: [
            "Aqui você vê quantos produtos tem, o total de itens e o resumo das vendas do mês.",
            "O cartão Vendas de ... abre o Registro de Vendas, com custo, lucro e itens vendidos.",
            "Os avisos mostram estoque baixo e contas de fiado que precisam de atenção.",
            "O Acesso rápido leva às tarefas que você escolheu em Configurações.",
            "Use o menu de baixo para Início, Produtos, Caixa e Nota.",
            "O botão de engrenagem abre Configurações. O botão de interrogação abre esta ajuda.",
        ],
    },
    "meu-cadastro": {
        title: "Meu cadastro",
        steps: [
            "Aqui você confere os dados da sua conta.",
            "Pode corrigir o nome do estabelecimento, CNPJ, telefone e endereço.",
            "Toque em Salvar alterações quando terminar.",
            "Os dados novos passam a aparecer nas próximas notas.",
        ],
    },
    "chegou-mercadoria": {
        title: "Caixa — chegada de produtos",
        steps: [
            "Escolha Produto existente ou Produto novo. No novo, digite nome, unidade e estoque mínimo.",
            "Digite a quantidade recebida.",
            "Digite o valor total que você pagou pela caixa inteira.",
            "O valor unitário de compra é calculado sozinho: total dividido pela quantidade.",
            "Se precisar, você pode corrigir o valor unitário.",
            "Digite o preço que você vai cobrar do cliente por unidade.",
            "Confira a mensagem de lucro e toque em Confirmar Entrada.",
            "O estoque, o custo e o preço de venda são atualizados na hora.",
        ],
    },
    estoque: {
        title: "Produtos",
        steps: [
            "Aqui aparecem os produtos com a quantidade e o preço de venda.",
            "Digite o nome no campo de busca para encontrar um produto.",
            "A etiqueta Baixo aparece quando a quantidade chega ao limite.",
            "Toque em um produto para ver preços, estoque e histórico.",
            "Para registrar mercadoria que chegou, use a aba Caixa.",
        ],
    },
    produto: {
        title: "Detalhe do produto",
        steps: [
            "Aqui você vê a quantidade atual e o preço de venda.",
            "Pode corrigir o preço de venda e o aviso de estoque baixo.",
            "Ajustar estoque serve para perdas, quebras ou contagem.",
            "Todo ajuste precisa de um motivo e fica registrado no histórico.",
            "O histórico mostra as entradas, saídas de venda, cancelamentos e ajustes.",
            "Excluir produto pede confirmação e mantém o histórico de vendas guardado.",
        ],
    },
    vender: {
        title: "Como fazer uma nova venda",
        steps: [
            "Passo 1: escreva o nome do cliente. O telefone é opcional, mas ajuda a enviar a nota.",
            "Se o cliente já comprou outras vezes, toque no nome dele na lista de sugestões.",
            "Passo 2: busque o produto, toque em Adicionar e confira a quantidade com os botões − e +.",
            "Se precisar, toque em Corrigir para digitar a quantidade exata. Em quilos, pode usar vírgula.",
            "Para dar desconto, toque em Alterar preço. O novo preço vale só para esta venda.",
            "Passo 3: confira os produtos e o total antes de continuar.",
            "Passo 4: escolha Dinheiro, Cartão, Pix ou Fiado. No dinheiro, pode registrar o valor recebido e ver o troco.",
            "No fiado, confira o nome, digite o telefone e o endereço e escolha a data combinada para pagamento.",
            "Toque em Finalizar Venda. O estoque é baixado na hora e a nota fica pronta.",
        ],
    },
    fiado: {
        title: "Contas de Fiado",
        steps: [
            "Aqui aparecem os clientes com fiado em aberto, do vencimento mais próximo para o mais distante.",
            "A etiqueta mostra se está em dia, vence hoje ou está atrasado.",
            "Toque no nome do cliente para ver as compras em aberto e os pagamentos.",
            "Dentro do cliente, use Registrar pagamento para anotar quanto ele pagou, mesmo que seja uma parte.",
            "Ligar e Cobrar no WhatsApp abrem o contato do cliente com uma mensagem pronta.",
        ],
    },
    "fiado-detalhe": {
        title: "Fiado do cliente",
        steps: [
            "Aqui você vê o saldo devedor total e cada compra feita fiado.",
            "Registrar pagamento aceita o valor todo ou uma parte. O saldo cai na hora.",
            "O valor não pode ser maior que o saldo devedor.",
            "O histórico mostra os pagamentos já recebidos, com data e forma de pagamento.",
            "Ligar usa o telefone do cadastro. Cobrar no WhatsApp abre uma mensagem educada pronta.",
        ],
    },
    vendas: {
        title: "Registro de Vendas",
        steps: [
            "Use Por mês para ver o relatório do mês ou Resumo geral para somar todas as vendas.",
            "No modo Por mês, use as setas para escolher o mês.",
            "Os cartões mostram total vendido, custo, lucro e número de vendas.",
            "O Relatório de vendas mostra, dia a dia, a quantidade de vendas, o total, o custo e o lucro.",
            "Toque em uma data do relatório para abrir as notas daquele dia.",
            "O botão Abrir notas de venda mostra cada nota em uma tabela separada.",
            "A faixa A receber mostra o total de fiado em aberto.",
            "Itens vendidos no mês mostra a quantidade e o valor de cada produto.",
            "O custo usado é o valor que o produto tinha no momento da venda.",
            "Vendas canceladas aparecem nas notas, mas ficam fora do total, custo e lucro.",
            "Na nota completa, você pode enviar por WhatsApp, SMS, imprimir ou salvar em PDF.",
        ],
    },
    notas: {
        title: "Notas de Venda",
        steps: [
            "Cada nota aparece em uma tabela separada, com item, quantidade, subtotal e total.",
            "Use as setas para escolher o mês.",
            "Se a tela abrir por uma data, toque em Ver mês inteiro para consultar todas as notas do mês.",
            "Notas canceladas aparecem com aviso e ficam fora do total concluído.",
            "Toque em Abrir nota completa para enviar, imprimir, salvar em PDF ou cancelar.",
        ],
    },
    nota: {
        title: "Nota da venda",
        steps: [
            "A nota mostra os dados da loja, o número, o cliente, os itens e o total.",
            "Em venda fiado, a nota mostra também a data combinada para pagamento.",
            "Enviar por WhatsApp abre o aplicativo com a nota escrita.",
            "Enviar por SMS abre o aplicativo de mensagens do celular.",
            "Imprimir nota abre a impressão do celular. No Android, você pode escolher Salvar como PDF.",
            "Salvar ou compartilhar PDF gera o arquivo e abre as opções para guardar ou enviar.",
            "Cancelar venda devolve todos os itens ao estoque. Não dá para desfazer o cancelamento.",
            "Um fiado que já recebeu pagamento não pode ser cancelado.",
            "O comprovante é simples e não substitui documento fiscal.",
        ],
    },
    configuracoes: {
        title: "Configurações",
        steps: [
            "Em Aparência, escolha tema Claro ou Escuro.",
            "Escolha o tamanho das letras e símbolos: Normal, Grande ou Muito grande.",
            "Em Acesso rápido, use as setas para mudar a ordem e o × para remover.",
            "Toque em um item disponível para adicionar à tela inicial.",
            "Em Avisos de fiado, ligue ou desligue, escolha os dias e o horário.",
            "Toque em Ativar avisos neste celular e permita as notificações.",
            "Depois de mudar os avisos, toque em Salvar avisos de fiado.",
        ],
    },
    "coming-soon": {
        title: "Módulo em construção",
        steps: [
            "Esta parte do app ainda está sendo preparada.",
            "As outras telas continuam funcionando normalmente.",
            "Toque em Voltar para retornar ao início.",
        ],
    },
};

export type TutorialStep = {
    icon: string;
    title: string;
    text: string;
};

export const tutorials: Record<string, TutorialStep[]> = {
    home: [
        {
            icon: "👋",
            title: "Bem-vindo ao Estoque Fácil",
            text: "Este aplicativo ajuda você a cuidar do estoque, das vendas e dos fiados. Vamos conhecer as partes principais.",
        },
        {
            icon: "📊",
            title: "Sua tela de início",
            text: "No Início você vê quantos produtos tem, o total de itens e o resumo das vendas do mês. Também aparecem avisos de estoque baixo e de fiado.",
        },
        {
            icon: "🧾",
            title: "Suas tarefas",
            text: "Use o Acesso rápido para abrir Produtos, Caixa, Nota, Vendas, Fiados ou Meus dados. Você escolhe os atalhos em Configurações.",
        },
        {
            icon: "❓",
            title: "Ajuda em todas as telas",
            text: "Toque em ? Ajuda no canto superior direito sempre que tiver dúvida. Você também pode ouvir a explicação em voz alta.",
        },
    ],
    "chegou-mercadoria": [
        {
            icon: "🚛",
            title: "Caixa — chegada de produtos",
            text: "Use a aba Caixa quando um fornecedor entregar produtos para a sua loja.",
        },
        {
            icon: "🛒",
            title: "Escolha o produto",
            text: "Toque em um produto que já existe ou crie um novo. Depois digite quantas unidades chegaram.",
        },
        {
            icon: "💰",
            title: "Valor da caixa",
            text: "Digite o valor total que você pagou pela caixa. O aplicativo calcula sozinho quanto custou cada unidade.",
        },
        {
            icon: "🏷️",
            title: "Preço de venda",
            text: "Digite por quanto você vai vender cada unidade. Antes de salvar, o aplicativo mostra o lucro.",
        },
    ],
    estoque: [
        {
            icon: "📋",
            title: "Seu estoque",
            text: "Aqui aparecem os produtos, a quantidade que você tem e o preço de venda.",
        },
        {
            icon: "🔎",
            title: "Encontrar um produto",
            text: "Digite parte do nome no campo de busca. A lista diminui enquanto você digita.",
        },
        {
            icon: "⚠️",
            title: "Estoque baixo",
            text: "Quando a quantidade fica igual ou menor que o limite do produto, aparece um aviso para você repor.",
        },
        {
            icon: "👆",
            title: "Ver os detalhes",
            text: "Toque em um produto para ver o histórico, mudar o preço ou ajustar a quantidade por perda, quebra ou contagem.",
        },
    ],
    vender: [
        {
            icon: "🧾",
            title: "Nova venda",
            text: "Esta tela tem quatro passos: cliente, produtos, resumo e pagamento. O aplicativo mostra em que passo você está.",
        },
        {
            icon: "🙋",
            title: "Quem está comprando",
            text: "Digite o nome do cliente. Se ele já comprou antes, toque no nome na lista de sugestões.",
        },
        {
            icon: "🛒",
            title: "Produtos e quantidades",
            text: "Busque o produto e toque em Adicionar. Confira a quantidade e, se precisar, altere o preço só nesta venda.",
        },
        {
            icon: "💳",
            title: "Pagamento e nota",
            text: "Escolha dinheiro, cartão, Pix ou fiado. No fiado, preencha o telefone, o endereço e a data combinada. Depois toque em Concluir venda.",
        },
    ],
    fiado: [
        {
            icon: "📒",
            title: "Contas de Fiado",
            text: "Aqui ficam os clientes com fiado em aberto. A lista mostra primeiro quem tem o vencimento mais próximo.",
        },
        {
            icon: "📅",
            title: "Vencimentos",
            text: "A etiqueta mostra se o fiado está em dia, vence hoje ou está atrasado. Toque no cliente para ver as compras.",
        },
        {
            icon: "💵",
            title: "Receber uma parte",
            text: "Dentro do cliente, toque em Registrar pagamento. Pode receber o valor todo ou só uma parte do que ele deve.",
        },
        {
            icon: "🔔",
            title: "Avisos de vencimento",
            text: "O aplicativo pode avisar no celular quando um fiado estiver perto de vencer ou atrasado. Você escolhe os dias e o horário em Configurações.",
        },
    ],
};

export function getTutorial(key: string): TutorialStep[] {
    return tutorials[key] ?? tutorials.home;
}

export const fieldHelp = {
    name: "Digite seu nome completo, como você quer ser chamado no app.",
    phone: "Digite o DDD e o número. Exemplo: (11) 91234-5678.",
    email: "É o e-mail usado para entrar no app. Use um que você abre sempre.",
    password: "Use pelo menos 8 caracteres. Anote em um lugar seguro.",
    cnpj: "São os 14 números do CNPJ do seu estabelecimento. Estão no cartão do CNPJ.",
    tradeName: "É o nome que os clientes conhecem e que vai aparecer na nota.",
    ownerName: "É o nome do dono do estabelecimento, como deve aparecer na nota.",
    street: "Rua, avenida ou praça onde fica o estabelecimento.",
    number: "Número do endereço. Se não tiver, escreva S/N.",
    district: "Bairro onde fica o estabelecimento.",
    city: "Cidade onde fica o estabelecimento.",
    state: "São as duas letras do estado. Exemplo: SP, RJ, MG.",
    product: "Escolha um produto que já existe ou toque em Criar novo produto.",
    productName: "Digite o nome do produto. Exemplo: Arroz 5 kg.",
    quantity: "Digite quantas unidades chegaram. Se for quilo, pode usar vírgula: 1,5.",
    boxTotal: "É o valor total que você pagou pela caixa inteira.",
    unitCost: "Quanto custou cada unidade. O app calcula dividindo a caixa pela quantidade.",
    salePrice: "É o preço que você vai cobrar do cliente por unidade.",
    supplier: "Opcional. Nome de quem vendeu a mercadoria.",
    lowStockThreshold: "Quando a quantidade ficar igual ou menor que este número, o app mostra o aviso de estoque baixo.",
    newQuantity: "Digite a quantidade que você contou de verdade. Pode ser zero.",
    adjustReason: "Escolha o motivo para ficar registrado no histórico do produto.",
    customerName: "Digite o nome de quem está comprando. O nome aparece na nota.",
    customerPhone: "Opcional, mas ajuda a enviar a nota por WhatsApp ou SMS. Digite DDD e número.",
    creditPhone: "Obrigatório no fiado. Digite DDD e número para conseguir cobrar o cliente depois.",
    creditAddress: "Obrigatório no fiado. Escreva rua, número, bairro e cidade do cliente.",
    creditNote: "Opcional. Anote o combinado, por exemplo: pagar depois do dia 10.",
    creditPayment: "Digite o valor que o cliente entregou agora. Pode ser uma parte do fiado.",
    productSearch: "Digite parte do nome do produto para encontrar mais rápido.",
    saleQuantity: "Confira a quantidade que o cliente está levando. Use os botões − e + ou toque em Corrigir.",
    cashReceived: "Opcional. Digite quanto o cliente entregou para o app calcular o troco.",
} as const;

export function getHelp(key: string): HelpContent {
    return helpTexts[key] ?? {
        title: "Ajuda",
        steps: [
            "Esta tela faz parte do Estoque Fácil.",
            "Se precisar de ajuda, pergunte ao responsável pelo estabelecimento.",
        ],
    };
}
