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
            "Aqui você vê um resumo do dia: vendas, estoque baixo e fiados.",
            "Os quatro botões grandes levam às tarefas principais.",
            "Chegou mercadoria: registra os produtos que chegaram.",
            "Nova venda: registra uma venda e prepara a nota.",
            "Estoque: mostra os produtos e as quantidades.",
            "Quem deve: mostra os fiados, os vencimentos e os pagamentos recebidos.",
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
        title: "Chegou mercadoria",
        steps: [
            "Escolha um produto da lista ou toque em Criar novo produto.",
            "Digite quantas unidades chegaram.",
            "Digite o valor total que você pagou pela caixa inteira.",
            "O valor unitário é calculado sozinho: valor da caixa dividido pela quantidade.",
            "Se precisar, você pode corrigir o valor unitário.",
            "Digite o preço que você vai cobrar do cliente por unidade.",
            "Confira a mensagem de lucro e toque em Salvar mercadoria.",
            "Depois de salvar, é só registrar o próximo produto.",
        ],
    },
    estoque: {
        title: "Estoque",
        steps: [
            "Aqui aparecem os produtos com a quantidade e o preço de venda.",
            "Digite o nome na busca para encontrar um produto.",
            "O aviso Estoque baixo aparece quando a quantidade chega ao limite.",
            "Toque em um produto para ver o histórico e ajustar o estoque.",
            "Para registrar mercadoria que chegou, use o botão no fim da lista.",
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
            "Toque em Concluir venda. O estoque é baixado na hora e a nota fica pronta.",
        ],
    },
    fiado: {
        title: "Quem deve",
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
        title: "Vendas recentes",
        steps: [
            "Aqui aparecem as últimas vendas feitas na loja.",
            "O cartão do topo mostra o total de hoje.",
            "Toque em uma venda para abrir a nota de novo.",
            "Na nota, você pode enviar por WhatsApp, SMS, imprimir ou salvar em PDF.",
            "Também pode cancelar uma venda. Os produtos voltam para o estoque.",
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
    "coming-soon": {
        title: "Módulo em construção",
        steps: [
            "Esta parte do app ainda está sendo preparada.",
            "As outras telas continuam funcionando normalmente.",
            "Toque em Voltar para retornar ao início.",
        ],
    },
};

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
            "Esta tela faz parte do Meu Armazém.",
            "Se precisar de ajuda, pergunte ao responsável pelo estabelecimento.",
        ],
    };
}
