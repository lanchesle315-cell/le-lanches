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


/* =========================================================
   UTILITÁRIOS
========================================================= */

function byId(
  id
) {

  return document.getElementById(
    id
  );
}


function escaparHtml(
  texto
) {

  return String(
    texto ?? ''
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function formatarMoeda(
  valor
) {

  return Number(
    valor || 0
  ).toLocaleString(
    'pt-BR',
    {
      style:
        'currency',

      currency:
        'BRL'
    }
  );
}


function formatarNumero(
  valor
) {

  return Number(
    valor || 0
  ).toLocaleString(
    'pt-BR'
  );
}


function formatarQuantidade(
  valor
) {

  const numero =
    Number(
      valor || 0
    );

  if (
    Number.isInteger(
      numero
    )
  ) {

    return String(
      numero
    );
  }

  return numero
    .toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          3
      }
    );
}


function formatarDataHora(
  valor
) {

  if (
    !valor
  ) {

    return '-';
  }

  const data =
    new Date(
      valor
    );

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


/* =========================================================
   CARREGAMENTO DA PÁGINA
========================================================= */

function mostrarPainelMaster() {

  const loading =
    byId(
      'masterLoading'
    );

  const app =
    byId(
      'masterApp'
    );


  if (
    loading
  ) {

    loading.style.display =
      'none';
  }


  if (
    app
  ) {

    app.classList.remove(
      'hidden'
    );

    app.style.display =
      '';
  }
}


function esconderPainelMaster() {

  const app =
    byId(
      'masterApp'
    );


  if (
    app
  ) {

    app.classList.add(
      'hidden'
    );
  }
}


/* =========================================================
   LOGIN / SESSÃO
========================================================= */

async function buscarPerfilMaster(
  userId
) {

  if (
    !supabaseClient
  ) {

    throw new Error(
      'Supabase não configurado.'
    );
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'profiles'
      )
      .select(
        'id, full_name, role, active'
      )
      .eq(
        'id',
        userId
      )
      .single();


  if (
    error
  ) {

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


function perfilEhMaster(
  perfil
) {

  return (
    perfil &&
    perfil.role === 'master' &&
    perfil.active === true
  );
}


async function validarAcessoMaster() {

  if (
    !supabaseClient
  ) {

    window.location.href =
      'master-login.html';

    return false;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (
      error
    ) {

      console.error(
        'Erro ao recuperar sessão:',
        error
      );

      throw error;
    }


    const sessao =
      data?.session;


    if (
      !sessao?.user
    ) {

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

      await supabaseClient.auth.signOut();

      alert(
        'Este usuário não possui acesso ao Painel Master.'
      );


      window.location.href =
        'master-login.html';

      return false;
    }


    atualizarDadosUsuario();


    return true;


  } catch (
    erro
  ) {

    console.error(
      'Falha ao validar acesso Master:',
      erro
    );


    try {

      await supabaseClient.auth.signOut();

    } catch (
      _
    ) {}


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
    byId(
      'masterUserName'
    );

  const email =
    byId(
      'masterUserEmail'
    );


  if (
    nome
  ) {

    nome.textContent =
      masterPerfil?.full_name ||
      'Master';
  }


  if (
    email
  ) {

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


  if (
    !confirmar
  ) {

    return;
  }


  try {

    if (
      supabaseClient
    ) {

      await supabaseClient.auth.signOut();
    }

  } catch (
    erro
  ) {

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
    byId(
      'masterClock'
    );


  if (
    !relogio
  ) {

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
    'Produtos',

  despesas:
    'Despesas',

  relatorios:
    'Relatórios'

};


function abrirPaginaMaster(
  pagina
) {

  if (
    !pagina
  ) {

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


  if (
    paginaElemento
  ) {

    paginaElemento.classList.add(
      'active'
    );
  }


  const botaoMenu =
    document.querySelector(
      `.master-nav-item[data-page="${pagina}"]`
    );


  if (
    botaoMenu
  ) {

    botaoMenu.classList.add(
      'active'
    );
  }


  const titulo =
    byId(
      'masterPageTitle'
    );


  if (
    titulo
  ) {

    titulo.textContent =
      TITULOS_PAGINAS[
        pagina
      ] ||
      'Painel Master';
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

    const inicio =
      new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        0,
        0,
        0,
        0
      );


    return inicio;
  }


  const dias =
    Number(
      periodoAtual
    );


  if (
    Number.isFinite(
      dias
    ) &&
    dias > 0
  ) {

    const inicio =
      new Date();


    inicio.setDate(
      inicio.getDate() -
      (
        dias -
        1
      )
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

  if (
    !supabaseClient
  ) {

    return [];
  }


  const inicio =
    inicioPeriodoSelecionado();


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'order_items'
      )
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
          ascending:
            false
        }
      );


  if (
    error
  ) {

    console.error(
      'Erro ao carregar dados financeiros:',
      error
    );

    return [];
  }


  return Array.isArray(
    data
  )
    ? data
    : [];
}


function atualizarCardsFinanceiros(
  itens
) {

  const pedidosUnicos =
    new Set();


  let faturamento =
    0;

  let custo =
    0;


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
        Number(
          item.sale_total ||
          0
        );


      custo +=
        Number(
          item.cost_total ||
          0
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
    byId(
      'masterTotalPedidos'
    )
  ) {

    byId(
      'masterTotalPedidos'
    ).textContent =
      quantidadePedidos;
  }


  if (
    byId(
      'masterFaturamento'
    )
  ) {

    byId(
      'masterFaturamento'
    ).textContent =
      formatarMoeda(
        faturamento
      );
  }


  if (
    byId(
      'masterCusto'
    )
  ) {

    byId(
      'masterCusto'
    ).textContent =
      formatarMoeda(
        custo
      );
  }


  if (
    byId(
      'masterLucro'
    )
  ) {

    byId(
      'masterLucro'
    ).textContent =
      formatarMoeda(
        lucro
      );
  }


  if (
    byId(
      'masterMargem'
    )
  ) {

    byId(
      'masterMargem'
    ).textContent =
      margem.toLocaleString(
        'pt-BR',
        {
          minimumFractionDigits:
            1,

          maximumFractionDigits:
            1
        }
      ) +
      '%';
  }


  if (
    byId(
      'masterTicketMedio'
    )
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

function renderizarProdutosMaisVendidos(
  itens
) {

  const container =
    byId(
      'masterProdutosVendidos'
    );


  if (
    !container
  ) {

    return;
  }


  const agrupados =
    {};


  itens.forEach(
    item => {

      const chave =
        item.product_code ||
        item.product_name ||
        'produto';


      if (
        !agrupados[
          chave
        ]
      ) {

        agrupados[
          chave
        ] =
          {
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


      agrupados[
        chave
      ].quantidade +=
        Number(
          item.quantity ||
          0
        );


      agrupados[
        chave
      ].faturamento +=
        Number(
          item.sale_total ||
          0
        );


      agrupados[
        chave
      ].lucro +=
        Number(
          item.gross_profit ||
          0
        );
    }
  );


  const ranking =
    Object.values(
      agrupados
    )
      .sort(
        (
          a,
          b
        ) =>
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
   ESTOQUE BAIXO
========================================================= */

async function buscarProdutos() {

  if (
    !supabaseClient
  ) {

    return [];
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'products'
      )
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
        active
        `
      )
      .eq(
        'active',
        true
      )
      .order(
        'name',
        {
          ascending:
            true
        }
      );


  if (
    error
  ) {

    console.error(
      'Erro ao carregar produtos:',
      error
    );

    return [];
  }


  return Array.isArray(
    data
  )
    ? data
    : [];
}


function renderizarEstoqueBaixo(
  produtos
) {

  const container =
    byId(
      'masterEstoqueBaixo'
    );


  if (
    !container
  ) {

    return;
  }


  const estoqueBaixo =
    produtos
      .filter(
        produto => {

          if (
            produto.stock_control !==
            true
          ) {

            return false;
          }


          const estoque =
            Number(
              produto.stock_quantity ||
              0
            );


          const minimo =
            Number(
              produto.minimum_stock ||
              0
            );


          return (
            estoque <=
            minimo
          );
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          Number(
            a.stock_quantity ||
            0
          ) -
          Number(
            b.stock_quantity ||
            0
          )
      )
      .slice(
        0,
        6
      );


  if (
    estoqueBaixo.length ===
    0
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
            Number(
              produto.stock_quantity ||
              0
            );


          const minimo =
            Number(
              produto.minimum_stock ||
              0
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
                    : formatarQuantidade(estoque)
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

  if (
    !supabaseClient
  ) {

    return [];
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'stock_movements'
      )
      .select(
        `
        id,
        product_id,
        movement_type,
        quantity,
        stock_before,
        stock_after,
        created_at,
        products (
          name,
          product_code
        )
        `
      )
      .order(
        'created_at',
        {
          ascending:
            false
        }
      )
      .limit(
        10
      );


  if (
    error
  ) {

    console.error(
      'Erro ao buscar movimentações:',
      error
    );

    return [];
  }


  return Array.isArray(
    data
  )
    ? data
    : [];
}


function obterLabelMovimento(
  tipo
) {

  const labels =
    {

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


  return (
    labels[
      tipo
    ] ||
    tipo ||
    '-'
  );
}


function renderizarMovimentacoes(
  movimentacoes
) {

  const tbody =
    byId(
      'masterMovimentacoesRecentes'
    );


  if (
    !tbody
  ) {

    return;
  }


  if (
    movimentacoes.length ===
    0
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
            </td>

            <td>
              ${formatarQuantidade(
                movimento.stock_after
              )}
            </td>

          </tr>

        `
      )
      .join('');
}


/* =========================================================
   CARREGAR DASHBOARD
========================================================= */

async function carregarDashboard() {

  if (
    carregandoMaster
  ) {

    return;
  }


  carregandoMaster =
    true;


  const btnAtualizar =
    byId(
      'btnAtualizarMaster'
    );


  const textoAnterior =
    btnAtualizar
      ? btnAtualizar.innerHTML
      : '';


  try {

    if (
      btnAtualizar
    ) {

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
          buscarProdutos(),
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


  } catch (
    erro
  ) {

    console.error(
      'Erro ao carregar dashboard Master:',
      erro
    );


  } finally {

    carregandoMaster =
      false;


    if (
      btnAtualizar
    ) {

      btnAtualizar.disabled =
        false;

      btnAtualizar.innerHTML =
        textoAnterior ||
        '🔄 Atualizar';
    }
  }
}


/* =========================================================
   BOTÕES AINDA EM CONSTRUÇÃO
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


  if (
    btnEntrada
  ) {

    btnEntrada.addEventListener(
      'click',
      () => {

        alert(
          'A tela de entrada de estoque será criada na próxima etapa.'
        );
      }
    );
  }


  if (
    btnProduto
  ) {

    btnProduto.addEventListener(
      'click',
      () => {

        alert(
          'O cadastro de produtos será criado na próxima etapa.'
        );
      }
    );
  }


  if (
    btnDespesa
  ) {

    btnDespesa.addEventListener(
      'click',
      () => {

        alert(
          'O cadastro de despesas será criado em uma próxima etapa.'
        );
      }
    );
  }
}


/* =========================================================
   EVENTOS
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


  if (
    btnSair
  ) {

    btnSair.addEventListener(
      'click',
      sairMaster
    );
  }


  if (
    btnAtualizar
  ) {

    btnAtualizar.addEventListener(
      'click',
      carregarDashboard
    );
  }


  configurarNavegacao();

  configurarFiltroPeriodo();

  configurarBotoesMaster();
}


/* =========================================================
   MONITORAR SESSÃO
========================================================= */

function monitorarSessaoMaster() {

  if (
    !supabaseClient
  ) {

    return;
  }


  supabaseClient.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

      console.log(
        'Master Auth:',
        event
      );


      if (
        event ===
          'SIGNED_OUT' ||
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


  if (
    !acessoLiberado
  ) {

    return;
  }


  configurarEventosMaster();


  monitorarSessaoMaster();


  mostrarPainelMaster();


  await carregarDashboard();


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
