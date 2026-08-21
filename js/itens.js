/* =========================================================
   LÊ LANCHES - PAINEL DE ITENS
   Controle de produtos e opções individuais
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
    icon: '➕',

    options: [
      'Ovo',
      'Mussarela',
      'Salsicha'
    ]
  },

  {
    code: 'A02',
    name: 'Adicionais R$ 5,00',
    category: 'Adicionais',
    icon: '➕',

    options: [
      'Bacon',
      'Calabresa',
      'Hambúrguer tradicional'
    ]
  },

  {
    code: 'A03',
    name: 'Adicionais R$ 6,00',
    category: 'Adicionais',
    icon: '➕',

    options: [
      'Catupiry',
      'Cheddar',
      'Cream Cheese'
    ]
  },

  {
    code: 'A04',
    name: 'Adicionais R$ 8,00',
    category: 'Adicionais',
    icon: '➕',

    options: [
      'Hambúrguer Smash',
      'Frango',
      'Costela'
    ]
  },


  /* =======================================================
     BEBIDAS
  ======================================================= */

  {
    code: 'R01',
    name: 'Água',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Com gás',
      'Sem gás'
    ]
  },

  {
    code: 'R02',
    name: 'Suco Del Valle 450ml',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Uva',
      'Laranja'
    ]
  },

  {
    code: 'R03',
    name: 'Suco Bellas 500ml',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Goiaba',
      'Laranja',
      'Caju',
      'Maracujá',
      'Acerola',
      'Guaraná com açaí'
    ]
  },

  {
    code: 'R04',
    name: 'Refrigerante Lata',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Coca-Cola',
      'Coca-Cola Zero',
      'Fanta Laranja',
      'Fanta Uva',
      'Sprite'
    ]
  },

  {
    code: 'R05',
    name: 'Cerveja Lata',
    category: 'Bebidas',
    icon: '🍺',

    options: [
      'Brahma',
      'Skol'
    ]
  },

  {
    code: 'R06',
    name: 'Cerveja Long Neck 330ml',
    category: 'Bebidas',
    icon: '🍺',

    options: [
      'Heineken'
    ]
  },

  {
    code: 'R07',
    name: 'Refrigerante 2 Litros',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Fanta',
      'Sprite'
    ]
  },

  {
    code: 'R08',
    name: 'Vedete 2 Litros',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Tubaína',
      'Guaraná'
    ]
  },

  {
    code: 'R09',
    name: 'Coca-Cola 2 Litros',
    category: 'Bebidas',
    icon: '🥤',

    options: [
      'Coca-Cola',
      'Coca-Cola Zero'
    ]
  }

];


/* =========================================================
   ESTADO
========================================================= */

let disponibilidade = {};

let filtroAtual =
  'todos';

let termoBusca =
  '';

let timeoutToast =
  null;


/* =========================================================
   ELEMENTOS
========================================================= */

const listaItens =
  document.getElementById(
    'listaItens'
  );

const loadingItens =
  document.getElementById(
    'loadingItens'
  );

const listaVazia =
  document.getElementById(
    'listaVazia'
  );

const buscaItem =
  document.getElementById(
    'buscaItem'
  );

const btnAtualizarItens =
  document.getElementById(
    'btnAtualizarItens'
  );


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarTexto(
  texto
) {

  return String(
    texto || ''
  )
    .normalize(
      'NFD'
    )
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .toLowerCase()
    .trim();

}


