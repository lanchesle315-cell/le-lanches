/* =========================================================
   PAINEL MASTER - LÊ LANCHES
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

let supabaseClient = null;

if (
  window.supabase &&
  window.APP_CONFIG &&
  window.APP_CONFIG.supabaseUrl &&
  window.APP_CONFIG.supabaseAnonKey
) {

  supabaseClient =
    window.supabase.createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey
    );

} else {

  console.error(
    'Supabase não configurado.'
  );
}


/* =========================================================
   ESTADO GLOBAL
========================================================= */

let masterPerfil = null;
let masterUsuario = null;

let periodoAtual = 'hoje';

let carregandoMaster = false;
let salvandoProdutoMaster = false;
let salvandoEntradaMaster = false;
let salvandoFichaMaster = false;
let salvandoDespesaMaster = false;

let masterProdutos = [];
let masterDespesas = [];
let masterMovimentacoesEstoque = [];

let filtroEstoqueMaster = 'all';
let buscaEstoqueMaster = '';
let filtroMovimentacaoEstoqueMaster = 'all';

let filtroProdutoMaster = 'all';
let buscaProdutoMaster = '';

let masterFichaProduto = null;
let masterFichaSelecionados = new Map();
let buscaFichaMaster = '';

let buscaDespesaMaster = '';
let filtroPeriodoDespesaMaster = 'all';
let filtroCategoriaDespesaMaster = 'all';

let periodoFinanceiroMaster = 'today';
let dataInicioFinanceiroMaster = null;
let dataFimFinanceiroMaster = null;
let carregandoFinanceiroMaster = false;

let periodoRelatoriosMaster = 'today';
let dataInicioRelatoriosMaster = null;
let dataFimRelatoriosMaster = null;
let carregandoRelatoriosMaster = false;


/* =========================================================
   UTILITÁRIOS
========================================================= */

function byId(id) {

  return document.getElementById(id);
}


function escaparHtml(texto) {

  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function normalizarTexto(texto) {

  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}


function numeroSeguro(valor) {

  const numero =
    Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}


function formatarMoeda(valor) {

  return numeroSeguro(valor)
    .toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );
}


function formatarNumero(valor) {

  return numeroSeguro(valor)
    .toLocaleString('pt-BR');
}


function formatarQuantidade(valor) {

  const numero =
    numeroSeguro(valor);

  if (
    Number.isInteger(numero)
  ) {

    return String(numero);
  }

  return numero.toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }
  );
}


function formatarDataHora(valor) {

  if (!valor) {

    return '-';
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {

    return '-';
  }

  return data.toLocaleString(
    'pt-BR'
  );
}


function formatarData(valor) {

  if (!valor) {

    return '-';
  }

  const partes =
    String(valor)
      .split('-')
      .map(Number);

  if (
    partes.length !== 3 ||
    !partes[0] ||
    !partes[1] ||
    !partes[2]
  ) {

    return '-';
  }

  const data =
    new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

  return data.toLocaleDateString(
    'pt-BR'
  );
}


function dataHojeISO() {

  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, '0');

  const dia =
    String(
      agora.getDate()
    ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}


function formatarUnidade(unidade) {

  const unidades = {

    un: 'un',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'ml'

  };

  return unidades[unidade] ||
    unidade ||
    'un';
}


function gerarCodigoProduto(nome) {

  const base =
    String(nome || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

  const sufixo =
    Date.now()
      .toString()
      .slice(-6);

  return base
    ? `${base}_${sufixo}`
    : `ITEM_${sufixo}`;
}


function arredondarCusto(valor) {

  return Math.round(
    (
      numeroSeguro(valor) +
      Number.EPSILON
    ) *
    10000
  ) / 10000;
}


function mostrarMensagemFormulario(
  elemento,
  texto,
  tipo = ''
) {

  if (!elemento) {

    return;
  }

  elemento.textContent =
    texto || '';

  elemento.className =
    'master-form-message';

  if (tipo) {

    elemento.classList.add(tipo);
  }
}


/* =========================================================
   CARREGAMENTO DA PÁGINA
========================================================= */

function mostrarPainelMaster() {

  const loading =
    byId('masterLoading');

  const app =
    byId('masterApp');

  if (loading) {

    loading.style.display =
      'none';
  }

  if (app) {

    app.classList.remove(
      'hidden'
    );

    app.style.display =
      '';
  }
}


function esconderPainelMaster() {

  const app =
    byId('masterApp');

  if (app) {

    app.classList.add(
      'hidden'
    );
  }
}


/* =========================================================
   LOGIN / SESSÃO
========================================================= */

async function buscarPerfilMaster(userId) {

  if (!supabaseClient) {

    throw new Error(
      'Supabase não configurado.'
    );
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from('profiles')
      .select(
        'id, full_name, role, active'
      )
      .eq(
        'id',
        userId
      )
      .single();

  if (error) {

    console.error(
      'Erro ao consultar perfil Master:',
      error
    );

    throw new Error(
      'Não foi possível validar a permissão Master.'
    );
  }

  return data;
}


function perfilEhMaster(perfil) {

  return (
    perfil &&
    perfil.role === 'master' &&
    perfil.active === true
  );
}


async function validarAcessoMaster() {

  if (!supabaseClient) {

    window.location.href =
      'master-login.html';

    return false;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();

    if (error) {

      throw error;
    }

    const sessao =
      data?.session;

    if (!sessao?.user) {

      window.location.href =
        'master-login.html';

      return false;
    }

    masterUsuario =
      sessao.user;

    masterPerfil =
      await buscarPerfilMaster(
        masterUsuario.id
      );

    if (
      !perfilEhMaster(
        masterPerfil
      )
    ) {

      await supabaseClient.auth
        .signOut();

      alert(
        'Este usuário não possui acesso ao Painel Master.'
      );

      window.location.href =
        'master-login.html';

      return false;
    }

    atualizarDadosUsuario();

    return true;

  } catch (erro) {

    console.error(
      'Falha ao validar acesso Master:',
      erro
    );

    try {

      await supabaseClient.auth
        .signOut();

    } catch (_) {}

    window.location.href =
      'master-login.html';

    return false;
  }
}


/* =========================================================
   DADOS DO USUÁRIO
========================================================= */

function atualizarDadosUsuario() {

  const nome =
    byId('masterUserName');

  const email =
    byId('masterUserEmail');

  if (nome) {

    nome.textContent =
      masterPerfil?.full_name ||
      'Master';
  }

  if (email) {

    email.textContent =
      masterUsuario?.email ||
      '';
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function sairMaster() {

  const confirmar =
    confirm(
      'Deseja sair do Painel Master?'
    );

  if (!confirmar) {

    return;
  }

  try {

    if (supabaseClient) {

      await supabaseClient.auth
        .signOut();
    }

  } catch (erro) {

    console.error(
      'Erro ao sair:',
      erro
    );
  }

  window.location.href =
    'master-login.html';
}


/* =========================================================
   RELÓGIO
========================================================= */

function atualizarRelogioMaster() {

  const relogio =
    byId('masterClock');

  if (!relogio) {

    return;
  }

  relogio.textContent =
    new Date()
      .toLocaleTimeString(
        'pt-BR'
      );
}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

const TITULOS_PAGINAS = {

  dashboard:
    'Visão Geral',

  financeiro:
    'Financeiro',

  estoque:
    'Estoque',

  produtos:
    'Produtos e Insumos',

  despesas:
    'Despesas',

  relatorios:
    'Relatórios'

};


function abrirPaginaMaster(pagina) {

  if (!pagina) {

    return;
  }

  document
    .querySelectorAll(
      '.master-page'
    )
    .forEach(
      elemento => {

        elemento.classList.remove(
          'active'
        );
      }
    );

  document
    .querySelectorAll(
      '.master-nav-item'
    )
    .forEach(
      elemento => {

        elemento.classList.remove(
          'active'
        );
      }
    );

  const paginaElemento =
    byId(
      `page-${pagina}`
    );

  if (paginaElemento) {

    paginaElemento.classList.add(
      'active'
    );
  }

  const botaoMenu =
    document.querySelector(
      `.master-nav-item[data-page="${pagina}"]`
    );

  if (botaoMenu) {

    botaoMenu.classList.add(
      'active'
    );
  }

  const titulo =
    byId('masterPageTitle');

  if (titulo) {

    titulo.textContent =
      TITULOS_PAGINAS[pagina] ||
      'Painel Master';
  }

  if (
    pagina === 'financeiro'
  ) {

    carregarFinanceiroMaster()
      .catch(
        erro => {

          console.error(
            'Erro ao carregar Financeiro:',
            erro
          );
        }
      );
  }

  if (
    pagina === 'estoque'
  ) {

    carregarEstoqueMaster()
      .catch(
        erro => {

          console.error(
            'Erro ao carregar Estoque:',
            erro
          );
        }
      );
  }

  if (
    pagina === 'produtos'
  ) {

    carregarProdutosMaster()
      .catch(
        erro => {

          console.error(
            'Erro ao carregar Produtos:',
            erro
          );
        }
      );
  }

  if (
    pagina === 'despesas'
  ) {

    carregarDespesasMaster()
      .catch(
        erro => {

          console.error(
            'Erro ao carregar Despesas:',
            erro
          );
        }
      );
  }

  if (
    pagina === 'relatorios'
  ) {

    carregarRelatoriosMaster()
      .catch(
        erro => {

          console.error(
            'Erro ao carregar Relatórios:',
            erro
          );
        }
      );
  }
}


function configurarNavegacao() {

  document
    .querySelectorAll(
      '.master-nav-item'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          () => {

            abrirPaginaMaster(
              botao.dataset.page
            );
          }
        );
      }
    );

  document
    .querySelectorAll(
      '[data-go-page]'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          () => {

            abrirPaginaMaster(
              botao.dataset.goPage
            );
          }
        );
      }
    );
}


/* =========================================================
   PERÍODO
========================================================= */

function inicioPeriodoSelecionado() {

  const agora =
    new Date();

  if (
    periodoAtual === 'hoje'
  ) {

    return new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
      0,
      0,
      0,
      0
    );
  }

  const dias =
    Number(periodoAtual);

  if (
    Number.isFinite(dias) &&
    dias > 0
  ) {

    const inicio =
      new Date();

    inicio.setDate(
      inicio.getDate() -
      (dias - 1)
    );

    inicio.setHours(
      0,
      0,
      0,
      0
    );

    return inicio;
  }

  const fallback =
    new Date();

  fallback.setHours(
    0,
    0,
    0,
    0
  );

  return fallback;
}


function configurarFiltroPeriodo() {

  document
    .querySelectorAll(
      '.period-btn'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          async () => {

            document
              .querySelectorAll(
                '.period-btn'
              )
              .forEach(
                item => {

                  item.classList.remove(
                    'active'
                  );
                }
              );

            botao.classList.add(
              'active'
            );

            periodoAtual =
              botao.dataset.period ||
              'hoje';

            await carregarDashboard();
          }
        );
      }
    );
}


/* =========================================================
   FINANCEIRO
========================================================= */

async function buscarItensFinanceiros() {

  if (!supabaseClient) {

    return [];
  }

  const inicio =
    inicioPeriodoSelecionado();

  const inicioISO =
    inicio.toISOString();


  /* =====================================================
     1. BUSCAR SOMENTE PEDIDOS FINALIZADOS DO PERÍODO
  ===================================================== */

  const {
    data: pedidosFinalizados,
    error: erroPedidos
  } =
    await supabaseClient
      .from('orders')
      .select(
        `
        id,
        status,
        created_at
        `
      )
      .eq(
        'status',
        'finalizado'
      )
      .gte(
        'created_at',
        inicioISO
      );

  if (erroPedidos) {

    console.error(
      'Erro ao carregar pedidos finalizados do Dashboard:',
      erroPedidos
    );

    return [];
  }


  /* =====================================================
     2. EXTRAIR SOMENTE IDS VÁLIDOS
  ===================================================== */

  const idsPedidosFinalizados =
    (
      Array.isArray(
        pedidosFinalizados
      )
        ? pedidosFinalizados
        : []
    )
      .map(
        pedido =>
          pedido.id
      )
      .filter(
        id =>
          id !== null &&
          id !== undefined
      );

  if (
    idsPedidosFinalizados.length === 0
  ) {

    return [];
  }


  /* =====================================================
     3. BUSCAR ITENS APENAS DOS PEDIDOS FINALIZADOS
  ===================================================== */

  const {
    data: itens,
    error: erroItens
  } =
    await supabaseClient
      .from('order_items')
      .select(
        `
        id,
        order_id,
        product_id,
        product_code,
        product_name,
        quantity,
        sale_unit_price,
        cost_unit_price,
        sale_total,
        cost_total,
        gross_profit,
        created_at
        `
      )
      .in(
        'order_id',
        idsPedidosFinalizados
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (erroItens) {

    console.error(
      'Erro ao carregar itens financeiros do Dashboard:',
      erroItens
    );

    return [];
  }

  return Array.isArray(itens)
    ? itens
    : [];
}


function atualizarCardsFinanceiros(itens) {

  const pedidosUnicos =
    new Set();

  let faturamento = 0;
  let custo = 0;

  itens.forEach(
    item => {

      if (
        item.order_id !== null &&
        item.order_id !== undefined
      ) {

        pedidosUnicos.add(
          item.order_id
        );
      }

      faturamento +=
        numeroSeguro(
          item.sale_total
        );

      custo +=
        numeroSeguro(
          item.cost_total
        );
    }
  );

  const lucro =
    faturamento -
    custo;

  const margem =
    faturamento > 0
      ? (
          lucro /
          faturamento
        ) * 100
      : 0;

  const quantidadePedidos =
    pedidosUnicos.size;

  const ticketMedio =
    quantidadePedidos > 0
      ? faturamento /
        quantidadePedidos
      : 0;

  if (
    byId('masterTotalPedidos')
  ) {

    byId(
      'masterTotalPedidos'
    ).textContent =
      quantidadePedidos;
  }

  if (
    byId('masterFaturamento')
  ) {

    byId(
      'masterFaturamento'
    ).textContent =
      formatarMoeda(
        faturamento
      );
  }

  if (
    byId('masterCusto')
  ) {

    byId(
      'masterCusto'
    ).textContent =
      formatarMoeda(
        custo
      );
  }

  if (
    byId('masterLucro')
  ) {

    byId(
      'masterLucro'
    ).textContent =
      formatarMoeda(
        lucro
      );
  }

  if (
    byId('masterMargem')
  ) {

    byId(
      'masterMargem'
    ).textContent =
      margem.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      ) + '%';
  }

  if (
    byId('masterTicketMedio')
  ) {

    byId(
      'masterTicketMedio'
    ).textContent =
      formatarMoeda(
        ticketMedio
      );
  }
}


/* =========================================================
   FINANCEIRO - PERÍODO
========================================================= */

function criarDataLocalFinanceiro(
  ano,
  mes,
  dia,
  fimDoDia = false
) {

  return new Date(
    ano,
    mes,
    dia,
    fimDoDia ? 23 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 59 : 0,
    fimDoDia ? 999 : 0
  );
}


function dataISOParaLocalFinanceiro(
  valor,
  fimDoDia = false
) {

  const partes =
    String(valor || '')
      .split('-')
      .map(Number);

  if (
    partes.length !== 3 ||
    !partes[0] ||
    !partes[1] ||
    !partes[2]
  ) {

    return null;
  }

  return criarDataLocalFinanceiro(
    partes[0],
    partes[1] - 1,
    partes[2],
    fimDoDia
  );
}


function obterPeriodoFinanceiroMaster() {

  const agora =
    new Date();

  let inicio = null;
  let fim = null;
  let label = '';

  if (
    periodoFinanceiroMaster === 'today'
  ) {

    inicio =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

    fim =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        true
      );

    label = 'Hoje';

  } else if (
    periodoFinanceiroMaster === 'month'
  ) {

    inicio =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        1
      );

    fim =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth() + 1,
        0,
        true
      );

    label =
      agora.toLocaleDateString(
        'pt-BR',
        {
          month: 'long',
          year: 'numeric'
        }
      );

  } else if (
    periodoFinanceiroMaster === 'custom'
  ) {

    inicio =
      dataISOParaLocalFinanceiro(
        dataInicioFinanceiroMaster
      );

    fim =
      dataISOParaLocalFinanceiro(
        dataFimFinanceiroMaster,
        true
      );

    if (
      !inicio ||
      !fim
    ) {

      throw new Error(
        'Informe a data inicial e a data final.'
      );
    }

    if (
      inicio.getTime() >
      fim.getTime()
    ) {

      throw new Error(
        'A data inicial não pode ser maior que a data final.'
      );
    }

    label =
      `${inicio.toLocaleDateString('pt-BR')} até ${fim.toLocaleDateString('pt-BR')}`;

  } else {

    const dias =
      Number(
        periodoFinanceiroMaster
      );

    const quantidadeDias =
      Number.isFinite(dias) &&
      dias > 0
        ? dias
        : 7;

    inicio =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

    inicio.setDate(
      inicio.getDate() -
      (quantidadeDias - 1)
    );

    fim =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        true
      );

    label =
      `Últimos ${quantidadeDias} dias`;
  }

  return {
    inicio,
    fim,
    label
  };
}


/* =========================================================
   FINANCEIRO - BUSCAR DADOS
========================================================= */

