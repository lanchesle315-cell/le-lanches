/* =========================================================
   LÊ LANCHES
   PAINEL DE ITENS
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

let supabaseClient = null;

if (
  window.supabase &&
  window.APP_CONFIG?.supabaseUrl &&
  window.APP_CONFIG?.supabaseAnonKey
) {

  supabaseClient =
    window.supabase.createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey
    );

}


/* =========================================================
   CATÁLOGO
========================================================= */

const CATALOGO_ITENS = [

  /* =======================================================
     HOT DOG
  ======================================================= */

  {
    code: 'HD01',
    name: 'Simples',
    category: 'Hot Dog',
    icon: '🌭'
  },

  {
    code: 'HD02',
    name: 'Duplo',
    category: 'Hot Dog',
    icon: '🌭'
  },

  {
    code: 'HD03',
    name: 'Especial',
    category: 'Hot Dog',
    icon: '🌭'
  },


  /* =======================================================
     BURGUER
  ======================================================= */

  {
    code: 'B01',
    name: 'X-Burguer',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B02',
    name: 'X-Salada',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B03',
    name: 'X-Egg',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B04',
    name: 'X-Bacon',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B05',
    name: 'X-Calabresa',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B06',
    name: 'X-Frango',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B07',
    name: 'X-Tudo',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B08',
    name: 'Calabacon',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B09',
    name: 'Franbacon',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B10',
    name: 'Calafrango',
    category: 'Burguer',
    icon: '🍔'
  },

  {
    code: 'B11',
    name: 'X-Costela',
    category: 'Burguer',
    icon: '🍔'
  },


  /* =======================================================
     SMASH
  ======================================================= */

  {
    code: 'S01',
    name: 'Smash Salada',
    category: 'Smash Burguer',
    icon: '🔥'
  },

  {
    code: 'S02',
    name: 'Smash Oklahoma',
    category: 'Smash Burguer',
    icon: '🔥'
  },

  {
    code: 'S03',
    name: 'Smash Bacon',
    category: 'Smash Burguer',
    icon: '🔥'
  },


  /* =======================================================
     FRITAS
  ======================================================= */

  {
    code: 'F01',
    name: 'Fritas Simples',
    category: 'Fritas',
    icon: '🍟'
  },

  {
    code: 'F02',
    name: 'Fritas com Cheddar e Bacon',
    category: 'Fritas',
    icon: '🍟'
  },


  /* =======================================================
     ADICIONAIS
  ======================================================= */

  {
    code: 'A01',
    name: 'Adicionais R$ 3,00',
    category: 'Adicionais',
    icon: '➕'
  },

  {
    code: 'A02',
    name: 'Adicionais R$ 5,00',
    category: 'Adicionais',
    icon: '➕'
  },

  {
    code: 'A03',
    name: 'Adicionais R$ 6,00',
    category: 'Adicionais',
    icon: '➕'
  },

  {
    code: 'A04',
    name: 'Adicionais R$ 8,00',
    category: 'Adicionais',
    icon: '➕'
  },


  /* =======================================================
     BEBIDAS
  ======================================================= */

  {
    code: 'R01',
    name: 'Água',
    category: 'Bebidas',
    icon: '🥤'
  },

  {
    code: 'R02',
    name: 'Suco Del Valle 450ml',
    category: 'Bebidas',
    icon: '🥤'
  },

  {
    code: 'R03',
    name: 'Suco Bellas 500ml',
    category: 'Bebidas',
    icon: '🥤'
  },

  {
    code: 'R04',
    name: 'Refrigerante Lata',
    category: 'Bebidas',
    icon: '🥤'
  },

  {
    code: 'R05',
    name: 'Cerveja Lata',
    category: 'Bebidas',
    icon: '🍺'
  },

  {
    code: 'R06',
    name: 'Cerveja Long Neck 330ml',
    category: 'Bebidas',
    icon: '🍺'
  },

  {
    code: 'R07',
    name: 'Refrigerante 2 Litros',
    category: 'Bebidas',
    icon: '🥤'
  },

  {
    code: 'R08',
    name: 'Vedete 2 Litros',
    category: 'Bebidas',
    icon: '🥤'
  },

  {
    code: 'R09',
    name: 'Coca-Cola 2 Litros',
    category: 'Bebidas',
    icon: '🥤'
  }

];


/* =========================================================
   ESTADO
========================================================= */

let disponibilidade = {};

let filtroAtual = 'todos';

let termoBusca = '';

let timeoutToast = null;


/* =========================================================
   ELEMENTOS
========================================================= */

const listaItens =
  document.getElementById('listaItens');

const loadingItens =
  document.getElementById('loadingItens');

const listaVazia =
  document.getElementById('listaVazia');

const buscaItem =
  document.getElementById('buscaItem');

const btnAtualizarItens =
  document.getElementById('btnAtualizarItens');


/* =========================================================
   NORMALIZA TEXTO
========================================================= */