function escaparHtml(
  texto
) {

  return String(
    texto || ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/* =========================================================
   GERAR CÓDIGO DA OPÇÃO
========================================================= */

function slugOpcao(
  texto
) {

  return normalizarTexto(
    texto
  )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );

}


function codigoOpcao(
  item,
  opcao
) {

  return (
    `${item.code}::${slugOpcao(opcao)}`
  );

}


/* =========================================================
   TOAST
========================================================= */

function mostrarToast(
  mensagem,
  tipo = 'success'
) {

  const toast =
    document.getElementById(
      'toast'
    );

  const texto =
    document.getElementById(
      'toastTexto'
    );

  const icon =
    document.getElementById(
      'toastIcon'
    );


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
   DISPONIBILIDADE
========================================================= */

function itemEstaDisponivel(
  code
) {

  return (
    disponibilidade[
      code
    ] !== false
  );

}


function itemTemOpcoes(
  item
) {

  return (
    Array.isArray(
      item.options
    ) &&
    item.options.length > 0
  );

}


function opcaoEstaDisponivel(
  item,
  opcao
) {

  return itemEstaDisponivel(
    codigoOpcao(
      item,
      opcao
    )
  );

}


function itemPossuiAlgoCongelado(
  item
) {

  if (
    !itemEstaDisponivel(
      item.code
    )
  ) {

    return true;

  }


  return (
    itemTemOpcoes(
      item
    ) &&
    item.options.some(
      opcao =>
        !opcaoEstaDisponivel(
          item,
          opcao
        )
    )
  );

}


/* =========================================================
   GARANTIR REGISTROS NO BANCO
========================================================= */

async function garantirItensNoBanco() {

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
        'product_availability'
      )
      .select(
        'product_code'
      );


  if (
    error
  ) {

    throw error;

  }


  const existentes =
    new Set(
      (
        data ||
        []
      ).map(
        item =>
          item.product_code
      )
    );


  const ausentes =
    [];


  for (
    const item
    of CATALOGO_ITENS
  ) {

    /*
     * Produto principal
     */

    if (
      !existentes.has(
        item.code
      )
    ) {

      ausentes.push(
        {

          product_code:
            item.code,

          product_name:
            item.name,

          available:
            true

        }
      );

    }


    /*
     * Opções internas
     */

    for (
      const opcao
      of item.options || []
    ) {

      const code =
        codigoOpcao(
          item,
          opcao
        );


      if (
        !existentes.has(
          code
        )
      ) {

        ausentes.push(
          {

            product_code:
              code,

            product_name:
              `${item.name} - ${opcao}`,

            available:
              true

          }
        );

      }

    }

  }


  if (
    !ausentes.length
  ) {

    return;

  }


  const {
    error: insertError
  } =
    await supabaseClient
      .from(
        'product_availability'
      )
      .insert(
        ausentes
      );


  if (
    insertError
  ) {

    throw insertError;

  }

}


/* =========================================================
   CARREGAR DISPONIBILIDADE
========================================================= */

async function carregarDisponibilidade() {

  if (
    !supabaseClient
  ) {

    throw new Error(
      'Supabase não configurado no config.js.'
    );

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'product_availability'
      )
      .select(
        'product_code, product_name, available'
      );


  if (
    error
  ) {

    throw error;

  }


  disponibilidade =
    {};


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
   FILTROS
========================================================= */

function obterItensFiltrados() {

  const busca =
    normalizarTexto(
      termoBusca
    );


  return CATALOGO_ITENS.filter(
    item => {

      const congelado =
        itemPossuiAlgoCongelado(
          item
        );


      if (
        filtroAtual ===
          'disponiveis' &&
        congelado
      ) {

        return false;

      }


      if (
        filtroAtual ===
          'congelados' &&
        !congelado
      ) {

        return false;

      }


      if (
        !busca
      ) {

        return true;

      }


      const texto =
        normalizarTexto(
          [
            item.code,
            item.name,
            item.category,
            ...(
              item.options ||
              []
            )
          ].join(
            ' '
          )
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


  const congelados =
    CATALOGO_ITENS
      .filter(
        item =>
          itemPossuiAlgoCongelado(
            item
          )
      )
      .length;


  const disponiveis =
    total -
    congelados;


  const elTotal =
    document.getElementById(
      'totalItens'
    );

  const elDisponiveis =
    document.getElementById(
      'totalDisponiveis'
    );

  const elCongelados =
    document.getElementById(
      'totalCongelados'
    );


  if (
    elTotal
  ) {

    elTotal.textContent =
      total;

  }


  if (
    elDisponiveis
  ) {

    elDisponiveis.textContent =
      disponiveis;

  }


  if (
    elCongelados
  ) {

    elCongelados.textContent =
      congelados;

  }

}


/* =========================================================
   SALVAR DISPONIBILIDADE
========================================================= */

async function salvarDisponibilidade(
  code,
  nome,
  novoStatus,
  button = null
) {

  if (
    !supabaseClient
  ) {

    mostrarToast(
      'Supabase não configurado.',
      'error'
    );

    return false;

  }


  const anterior =
    itemEstaDisponivel(
      code
    );


  try {

    if (
      button
    ) {

      button.disabled =
        true;


      button.dataset.textoAnterior =
        button.textContent;


      button.textContent =
        'Salvando...';

    }


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
              code,

            product_name:
              nome,

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


    if (
      error
    ) {

      throw error;

    }


    disponibilidade[
      code
    ] =
      novoStatus;


    atualizarResumo();

    renderizarItens();


    mostrarToast(
      novoStatus
        ? `${nome} está disponível novamente.`
        : `${nome} foi congelado.`
    );


    return true;

  } catch (
    erro
  ) {

    console.error(
      'Erro ao atualizar disponibilidade:',
      erro
    );


    disponibilidade[
      code
    ] =
      anterior;


    renderizarItens();


    mostrarToast(
      'Não foi possível alterar o item.',
      'error'
    );


    return false;

  }

}


/* =========================================================
   ALTERAR PRODUTO COMPLETO
========================================================= */

async function alterarProdutoInteiro(
  item,
  novoStatus,
  button
) {

  await salvarDisponibilidade(
    item.code,
    item.name,
    novoStatus,
    button
  );

}


/* =========================================================
   ALTERAR UMA OPÇÃO
========================================================= */

async function alterarOpcao(
  item,
  opcao,
  novoStatus,
  button
) {

  await salvarDisponibilidade(
    codigoOpcao(
      item,
      opcao
    ),
    `${item.name} - ${opcao}`,
    novoStatus,
    button
  );

}


/* =========================================================
   LISTA INTERNA DE OPÇÕES
========================================================= */

function criarListaOpcoes(
  item
) {

  const linhas =
    item.options
      .map(
        opcao => {

          const disponivel =
            opcaoEstaDisponivel(
              item,
              opcao
            );


          return `

            <div
              class="availability-option-row"
              style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:12px;
                padding:10px 12px;
                margin-top:8px;
                border:1px solid rgba(255,255,255,.08);
                border-radius:10px;
                background:rgba(255,255,255,.025);
              "
            >

              <div
                style="
                  min-width:0;
                "
              >

                <strong
                  style="
                    display:block;
                    color:#fff;
                  "
                >
                  ${escaparHtml(opcao)}
                </strong>


                <small
                  style="
                    color:${
                      disponivel
                        ? '#5ee68a'
                        : '#ff7b7b'
                    };
                  "
                >

                  ${
                    disponivel
                      ? '● Disponível'
                      : '● Esgotado'
                  }

                </small>

              </div>


              <button
                type="button"
                class="option-toggle-btn"
                data-option="${escaparHtml(opcao)}"
                style="
                  border:1px solid ${
                    disponivel
                      ? 'rgba(255,80,80,.45)'
                      : 'rgba(46,204,113,.45)'
                  };
                  background:${
                    disponivel
                      ? 'rgba(120,30,30,.25)'
                      : 'rgba(20,100,55,.25)'
                  };
                  color:${
                    disponivel
                      ? '#ff7b7b'
                      : '#5ee68a'
                  };
                  border-radius:9px;
                  padding:8px 10px;
                  font-weight:700;
                  cursor:pointer;
                  white-space:nowrap;
                "
              >

                ${
                  disponivel
                    ? '❄️ Congelar'
                    : '✓ Liberar'
                }

              </button>

            </div>

          `;

        }
      )
      .join(
        ''
      );


  return `

    <div
      class="item-options-panel"
      style="
        display:none;
        margin-top:12px;
        padding-top:12px;
        border-top:1px solid rgba(255,255,255,.08);
      "
    >

      <div
        style="
          font-size:13px;
          color:#aaa;
          margin-bottom:4px;
        "
      >
        Escolha exatamente o que deseja bloquear:
      </div>

      ${linhas}

    </div>

  `;

}


/* =========================================================
   CRIAR CARD
========================================================= */

function criarCardItem(
  item
) {

  const produtoDisponivel =
    itemEstaDisponivel(
      item.code
    );


  const temOpcoes =
    itemTemOpcoes(
      item
    );


  const opcoesCongeladas =
    temOpcoes

      ? item.options
          .filter(
            opcao =>
              !opcaoEstaDisponivel(
                item,
                opcao
              )
          )
          .length

      : 0;


  const card =
    document.createElement(
      'article'
    );


  card.className =
    (
      !produtoDisponivel ||
      opcoesCongeladas > 0
    )

      ? 'item-card is-frozen'

      : 'item-card';


  let statusTexto =
    '● DISPONÍVEL';


  let statusClasse =
    'available';


  if (
    !produtoDisponivel
  ) {

    statusTexto =
      '● ESGOTADO';

    statusClasse =
      'frozen';

  } else if (
    opcoesCongeladas > 0
  ) {

    statusTexto =
      `● ${opcoesCongeladas} OPÇÃO${
        opcoesCongeladas > 1
          ? 'ÕES'
          : ''
      } ESGOTADA${
        opcoesCongeladas > 1
          ? 'S'
          : ''
      }`;


    statusClasse =
      'frozen';

  }


  card.innerHTML = `

    <div class="item-top">

      <span class="item-code">
        ${item.code}
      </span>


      <span
        class="
          item-status
          ${statusClasse}
        "
      >
        ${statusTexto}
      </span>

    </div>


    <div class="item-info">

      <h4>
        ${escaparHtml(item.name)}
      </h4>

      <span>
        ${escaparHtml(item.category)}
      </span>

    </div>


    <div class="item-actions">

      ${
        temOpcoes

          ? `

            <button
              type="button"
              class="
                item-toggle
                manage-options
              "
            >
              ⚙️ Gerenciar opções
            </button>

          `

          : `

            <button
              type="button"
              class="
                item-toggle
                ${
                  produtoDisponivel
                    ? 'freeze'
                    : 'unfreeze'
                }
                simple-toggle
              "
            >

              ${
                produtoDisponivel
                  ? '❄️ Congelar item'
                  : '✓ Disponibilizar item'
              }

            </button>

          `
      }

    </div>


    ${
      temOpcoes
        ? criarListaOpcoes(
            item
          )
        : ''
    }

  `;


  /* =======================================================
     PRODUTO COM OPÇÕES
  ======================================================= */

  if (
    temOpcoes
  ) {

    const btnGerenciar =
      card.querySelector(
        '.manage-options'
      );


    const painel =
      card.querySelector(
        '.item-options-panel'
      );


    btnGerenciar.addEventListener(
      'click',
      () => {

        const aberto =
          painel.style.display !==
          'none';


        painel.style.display =
          aberto
            ? 'none'
            : 'block';


        btnGerenciar.textContent =
          aberto
            ? '⚙️ Gerenciar opções'
            : '▲ Fechar opções';

      }
    );


    card
      .querySelectorAll(
        '.option-toggle-btn'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            async event => {

              event.stopPropagation();


              const opcao =
                button.dataset.option;


              const disponivel =
                opcaoEstaDisponivel(
                  item,
                  opcao
                );


              await alterarOpcao(
                item,
                opcao,
                !disponivel,
                button
              );

            }
          );

        }
      );

  }


  /* =======================================================
     PRODUTO SIMPLES
  ======================================================= */

  else {

    const button =
      card.querySelector(
        '.simple-toggle'
      );


    button.addEventListener(
      'click',
      () => {

        alterarProdutoInteiro(
          item,
          !produtoDisponivel,
          button
        );

      }
    );

  }


  return card;

}


/* =========================================================
   RENDERIZAR
========================================================= */

function renderizarItens() {

  if (
    !listaItens
  ) {

    return;

  }


  const itens =
    obterItensFiltrados();


  listaItens.innerHTML =
    '';


  loadingItens
    ?.classList.add(
      'hidden'
    );


  if (
    !itens.length
  ) {

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


  const categorias =
    {};


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
      ] =
        [];

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
      produtos[0]?.icon ||
      '🍔';


    section.innerHTML = `

      <div class="category-header">

        <div class="category-header-left">

          <div class="category-icon">
            ${icon}
          </div>


          <div>

            <h3>
              ${escaparHtml(categoria)}
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
   INICIALIZAÇÃO
========================================================= */

async function iniciarPainelItens() {

  try {

    loadingItens
      ?.classList.remove(
        'hidden'
      );


    if (
      listaItens
    ) {

      listaItens.innerHTML =
        '';

    }


    await garantirItensNoBanco();


    await carregarDisponibilidade();


    atualizarResumo();


    renderizarItens();

  } catch (
    erro
  ) {

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


    if (
      listaVazia
    ) {

      listaVazia.innerHTML = `

        <i
          class="
            bi
            bi-exclamation-triangle
          "
        ></i>


        <strong>
          Não foi possível carregar os itens
        </strong>


        <span>
          Verifique a conexão com o Supabase.
        </span>

      `;

    }


    mostrarToast(
      'Erro ao carregar itens.',
      'error'
    );

  }

}


/* =========================================================
   BUSCA
========================================================= */

buscaItem
  ?.addEventListener(
    'input',
    event => {

      termoBusca =
        event.target.value ||
        '';


      renderizarItens();

    }
  );


/* =========================================================
   FILTROS
========================================================= */

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
              btn => {

                btn.classList.remove(
                  'active'
                );

              }
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


/* =========================================================
   ATUALIZAR
========================================================= */

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

      } catch (
        erro
      ) {

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


/* =========================================================
   START
========================================================= */

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    iniciarPainelItens
  );

} else {

  iniciarPainelItens();

}
