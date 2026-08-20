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

let masterProdutos = [];

let filtroProdutoMaster = 'all';
let buscaProdutoMaster = '';

let masterFichaProduto = null;
let masterFichaSelecionados = new Map();
let buscaFichaMaster = '';


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

  const {
    data,
    error
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
      .gte(
        'created_at',
        inicio.toISOString()
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      'Erro ao carregar dados financeiros:',
      error
    );

    return [];
  }

  return Array.isArray(data)
    ? data
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
      async () => {

        abrirPaginaMaster(
          'produtos'
        );

        await carregarProdutosMaster();
      }
    );
  }

  if (btnDespesa) {

    btnDespesa.addEventListener(
      'click',
      () => {

        alert(
          'O cadastro de despesas será criado na próxima etapa.'
        );
      }
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

        await carregarDashboard();

        await carregarProdutosMaster();
      }
    );
  }

  configurarNavegacao();

  configurarFiltroPeriodo();

  configurarBotoesMaster();

  configurarFiltrosProdutosMaster();

  configurarEventosListaProdutos();

  configurarEventosFichaMaster();

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
      carregarProdutosMaster()
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