function normalizarTexto(texto) {

  return String(
    texto || ''
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast(
  mensagem,
  tipo = 'success'
) {

  const toast =
    document.getElementById('toast');

  const texto =
    document.getElementById('toastTexto');

  const icon =
    document.getElementById('toastIcon');


  if (
    !toast ||
    !texto ||
    !icon
  ) {
    return;
  }


  clearTimeout(
    timeoutToast
  );


  texto.textContent =
    mensagem;


  toast.classList.remove(
    'success',
    'error',
    'visible'
  );


  toast.classList.add(
    tipo
  );


  icon.className =
    tipo === 'error'
      ? 'bi bi-exclamation-circle-fill'
      : 'bi bi-check-circle-fill';


  requestAnimationFrame(
    () => {

      toast.classList.add(
        'visible'
      );

    }
  );


  timeoutToast =
    setTimeout(
      () => {

        toast.classList.remove(
          'visible'
        );

      },
      2600
    );

}


/* =========================================================
   CRIAR REGISTROS AUSENTES
========================================================= */

async function garantirItensNoBanco() {

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
      .from('product_availability')
      .select(
        'product_code, product_name, available'
      );


  if (error) {
    throw error;
  }


  const existentes =
    new Set(
      (data || [])
        .map(
          item => item.product_code
        )
    );


  const ausentes =
    CATALOGO_ITENS
      .filter(
        item =>
          !existentes.has(
            item.code
          )
      )
      .map(
        item => ({
          product_code:
            item.code,

          product_name:
            item.name,

          available:
            true
        })
      );


  if (!ausentes.length) {
    return;
  }


  const {
    error: insertError
  } =
    await supabaseClient
      .from('product_availability')
      .insert(
        ausentes
      );


  if (insertError) {
    throw insertError;
  }

}


/* =========================================================
   CARREGAR DISPONIBILIDADE
========================================================= */

async function carregarDisponibilidade() {

  if (!supabaseClient) {

    throw new Error(
      'Supabase não configurado no config.js.'
    );

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from('product_availability')
      .select(
        'product_code, product_name, available'
      );


  if (error) {
    throw error;
  }


  disponibilidade = {};


  for (
    const registro
    of data || []
  ) {

    disponibilidade[
      registro.product_code
    ] =
      registro.available !== false;

  }

}


/* =========================================================
   STATUS
========================================================= */

function itemEstaDisponivel(code) {

  if (
    disponibilidade[code] === undefined
  ) {
    return true;
  }


  return (
    disponibilidade[code] !== false
  );

}


/* =========================================================
   FILTRAGEM
========================================================= */

function obterItensFiltrados() {

  const busca =
    normalizarTexto(
      termoBusca
    );


  return CATALOGO_ITENS.filter(
    item => {

      const disponivel =
        itemEstaDisponivel(
          item.code
        );


      if (
        filtroAtual === 'disponiveis' &&
        !disponivel
      ) {
        return false;
      }


      if (
        filtroAtual === 'congelados' &&
        disponivel
      ) {
        return false;
      }


      if (!busca) {
        return true;
      }


      const texto =
        normalizarTexto(
          [
            item.code,
            item.name,
            item.category
          ].join(' ')
        );


      return texto.includes(
        busca
      );

    }
  );

}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumo() {

  const total =
    CATALOGO_ITENS.length;


  const disponiveis =
    CATALOGO_ITENS.filter(
      item =>
        itemEstaDisponivel(
          item.code
        )
    ).length;


  const congelados =
    total - disponiveis;


  document
    .getElementById(
      'totalItens'
    )
    .textContent =
      total;


  document
    .getElementById(
      'totalDisponiveis'
    )
    .textContent =
      disponiveis;


  document
    .getElementById(
      'totalCongelados'
    )
    .textContent =
      congelados;

}


/* =========================================================
   CARD DO ITEM
========================================================= */

function criarCardItem(item) {

  const disponivel =
    itemEstaDisponivel(
      item.code
    );


  const card =
    document.createElement(
      'article'
    );


  card.className =
    disponivel
      ? 'item-card'
      : 'item-card is-frozen';


  card.innerHTML = `

    <div class="item-top">

      <span class="item-code">
        ${item.code}
      </span>

      <span class="
        item-status
        ${disponivel
          ? 'available'
          : 'frozen'}
      ">

        ${
          disponivel
            ? '● DISPONÍVEL'
            : '● ESGOTADO'
        }

      </span>

    </div>


    <div class="item-info">

      <h4>
        ${item.name}
      </h4>

      <span>
        ${item.category}
      </span>

    </div>


    <div class="item-actions">

      <button
        type="button"
        class="
          item-toggle
          ${
            disponivel
              ? 'freeze'
              : 'unfreeze'
          }
        "
        data-code="${item.code}"
      >

        ${
          disponivel
            ? '❄️ Congelar item'
            : '✓ Disponibilizar item'
        }

      </button>

    </div>

  `;


  const button =
    card.querySelector(
      '.item-toggle'
    );


  button.addEventListener(
    'click',
    () => {

      alterarDisponibilidade(
        item,
        !disponivel,
        button
      );

    }
  );


  return card;

}


/* =========================================================
   RENDER
========================================================= */

function renderizarItens() {

  if (!listaItens) {
    return;
  }


  const itens =
    obterItensFiltrados();


  listaItens.innerHTML = '';


  loadingItens
    ?.classList.add(
      'hidden'
    );


  if (!itens.length) {

    listaVazia
      ?.classList.remove(
        'hidden'
      );

    return;

  }


  listaVazia
    ?.classList.add(
      'hidden'
    );


  const categorias = {};


  for (
    const item
    of itens
  ) {

    if (
      !categorias[
        item.category
      ]
    ) {

      categorias[
        item.category
      ] = [];

    }


    categorias[
      item.category
    ].push(
      item
    );

  }


  for (
    const [
      categoria,
      produtos
    ]
    of Object.entries(
      categorias
    )
  ) {

    const section =
      document.createElement(
        'section'
      );


    section.className =
      'category-section';


    const icon =
      produtos[0]?.icon || '🍔';


    section.innerHTML = `

      <div class="category-header">

        <div class="category-header-left">

          <div class="category-icon">
            ${icon}
          </div>

          <div>

            <h3>
              ${categoria}
            </h3>

            <span class="category-count">
              ${produtos.length}
              ${
                produtos.length === 1
                  ? 'item'
                  : 'itens'
              }
            </span>

          </div>

        </div>

      </div>


      <div class="items-grid"></div>

    `;


    const grid =
      section.querySelector(
        '.items-grid'
      );


    for (
      const item
      of produtos
    ) {

      grid.appendChild(
        criarCardItem(
          item
        )
      );

    }


    listaItens.appendChild(
      section
    );

  }

}


/* =========================================================
   ALTERAR DISPONIBILIDADE
========================================================= */

async function alterarDisponibilidade(
  item,
  novoStatus,
  button
) {

  if (!supabaseClient) {

    mostrarToast(
      'Supabase não configurado.',
      'error'
    );

    return;

  }


  const statusAnterior =
    itemEstaDisponivel(
      item.code
    );


  try {

    button.disabled = true;


    button.textContent =
      'Salvando...';


    const {
      error
    } =
      await supabaseClient
        .from(
          'product_availability'
        )
        .upsert(
          {

            product_code:
              item.code,

            product_name:
              item.name,

            available:
              novoStatus,

            updated_at:
              new Date()
                .toISOString()

          },
          {

            onConflict:
              'product_code'

          }
        );


    if (error) {
      throw error;
    }


    disponibilidade[
      item.code
    ] =
      novoStatus;


    atualizarResumo();

    renderizarItens();


    if (novoStatus) {

      mostrarToast(
        `${item.name} está disponível novamente.`
      );

    } else {

      mostrarToast(
        `${item.name} foi congelado.`
      );

    }

  } catch (erro) {

    console.error(
      'Erro ao atualizar item:',
      erro
    );


    disponibilidade[
      item.code
    ] =
      statusAnterior;


    renderizarItens();


    mostrarToast(
      'Não foi possível alterar o item.',
      'error'
    );

  }

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarPainelItens() {

  try {

    loadingItens
      ?.classList.remove(
        'hidden'
      );


    listaItens.innerHTML = '';


    await garantirItensNoBanco();

    await carregarDisponibilidade();


    atualizarResumo();

    renderizarItens();

  } catch (erro) {

    console.error(
      'Erro ao iniciar painel de itens:',
      erro
    );


    loadingItens
      ?.classList.add(
        'hidden'
      );


    listaVazia
      ?.classList.remove(
        'hidden'
      );


    listaVazia.innerHTML = `

      <i class="bi bi-exclamation-triangle"></i>

      <strong>
        Não foi possível carregar os itens
      </strong>

      <span>
        Verifique a conexão com o Supabase.
      </span>

    `;


    mostrarToast(
      'Erro ao carregar itens.',
      'error'
    );

  }

}


/* =========================================================
   EVENTOS
========================================================= */

buscaItem
  ?.addEventListener(
    'input',
    event => {

      termoBusca =
        event.target.value || '';

      renderizarItens();

    }
  );


document
  .querySelectorAll(
    '.filter-btn'
  )
  .forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          document
            .querySelectorAll(
              '.filter-btn'
            )
            .forEach(
              btn =>
                btn.classList.remove(
                  'active'
                )
            );


          button.classList.add(
            'active'
          );


          filtroAtual =
            button.dataset.filter ||
            'todos';


          renderizarItens();

        }
      );

    }
  );


btnAtualizarItens
  ?.addEventListener(
    'click',
    async () => {

      btnAtualizarItens.disabled =
        true;


      try {

        await carregarDisponibilidade();

        atualizarResumo();

        renderizarItens();


        mostrarToast(
          'Lista atualizada.'
        );

      } catch (erro) {

        console.error(
          erro
        );


        mostrarToast(
          'Erro ao atualizar.',
          'error'
        );

      } finally {

        btnAtualizarItens.disabled =
          false;

      }

    }
  );


document.addEventListener(
  'DOMContentLoaded',
  iniciarPainelItens
);