async function buscarDadosFinanceirosMaster(
  inicio,
  fim
) {

  if (!supabaseClient) {

    return {
      pedidos: [],
      itens: [],
      despesas: []
    };
  }

  const inicioISO =
    inicio.toISOString();

  const fimISO =
    fim.toISOString();

  const [
    respostaPedidos,
    respostaItens,
    respostaDespesas
  ] =
    await Promise.all(
      [
        supabaseClient
          .from('orders')
          .select(
            `
            id,
            subtotal,
            delivery_fee,
            total,
            status,
            created_at
            `
          )
          .eq(
            'status',
            'finalizado'
          )
          .gte(
            'created_at',
            inicioISO
          )
          .lte(
            'created_at',
            fimISO
          )
          .order(
            'created_at',
            {
              ascending: false
            }
          ),

        supabaseClient
          .from('order_items')
          .select(
            `
            id,
            order_id,
            product_id,
            product_code,
            product_name,
            quantity,
            sale_unit_price,
            cost_unit_price,
            sale_total,
            cost_total,
            gross_profit,
            created_at
            `
          )
          .gte(
            'created_at',
            inicioISO
          )
          .lte(
            'created_at',
            fimISO
          ),

        supabaseClient
          .from('expenses')
          .select(
            `
            id,
            description,
            category,
            amount,
            expense_date,
            active
            `
          )
          .eq(
            'active',
            true
          )
          .gte(
            'expense_date',
            [
              inicio.getFullYear(),
              String(
                inicio.getMonth() + 1
              ).padStart(2, '0'),
              String(
                inicio.getDate()
              ).padStart(2, '0')
            ].join('-')
          )
          .lte(
            'expense_date',
            [
              fim.getFullYear(),
              String(
                fim.getMonth() + 1
              ).padStart(2, '0'),
              String(
                fim.getDate()
              ).padStart(2, '0')
            ].join('-')
          )
      ]
    );

  if (
    respostaPedidos.error
  ) {

    throw respostaPedidos.error;
  }

  if (
    respostaItens.error
  ) {

    throw respostaItens.error;
  }

  if (
    respostaDespesas.error
  ) {

    throw respostaDespesas.error;
  }

  const pedidos =
    Array.isArray(
      respostaPedidos.data
    )
      ? respostaPedidos.data
      : [];

  const idsPedidos =
    new Set(
      pedidos.map(
        pedido =>
          String(
            pedido.id
          )
      )
    );

  const itens =
    (
      Array.isArray(
        respostaItens.data
      )
        ? respostaItens.data
        : []
    ).filter(
      item =>
        idsPedidos.has(
          String(
            item.order_id
          )
        )
    );

  const despesas =
    Array.isArray(
      respostaDespesas.data
    )
      ? respostaDespesas.data
      : [];

  return {
    pedidos,
    itens,
    despesas
  };
}


/* =========================================================
   FINANCEIRO - RESUMO
========================================================= */

function calcularResumoFinanceiroMaster(
  pedidos,
  itens,
  despesas
) {

  const vendaProdutos =
    pedidos.reduce(
      (
        total,
        pedido
      ) =>
        total +
        numeroSeguro(
          pedido.subtotal
        ),
      0
    );

  const taxaEntrega =
    pedidos.reduce(
      (
        total,
        pedido
      ) =>
        total +
        numeroSeguro(
          pedido.delivery_fee
        ),
      0
    );

  const faturamento =
    pedidos.reduce(
      (
        total,
        pedido
      ) =>
        total +
        numeroSeguro(
          pedido.total
        ),
      0
    );

  const custoProdutos =
    itens.reduce(
      (
        total,
        item
      ) =>
        total +
        numeroSeguro(
          item.cost_total
        ),
      0
    );

  const totalDespesas =
    despesas.reduce(
      (
        total,
        despesa
      ) =>
        total +
        numeroSeguro(
          despesa.amount
        ),
      0
    );

  const lucroBruto =
    faturamento -
    custoProdutos;

  const lucroLiquido =
    lucroBruto -
    totalDespesas;

  const margemBruta =
    faturamento > 0
      ? (
          lucroBruto /
          faturamento
        ) * 100
      : 0;

  const margemLiquida =
    faturamento > 0
      ? (
          lucroLiquido /
          faturamento
        ) * 100
      : 0;

  const quantidadePedidos =
    pedidos.length;

  const ticketMedio =
    quantidadePedidos > 0
      ? faturamento /
        quantidadePedidos
      : 0;

  return {
    faturamento,
    vendaProdutos,
    taxaEntrega,
    custoProdutos,
    lucroBruto,
    totalDespesas,
    lucroLiquido,
    margemBruta,
    margemLiquida,
    quantidadePedidos,
    ticketMedio
  };
}


function atualizarElementoFinanceiro(
  id,
  valor
) {

  const elemento =
    byId(id);

  if (elemento) {

    elemento.textContent =
      valor;
  }
}


function formatarPercentualFinanceiro(
  valor
) {

  return numeroSeguro(
    valor
  ).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }
  ) + '%';
}


function renderizarResumoFinanceiroMaster(
  resumo,
  labelPeriodo
) {

  atualizarElementoFinanceiro(
    'masterFinanceiroPeriodoLabel',
    labelPeriodo
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroFaturamento',
    formatarMoeda(
      resumo.faturamento
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroVendaProdutos',
    formatarMoeda(
      resumo.vendaProdutos
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroTaxaEntrega',
    formatarMoeda(
      resumo.taxaEntrega
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroCustoProdutos',
    formatarMoeda(
      resumo.custoProdutos
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroLucroBruto',
    formatarMoeda(
      resumo.lucroBruto
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroDespesas',
    formatarMoeda(
      resumo.totalDespesas
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroLucroLiquido',
    formatarMoeda(
      resumo.lucroLiquido
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroMargemLiquida',
    formatarPercentualFinanceiro(
      resumo.margemLiquida
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroMargemBruta',
    formatarPercentualFinanceiro(
      resumo.margemBruta
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroTicketMedio',
    formatarMoeda(
      resumo.ticketMedio
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroPedidos',
    formatarNumero(
      resumo.quantidadePedidos
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroFluxoFaturamento',
    formatarMoeda(
      resumo.faturamento
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroFluxoCusto',
    formatarMoeda(
      resumo.custoProdutos
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroFluxoLucroBruto',
    formatarMoeda(
      resumo.lucroBruto
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroFluxoDespesas',
    formatarMoeda(
      resumo.totalDespesas
    )
  );

  atualizarElementoFinanceiro(
    'masterFinanceiroFluxoLucroLiquido',
    formatarMoeda(
      resumo.lucroLiquido
    )
  );
}


/* =========================================================
   FINANCEIRO - PRODUTOS
========================================================= */

function renderizarProdutosFinanceiroMaster(
  itens
) {

  const tbody =
    byId(
      'masterFinanceiroProdutosTabela'
    );

  if (!tbody) {

    return;
  }

  const agrupados =
    new Map();

  itens.forEach(
    item => {

      const chave =
        String(
          item.product_id ||
          item.product_code ||
          item.product_name ||
          'produto'
        );

      if (
        !agrupados.has(
          chave
        )
      ) {

        agrupados.set(
          chave,
          {
            nome:
              item.product_name ||
              'Produto',
            quantidade: 0,
            faturamento: 0,
            custo: 0
          }
        );
      }

      const atual =
        agrupados.get(
          chave
        );

      atual.quantidade +=
        numeroSeguro(
          item.quantity
        );

      atual.faturamento +=
        numeroSeguro(
          item.sale_total
        );

      atual.custo +=
        numeroSeguro(
          item.cost_total
        );
    }
  );

  const produtos =
    Array.from(
      agrupados.values()
    )
      .map(
        item => {

          const lucro =
            item.faturamento -
            item.custo;

          const margem =
            item.faturamento > 0
              ? (
                  lucro /
                  item.faturamento
                ) * 100
              : 0;

          return {
            ...item,
            lucro,
            margem
          };
        }
      )
      .sort(
        (a, b) =>
          b.faturamento -
          a.faturamento
      );

  if (
    produtos.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="6"
            class="table-empty"
          >
            Nenhuma venda encontrada no período.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    produtos
      .map(
        item => `

          <tr>

            <td>
              <strong>
                ${escaparHtml(
                  item.nome
                )}
              </strong>
            </td>

            <td>
              ${formatarQuantidade(
                item.quantidade
              )}
            </td>

            <td>
              ${formatarMoeda(
                item.faturamento
              )}
            </td>

            <td>
              ${formatarMoeda(
                item.custo
              )}
            </td>

            <td>
              <strong>
                ${formatarMoeda(
                  item.lucro
                )}
              </strong>
            </td>

            <td>
              ${formatarPercentualFinanceiro(
                item.margem
              )}
            </td>

          </tr>

        `
      )
      .join('');
}


/* =========================================================
   FINANCEIRO - DESPESAS POR CATEGORIA
========================================================= */

function renderizarDespesasFinanceiroMaster(
  despesas
) {

  const tbody =
    byId(
      'masterFinanceiroDespesasTabela'
    );

  if (!tbody) {

    return;
  }

  const categorias =
    new Map();

  despesas.forEach(
    despesa => {

      const categoria =
        despesa.category ||
        'outros';

      if (
        !categorias.has(
          categoria
        )
      ) {

        categorias.set(
          categoria,
          {
            categoria,
            quantidade: 0,
            total: 0
          }
        );
      }

      const atual =
        categorias.get(
          categoria
        );

      atual.quantidade += 1;

      atual.total +=
        numeroSeguro(
          despesa.amount
        );
    }
  );

  const lista =
    Array.from(
      categorias.values()
    )
      .sort(
        (a, b) =>
          b.total -
          a.total
      );

  if (
    lista.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="3"
            class="table-empty"
          >
            Nenhuma despesa encontrada no período.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    lista
      .map(
        item => `

          <tr>

            <td>
              ${escaparHtml(
                obterLabelCategoriaDespesa(
                  item.categoria
                )
              )}
            </td>

            <td>
              ${formatarNumero(
                item.quantidade
              )}
            </td>

            <td>
              <strong>
                ${formatarMoeda(
                  item.total
                )}
              </strong>
            </td>

          </tr>

        `
      )
      .join('');
}


/* =========================================================
   FINANCEIRO - CARREGAR
========================================================= */

async function carregarFinanceiroMaster() {

  if (
    carregandoFinanceiroMaster
  ) {

    return;
  }

  const mensagem =
    byId(
      'masterFinanceiroMensagem'
    );

  const botao =
    byId(
      'btnAtualizarFinanceiro'
    );

  const textoAnterior =
    botao?.innerHTML ||
    '🔄 Atualizar financeiro';

  try {

    carregandoFinanceiroMaster =
      true;

    if (botao) {

      botao.disabled =
        true;

      botao.innerHTML =
        '⏳ Atualizando...';
    }

    mostrarMensagemFormulario(
      mensagem,
      'Carregando dados financeiros...',
      'warning'
    );

    const periodo =
      obterPeriodoFinanceiroMaster();

    const {
      pedidos,
      itens,
      despesas
    } =
      await buscarDadosFinanceirosMaster(
        periodo.inicio,
        periodo.fim
      );

    const resumo =
      calcularResumoFinanceiroMaster(
        pedidos,
        itens,
        despesas
      );

    renderizarResumoFinanceiroMaster(
      resumo,
      periodo.label
    );

    renderizarProdutosFinanceiroMaster(
      itens
    );

    renderizarDespesasFinanceiroMaster(
      despesas
    );

    mostrarMensagemFormulario(
      mensagem,
      ''
    );

  } catch (erro) {

    console.error(
      'Erro ao carregar Financeiro:',
      erro
    );

    mostrarMensagemFormulario(
      mensagem,
      erro?.message ||
      'Não foi possível carregar o financeiro.'
    );

  } finally {

    carregandoFinanceiroMaster =
      false;

    if (botao) {

      botao.disabled =
        false;

      botao.innerHTML =
        textoAnterior;
    }
  }
}


/* =========================================================
   FINANCEIRO - FILTROS E EVENTOS
========================================================= */

function configurarFinanceiroMaster() {

  document
    .querySelectorAll(
      '.financial-period-btn'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          async () => {

            document
              .querySelectorAll(
                '.financial-period-btn'
              )
              .forEach(
                item => {

                  item.classList.remove(
                    'active'
                  );
                }
              );

            botao.classList.add(
              'active'
            );

            periodoFinanceiroMaster =
              botao.dataset
                .financialPeriod ||
              'today';

            const personalizado =
              byId(
                'masterFinanceiroPeriodoPersonalizado'
              );

            if (
              periodoFinanceiroMaster ===
              'custom'
            ) {

              personalizado
                ?.classList
                .remove(
                  'hidden'
                );

              const hoje =
                dataHojeISO();

              if (
                !dataInicioFinanceiroMaster
              ) {

                dataInicioFinanceiroMaster =
                  hoje;
              }

              if (
                !dataFimFinanceiroMaster
              ) {

                dataFimFinanceiroMaster =
                  hoje;
              }

              if (
                byId(
                  'masterFinanceiroDataInicio'
                )
              ) {

                byId(
                  'masterFinanceiroDataInicio'
                ).value =
                  dataInicioFinanceiroMaster;
              }

              if (
                byId(
                  'masterFinanceiroDataFim'
                )
              ) {

                byId(
                  'masterFinanceiroDataFim'
                ).value =
                  dataFimFinanceiroMaster;
              }

              return;
            }

            personalizado
              ?.classList
              .add(
                'hidden'
              );

            await carregarFinanceiroMaster();
          }
        );
      }
    );


  const aplicar =
    byId(
      'btnAplicarPeriodoFinanceiro'
    );

  if (aplicar) {

    aplicar.addEventListener(
      'click',
      async () => {

        dataInicioFinanceiroMaster =
          byId(
            'masterFinanceiroDataInicio'
          )?.value ||
          null;

        dataFimFinanceiroMaster =
          byId(
            'masterFinanceiroDataFim'
          )?.value ||
          null;

        await carregarFinanceiroMaster();
      }
    );
  }


  const atualizar =
    byId(
      'btnAtualizarFinanceiro'
    );

  if (atualizar) {

    atualizar.addEventListener(
      'click',
      carregarFinanceiroMaster
    );
  }
}





/* =========================================================
   RELATÓRIOS - PERÍODO
========================================================= */

function obterPeriodoRelatoriosMaster() {

  const agora =
    new Date();

  let inicio = null;
  let fim = null;
  let label = '';

  if (
    periodoRelatoriosMaster === 'today'
  ) {

    inicio =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

    fim =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        true
      );

    label = 'Hoje';

  } else if (
    periodoRelatoriosMaster === 'month'
  ) {

    inicio =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        1
      );

    fim =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth() + 1,
        0,
        true
      );

    label =
      agora.toLocaleDateString(
        'pt-BR',
        {
          month: 'long',
          year: 'numeric'
        }
      );

  } else if (
    periodoRelatoriosMaster === 'custom'
  ) {

    inicio =
      dataISOParaLocalFinanceiro(
        dataInicioRelatoriosMaster
      );

    fim =
      dataISOParaLocalFinanceiro(
        dataFimRelatoriosMaster,
        true
      );

    if (
      !inicio ||
      !fim
    ) {

      throw new Error(
        'Informe a data inicial e a data final.'
      );
    }

    if (
      inicio.getTime() >
      fim.getTime()
    ) {

      throw new Error(
        'A data inicial não pode ser maior que a data final.'
      );
    }

    label =
      `${inicio.toLocaleDateString('pt-BR')} até ${fim.toLocaleDateString('pt-BR')}`;

  } else {

    const dias =
      Number(
        periodoRelatoriosMaster
      );

    const quantidadeDias =
      Number.isFinite(dias) &&
      dias > 0
        ? dias
        : 7;

    inicio =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );

    inicio.setDate(
      inicio.getDate() -
      (quantidadeDias - 1)
    );

    fim =
      criarDataLocalFinanceiro(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        true
      );

    label =
      `Últimos ${quantidadeDias} dias`;
  }

  return {
    inicio,
    fim,
    label
  };
}


/* =========================================================
   RELATÓRIOS - PRODUTOS
========================================================= */

function agruparProdutosRelatoriosMaster(
  itens
) {

  const agrupados =
    new Map();

  itens.forEach(
    item => {

      const chave =
        String(
          item.product_id ||
          item.product_code ||
          item.product_name ||
          'produto'
        );

      if (
        !agrupados.has(
          chave
        )
      ) {

        agrupados.set(
          chave,
          {
            nome:
              item.product_name ||
              'Produto',

            codigo:
              item.product_code ||
              '',

            quantidade:
              0,

            faturamento:
              0,

            custo:
              0
          }
        );
      }

      const atual =
        agrupados.get(
          chave
        );

      atual.quantidade +=
        numeroSeguro(
          item.quantity
        );

      atual.faturamento +=
        numeroSeguro(
          item.sale_total
        );

      atual.custo +=
        numeroSeguro(
          item.cost_total
        );
    }
  );

  return Array
    .from(
      agrupados.values()
    )
    .map(
      item => {

        const lucro =
          item.faturamento -
          item.custo;

        const margem =
          item.faturamento > 0
            ? (
                lucro /
                item.faturamento
              ) * 100
            : 0;

        return {
          ...item,
          lucro,
          margem
        };
      }
    );
}


function renderizarRankingRelatoriosMaster(
  produtos,
  tipo
) {

  const maisVendidos =
    tipo === 'vendidos';

  const container =
    byId(
      maisVendidos
        ? 'masterRelatoriosMaisVendidos'
        : 'masterRelatoriosMaisLucrativos'
    );

  if (!container) {

    return;
  }

  const ranking =
    [...produtos]
      .sort(
        (a, b) =>
          maisVendidos
            ? b.quantidade -
              a.quantidade
            : b.lucro -
              a.lucro
      )
      .slice(
        0,
        5
      );

  if (
    ranking.length === 0
  ) {

    container.innerHTML =
      `
        <div class="master-empty">
          Nenhuma venda encontrada no período.
        </div>
      `;

    return;
  }

  container.innerHTML =
    ranking
      .map(
        (
          item,
          index
        ) => `

          <div class="ranking-item">

            <div class="ranking-position">
              ${index + 1}
            </div>

            <div class="ranking-info">

              <strong>
                ${escaparHtml(
                  item.nome
                )}
              </strong>

              <span>
                ${
                  item.codigo
                    ? `#${escaparHtml(item.codigo)} • `
                    : ''
                }
                ${formatarQuantidade(
                  item.quantidade
                )}
                unidade(s)
              </span>

            </div>

            <div class="ranking-value">

              <strong>
                ${
                  maisVendidos
                    ? formatarQuantidade(
                        item.quantidade
                      ) + ' un.'
                    : formatarMoeda(
                        item.lucro
                      )
                }
              </strong>

              <span>
                ${
                  maisVendidos
                    ? `Faturamento: ${formatarMoeda(
                        item.faturamento
                      )}`
                    : `Faturamento: ${formatarMoeda(
                        item.faturamento
                      )}`
                }
              </span>

            </div>

          </div>

        `
      )
      .join('');
}


function renderizarProdutosRelatoriosMaster(
  produtos
) {

  const tbody =
    byId(
      'masterRelatoriosProdutosTabela'
    );

  if (!tbody) {

    return;
  }

  const lista =
    [...produtos]
      .sort(
        (a, b) =>
          b.faturamento -
          a.faturamento
      );

  if (
    lista.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="6"
            class="table-empty"
          >
            Nenhum produto encontrado no período.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    lista
      .map(
        item => `

          <tr>

            <td class="reports-product-name">

              <strong>
                ${escaparHtml(
                  item.nome
                )}
              </strong>

              <span>
                ${
                  item.codigo
                    ? `#${escaparHtml(item.codigo)}`
                    : ''
                }
              </span>

            </td>

            <td>
              ${formatarQuantidade(
                item.quantidade
              )}
            </td>

            <td>
              ${formatarMoeda(
                item.faturamento
              )}
            </td>

            <td>
              ${formatarMoeda(
                item.custo
              )}
            </td>

            <td
              class="${
                item.lucro >= 0
                  ? 'reports-positive'
                  : 'reports-negative'
              }"
            >
              ${formatarMoeda(
                item.lucro
              )}
            </td>

            <td>
              ${formatarPercentualFinanceiro(
                item.margem
              )}
            </td>

          </tr>

        `
      )
      .join('');
}


/* =========================================================
   RELATÓRIOS - DESPESAS
========================================================= */

function renderizarDespesasRelatoriosMaster(
  despesas
) {

  const tbody =
    byId(
      'masterRelatoriosDespesasTabela'
    );

  if (!tbody) {

    return;
  }

  const agrupadas =
    new Map();

  despesas.forEach(
    despesa => {

      const categoria =
        despesa.category ||
        'outros';

      if (
        !agrupadas.has(
          categoria
        )
      ) {

        agrupadas.set(
          categoria,
          {
            categoria,
            quantidade: 0,
            total: 0
          }
        );
      }

      const atual =
        agrupadas.get(
          categoria
        );

      atual.quantidade += 1;

      atual.total +=
        numeroSeguro(
          despesa.amount
        );
    }
  );

  const totalGeral =
    despesas.reduce(
      (
        total,
        despesa
      ) =>
        total +
        numeroSeguro(
          despesa.amount
        ),
      0
    );

  const lista =
    Array
      .from(
        agrupadas.values()
      )
      .sort(
        (a, b) =>
          b.total -
          a.total
      );

  if (
    lista.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="4"
            class="table-empty"
          >
            Nenhuma despesa encontrada no período.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    lista
      .map(
        item => {

          const participacao =
            totalGeral > 0
              ? (
                  item.total /
                  totalGeral
                ) * 100
              : 0;

          return `

            <tr>

              <td>
                <span class="reports-category-badge">
                  ${escaparHtml(
                    obterLabelCategoriaDespesa(
                      item.categoria
                    )
                  )}
                </span>
              </td>

              <td>
                ${formatarNumero(
                  item.quantidade
                )}
              </td>

              <td>
                <strong>
                  ${formatarMoeda(
                    item.total
                  )}
                </strong>
              </td>

              <td>
                ${formatarPercentualFinanceiro(
                  participacao
                )}
              </td>

            </tr>

          `;
        }
      )
      .join('');
}


/* =========================================================
   RELATÓRIOS - ESTOQUE
========================================================= */

function renderizarEstoqueRelatoriosMaster(
  produtos
) {

  const controlados =
    produtos.filter(
      produto =>
        produto.active === true &&
        produto.stock_control === true
    );

  const estoqueBaixo =
    controlados.filter(
      produto =>
        numeroSeguro(
          produto.stock_quantity
        ) <=
        numeroSeguro(
          produto.minimum_stock
        )
    );

  const esgotados =
    controlados.filter(
      produto =>
        numeroSeguro(
          produto.stock_quantity
        ) <= 0
    );

  const valorEstoque =
    controlados.reduce(
      (
        total,
        produto
      ) =>
        total +
        (
          numeroSeguro(
            produto.stock_quantity
          ) *
          numeroSeguro(
            produto.average_cost
          )
        ),
      0
    );

  atualizarElementoFinanceiro(
    'masterRelatoriosEstoqueItens',
    formatarNumero(
      controlados.length
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosEstoqueBaixo',
    formatarNumero(
      estoqueBaixo.length
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosEstoqueEsgotado',
    formatarNumero(
      esgotados.length
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosValorEstoque',
    formatarMoeda(
      valorEstoque
    )
  );

  const tbody =
    byId(
      'masterRelatoriosEstoqueTabela'
    );

  if (!tbody) {

    return;
  }

  const lista =
    [...estoqueBaixo]
      .sort(
        (a, b) =>
          numeroSeguro(
            a.stock_quantity
          ) -
          numeroSeguro(
            b.stock_quantity
          )
      );

  if (
    lista.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="7"
            class="table-empty"
          >
            Nenhum item com estoque baixo.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    lista
      .map(
        produto => {

          const estoque =
            numeroSeguro(
              produto.stock_quantity
            );

          const minimo =
            numeroSeguro(
              produto.minimum_stock
            );

          const custo =
            numeroSeguro(
              produto.average_cost
            );

          const unidade =
            formatarUnidade(
              produto.unit
            );

          const esgotado =
            estoque <= 0;

          return `

            <tr>

              <td class="reports-product-name">

                <strong>
                  ${escaparHtml(
                    produto.name
                  )}
                </strong>

                <span>
                  ${
                    produto.product_code
                      ? `#${escaparHtml(
                          produto.product_code
                        )}`
                      : ''
                  }
                </span>

              </td>

              <td>
                ${
                  produto.item_type ===
                  'ingredient'
                    ? 'Insumo'
                    : 'Produto'
                }
              </td>

              <td
                class="${
                  esgotado
                    ? 'reports-negative'
                    : 'reports-warning'
                }"
              >
                ${formatarQuantidade(
                  estoque
                )}
                ${escaparHtml(
                  unidade
                )}
              </td>

              <td>
                ${formatarQuantidade(
                  minimo
                )}
                ${escaparHtml(
                  unidade
                )}
              </td>

              <td>
                ${formatarMoeda(
                  custo
                )}
              </td>

              <td>
                ${formatarMoeda(
                  estoque *
                  custo
                )}
              </td>

              <td
                class="${
                  esgotado
                    ? 'reports-negative'
                    : 'reports-warning'
                }"
              >
                ${
                  esgotado
                    ? 'ESGOTADO'
                    : 'ESTOQUE BAIXO'
                }
              </td>

            </tr>

          `;
        }
      )
      .join('');
}


/* =========================================================
   RELATÓRIOS - RESUMO
========================================================= */

function renderizarResumoRelatoriosMaster(
  resumo,
  labelPeriodo
) {

  atualizarElementoFinanceiro(
    'masterRelatoriosPeriodoLabel',
    labelPeriodo
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosPedidos',
    formatarNumero(
      resumo.quantidadePedidos
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosFaturamento',
    formatarMoeda(
      resumo.faturamento
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosCusto',
    formatarMoeda(
      resumo.custoProdutos
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosDespesas',
    formatarMoeda(
      resumo.totalDespesas
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosLucroLiquido',
    formatarMoeda(
      resumo.lucroLiquido
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosTicketMedio',
    formatarMoeda(
      resumo.ticketMedio
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosVendaProdutos',
    formatarMoeda(
      resumo.vendaProdutos
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosTaxasEntrega',
    formatarMoeda(
      resumo.taxaEntrega
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosLucroBruto',
    formatarMoeda(
      resumo.lucroBruto
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosMargemBruta',
    formatarPercentualFinanceiro(
      resumo.margemBruta
    )
  );

  atualizarElementoFinanceiro(
    'masterRelatoriosMargemLiquida',
    formatarPercentualFinanceiro(
      resumo.margemLiquida
    )
  );
}


/* =========================================================
   RELATÓRIOS - CARREGAR
========================================================= */

async function carregarRelatoriosMaster() {

  if (
    carregandoRelatoriosMaster
  ) {

    return;
  }

  const botao =
    byId(
      'btnAtualizarRelatorios'
    );

  const mensagem =
    byId(
      'masterRelatoriosMensagem'
    );

  const textoAnterior =
    botao?.innerHTML ||
    '🔄 Atualizar relatório';

  try {

    carregandoRelatoriosMaster =
      true;

    if (botao) {

      botao.disabled =
        true;

      botao.innerHTML =
        '⏳ Atualizando...';
    }

    mostrarMensagemFormulario(
      mensagem,
      'Carregando relatório...',
      'warning'
    );

    const periodo =
      obterPeriodoRelatoriosMaster();

    const [
      dadosFinanceiros,
      produtosEstoque
    ] =
      await Promise.all(
        [
          buscarDadosFinanceirosMaster(
            periodo.inicio,
            periodo.fim
          ),

          buscarProdutos(false)
        ]
      );

    const resumo =
      calcularResumoFinanceiroMaster(
        dadosFinanceiros.pedidos,
        dadosFinanceiros.itens,
        dadosFinanceiros.despesas
      );

    const produtosRelatorio =
      agruparProdutosRelatoriosMaster(
        dadosFinanceiros.itens
      );

    renderizarResumoRelatoriosMaster(
      resumo,
      periodo.label
    );

    renderizarRankingRelatoriosMaster(
      produtosRelatorio,
      'vendidos'
    );

    renderizarRankingRelatoriosMaster(
      produtosRelatorio,
      'lucrativos'
    );

    renderizarProdutosRelatoriosMaster(
      produtosRelatorio
    );

    renderizarDespesasRelatoriosMaster(
      dadosFinanceiros.despesas
    );

    renderizarEstoqueRelatoriosMaster(
      produtosEstoque
    );

    mostrarMensagemFormulario(
      mensagem,
      ''
    );

  } catch (erro) {

    console.error(
      'Erro ao carregar Relatórios:',
      erro
    );

    mostrarMensagemFormulario(
      mensagem,
      erro?.message ||
      'Não foi possível carregar os relatórios.'
    );

  } finally {

    carregandoRelatoriosMaster =
      false;

    if (botao) {

      botao.disabled =
        false;

      botao.innerHTML =
        textoAnterior;
    }
  }
}


/* =========================================================
   RELATÓRIOS - FILTROS E EVENTOS
========================================================= */

function configurarRelatoriosMaster() {

  document
    .querySelectorAll(
      '.reports-period-btn'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          async () => {

            document
              .querySelectorAll(
                '.reports-period-btn'
              )
              .forEach(
                item => {

                  item.classList.remove(
                    'active'
                  );
                }
              );

            botao.classList.add(
              'active'
            );

            periodoRelatoriosMaster =
              botao.dataset
                .reportsPeriod ||
              'today';

            const personalizado =
              byId(
                'masterRelatoriosPeriodoPersonalizado'
              );

            if (
              periodoRelatoriosMaster ===
              'custom'
            ) {

              personalizado
                ?.classList
                .remove(
                  'hidden'
                );

              const hoje =
                dataHojeISO();

              if (
                !dataInicioRelatoriosMaster
              ) {

                dataInicioRelatoriosMaster =
                  hoje;
              }

              if (
                !dataFimRelatoriosMaster
              ) {

                dataFimRelatoriosMaster =
                  hoje;
              }

              if (
                byId(
                  'masterRelatoriosDataInicio'
                )
              ) {

                byId(
                  'masterRelatoriosDataInicio'
                ).value =
                  dataInicioRelatoriosMaster;
              }

              if (
                byId(
                  'masterRelatoriosDataFim'
                )
              ) {

                byId(
                  'masterRelatoriosDataFim'
                ).value =
                  dataFimRelatoriosMaster;
              }

              return;
            }

            personalizado
              ?.classList
              .add(
                'hidden'
              );

            await carregarRelatoriosMaster();
          }
        );
      }
    );


  const aplicar =
    byId(
      'btnAplicarPeriodoRelatorios'
    );

  if (aplicar) {

    aplicar.addEventListener(
      'click',
      async () => {

        dataInicioRelatoriosMaster =
          byId(
            'masterRelatoriosDataInicio'
          )?.value ||
          null;

        dataFimRelatoriosMaster =
          byId(
            'masterRelatoriosDataFim'
          )?.value ||
          null;

        await carregarRelatoriosMaster();
      }
    );
  }


  const atualizar =
    byId(
      'btnAtualizarRelatorios'
    );

  if (atualizar) {

    atualizar.addEventListener(
      'click',
      carregarRelatoriosMaster
    );
  }
}


/* =========================================================
   PRODUTOS MAIS VENDIDOS
========================================================= */

function renderizarProdutosMaisVendidos(itens) {

  const container =
    byId(
      'masterProdutosVendidos'
    );

  if (!container) {

    return;
  }

  const agrupados = {};

  itens.forEach(
    item => {

      const chave =
        item.product_code ||
        item.product_name ||
        'produto';

      if (!agrupados[chave]) {

        agrupados[chave] = {

          nome:
            item.product_name ||
            'Produto',

          quantidade:
            0,

          faturamento:
            0,

          lucro:
            0
        };
      }

      agrupados[chave].quantidade +=
        numeroSeguro(
          item.quantity
        );

      agrupados[chave].faturamento +=
        numeroSeguro(
          item.sale_total
        );

      agrupados[chave].lucro +=
        numeroSeguro(
          item.gross_profit
        );
    }
  );

  const ranking =
    Object.values(
      agrupados
    )
      .sort(
        (a, b) =>
          b.quantidade -
          a.quantidade
      )
      .slice(
        0,
        5
      );

  if (
    ranking.length === 0
  ) {

    container.innerHTML =
      `
        <div class="master-empty">
          Ainda não há vendas no período.
        </div>
      `;

    return;
  }

  container.innerHTML =
    ranking
      .map(
        (
          item,
          index
        ) => `

          <div class="ranking-item">

            <div class="ranking-position">
              ${index + 1}
            </div>

            <div class="ranking-info">

              <strong>
                ${escaparHtml(item.nome)}
              </strong>

              <span>
                ${formatarQuantidade(item.quantidade)}
                unidade(s)
              </span>

            </div>

            <div class="ranking-value">

              <strong>
                ${formatarMoeda(item.faturamento)}
              </strong>

              <span>
                Lucro:
                ${formatarMoeda(item.lucro)}
              </span>

            </div>

          </div>

        `
      )
      .join('');
}


/* =========================================================
   BUSCAR PRODUTOS
========================================================= */

async function buscarProdutos(
  somenteAtivos = true
) {

  if (!supabaseClient) {

    return [];
  }

  let consulta =
    supabaseClient
      .from('products')
      .select(
        `
        id,
        product_code,
        name,
        category,
        sale_price,
        average_cost,
        stock_quantity,
        minimum_stock,
        stock_control,
        available,
        active,
        item_type,
        unit,
        supplier,
        notes,
        created_at,
        updated_at
        `
      );

  if (somenteAtivos) {

    consulta =
      consulta.eq(
        'active',
        true
      );
  }

  const {
    data,
    error
  } =
    await consulta.order(
      'name',
      {
        ascending: true
      }
    );

  if (error) {

    console.error(
      'Erro ao carregar produtos:',
      error
    );

    throw error;
  }

  return Array.isArray(data)
    ? data
    : [];
}


/* =========================================================
   ESTOQUE BAIXO - DASHBOARD
========================================================= */

function renderizarEstoqueBaixo(produtos) {

  const container =
    byId('masterEstoqueBaixo');

  if (!container) {

    return;
  }

  const estoqueBaixo =
    produtos
      .filter(
        produto => {

          if (
            produto.stock_control !== true
          ) {

            return false;
          }

          const estoque =
            numeroSeguro(
              produto.stock_quantity
            );

          const minimo =
            numeroSeguro(
              produto.minimum_stock
            );

          return estoque <= minimo;
        }
      )
      .sort(
        (a, b) =>
          numeroSeguro(
            a.stock_quantity
          ) -
          numeroSeguro(
            b.stock_quantity
          )
      )
      .slice(
        0,
        6
      );

  if (
    estoqueBaixo.length === 0
  ) {

    container.innerHTML =
      `
        <div class="master-empty">
          Nenhum produto com estoque baixo.
        </div>
      `;

    return;
  }

  container.innerHTML =
    estoqueBaixo
      .map(
        produto => {

          const estoque =
            numeroSeguro(
              produto.stock_quantity
            );

          const minimo =
            numeroSeguro(
              produto.minimum_stock
            );

          const esgotado =
            estoque <= 0;

          return `

            <div class="stock-warning-item">

              <div>

                <strong>
                  ${escaparHtml(produto.name)}
                </strong>

                <span>
                  Mínimo:
                  ${formatarQuantidade(minimo)}
                  ${escaparHtml(
                    formatarUnidade(
                      produto.unit
                    )
                  )}
                </span>

              </div>

              <div
                class="
                  stock-warning-value
                  ${
                    esgotado
                      ? 'danger'
                      : ''
                  }
                "
              >

                ${
                  esgotado
                    ? 'ESGOTADO'
                    :
                    `${formatarQuantidade(estoque)}
                     ${escaparHtml(
                       formatarUnidade(
                         produto.unit
                       )
                     )}`
                }

              </div>

            </div>

          `;
        }
      )
      .join('');
}


/* =========================================================
   MOVIMENTAÇÕES
========================================================= */

async function buscarMovimentacoesRecentes() {

  if (!supabaseClient) {

    return [];
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from('stock_movements')
      .select(
        `
        id,
        product_id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        stock_before,
        stock_after,
        average_cost_before,
        average_cost_after,
        order_id,
        notes,
        created_at,
        products (
          name,
          product_code,
          unit
        )
        `
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(10);

  if (error) {

    console.error(
      'Erro ao buscar movimentações:',
      error
    );

    return [];
  }

  return Array.isArray(data)
    ? data
    : [];
}


function obterLabelMovimento(tipo) {

  const labels = {

    entrada:
      'Entrada',

    venda:
      'Venda',

    ajuste_entrada:
      'Ajuste +',

    ajuste_saida:
      'Ajuste -',

    perda:
      'Perda',

    cancelamento:
      'Cancelamento'

  };

  return labels[tipo] ||
    tipo ||
    '-';
}


function renderizarMovimentacoes(
  movimentacoes
) {

  const tbody =
    byId(
      'masterMovimentacoesRecentes'
    );

  if (!tbody) {

    return;
  }

  if (
    movimentacoes.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="5"
            class="table-empty"
          >
            Nenhuma movimentação registrada.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    movimentacoes
      .map(
        movimento => `

          <tr>

            <td>
              ${formatarDataHora(
                movimento.created_at
              )}
            </td>

            <td>
              ${escaparHtml(
                movimento.products?.name ||
                'Produto'
              )}
            </td>

            <td>
              ${escaparHtml(
                obterLabelMovimento(
                  movimento.movement_type
                )
              )}
            </td>

            <td>
              ${formatarQuantidade(
                movimento.quantity
              )}
              ${escaparHtml(
                formatarUnidade(
                  movimento.products?.unit
                )
              )}
            </td>

            <td>
              ${formatarQuantidade(
                movimento.stock_after
              )}
              ${escaparHtml(
                formatarUnidade(
                  movimento.products?.unit
                )
              )}
            </td>

          </tr>

        `
      )
      .join('');
}


/* =========================================================
   ESTOQUE - PÁGINA COMPLETA
========================================================= */

async function buscarMovimentacoesEstoqueMaster(
  limite = 250
) {

  if (!supabaseClient) {

    return [];
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from('stock_movements')
      .select(
        `
        id,
        product_id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        stock_before,
        stock_after,
        average_cost_before,
        average_cost_after,
        order_id,
        notes,
        created_at,
        products (
          id,
          name,
          product_code,
          item_type,
          unit
        )
        `
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(limite);

  if (error) {

    console.error(
      'Erro ao buscar histórico de estoque:',
      error
    );

    throw error;
  }

  return Array.isArray(data)
    ? data
    : [];
}


function obterClasseMovimentoEstoqueMaster(tipo) {

  const classes = {

    entrada:
      'entry',

    venda:
      'sale',

    ajuste_entrada:
      'adjust-in',

    ajuste_saida:
      'adjust-out',

    perda:
      'loss',

    cancelamento:
      'cancel'
  };

  return classes[tipo] || '';
}


function obterProdutosEstoqueFiltradosMaster() {

  const termo =
    normalizarTexto(
      buscaEstoqueMaster
    );

  return masterProdutos
    .filter(
      produto =>
        produto.stock_control === true
    )
    .filter(
      produto => {

        const estoque =
          numeroSeguro(
            produto.stock_quantity
          );

        const minimo =
          numeroSeguro(
            produto.minimum_stock
          );

        if (
          filtroEstoqueMaster === 'product' &&
          produto.item_type === 'ingredient'
        ) {

          return false;
        }

        if (
          filtroEstoqueMaster === 'ingredient' &&
          produto.item_type !== 'ingredient'
        ) {

          return false;
        }

        if (
          filtroEstoqueMaster === 'low' &&
          !(
            estoque > 0 &&
            estoque <= minimo
          )
        ) {

          return false;
        }

        if (
          filtroEstoqueMaster === 'empty' &&
          estoque > 0
        ) {

          return false;
        }

        if (!termo) {

          return true;
        }

        const texto =
          normalizarTexto(
            [
              produto.name,
              produto.product_code,
              produto.category,
              produto.supplier,
              produto.item_type === 'ingredient'
                ? 'insumo ingrediente'
                : 'produto'
            ].join(' ')
          );

        return texto.includes(termo);
      }
    )
    .sort(
      (a, b) =>
        String(a.name || '')
          .localeCompare(
            String(b.name || ''),
            'pt-BR'
          )
    );
}


function atualizarResumoEstoqueMaster() {

  const controlados =
    masterProdutos.filter(
      produto =>
        produto.stock_control === true
    );

  const estoqueBaixo =
    controlados.filter(
      produto => {

        const estoque =
          numeroSeguro(
            produto.stock_quantity
          );

        const minimo =
          numeroSeguro(
            produto.minimum_stock
          );

        return (
          estoque > 0 &&
          estoque <= minimo
        );
      }
    );

  const esgotados =
    controlados.filter(
      produto =>
        numeroSeguro(
          produto.stock_quantity
        ) <= 0
    );

  const valorTotal =
    controlados.reduce(
      (
        total,
        produto
      ) =>
        total +
        Math.max(
          0,
          numeroSeguro(
            produto.stock_quantity
          )
        ) *
        Math.max(
          0,
          numeroSeguro(
            produto.average_cost
          )
        ),
      0
    );

  const definir = (
    id,
    valor
  ) => {

    const elemento =
      byId(id);

    if (elemento) {

      elemento.textContent = valor;
    }
  };

  definir(
    'masterEstoqueItensControlados',
    formatarNumero(
      controlados.length
    )
  );

  definir(
    'masterEstoqueQuantidadeBaixo',
    formatarNumero(
      estoqueBaixo.length
    )
  );

  definir(
    'masterEstoqueQuantidadeEsgotado',
    formatarNumero(
      esgotados.length
    )
  );

  definir(
    'masterEstoqueValorTotal',
    formatarMoeda(
      valorTotal
    )
  );
}


function renderizarEstoqueMaster() {

  const tbody =
    byId(
      'masterListaEstoque'
    );

  if (!tbody) {

    return;
  }

  atualizarResumoEstoqueMaster();

  const produtos =
    obterProdutosEstoqueFiltradosMaster();

  if (
    produtos.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="8"
            class="table-empty"
          >
            Nenhum item encontrado com os filtros atuais.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    produtos
      .map(
        produto => {

          const tipoInsumo =
            produto.item_type ===
            'ingredient';

          const estoque =
            numeroSeguro(
              produto.stock_quantity
            );

          const minimo =
            numeroSeguro(
              produto.minimum_stock
            );

          const custo =
            numeroSeguro(
              produto.average_cost
            );

          const valorEstoque =
            Math.max(0, estoque) *
            Math.max(0, custo);

          const unidade =
            formatarUnidade(
              produto.unit
            );

          const esgotado =
            estoque <= 0;

          const baixo =
            !esgotado &&
            estoque <= minimo;

          const classeQuantidade =
            esgotado
              ? 'empty'
              : baixo
                ? 'low'
                : '';

          const classeStatus =
            esgotado
              ? 'empty'
              : baixo
                ? 'low'
                : 'ok';

          const textoStatus =
            esgotado
              ? 'Esgotado'
              : baixo
                ? 'Estoque baixo'
                : 'Normal';

          return `

            <tr>

              <td>

                <div class="stock-item-main">

                  <div class="stock-item-icon">
                    ${
                      tipoInsumo
                        ? '🥩'
                        : '🍔'
                    }
                  </div>

                  <div class="stock-item-info">

                    <strong>
                      ${escaparHtml(
                        produto.name
                      )}
                    </strong>

                    <span>
                      ${
                        produto.product_code
                          ? `#${escaparHtml(
                              produto.product_code
                            )}`
                          : 'Sem código'
                      }
                    </span>

                  </div>

                </div>

              </td>

              <td>
                <span
                  class="stock-type-badge ${
                    tipoInsumo
                      ? 'ingredient'
                      : ''
                  }"
                >
                  ${
                    tipoInsumo
                      ? 'Insumo'
                      : 'Produto'
                  }
                </span>
              </td>

              <td>
                <span
                  class="stock-quantity-value ${classeQuantidade}"
                >
                  ${formatarQuantidade(
                    estoque
                  )}
                  ${escaparHtml(
                    unidade
                  )}
                </span>
              </td>

              <td>
                ${formatarQuantidade(
                  minimo
                )}
                ${escaparHtml(
                  unidade
                )}
              </td>

              <td>
                ${formatarMoeda(
                  custo
                )}
              </td>

              <td>
                ${formatarMoeda(
                  valorEstoque
                )}
              </td>

              <td>
                <span
                  class="stock-status-badge ${classeStatus}"
                >
                  ${textoStatus}
                </span>
              </td>

              <td>

                <div class="stock-actions">

                  <button
                    type="button"
                    class="stock-action-btn entry"
                    data-master-stock-entry="${produto.id}"
                  >
                    + Entrada
                  </button>

                  <button
                    type="button"
                    class="stock-action-btn adjust"
                    data-master-edit-product="${produto.id}"
                  >
                    Editar item
                  </button>

                </div>

              </td>

            </tr>

          `;
        }
      )
      .join('');
}


function renderizarHistoricoEstoqueMaster() {

  const tbody =
    byId(
      'masterHistoricoEstoque'
    );

  if (!tbody) {

    return;
  }

  const movimentacoes =
    masterMovimentacoesEstoque
      .filter(
        movimento =>
          filtroMovimentacaoEstoqueMaster === 'all' ||
          movimento.movement_type ===
            filtroMovimentacaoEstoqueMaster
      );

  if (
    movimentacoes.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="9"
            class="table-empty"
          >
            Nenhuma movimentação encontrada.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    movimentacoes
      .map(
        movimento => {

          const unidade =
            formatarUnidade(
              movimento.products?.unit
            );

          const quantidade =
            numeroSeguro(
              movimento.quantity
            );

          const custoUnitario =
            numeroSeguro(
              movimento.unit_cost
            );

          const valorMovimento =
            numeroSeguro(
              movimento.total_cost
            ) ||
            Math.abs(
              quantidade *
              custoUnitario
            );

          const classe =
            obterClasseMovimentoEstoqueMaster(
              movimento.movement_type
            );

          return `

            <tr>

              <td>
                ${formatarDataHora(
                  movimento.created_at
                )}
              </td>

              <td>
                ${escaparHtml(
                  movimento.products?.name ||
                  'Item removido'
                )}
              </td>

              <td>
                <span
                  class="stock-movement-badge ${classe}"
                >
                  ${escaparHtml(
                    obterLabelMovimento(
                      movimento.movement_type
                    )
                  )}
                </span>
              </td>

              <td>
                ${formatarQuantidade(
                  quantidade
                )}
                ${escaparHtml(
                  unidade
                )}
              </td>

              <td>
                ${formatarQuantidade(
                  movimento.stock_before
                )}
                ${escaparHtml(
                  unidade
                )}
              </td>

              <td>
                ${formatarQuantidade(
                  movimento.stock_after
                )}
                ${escaparHtml(
                  unidade
                )}
              </td>

              <td>
                ${formatarMoeda(
                  custoUnitario
                )}
              </td>

              <td>
                ${formatarMoeda(
                  valorMovimento
                )}
              </td>

              <td>
                <span class="stock-note">
                  ${escaparHtml(
                    movimento.notes ||
                    '-'
                  )}
                </span>
              </td>

            </tr>

          `;
        }
      )
      .join('');
}


async function carregarEstoqueMaster() {

  if (!supabaseClient) {

    return;
  }

  const lista =
    byId(
      'masterListaEstoque'
    );

  const historico =
    byId(
      'masterHistoricoEstoque'
    );

  if (lista) {

    lista.innerHTML =
      `
        <tr>
          <td
            colspan="8"
            class="table-empty"
          >
            Carregando estoque...
          </td>
        </tr>
      `;
  }

  if (historico) {

    historico.innerHTML =
      `
        <tr>
          <td
            colspan="9"
            class="table-empty"
          >
            Carregando movimentações...
          </td>
        </tr>
      `;
  }

  try {

    const [
      produtos,
      movimentacoes
    ] =
      await Promise.all(
        [
          buscarProdutos(false),
          buscarMovimentacoesEstoqueMaster()
        ]
      );

    masterProdutos = produtos;

    masterMovimentacoesEstoque =
      movimentacoes;

    renderizarEstoqueMaster();

    renderizarHistoricoEstoqueMaster();

  } catch (erro) {

    console.error(
      'Erro ao carregar página de Estoque:',
      erro
    );

    if (lista) {

      lista.innerHTML =
        `
          <tr>
            <td
              colspan="8"
              class="table-empty"
            >
              Não foi possível carregar o estoque.
            </td>
          </tr>
        `;
    }

    if (historico) {

      historico.innerHTML =
        `
          <tr>
            <td
              colspan="9"
              class="table-empty"
            >
              Não foi possível carregar as movimentações.
            </td>
          </tr>
        `;
    }
  }
}


function configurarFiltrosEstoqueMaster() {

  const busca =
    byId(
      'masterBuscaEstoque'
    );

  if (busca) {

    busca.addEventListener(
      'input',
      () => {

        buscaEstoqueMaster =
          busca.value || '';

        renderizarEstoqueMaster();
      }
    );
  }

  document
    .querySelectorAll(
      '.stock-filter-btn'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          () => {

            document
              .querySelectorAll(
                '.stock-filter-btn'
              )
              .forEach(
                item =>
                  item.classList.remove(
                    'active'
                  )
              );

            botao.classList.add(
              'active'
            );

            filtroEstoqueMaster =
              botao.dataset
                .stockFilter ||
              'all';

            renderizarEstoqueMaster();
          }
        );
      }
    );

  const filtroMovimento =
    byId(
      'masterFiltroMovimentacaoEstoque'
    );

  if (filtroMovimento) {

    filtroMovimento.addEventListener(
      'change',
      () => {

        filtroMovimentacaoEstoqueMaster =
          filtroMovimento.value ||
          'all';

        renderizarHistoricoEstoqueMaster();
      }
    );
  }
}


function configurarEventosEstoqueMaster() {

  const lista =
    byId(
      'masterListaEstoque'
    );

  if (!lista) {

    return;
  }

  lista.addEventListener(
    'click',
    evento => {

      const botaoEntrada =
        evento.target.closest(
          '[data-master-stock-entry]'
        );

      if (botaoEntrada) {

        abrirEntradaEstoqueMaster(
          botaoEntrada.dataset
            .masterStockEntry
        );

        return;
      }

      const botaoEditar =
        evento.target.closest(
          '[data-master-edit-product]'
        );

      if (botaoEditar) {

        abrirEditarProdutoMaster(
          botaoEditar.dataset
            .masterEditProduct
        );
      }
    }
  );
}


function iniciarNovaEntradaPelaPaginaEstoqueMaster() {

  const controlados =
    masterProdutos.filter(
      produto =>
        produto.stock_control === true
    );

  if (
    controlados.length === 0
  ) {

    alert(
      'Nenhum item possui controle de estoque ativo.'
    );

    return;
  }

  buscaEstoqueMaster = '';
  filtroEstoqueMaster = 'all';

  const busca =
    byId(
      'masterBuscaEstoque'
    );

  if (busca) {

    busca.value = '';
  }

  document
    .querySelectorAll(
      '.stock-filter-btn'
    )
    .forEach(
      botao => {

        botao.classList.toggle(
          'active',
          botao.dataset.stockFilter ===
            'all'
        );
      }
    );

  renderizarEstoqueMaster();

  if (busca) {

    busca.focus();

    busca.scrollIntoView(
      {
        behavior: 'smooth',
        block: 'center'
      }
    );
  }

  alert(
    'Busque o item desejado e clique em “+ Entrada” na linha dele.'
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

async function carregarDashboard() {

  if (carregandoMaster) {

    return;
  }

  carregandoMaster =
    true;

  const btnAtualizar =
    byId('btnAtualizarMaster');

  const textoAnterior =
    btnAtualizar
      ? btnAtualizar.innerHTML
      : '';

  try {

    if (btnAtualizar) {

      btnAtualizar.disabled =
        true;

      btnAtualizar.innerHTML =
        '⏳ Atualizando...';
    }

    const [
      itensFinanceiros,
      produtos,
      movimentacoes
    ] =
      await Promise.all(
        [
          buscarItensFinanceiros(),
          buscarProdutos(true),
          buscarMovimentacoesRecentes()
        ]
      );

    atualizarCardsFinanceiros(
      itensFinanceiros
    );

    renderizarProdutosMaisVendidos(
      itensFinanceiros
    );

    renderizarEstoqueBaixo(
      produtos
    );

    renderizarMovimentacoes(
      movimentacoes
    );

  } catch (erro) {

    console.error(
      'Erro ao carregar dashboard Master:',
      erro
    );

  } finally {

    carregandoMaster =
      false;

    if (btnAtualizar) {

      btnAtualizar.disabled =
        false;

      btnAtualizar.innerHTML =
        textoAnterior ||
        '🔄 Atualizar';
    }
  }
}


/* =========================================================
   PRODUTOS / INSUMOS - RESUMO
========================================================= */

function atualizarResumoProdutosMaster() {

  const ativos =
    masterProdutos.filter(
      produto =>
        produto.active === true
    );

  const produtos =
    ativos.filter(
      produto =>
        produto.item_type ===
        'product'
    );

  const insumos =
    ativos.filter(
      produto =>
        produto.item_type ===
        'ingredient'
    );

  const estoqueBaixo =
    ativos.filter(
      produto => {

        if (
          produto.stock_control !== true
        ) {

          return false;
        }

        return (
          numeroSeguro(
            produto.stock_quantity
          ) <=
          numeroSeguro(
            produto.minimum_stock
          )
        );
      }
    );

  const valorEstoque =
    ativos.reduce(
      (
        total,
        produto
      ) => {

        if (
          produto.stock_control !== true
        ) {

          return total;
        }

        return (
          total +
          (
            numeroSeguro(
              produto.stock_quantity
            ) *
            numeroSeguro(
              produto.average_cost
            )
          )
        );
      },
      0
    );

  if (
    byId(
      'masterQuantidadeProdutos'
    )
  ) {

    byId(
      'masterQuantidadeProdutos'
    ).textContent =
      formatarNumero(
        produtos.length
      );
  }

  if (
    byId(
      'masterQuantidadeInsumos'
    )
  ) {

    byId(
      'masterQuantidadeInsumos'
    ).textContent =
      formatarNumero(
        insumos.length
      );
  }

  if (
    byId(
      'masterQuantidadeEstoqueBaixo'
    )
  ) {

    byId(
      'masterQuantidadeEstoqueBaixo'
    ).textContent =
      formatarNumero(
        estoqueBaixo.length
      );
  }

  if (
    byId(
      'masterValorEstoque'
    )
  ) {

    byId(
      'masterValorEstoque'
    ).textContent =
      formatarMoeda(
        valorEstoque
      );
  }
}


/* =========================================================
   FILTRAR PRODUTOS
========================================================= */

function obterProdutosFiltrados() {

  const busca =
    normalizarTexto(
      buscaProdutoMaster
    );

  return masterProdutos
    .filter(
      produto => {

        if (
          filtroProdutoMaster !==
            'all' &&
          produto.item_type !==
            filtroProdutoMaster
        ) {

          return false;
        }

        if (!busca) {

          return true;
        }

        const texto =
          normalizarTexto(
            [
              produto.name,
              produto.product_code,
              produto.category,
              produto.supplier
            ].join(' ')
          );

        return texto.includes(
          busca
        );
      }
    )
    .sort(
      (a, b) =>
        String(a.name || '')
          .localeCompare(
            String(b.name || ''),
            'pt-BR'
          )
    );
}


/* =========================================================
   RENDERIZAR PRODUTOS
========================================================= */

function renderizarProdutosMaster() {

  const container =
    byId('masterListaProdutos');

  if (!container) {

    return;
  }

  atualizarResumoProdutosMaster();

  const produtos =
    obterProdutosFiltrados();

  if (
    produtos.length === 0
  ) {

    container.innerHTML =
      `
        <div class="master-empty">
          Nenhum produto ou insumo encontrado.
        </div>
      `;

    return;
  }

  container.innerHTML =
    produtos
      .map(
        produto => {

          const tipoInsumo =
            produto.item_type ===
            'ingredient';

          const estoque =
            numeroSeguro(
              produto.stock_quantity
            );

          const minimo =
            numeroSeguro(
              produto.minimum_stock
            );

          const custo =
            numeroSeguro(
              produto.average_cost
            );

          const venda =
            numeroSeguro(
              produto.sale_price
            );

          const lucro =
            venda - custo;

          const margem =
            venda > 0
              ? (
                  lucro /
                  venda
                ) * 100
              : 0;

          const estoqueBaixo =
            produto.stock_control ===
              true &&
            estoque <= minimo;

          const esgotado =
            produto.stock_control ===
              true &&
            estoque <= 0;

          const unidade =
            formatarUnidade(
              produto.unit
            );

          let classeEstoque = '';

          if (esgotado) {

            classeEstoque =
              'danger';

          } else if (
            estoqueBaixo
          ) {

            classeEstoque =
              'warning';
          }

          return `

            <article
              class="product-master-item"
              data-product-id="${produto.id}"
            >

              <div class="product-master-main">

                <div class="product-master-icon">
                  ${
                    tipoInsumo
                      ? '🥩'
                      : '🍔'
                  }
                </div>

                <div class="product-master-info">

                  <strong>
                    ${escaparHtml(
                      produto.name
                    )}
                  </strong>

                  <div class="product-master-meta">

                    <span
                      class="
                        product-type-badge
                        ${
                          tipoInsumo
                            ? 'ingredient'
                            : ''
                        }
                      "
                    >
                      ${
                        tipoInsumo
                          ? 'Insumo'
                          : 'Produto'
                      }
                    </span>

                    ${
                      produto.category
                        ? `
                          <span class="product-master-code">
                            ${escaparHtml(
                              produto.category
                            )}
                          </span>
                        `
                        : ''
                    }

                    ${
                      produto.product_code
                        ? `
                          <span class="product-master-code">
                            #${escaparHtml(
                              produto.product_code
                            )}
                          </span>
                        `
                        : ''
                    }

                  </div>

                </div>

              </div>


              <div class="product-master-value">

                <span>
                  ${
                    tipoInsumo
                      ? 'Custo médio'
                      : 'Venda'
                  }
                </span>

                <strong>
                  ${
                    tipoInsumo
                      ? formatarMoeda(
                          custo
                        )
                      : formatarMoeda(
                          venda
                        )
                  }
                </strong>

              </div>


              <div class="product-master-value">

                <span>
                  Estoque
                </span>

                <strong class="${classeEstoque}">
                  ${
                    produto.stock_control
                      ? `
                        ${formatarQuantidade(
                          estoque
                        )}
                        ${escaparHtml(
                          unidade
                        )}
                      `
                      : 'Sem controle'
                  }
                </strong>

              </div>


              <div class="product-master-value">

                <span>
                  ${
                    tipoInsumo
                      ? 'Valor estoque'
                      : 'Custo'
                  }
                </span>

                <strong>
                  ${
                    tipoInsumo
                      ? formatarMoeda(
                          estoque *
                          custo
                        )
                      : formatarMoeda(
                          custo
                        )
                  }
                </strong>

              </div>


              <div class="product-master-value">

                <span>
                  ${
                    tipoInsumo
                      ? 'Mínimo'
                      : 'Margem'
                  }
                </span>

                <strong
                  class="${
                    !tipoInsumo &&
                    margem > 0
                      ? 'positive'
                      : ''
                  }"
                >
                  ${
                    tipoInsumo
                      ? `
                        ${formatarQuantidade(
                          minimo
                        )}
                        ${escaparHtml(
                          unidade
                        )}
                      `
                      : `
                        ${margem.toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1
                          }
                        )}%
                      `
                  }
                </strong>

              </div>


              <div class="product-master-actions">

                ${
                  !tipoInsumo
                    ? `
                      <button
                        type="button"
                        class="product-action-btn recipe"
                        data-master-recipe="${produto.id}"
                      >
                        🧾 Ficha
                      </button>
                    `
                    : ''
                }

                <button
                  type="button"
                  class="product-action-btn"
                  data-master-edit-product="${produto.id}"
                >
                  Editar
                </button>

                ${
                  produto.stock_control
                    ? `
                      <button
                        type="button"
                        class="product-action-btn stock"
                        data-master-stock-entry="${produto.id}"
                      >
                        + Entrada
                      </button>
                    `
                    : ''
                }

              </div>

            </article>

          `;
        }
      )
      .join('');
}


/* =========================================================
   CARREGAR PRODUTOS MASTER
========================================================= */

async function carregarProdutosMaster() {

  if (!supabaseClient) {

    return;
  }

  const container =
    byId('masterListaProdutos');

  if (container) {

    container.innerHTML =
      `
        <div class="master-empty">
          Carregando produtos...
        </div>
      `;
  }

  try {

    masterProdutos =
      await buscarProdutos(false);

    renderizarProdutosMaster();

  } catch (erro) {

    console.error(
      'Erro ao carregar Produtos/Insumos:',
      erro
    );

    if (container) {

      container.innerHTML =
        `
          <div class="master-empty">
            Não foi possível carregar os produtos.
          </div>
        `;
    }
  }
}


/* =========================================================
   MODAIS
========================================================= */

function abrirModalMaster(elemento) {

  if (!elemento) {

    return;
  }

  elemento.classList.remove(
    'hidden'
  );

  elemento.setAttribute(
    'aria-hidden',
    'false'
  );

  document.body.style.overflow =
    'hidden';
}


function fecharModalMaster(elemento) {

  if (!elemento) {

    return;
  }

  elemento.classList.add(
    'hidden'
  );

  elemento.setAttribute(
    'aria-hidden',
    'true'
  );

  const algumModalAberto =
    document.querySelector(
      '.master-modal:not(.hidden)'
    );

  if (!algumModalAberto) {

    document.body.style.overflow =
      '';
  }
}


function fecharModalPorNome(nome) {

  if (
    nome === 'produto'
  ) {

    fecharModalMaster(
      byId(
        'modalMasterProduto'
      )
    );

    return;
  }

  if (
    nome === 'entrada'
  ) {

    fecharModalMaster(
      byId(
        'modalMasterEntrada'
      )
    );

    return;
  }

  if (
    nome === 'ficha'
  ) {

    fecharModalMaster(
      byId(
        'modalMasterFicha'
      )
    );

    return;
  }

  if (
    nome === 'despesa'
  ) {

    fecharModalMaster(
      byId(
        'modalMasterDespesa'
      )
    );
  }
}


/* =========================================================
   TIPO DO ITEM
========================================================= */

function obterTipoItemSelecionado() {

  const selecionado =
    document.querySelector(
      'input[name="masterItemType"]:checked'
    );

  return selecionado?.value ===
    'ingredient'
    ? 'ingredient'
    : 'product';
}


function atualizarFormularioPorTipo() {

  const tipo =
    obterTipoItemSelecionado();

  const campoPreco =
    byId(
      'masterCampoPrecoVenda'
    );

  const preco =
    byId(
      'masterProdutoPrecoVenda'
    );

  if (
    tipo === 'ingredient'
  ) {

    if (campoPreco) {

      campoPreco.style.display =
        'none';
    }

    if (preco) {

      preco.value =
        '0';
    }

  } else {

    if (campoPreco) {

      campoPreco.style.display =
        '';
    }
  }
}


/* =========================================================
   NOVO PRODUTO / INSUMO
========================================================= */

function limparFormularioProdutoMaster() {

  const form =
    byId(
      'formMasterProduto'
    );

  if (form) {

    form.reset();
  }

  if (
    byId('masterProdutoId')
  ) {

    byId(
      'masterProdutoId'
    ).value =
      '';
  }

  const radioProduto =
    document.querySelector(
      'input[name="masterItemType"][value="product"]'
    );

  if (radioProduto) {

    radioProduto.checked =
      true;
  }

  if (
    byId('masterProdutoUnidade')
  ) {

    byId(
      'masterProdutoUnidade'
    ).value =
      'un';
  }

  if (
    byId('masterProdutoEstoque')
  ) {

    byId(
      'masterProdutoEstoque'
    ).value =
      '0';
  }

  if (
    byId('masterProdutoEstoqueMinimo')
  ) {

    byId(
      'masterProdutoEstoqueMinimo'
    ).value =
      '0';
  }

  if (
    byId(
      'masterProdutoControlaEstoque'
    )
  ) {

    byId(
      'masterProdutoControlaEstoque'
    ).checked =
      true;
  }

  if (
    byId('masterProdutoDisponivel')
  ) {

    byId(
      'masterProdutoDisponivel'
    ).checked =
      true;
  }

  if (
    byId('masterProdutoAtivo')
  ) {

    byId(
      'masterProdutoAtivo'
    ).checked =
      true;
  }

  mostrarMensagemFormulario(
    byId(
      'masterProdutoMensagem'
    ),
    ''
  );

  atualizarFormularioPorTipo();
}


function abrirNovoProdutoMaster() {

  limparFormularioProdutoMaster();

  const titulo =
    byId(
      'tituloModalMasterProduto'
    );

  if (titulo) {

    titulo.textContent =
      'Novo item';
  }

  const botao =
    byId(
      'btnSalvarMasterProduto'
    );

  if (botao) {

    botao.textContent =
      'Salvar item';
  }

  abrirModalMaster(
    byId(
      'modalMasterProduto'
    )
  );

  setTimeout(
    () => {

      byId(
        'masterProdutoNome'
      )?.focus();

    },
    100
  );
}


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function buscarProdutoLocalPorId(id) {

  return masterProdutos.find(
    produto =>
      String(produto.id) ===
      String(id)
  ) || null;
}


function abrirEditarProdutoMaster(id) {

  const produto =
    buscarProdutoLocalPorId(id);

  if (!produto) {

    alert(
      'Produto não encontrado.'
    );

    return;
  }

  limparFormularioProdutoMaster();

  byId(
    'masterProdutoId'
  ).value =
    produto.id;

  const radio =
    document.querySelector(
      `input[name="masterItemType"][value="${
        produto.item_type ===
          'ingredient'
          ? 'ingredient'
          : 'product'
      }"]`
    );

  if (radio) {

    radio.checked =
      true;
  }

  byId(
    'masterProdutoNome'
  ).value =
    produto.name || '';

  byId(
    'masterProdutoCodigo'
  ).value =
    produto.product_code || '';

  byId(
    'masterProdutoCategoria'
  ).value =
    produto.category || '';

  byId(
    'masterProdutoUnidade'
  ).value =
    produto.unit || 'un';

  byId(
    'masterProdutoFornecedor'
  ).value =
    produto.supplier || '';

  byId(
    'masterProdutoPrecoVenda'
  ).value =
    numeroSeguro(
      produto.sale_price
    );

  byId(
    'masterProdutoCusto'
  ).value =
    numeroSeguro(
      produto.average_cost
    );

  byId(
    'masterProdutoEstoque'
  ).value =
    numeroSeguro(
      produto.stock_quantity
    );

  byId(
    'masterProdutoEstoqueMinimo'
  ).value =
    numeroSeguro(
      produto.minimum_stock
    );

  byId(
    'masterProdutoControlaEstoque'
  ).checked =
    produto.stock_control === true;

  byId(
    'masterProdutoDisponivel'
  ).checked =
    produto.available === true;

  byId(
    'masterProdutoAtivo'
  ).checked =
    produto.active === true;

  byId(
    'masterProdutoObservacoes'
  ).value =
    produto.notes || '';

  const titulo =
    byId(
      'tituloModalMasterProduto'
    );

  if (titulo) {

    titulo.textContent =
      `Editar ${produto.name}`;
  }

  const botao =
    byId(
      'btnSalvarMasterProduto'
    );

  if (botao) {

    botao.textContent =
      'Salvar alterações';
  }

  atualizarFormularioPorTipo();

  abrirModalMaster(
    byId(
      'modalMasterProduto'
    )
  );
}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function salvarProdutoMaster(evento) {

  evento.preventDefault();

  if (
    salvandoProdutoMaster
  ) {

    return;
  }

  const mensagem =
    byId(
      'masterProdutoMensagem'
    );

  mostrarMensagemFormulario(
    mensagem,
    ''
  );

  const id =
    String(
      byId(
        'masterProdutoId'
      )?.value || ''
    ).trim();

  const editando =
    Boolean(id);

  const tipo =
    obterTipoItemSelecionado();

  const nome =
    String(
      byId(
        'masterProdutoNome'
      )?.value || ''
    ).trim();

  let codigo =
    String(
      byId(
        'masterProdutoCodigo'
      )?.value || ''
    )
      .trim()
      .toUpperCase();

  const categoria =
    String(
      byId(
        'masterProdutoCategoria'
      )?.value || ''
    ).trim();

  const unidade =
    String(
      byId(
        'masterProdutoUnidade'
      )?.value || 'un'
    ).trim();

  const fornecedor =
    String(
      byId(
        'masterProdutoFornecedor'
      )?.value || ''
    ).trim();

  const precoVenda =
    tipo === 'product'
      ? numeroSeguro(
          byId(
            'masterProdutoPrecoVenda'
          )?.value
        )
      : 0;

  const custo =
    numeroSeguro(
      byId(
        'masterProdutoCusto'
      )?.value
    );

  const estoque =
    numeroSeguro(
      byId(
        'masterProdutoEstoque'
      )?.value
    );

  const estoqueMinimo =
    numeroSeguro(
      byId(
        'masterProdutoEstoqueMinimo'
      )?.value
    );

  const controlaEstoque =
    byId(
      'masterProdutoControlaEstoque'
    )?.checked === true;

  const disponivel =
    byId(
      'masterProdutoDisponivel'
    )?.checked === true;

  const ativo =
    byId(
      'masterProdutoAtivo'
    )?.checked === true;

  const observacoes =
    String(
      byId(
        'masterProdutoObservacoes'
      )?.value || ''
    ).trim();

  if (!nome) {

    mostrarMensagemFormulario(
      mensagem,
      'Informe o nome do item.'
    );

    return;
  }

  if (
    precoVenda < 0 ||
    custo < 0 ||
    estoque < 0 ||
    estoqueMinimo < 0
  ) {

    mostrarMensagemFormulario(
      mensagem,
      'Valores negativos não são permitidos.'
    );

    return;
  }

  if (!codigo) {

    codigo =
      gerarCodigoProduto(
        nome
      );
  }

  const payload = {

    product_code:
      codigo,

    name:
      nome,

    category:
      categoria || null,

    sale_price:
      precoVenda,

    average_cost:
      arredondarCusto(
        custo
      ),

    stock_quantity:
      estoque,

    minimum_stock:
      estoqueMinimo,

    stock_control:
      controlaEstoque,

    available:
      disponivel,

    active:
      ativo,

    item_type:
      tipo,

    unit:
      unidade,

    supplier:
      fornecedor || null,

    notes:
      observacoes || null,

    updated_at:
      new Date().toISOString()
  };

  const botao =
    byId(
      'btnSalvarMasterProduto'
    );

  const textoBotao =
    botao?.textContent || '';

  try {

    salvandoProdutoMaster =
      true;

    if (botao) {

      botao.disabled =
        true;

      botao.textContent =
        'Salvando...';
    }

    mostrarMensagemFormulario(
      mensagem,
      'Salvando item...',
      'warning'
    );

    let resultado = null;

    if (editando) {

      const produtoAnterior =
        buscarProdutoLocalPorId(id);

      const {
        data,
        error
      } =
        await supabaseClient
          .from('products')
          .update(payload)
          .eq(
            'id',
            id
          )
          .select()
          .single();

      if (error) {

        throw error;
      }

      resultado =
        data;

      if (
        produtoAnterior &&
        produtoAnterior.stock_control === true &&
        controlaEstoque === true
      ) {

        const estoqueAnterior =
          numeroSeguro(
            produtoAnterior.stock_quantity
          );

        const diferenca =
          estoque -
          estoqueAnterior;

        if (
          Math.abs(diferenca) >
          0.0000001
        ) {

          const tipoMovimento =
            diferenca > 0
              ? 'ajuste_entrada'
              : 'ajuste_saida';

          const {
            error:
              erroMovimento
          } =
            await supabaseClient
              .from(
                'stock_movements'
              )
              .insert(
                {

                  product_id:
                    resultado.id,

                  movement_type:
                    tipoMovimento,

                  quantity:
                    Math.abs(
                      diferenca
                    ),

                  unit_cost:
                    custo,

                  total_cost:
                    Math.abs(
                      diferenca
                    ) * custo,

                  stock_before:
                    estoqueAnterior,

                  stock_after:
                    estoque,

                  average_cost_before:
                    numeroSeguro(
                      produtoAnterior.average_cost
                    ),

                  average_cost_after:
                    custo,

                  notes:
                    'Ajuste manual realizado no cadastro do item.',

                  created_by:
                    masterUsuario?.id ||
                    null
                }
              );

          if (erroMovimento) {

            console.error(
              'Produto atualizado, mas houve erro ao registrar ajuste:',
              erroMovimento
            );
          }
        }
      }

    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .from('products')
          .insert(
            payload
          )
          .select()
          .single();

      if (error) {

        throw error;
      }

      resultado =
        data;

      if (
        controlaEstoque &&
        estoque > 0
      ) {

        const {
          error:
            erroMovimento
        } =
          await supabaseClient
            .from(
              'stock_movements'
            )
            .insert(
              {

                product_id:
                  resultado.id,

                movement_type:
                  'entrada',

                quantity:
                  estoque,

                unit_cost:
                  custo,

                total_cost:
                  estoque * custo,

                stock_before:
                  0,

                stock_after:
                  estoque,

                average_cost_before:
                  0,

                average_cost_after:
                  custo,

                notes:
                  'Estoque inicial do cadastro.',

                created_by:
                  masterUsuario?.id ||
                  null
              }
            );

        if (erroMovimento) {

          console.error(
            'Produto cadastrado, mas houve erro ao registrar estoque inicial:',
            erroMovimento
          );
        }
      }
    }

    mostrarMensagemFormulario(
      mensagem,
      editando
        ? 'Item atualizado com sucesso.'
        : 'Item cadastrado com sucesso.',
      'success'
    );

    await carregarProdutosMaster();

    await carregarDashboard();

    setTimeout(
      () => {

        fecharModalMaster(
          byId(
            'modalMasterProduto'
          )
        );

      },
      450
    );

  } catch (erro) {

    console.error(
      'Erro ao salvar produto:',
      erro
    );

    let texto =
      'Não foi possível salvar o item.';

    if (
      erro?.code === '23505'
    ) {

      texto =
        'Já existe um item utilizando esse código.';
    }

    mostrarMensagemFormulario(
      mensagem,
      texto
    );

  } finally {

    salvandoProdutoMaster =
      false;

    if (botao) {

      botao.disabled =
        false;

      botao.textContent =
        textoBotao ||
        'Salvar item';
    }
  }
}


/* =========================================================
   FICHA TÉCNICA - BUSCAR FICHA SALVA
========================================================= */

async function buscarFichaTecnicaProduto(
  produtoId
) {

  if (!supabaseClient) {

    return [];
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from('product_ingredients')
      .select(
        `
        id,
        product_id,
        ingredient_id,
        quantity
        `
      )
      .eq(
        'product_id',
        produtoId
      );

  if (error) {

    console.error(
      'Erro ao carregar ficha técnica:',
      error
    );

    throw error;
  }

  return Array.isArray(data)
    ? data
    : [];
}


/* =========================================================
   FICHA TÉCNICA - INSUMOS
========================================================= */

function obterInsumosFichaMaster() {

  const busca =
    normalizarTexto(
      buscaFichaMaster
    );

  return masterProdutos
    .filter(
      item => {

        if (
          item.item_type !==
          'ingredient'
        ) {

          return false;
        }

        if (
          item.active !== true
        ) {

          return false;
        }

        if (!busca) {

          return true;
        }

        const texto =
          normalizarTexto(
            [
              item.name,
              item.product_code,
              item.category,
              item.supplier
            ].join(' ')
          );

        return texto.includes(
          busca
        );
      }
    )
    .sort(
      (a, b) =>
        String(a.name || '')
          .localeCompare(
            String(b.name || ''),
            'pt-BR'
          )
    );
}


/* =========================================================
   FICHA TÉCNICA - CÁLCULOS
========================================================= */

function calcularCustoFichaMaster() {

  let total = 0;

  masterFichaSelecionados.forEach(
    (
      quantidade,
      ingredientId
    ) => {

      const insumo =
        buscarProdutoLocalPorId(
          ingredientId
        );

      if (!insumo) {

        return;
      }

      total +=
        numeroSeguro(
          quantidade
        ) *
        numeroSeguro(
          insumo.average_cost
        );
    }
  );

  return arredondarCusto(
    total
  );
}


function atualizarResumoFichaMaster() {

  if (!masterFichaProduto) {

    return;
  }

  const preco =
    numeroSeguro(
      masterFichaProduto.sale_price
    );

  const custo =
    calcularCustoFichaMaster();

  const lucro =
    preco -
    custo;

  const margem =
    preco > 0
      ? (
          lucro /
          preco
        ) * 100
      : 0;

  const precoElemento =
    byId(
      'masterFichaPrecoVenda'
    );

  const custoElemento =
    byId(
      'masterFichaCustoTotal'
    );

  const lucroElemento =
    byId(
      'masterFichaLucro'
    );

  const margemElemento =
    byId(
      'masterFichaMargem'
    );

  const custoRodape =
    byId(
      'masterFichaCustoRodape'
    );

  if (precoElemento) {

    precoElemento.textContent =
      formatarMoeda(
        preco
      );
  }

  if (custoElemento) {

    custoElemento.textContent =
      formatarMoeda(
        custo
      );
  }

  if (lucroElemento) {

    lucroElemento.textContent =
      formatarMoeda(
        lucro
      );
  }

  if (margemElemento) {

    margemElemento.textContent =
      margem.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }
      ) + '%';
  }

  if (custoRodape) {

    custoRodape.textContent =
      formatarMoeda(
        custo
      );
  }
}


/* =========================================================
   FICHA TÉCNICA - RENDERIZAR
========================================================= */

function renderizarFichaMaster() {

  const container =
    byId(
      'masterFichaListaInsumos'
    );

  if (!container) {

    return;
  }

  const insumos =
    obterInsumosFichaMaster();

  if (
    insumos.length === 0
  ) {

    container.innerHTML =
      `
        <div class="master-empty">
          Nenhum insumo cadastrado.
        </div>
      `;

    atualizarResumoFichaMaster();

    return;
  }

  container.innerHTML =
    insumos
      .map(
        insumo => {

          const selecionado =
            masterFichaSelecionados.has(
              String(insumo.id)
            );

          const quantidade =
            selecionado
              ? numeroSeguro(
                  masterFichaSelecionados.get(
                    String(insumo.id)
                  )
                )
              : 0;

          const custoUnitario =
            numeroSeguro(
              insumo.average_cost
            );

          const custoProporcional =
            quantidade *
            custoUnitario;

          return `

            <div
              class="
                recipe-ingredient-item
                ${
                  selecionado
                    ? 'selected'
                    : ''
                }
              "
              data-recipe-ingredient="${insumo.id}"
            >

              <div class="recipe-ingredient-main">

                <input
                  type="checkbox"
                  class="recipe-check"
                  data-recipe-check="${insumo.id}"
                  ${
                    selecionado
                      ? 'checked'
                      : ''
                  }
                >

                <div class="recipe-ingredient-info">

                  <strong>
                    ${escaparHtml(
                      insumo.name
                    )}
                  </strong>

                  <span>
                    Custo médio:
                    ${formatarMoeda(
                      custoUnitario
                    )}
                    por
                    ${escaparHtml(
                      formatarUnidade(
                        insumo.unit
                      )
                    )}
                  </span>

                </div>

              </div>


              <div class="recipe-quantity-box">

                <input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value="${
                    selecionado
                      ? quantidade
                      : ''
                  }"
                  placeholder="0"
                  data-recipe-quantity="${insumo.id}"
                  ${
                    selecionado
                      ? ''
                      : 'disabled'
                  }
                >

                <span class="recipe-quantity-unit">
                  ${escaparHtml(
                    formatarUnidade(
                      insumo.unit
                    )
                  )}
                </span>

              </div>


              <div class="recipe-ingredient-cost">

                <span>
                  Custo na receita
                </span>

                <strong
                  data-recipe-cost="${insumo.id}"
                >
                  ${formatarMoeda(
                    custoProporcional
                  )}
                </strong>

              </div>

            </div>

          `;
        }
      )
      .join('');

  atualizarResumoFichaMaster();
}


/* =========================================================
   FICHA TÉCNICA - ABRIR
========================================================= */

async function abrirFichaTecnicaMaster(
  produtoId
) {

  const produto =
    buscarProdutoLocalPorId(
      produtoId
    );

  if (!produto) {

    alert(
      'Produto não encontrado.'
    );

    return;
  }

  if (
    produto.item_type !==
    'product'
  ) {

    alert(
      'Ficha técnica disponível apenas para produtos.'
    );

    return;
  }

  masterFichaProduto =
    produto;

  masterFichaSelecionados =
    new Map();

  buscaFichaMaster = '';

  if (
    byId(
      'masterFichaBuscaInsumo'
    )
  ) {

    byId(
      'masterFichaBuscaInsumo'
    ).value =
      '';
  }

  if (
    byId(
      'masterFichaProdutoId'
    )
  ) {

    byId(
      'masterFichaProdutoId'
    ).value =
      produto.id;
  }

  if (
    byId(
      'tituloModalMasterFicha'
    )
  ) {

    byId(
      'tituloModalMasterFicha'
    ).textContent =
      'Ficha Técnica';
  }

  if (
    byId(
      'masterFichaProdutoNome'
    )
  ) {

    byId(
      'masterFichaProdutoNome'
    ).textContent =
      produto.name;
  }

  mostrarMensagemFormulario(
    byId(
      'masterFichaMensagem'
    ),
    ''
  );

  const lista =
    byId(
      'masterFichaListaInsumos'
    );

  if (lista) {

    lista.innerHTML =
      `
        <div class="master-empty">
          Carregando ficha técnica...
        </div>
      `;
  }

  abrirModalMaster(
    byId(
      'modalMasterFicha'
    )
  );

  try {

    const ficha =
      await buscarFichaTecnicaProduto(
        produto.id
      );

    ficha.forEach(
      item => {

        const quantidade =
          numeroSeguro(
            item.quantity
          );

        if (
          quantidade > 0
        ) {

          masterFichaSelecionados.set(
            String(
              item.ingredient_id
            ),
            quantidade
          );
        }
      }
    );

    renderizarFichaMaster();

  } catch (erro) {

    console.error(
      'Erro ao abrir ficha técnica:',
      erro
    );

    if (lista) {

      lista.innerHTML =
        `
          <div class="master-empty">
            Não foi possível carregar a ficha técnica.
          </div>
        `;
    }

    mostrarMensagemFormulario(
      byId(
        'masterFichaMensagem'
      ),
      'Não foi possível carregar a ficha técnica.'
    );
  }
}


/* =========================================================
   FICHA TÉCNICA - INTERAÇÕES
========================================================= */

function configurarEventosFichaMaster() {

  const lista =
    byId(
      'masterFichaListaInsumos'
    );

  if (lista) {

    lista.addEventListener(
      'change',
      evento => {

        const checkbox =
          evento.target.closest(
            '[data-recipe-check]'
          );

        if (checkbox) {

          const ingredientId =
            String(
              checkbox.dataset
                .recipeCheck
            );

          const linha =
            checkbox.closest(
              '.recipe-ingredient-item'
            );

          const input =
            linha?.querySelector(
              '[data-recipe-quantity]'
            );

          if (
            checkbox.checked
          ) {

            let quantidade =
              numeroSeguro(
                input?.value
              );

            if (
              quantidade <= 0
            ) {

              quantidade = 1;
            }

            masterFichaSelecionados.set(
              ingredientId,
              quantidade
            );

            if (input) {

              input.disabled =
                false;

              input.value =
                quantidade;

              setTimeout(
                () => {

                  input.focus();

                  input.select();

                },
                30
              );
            }

          } else {

            masterFichaSelecionados.delete(
              ingredientId
            );

            if (input) {

              input.disabled =
                true;

              input.value =
                '';
            }
          }

          renderizarFichaMaster();

          return;
        }
      }
    );


    lista.addEventListener(
      'input',
      evento => {

        const input =
          evento.target.closest(
            '[data-recipe-quantity]'
          );

        if (!input) {

          return;
        }

        const ingredientId =
          String(
            input.dataset
              .recipeQuantity
          );

        const quantidade =
          numeroSeguro(
            input.value
          );

        if (
          quantidade > 0
        ) {

          masterFichaSelecionados.set(
            ingredientId,
            quantidade
          );

        } else {

          masterFichaSelecionados.set(
            ingredientId,
            0
          );
        }

        const insumo =
          buscarProdutoLocalPorId(
            ingredientId
          );

        const custo =
          quantidade *
          numeroSeguro(
            insumo?.average_cost
          );

        const linha =
          input.closest(
            '.recipe-ingredient-item'
          );

        const custoElemento =
          linha?.querySelector(
            `[data-recipe-cost="${ingredientId}"]`
          );

        if (custoElemento) {

          custoElemento.textContent =
            formatarMoeda(
              custo
            );
        }

        atualizarResumoFichaMaster();
      }
    );
  }


  const busca =
    byId(
      'masterFichaBuscaInsumo'
    );

  if (busca) {

    busca.addEventListener(
      'input',
      () => {

        buscaFichaMaster =
          busca.value || '';

        renderizarFichaMaster();
      }
    );
  }
}


/* =========================================================
   FICHA TÉCNICA - SALVAR
========================================================= */

async function salvarFichaTecnicaMaster(
  evento
) {

  evento.preventDefault();

  if (
    salvandoFichaMaster
  ) {

    return;
  }

  const mensagem =
    byId(
      'masterFichaMensagem'
    );

  mostrarMensagemFormulario(
    mensagem,
    ''
  );

  if (!masterFichaProduto) {

    mostrarMensagemFormulario(
      mensagem,
      'Produto inválido.'
    );

    return;
  }

  const itens = [];

  for (
    const [
      ingredientId,
      quantidade
    ]
    of masterFichaSelecionados.entries()
  ) {

    const quantidadeNumerica =
      numeroSeguro(
        quantidade
      );

    if (
      quantidadeNumerica <= 0
    ) {

      mostrarMensagemFormulario(
        mensagem,
        'Todos os insumos selecionados precisam ter quantidade maior que zero.'
      );

      return;
    }

    itens.push(
      {

        ingredient_id:
          Number(
            ingredientId
          ),

        quantity:
          quantidadeNumerica
      }
    );
  }

  const botao =
    byId(
      'btnSalvarMasterFicha'
    );

  const textoAnterior =
    botao?.textContent ||
    'Salvar ficha técnica';

  try {

    salvandoFichaMaster =
      true;

    if (botao) {

      botao.disabled =
        true;

      botao.textContent =
        'Salvando...';
    }

    mostrarMensagemFormulario(
      mensagem,
      'Salvando ficha técnica...',
      'warning'
    );

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          'save_product_recipe',
          {

            p_product_id:
              Number(
                masterFichaProduto.id
              ),

            p_items:
              itens
          }
        );

    if (error) {

      throw error;
    }

    const novoCusto =
      numeroSeguro(
        data
      );

    mostrarMensagemFormulario(
      mensagem,
      `Ficha salva com sucesso. Custo calculado: ${formatarMoeda(
        novoCusto
      )}`,
      'success'
    );

    await carregarProdutosMaster();

    await carregarDashboard();

    masterFichaProduto =
      buscarProdutoLocalPorId(
        masterFichaProduto.id
      ) ||
      masterFichaProduto;

    atualizarResumoFichaMaster();

    setTimeout(
      () => {

        fecharModalMaster(
          byId(
            'modalMasterFicha'
          )
        );

      },
      700
    );

  } catch (erro) {

    console.error(
      'Erro ao salvar ficha técnica:',
      erro
    );

    let texto =
      'Não foi possível salvar a ficha técnica.';

    if (
      erro?.message
    ) {

      texto =
        erro.message;
    }

    mostrarMensagemFormulario(
      mensagem,
      texto
    );

  } finally {

    salvandoFichaMaster =
      false;

    if (botao) {

      botao.disabled =
        false;

      botao.textContent =
        textoAnterior;
    }
  }
}


/* =========================================================
   ENTRADA DE ESTOQUE
========================================================= */

function calcularPrevisaoEntradaMaster() {

  const produtoId =
    byId(
      'masterEntradaProdutoId'
    )?.value;

  const produto =
    buscarProdutoLocalPorId(
      produtoId
    );

  if (!produto) {

    return;
  }

  const estoqueAtual =
    numeroSeguro(
      produto.stock_quantity
    );

  const custoAtual =
    numeroSeguro(
      produto.average_cost
    );

  const quantidade =
    numeroSeguro(
      byId(
        'masterEntradaQuantidade'
      )?.value
    );

  const custoUnitario =
    numeroSeguro(
      byId(
        'masterEntradaCustoUnitario'
      )?.value
    );

  const novoEstoque =
    estoqueAtual +
    quantidade;

  const totalCompra =
    quantidade *
    custoUnitario;

  let novoCusto =
    custoAtual;

  if (
    quantidade > 0 &&
    novoEstoque > 0
  ) {

    const valorEstoqueAnterior =
      estoqueAtual *
      custoAtual;

    novoCusto =
      (
        valorEstoqueAnterior +
        totalCompra
      ) /
      novoEstoque;
  }

  novoCusto =
    arredondarCusto(
      novoCusto
    );

  if (
    byId(
      'masterEntradaNovoEstoque'
    )
  ) {

    byId(
      'masterEntradaNovoEstoque'
    ).textContent =
      `${formatarQuantidade(
        novoEstoque
      )} ${formatarUnidade(
        produto.unit
      )}`;
  }

  if (
    byId(
      'masterEntradaNovoCusto'
    )
  ) {

    byId(
      'masterEntradaNovoCusto'
    ).textContent =
      formatarMoeda(
        novoCusto
      );
  }

  if (
    byId(
      'masterEntradaTotalCompra'
    )
  ) {

    byId(
      'masterEntradaTotalCompra'
    ).textContent =
      formatarMoeda(
        totalCompra
      );
  }
}


function abrirEntradaEstoqueMaster(id) {

  const produto =
    buscarProdutoLocalPorId(id);

  if (!produto) {

    alert(
      'Item não encontrado.'
    );

    return;
  }

  if (
    produto.stock_control !== true
  ) {

    alert(
      'Este item não possui controle de estoque.'
    );

    return;
  }

  const form =
    byId(
      'formMasterEntrada'
    );

  if (form) {

    form.reset();
  }

  byId(
    'masterEntradaProdutoId'
  ).value =
    produto.id;

  if (
    byId(
      'masterEntradaProdutoNome'
    )
  ) {

    byId(
      'masterEntradaProdutoNome'
    ).textContent =
      `${produto.name} • ${formatarUnidade(
        produto.unit
      )}`;
  }

  if (
    byId(
      'masterEntradaEstoqueAtual'
    )
  ) {

    byId(
      'masterEntradaEstoqueAtual'
    ).textContent =
      `${formatarQuantidade(
        produto.stock_quantity
      )} ${formatarUnidade(
        produto.unit
      )}`;
  }

  if (
    byId(
      'masterEntradaCustoAtual'
    )
  ) {

    byId(
      'masterEntradaCustoAtual'
    ).textContent =
      formatarMoeda(
        produto.average_cost
      );
  }

  mostrarMensagemFormulario(
    byId(
      'masterEntradaMensagem'
    ),
    ''
  );

  calcularPrevisaoEntradaMaster();

  abrirModalMaster(
    byId(
      'modalMasterEntrada'
    )
  );

  setTimeout(
    () => {

      byId(
        'masterEntradaQuantidade'
      )?.focus();

    },
    100
  );
}


/* =========================================================
   SALVAR ENTRADA DE ESTOQUE
========================================================= */

async function salvarEntradaEstoqueMaster(
  evento
) {

  evento.preventDefault();

  if (
    salvandoEntradaMaster
  ) {

    return;
  }

  const mensagem =
    byId(
      'masterEntradaMensagem'
    );

  mostrarMensagemFormulario(
    mensagem,
    ''
  );

  const produtoId =
    String(
      byId(
        'masterEntradaProdutoId'
      )?.value || ''
    ).trim();

  const quantidade =
    numeroSeguro(
      byId(
        'masterEntradaQuantidade'
      )?.value
    );

  const custoUnitario =
    numeroSeguro(
      byId(
        'masterEntradaCustoUnitario'
      )?.value
    );

  const observacao =
    String(
      byId(
        'masterEntradaObservacao'
      )?.value || ''
    ).trim();

  if (!produtoId) {

    mostrarMensagemFormulario(
      mensagem,
      'Produto inválido.'
    );

    return;
  }

  if (
    quantidade <= 0
  ) {

    mostrarMensagemFormulario(
      mensagem,
      'Informe uma quantidade maior que zero.'
    );

    return;
  }

  if (
    custoUnitario < 0
  ) {

    mostrarMensagemFormulario(
      mensagem,
      'O custo unitário não pode ser negativo.'
    );

    return;
  }

  const botao =
    byId(
      'btnSalvarMasterEntrada'
    );

  const textoBotao =
    botao?.textContent || '';

  try {

    salvandoEntradaMaster =
      true;

    if (botao) {

      botao.disabled =
        true;

      botao.textContent =
        'Registrando...';
    }

    mostrarMensagemFormulario(
      mensagem,
      'Registrando entrada...',
      'warning'
    );

    const {
      data:
        produtoAtual,
      error:
        erroProduto
    } =
      await supabaseClient
        .from('products')
        .select(
          `
          id,
          name,
          average_cost,
          stock_quantity,
          stock_control,
          unit
          `
        )
        .eq(
          'id',
          produtoId
        )
        .single();

    if (erroProduto) {

      throw erroProduto;
    }

    if (
      produtoAtual.stock_control !==
      true
    ) {

      throw new Error(
        'O controle de estoque deste item está desativado.'
      );
    }

    const estoqueAnterior =
      numeroSeguro(
        produtoAtual.stock_quantity
      );

    const custoAnterior =
      numeroSeguro(
        produtoAtual.average_cost
      );

    const estoqueDepois =
      estoqueAnterior +
      quantidade;

    const valorAnterior =
      estoqueAnterior *
      custoAnterior;

    const totalCompra =
      quantidade *
      custoUnitario;

    const novoCusto =
      arredondarCusto(
        estoqueDepois > 0
          ? (
              valorAnterior +
              totalCompra
            ) /
            estoqueDepois
          : custoUnitario
      );

    const {
      data:
        produtoAtualizado,
      error:
        erroAtualizacao
    } =
      await supabaseClient
        .from('products')
        .update(
          {

            stock_quantity:
              estoqueDepois,

            average_cost:
              novoCusto,

            updated_at:
              new Date()
                .toISOString()
          }
        )
        .eq(
          'id',
          produtoId
        )
        .eq(
          'stock_quantity',
          estoqueAnterior
        )
        .select(
          'id, stock_quantity, average_cost'
        )
        .maybeSingle();

    if (erroAtualizacao) {

      throw erroAtualizacao;
    }

    if (!produtoAtualizado) {

      throw new Error(
        'O estoque foi alterado por outra operação. Tente novamente.'
      );
    }

    const {
      error:
        erroMovimento
    } =
      await supabaseClient
        .from('stock_movements')
        .insert(
          {

            product_id:
              produtoId,

            movement_type:
              'entrada',

            quantity:
              quantidade,

            unit_cost:
              custoUnitario,

            total_cost:
              totalCompra,

            stock_before:
              estoqueAnterior,

            stock_after:
              estoqueDepois,

            average_cost_before:
              custoAnterior,

            average_cost_after:
              novoCusto,

            notes:
              observacao ||
              'Entrada de estoque pelo Painel Master.',

            created_by:
              masterUsuario?.id ||
              null
          }
        );

    if (erroMovimento) {

      console.error(
        'Falha ao registrar movimentação:',
        erroMovimento
      );

      throw new Error(
        'O estoque foi atualizado, mas houve erro ao gravar o histórico.'
      );
    }

    mostrarMensagemFormulario(
      mensagem,
      `Entrada registrada. Novo estoque: ${formatarQuantidade(
        estoqueDepois
      )} ${formatarUnidade(
        produtoAtual.unit
      )} • Custo médio: ${formatarMoeda(
        novoCusto
      )}`,
      'success'
    );

    await carregarProdutosMaster();

    await carregarEstoqueMaster();

    await carregarDashboard();

    setTimeout(
      () => {

        fecharModalMaster(
          byId(
            'modalMasterEntrada'
          )
        );

      },
      650
    );

  } catch (erro) {

    console.error(
      'Erro na entrada de estoque:',
      erro
    );

    mostrarMensagemFormulario(
      mensagem,
      erro?.message ||
      'Não foi possível registrar a entrada.'
    );

  } finally {

    salvandoEntradaMaster =
      false;

    if (botao) {

      botao.disabled =
        false;

      botao.textContent =
        textoBotao ||
        'Registrar entrada';
    }
  }
}


/* =========================================================
   DESPESAS - LABELS
========================================================= */

function obterLabelCategoriaDespesa(categoria) {

  const labels = {

    insumos:
      'Insumos',

    embalagens:
      'Embalagens',

    gas:
      'Gás',

    energia:
      'Energia',

    agua:
      'Água',

    internet:
      'Internet',

    manutencao:
      'Manutenção',

    entrega:
      'Entrega',

    taxas:
      'Taxas',

    marketing:
      'Marketing',

    outros:
      'Outros'
  };

  return labels[categoria] ||
    categoria ||
    'Outros';
}


function obterLabelPagamentoDespesa(pagamento) {

  const labels = {

    dinheiro:
      'Dinheiro',

    pix:
      'PIX',

    debito:
      'Débito',

    credito:
      'Crédito',

    boleto:
      'Boleto',

    transferencia:
      'Transferência',

    outros:
      'Outros'
  };

  return labels[pagamento] ||
    'Não informado';
}


/* =========================================================
   DESPESAS - BUSCAR
========================================================= */

async function buscarDespesasMaster() {

  if (!supabaseClient) {

    return [];
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from('expenses')
      .select(
        `
        id,
        description,
        category,
        amount,
        expense_date,
        notes,
        created_by,
        created_at,
        payment_method,
        active,
        updated_at
        `
      )
      .order(
        'expense_date',
        {
          ascending: false
        }
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      'Erro ao carregar despesas:',
      error
    );

    throw error;
  }

  return Array.isArray(data)
    ? data
    : [];
}


/* =========================================================
   DESPESAS - FILTRO DE PERÍODO
========================================================= */

function despesaDentroDoPeriodo(
  despesa,
  periodo
) {

  if (
    !periodo ||
    periodo === 'all'
  ) {

    return true;
  }

  const valorData =
    String(
      despesa?.expense_date ||
      ''
    );

  if (!valorData) {

    return false;
  }

  const partes =
    valorData
      .split('-')
      .map(Number);

  if (
    partes.length !== 3
  ) {

    return false;
  }

  const dataDespesa =
    new Date(
      partes[0],
      partes[1] - 1,
      partes[2],
      0,
      0,
      0,
      0
    );

  const hoje =
    new Date();

  hoje.setHours(
    0,
    0,
    0,
    0
  );

  if (
    periodo === 'today'
  ) {

    return (
      dataDespesa.getTime() ===
      hoje.getTime()
    );
  }

  if (
    periodo === 'month'
  ) {

    return (
      dataDespesa.getFullYear() ===
        hoje.getFullYear() &&
      dataDespesa.getMonth() ===
        hoje.getMonth()
    );
  }

  const dias =
    Number(periodo);

  if (
    Number.isFinite(dias) &&
    dias > 0
  ) {

    const inicio =
      new Date(hoje);

    inicio.setDate(
      inicio.getDate() -
      (dias - 1)
    );

    return (
      dataDespesa >= inicio &&
      dataDespesa <= hoje
    );
  }

  return true;
}


function obterDespesasFiltradasMaster() {

  const busca =
    normalizarTexto(
      buscaDespesaMaster
    );

  return masterDespesas
    .filter(
      despesa => {

        if (
          filtroCategoriaDespesaMaster !==
            'all' &&
          despesa.category !==
            filtroCategoriaDespesaMaster
        ) {

          return false;
        }

        if (
          !despesaDentroDoPeriodo(
            despesa,
            filtroPeriodoDespesaMaster
          )
        ) {

          return false;
        }

        if (!busca) {

          return true;
        }

        const texto =
          normalizarTexto(
            [
              despesa.description,
              obterLabelCategoriaDespesa(
                despesa.category
              ),
              obterLabelPagamentoDespesa(
                despesa.payment_method
              ),
              despesa.notes
            ].join(' ')
          );

        return texto.includes(
          busca
        );
      }
    );
}


/* =========================================================
   DESPESAS - RESUMO
========================================================= */

function atualizarResumoDespesasMaster(
  despesasFiltradas
) {

  const ativas =
    despesasFiltradas.filter(
      despesa =>
        despesa.active === true
    );

  const total =
    ativas.reduce(
      (
        acumulado,
        despesa
      ) =>
        acumulado +
        numeroSeguro(
          despesa.amount
        ),
      0
    );

  const quantidade =
    ativas.length;

  const media =
    quantidade > 0
      ? total / quantidade
      : 0;

  const categorias = {};

  ativas.forEach(
    despesa => {

      const categoria =
        despesa.category ||
        'outros';

      categorias[categoria] =
        numeroSeguro(
          categorias[categoria]
        ) +
        numeroSeguro(
          despesa.amount
        );
    }
  );

  const maiorCategoria =
    Object.entries(
      categorias
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  if (
    byId(
      'masterDespesasTotal'
    )
  ) {

    byId(
      'masterDespesasTotal'
    ).textContent =
      formatarMoeda(
        total
      );
  }

  if (
    byId(
      'masterDespesasQuantidade'
    )
  ) {

    byId(
      'masterDespesasQuantidade'
    ).textContent =
      formatarNumero(
        quantidade
      );
  }

  if (
    byId(
      'masterDespesasMaiorCategoria'
    )
  ) {

    byId(
      'masterDespesasMaiorCategoria'
    ).textContent =
      maiorCategoria
        ? obterLabelCategoriaDespesa(
            maiorCategoria[0]
          )
        : '-';
  }

  if (
    byId(
      'masterDespesasMedia'
    )
  ) {

    byId(
      'masterDespesasMedia'
    ).textContent =
      formatarMoeda(
        media
      );
  }
}


/* =========================================================
   DESPESAS - RENDERIZAR
========================================================= */

function renderizarDespesasMaster() {

  const tbody =
    byId(
      'masterListaDespesas'
    );

  if (!tbody) {

    return;
  }

  const despesas =
    obterDespesasFiltradasMaster();

  atualizarResumoDespesasMaster(
    despesas
  );

  if (
    despesas.length === 0
  ) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="8"
            class="table-empty"
          >
            Nenhuma despesa encontrada.
          </td>
        </tr>
      `;

    return;
  }

  tbody.innerHTML =
    despesas
      .map(
        despesa => `

          <tr>

            <td>
              ${formatarData(
                despesa.expense_date
              )}
            </td>

            <td>

              <div class="expense-description">

                <strong>
                  ${escaparHtml(
                    despesa.description
                  )}
                </strong>

              </div>

            </td>

            <td>

              <span class="expense-category-badge">
                ${escaparHtml(
                  obterLabelCategoriaDespesa(
                    despesa.category
                  )
                )}
              </span>

            </td>

            <td>

              <span class="expense-payment-badge">
                ${escaparHtml(
                  obterLabelPagamentoDespesa(
                    despesa.payment_method
                  )
                )}
              </span>

            </td>

            <td>

              <strong class="expense-value">
                ${formatarMoeda(
                  despesa.amount
                )}
              </strong>

            </td>

            <td>

              <span class="expense-note">
                ${escaparHtml(
                  despesa.notes ||
                  '-'
                )}
              </span>

            </td>

            <td>

              <span
                class="
                  expense-status-badge
                  ${
                    despesa.active === true
                      ? 'active'
                      : 'inactive'
                  }
                "
              >
                ${
                  despesa.active === true
                    ? 'Ativa'
                    : 'Inativa'
                }
              </span>

            </td>

            <td>

              <div class="expense-actions">

                <button
                  type="button"
                  class="expense-action-btn edit"
                  data-expense-edit="${despesa.id}"
                >
                  Editar
                </button>

                <button
                  type="button"
                  class="expense-action-btn toggle"
                  data-expense-toggle="${despesa.id}"
                >
                  ${
                    despesa.active === true
                      ? 'Desativar'
                      : 'Ativar'
                  }
                </button>

                <button
                  type="button"
                  class="expense-action-btn delete"
                  data-expense-delete="${despesa.id}"
                >
                  Excluir
                </button>

              </div>

            </td>

          </tr>

        `
      )
      .join('');
}


/* =========================================================
   DESPESAS - CARREGAR
========================================================= */

async function carregarDespesasMaster() {

  const tbody =
    byId(
      'masterListaDespesas'
    );

  if (tbody) {

    tbody.innerHTML =
      `
        <tr>
          <td
            colspan="8"
            class="table-empty"
          >
            Carregando despesas...
          </td>
        </tr>
      `;
  }

  try {

    masterDespesas =
      await buscarDespesasMaster();

    renderizarDespesasMaster();

  } catch (erro) {

    console.error(
      'Erro ao carregar Despesas:',
      erro
    );

    if (tbody) {

      tbody.innerHTML =
        `
          <tr>
            <td
              colspan="8"
              class="table-empty"
            >
              Não foi possível carregar as despesas.
            </td>
          </tr>
        `;
    }
  }
}


/* =========================================================
   DESPESAS - NOVA / EDITAR
========================================================= */

function limparFormularioDespesaMaster() {

  const form =
    byId(
      'formMasterDespesa'
    );

  form?.reset();

  if (
    byId(
      'masterDespesaId'
    )
  ) {

    byId(
      'masterDespesaId'
    ).value =
      '';
  }

  if (
    byId(
      'masterDespesaData'
    )
  ) {

    byId(
      'masterDespesaData'
    ).value =
      dataHojeISO();
  }

  if (
    byId(
      'masterDespesaAtiva'
    )
  ) {

    byId(
      'masterDespesaAtiva'
    ).checked =
      true;
  }

  mostrarMensagemFormulario(
    byId(
      'masterDespesaMensagem'
    ),
    ''
  );
}


function abrirNovaDespesaMaster() {

  limparFormularioDespesaMaster();

  if (
    byId(
      'tituloModalMasterDespesa'
    )
  ) {

    byId(
      'tituloModalMasterDespesa'
    ).textContent =
      'Nova despesa';
  }

  if (
    byId(
      'btnSalvarMasterDespesa'
    )
  ) {

    byId(
      'btnSalvarMasterDespesa'
    ).textContent =
      'Salvar despesa';
  }

  abrirModalMaster(
    byId(
      'modalMasterDespesa'
    )
  );

  setTimeout(
    () => {

      byId(
        'masterDespesaDescricao'
      )?.focus();

    },
    100
  );
}


function buscarDespesaLocalPorId(id) {

  return masterDespesas.find(
    despesa =>
      String(despesa.id) ===
      String(id)
  ) || null;
}


function abrirEditarDespesaMaster(id) {

  const despesa =
    buscarDespesaLocalPorId(
      id
    );

  if (!despesa) {

    alert(
      'Despesa não encontrada.'
    );

    return;
  }

  limparFormularioDespesaMaster();

  byId(
    'masterDespesaId'
  ).value =
    despesa.id;

  byId(
    'masterDespesaDescricao'
  ).value =
    despesa.description ||
    '';

  byId(
    'masterDespesaData'
  ).value =
    despesa.expense_date ||
    dataHojeISO();

  byId(
    'masterDespesaCategoria'
  ).value =
    despesa.category ||
    'outros';

  byId(
    'masterDespesaValor'
  ).value =
    numeroSeguro(
      despesa.amount
    );

  byId(
    'masterDespesaPagamento'
  ).value =
    despesa.payment_method ||
    '';

  byId(
    'masterDespesaObservacoes'
  ).value =
    despesa.notes ||
    '';

  byId(
    'masterDespesaAtiva'
  ).checked =
    despesa.active === true;

  byId(
    'tituloModalMasterDespesa'
  ).textContent =
    'Editar despesa';

  byId(
    'btnSalvarMasterDespesa'
  ).textContent =
    'Salvar alterações';

  abrirModalMaster(
    byId(
      'modalMasterDespesa'
    )
  );
}


/* =========================================================
   DESPESAS - SALVAR
========================================================= */

async function salvarDespesaMaster(evento) {

  evento.preventDefault();

  if (
    salvandoDespesaMaster
  ) {

    return;
  }

  const mensagem =
    byId(
      'masterDespesaMensagem'
    );

  mostrarMensagemFormulario(
    mensagem,
    ''
  );

  const id =
    String(
      byId(
        'masterDespesaId'
      )?.value ||
      ''
    ).trim();

  const editando =
    Boolean(id);

  const descricao =
    String(
      byId(
        'masterDespesaDescricao'
      )?.value ||
      ''
    ).trim();

  const dataDespesa =
    String(
      byId(
        'masterDespesaData'
      )?.value ||
      ''
    ).trim();

  const categoria =
    String(
      byId(
        'masterDespesaCategoria'
      )?.value ||
      ''
    ).trim();

  const valor =
    numeroSeguro(
      byId(
        'masterDespesaValor'
      )?.value
    );

  const pagamento =
    String(
      byId(
        'masterDespesaPagamento'
      )?.value ||
      ''
    ).trim();

  const observacoes =
    String(
      byId(
        'masterDespesaObservacoes'
      )?.value ||
      ''
    ).trim();

  const ativa =
    byId(
      'masterDespesaAtiva'
    )?.checked === true;

  if (!descricao) {

    mostrarMensagemFormulario(
      mensagem,
      'Informe a descrição da despesa.'
    );

    return;
  }

  if (!dataDespesa) {

    mostrarMensagemFormulario(
      mensagem,
      'Informe a data da despesa.'
    );

    return;
  }

  if (!categoria) {

    mostrarMensagemFormulario(
      mensagem,
      'Selecione a categoria da despesa.'
    );

    return;
  }

  if (
    valor <= 0
  ) {

    mostrarMensagemFormulario(
      mensagem,
      'Informe um valor maior que zero.'
    );

    return;
  }

  const payload = {

    description:
      descricao,

    category:
      categoria,

    amount:
      valor,

    expense_date:
      dataDespesa,

    payment_method:
      pagamento ||
      null,

    notes:
      observacoes ||
      null,

    active:
      ativa
  };

  if (!editando) {

    payload.created_by =
      masterUsuario?.id ||
      null;
  }

  const botao =
    byId(
      'btnSalvarMasterDespesa'
    );

  const textoAnterior =
    botao?.textContent ||
    'Salvar despesa';

  try {

    salvandoDespesaMaster =
      true;

    if (botao) {

      botao.disabled =
        true;

      botao.textContent =
        'Salvando...';
    }

    mostrarMensagemFormulario(
      mensagem,
      'Salvando despesa...',
      'warning'
    );

    if (editando) {

      const {
        error
      } =
        await supabaseClient
          .from('expenses')
          .update(
            payload
          )
          .eq(
            'id',
            id
          );

      if (error) {

        throw error;
      }

    } else {

      const {
        error
      } =
        await supabaseClient
          .from('expenses')
          .insert(
            payload
          );

      if (error) {

        throw error;
      }
    }

    mostrarMensagemFormulario(
      mensagem,
      editando
        ? 'Despesa atualizada com sucesso.'
        : 'Despesa cadastrada com sucesso.',
      'success'
    );

    await carregarDespesasMaster();

    setTimeout(
      () => {

        fecharModalMaster(
          byId(
            'modalMasterDespesa'
          )
        );

      },
      450
    );

  } catch (erro) {

    console.error(
      'Erro ao salvar despesa:',
      erro
    );

    mostrarMensagemFormulario(
      mensagem,
      erro?.message ||
      'Não foi possível salvar a despesa.'
    );

  } finally {

    salvandoDespesaMaster =
      false;

    if (botao) {

      botao.disabled =
        false;

      botao.textContent =
        textoAnterior;
    }
  }
}


/* =========================================================
   DESPESAS - ATIVAR / DESATIVAR
========================================================= */

async function alternarStatusDespesaMaster(id) {

  const despesa =
    buscarDespesaLocalPorId(
      id
    );

  if (!despesa) {

    return;
  }

  const novoStatus =
    despesa.active !== true;

  try {

    const {
      error
    } =
      await supabaseClient
        .from('expenses')
        .update(
          {
            active:
              novoStatus
          }
        )
        .eq(
          'id',
          despesa.id
        );

    if (error) {

      throw error;
    }

    await carregarDespesasMaster();

  } catch (erro) {

    console.error(
      'Erro ao alterar status da despesa:',
      erro
    );

    alert(
      erro?.message ||
      'Não foi possível alterar o status da despesa.'
    );
  }
}


/* =========================================================
   DESPESAS - EXCLUIR
========================================================= */

async function excluirDespesaMaster(id) {

  const despesa =
    buscarDespesaLocalPorId(
      id
    );

  if (!despesa) {

    return;
  }

  const confirmar =
    confirm(
      `Excluir a despesa "${despesa.description}"?\n\nEsta ação remove o lançamento definitivamente.`
    );

  if (!confirmar) {

    return;
  }

  try {

    const {
      error
    } =
      await supabaseClient
        .from('expenses')
        .delete()
        .eq(
          'id',
          despesa.id
        );

    if (error) {

      throw error;
    }

    await carregarDespesasMaster();

  } catch (erro) {

    console.error(
      'Erro ao excluir despesa:',
      erro
    );

    alert(
      erro?.message ||
      'Não foi possível excluir a despesa.'
    );
  }
}


/* =========================================================
   DESPESAS - FILTROS
========================================================= */

function configurarFiltrosDespesasMaster() {

  const busca =
    byId(
      'masterBuscaDespesa'
    );

  if (busca) {

    busca.addEventListener(
      'input',
      () => {

        buscaDespesaMaster =
          busca.value ||
          '';

        renderizarDespesasMaster();
      }
    );
  }

  const periodo =
    byId(
      'masterFiltroPeriodoDespesa'
    );

  if (periodo) {

    periodo.addEventListener(
      'change',
      () => {

        filtroPeriodoDespesaMaster =
          periodo.value ||
          'all';

        renderizarDespesasMaster();
      }
    );
  }

  const categoria =
    byId(
      'masterFiltroCategoriaDespesa'
    );

  if (categoria) {

    categoria.addEventListener(
      'change',
      () => {

        filtroCategoriaDespesaMaster =
          categoria.value ||
          'all';

        renderizarDespesasMaster();
      }
    );
  }
}


/* =========================================================
   DESPESAS - EVENTOS DA TABELA
========================================================= */

function configurarEventosDespesasMaster() {

  const tabela =
    byId(
      'masterListaDespesas'
    );

  if (!tabela) {

    return;
  }

  tabela.addEventListener(
    'click',
    evento => {

      const editar =
        evento.target.closest(
          '[data-expense-edit]'
        );

      if (editar) {

        abrirEditarDespesaMaster(
          editar.dataset
            .expenseEdit
        );

        return;
      }

      const alternar =
        evento.target.closest(
          '[data-expense-toggle]'
        );

      if (alternar) {

        alternarStatusDespesaMaster(
          alternar.dataset
            .expenseToggle
        );

        return;
      }

      const excluir =
        evento.target.closest(
          '[data-expense-delete]'
        );

      if (excluir) {

        excluirDespesaMaster(
          excluir.dataset
            .expenseDelete
        );
      }
    }
  );
}


/* =========================================================
   FILTROS DE PRODUTOS
========================================================= */

function configurarFiltrosProdutosMaster() {

  const busca =
    byId(
      'masterBuscaProduto'
    );

  if (busca) {

    busca.addEventListener(
      'input',
      () => {

        buscaProdutoMaster =
          busca.value || '';

        renderizarProdutosMaster();
      }
    );
  }

  document
    .querySelectorAll(
      '.product-filter-btn'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          () => {

            document
              .querySelectorAll(
                '.product-filter-btn'
              )
              .forEach(
                item => {

                  item.classList.remove(
                    'active'
                  );
                }
              );

            botao.classList.add(
              'active'
            );

            filtroProdutoMaster =
              botao.dataset
                .productFilter ||
              'all';

            renderizarProdutosMaster();
          }
        );
      }
    );
}


/* =========================================================
   EVENTOS DA LISTA DE PRODUTOS
========================================================= */

function configurarEventosListaProdutos() {

  const lista =
    byId(
      'masterListaProdutos'
    );

  if (!lista) {

    return;
  }

  lista.addEventListener(
    'click',
    evento => {

      const botaoFicha =
        evento.target.closest(
          '[data-master-recipe]'
        );

      if (botaoFicha) {

        abrirFichaTecnicaMaster(
          botaoFicha.dataset
            .masterRecipe
        );

        return;
      }


      const botaoEditar =
        evento.target.closest(
          '[data-master-edit-product]'
        );

      if (botaoEditar) {

        abrirEditarProdutoMaster(
          botaoEditar.dataset
            .masterEditProduct
        );

        return;
      }


      const botaoEntrada =
        evento.target.closest(
          '[data-master-stock-entry]'
        );

      if (botaoEntrada) {

        abrirEntradaEstoqueMaster(
          botaoEntrada.dataset
            .masterStockEntry
        );
      }
    }
  );
}


/* =========================================================
   CONFIGURAR MODAIS
========================================================= */

function configurarModaisMaster() {

  document
    .querySelectorAll(
      '[data-close-master-modal]'
    )
    .forEach(
      botao => {

        botao.addEventListener(
          'click',
          () => {

            fecharModalPorNome(
              botao.dataset
                .closeMasterModal
            );
          }
        );
      }
    );

  document.addEventListener(
    'keydown',
    evento => {

      if (
        evento.key !== 'Escape'
      ) {

        return;
      }

      const modalAberto =
        document.querySelector(
          '.master-modal:not(.hidden)'
        );

      if (modalAberto) {

        fecharModalMaster(
          modalAberto
        );
      }
    }
  );
}


/* =========================================================
   BOTÕES MASTER
========================================================= */

function configurarBotoesMaster() {

  const btnEntrada =
    byId(
      'btnNovaEntradaEstoque'
    );

  const btnProduto =
    byId(
      'btnNovoProduto'
    );

  const btnDespesa =
    byId(
      'btnNovaDespesa'
    );

  if (btnProduto) {

    btnProduto.addEventListener(
      'click',
      abrirNovoProdutoMaster
    );
  }

  if (btnEntrada) {

    btnEntrada.addEventListener(
      'click',
      iniciarNovaEntradaPelaPaginaEstoqueMaster
    );
  }

  if (btnDespesa) {

    btnDespesa.addEventListener(
      'click',
      abrirNovaDespesaMaster
    );
  }
}


/* =========================================================
   FORMULÁRIOS
========================================================= */

function configurarFormulariosMaster() {

  const formProduto =
    byId(
      'formMasterProduto'
    );

  const formEntrada =
    byId(
      'formMasterEntrada'
    );

  const formFicha =
    byId(
      'formMasterFicha'
    );

  const formDespesa =
    byId(
      'formMasterDespesa'
    );

  if (formProduto) {

    formProduto.addEventListener(
      'submit',
      salvarProdutoMaster
    );
  }

  if (formEntrada) {

    formEntrada.addEventListener(
      'submit',
      salvarEntradaEstoqueMaster
    );
  }

  if (formFicha) {

    formFicha.addEventListener(
      'submit',
      salvarFichaTecnicaMaster
    );
  }


  if (formDespesa) {

    formDespesa.addEventListener(
      'submit',
      salvarDespesaMaster
    );
  }

  document
    .querySelectorAll(
      'input[name="masterItemType"]'
    )
    .forEach(
      radio => {

        radio.addEventListener(
          'change',
          atualizarFormularioPorTipo
        );
      }
    );

  const quantidadeEntrada =
    byId(
      'masterEntradaQuantidade'
    );

  const custoEntrada =
    byId(
      'masterEntradaCustoUnitario'
    );

  if (quantidadeEntrada) {

    quantidadeEntrada.addEventListener(
      'input',
      calcularPrevisaoEntradaMaster
    );
  }

  if (custoEntrada) {

    custoEntrada.addEventListener(
      'input',
      calcularPrevisaoEntradaMaster
    );
  }
}


/* =========================================================
   EVENTOS GERAIS
========================================================= */

function configurarEventosMaster() {

  const btnSair =
    byId(
      'btnMasterSair'
    );

  const btnAtualizar =
    byId(
      'btnAtualizarMaster'
    );

  if (btnSair) {

    btnSair.addEventListener(
      'click',
      sairMaster
    );
  }

  if (btnAtualizar) {

    btnAtualizar.addEventListener(
      'click',
      async () => {

        await Promise.all(
          [
            carregarDashboard(),
            carregarFinanceiroMaster(),
            carregarEstoqueMaster(),
            carregarProdutosMaster(),
            carregarDespesasMaster(),
            carregarRelatoriosMaster()
          ]
        );
      }
    );
  }

  configurarNavegacao();

  configurarFiltroPeriodo();

  configurarFinanceiroMaster();

  configurarRelatoriosMaster();

  configurarBotoesMaster();

  configurarFiltrosEstoqueMaster();

  configurarEventosEstoqueMaster();

  configurarFiltrosProdutosMaster();

  configurarEventosListaProdutos();

  configurarEventosFichaMaster();

  configurarFiltrosDespesasMaster();

  configurarEventosDespesasMaster();

  configurarModaisMaster();

  configurarFormulariosMaster();
}


/* =========================================================
   MONITORAR SESSÃO
========================================================= */

function monitorarSessaoMaster() {

  if (!supabaseClient) {

    return;
  }

  supabaseClient.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {

        console.log(
          'Master Auth:',
          event
        );

        if (
          event === 'SIGNED_OUT' ||
          !session
        ) {

          window.location.href =
            'master-login.html';
        }
      }
    );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarMaster() {

  esconderPainelMaster();

  atualizarRelogioMaster();

  const acessoLiberado =
    await validarAcessoMaster();

  if (!acessoLiberado) {

    return;
  }

  configurarEventosMaster();

  monitorarSessaoMaster();

  mostrarPainelMaster();

  await Promise.all(
    [
      carregarDashboard(),
      carregarFinanceiroMaster(),
      carregarEstoqueMaster(),
      carregarProdutosMaster(),
      carregarDespesasMaster(),
      carregarRelatoriosMaster()
    ]
  );

  setInterval(
    atualizarRelogioMaster,
    1000
  );
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    iniciarMaster()
      .catch(
        erro => {

          console.error(
            'Erro ao iniciar Painel Master:',
            erro
          );

          window.location.href =
            'master-login.html';
        }
      );
  }
);
