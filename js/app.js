const numeroWhatsapp =
  window.APP_CONFIG?.whatsappNumber ||
  '5515996314700';

const nomeLoja =
  window.APP_CONFIG?.storeName ||
  'Lê Lanches';

const ENDERECO_LOJA_PADRAO =
  window.APP_CONFIG?.storeAddress ||
  'R. Firmino Mineli, 315 - Jardim Hungares, Sorocaba - SP, 18075-700';

const GOOGLE_MAPS_API_KEY =
  window.APP_CONFIG?.googleMapsApiKey || '';

const TEMPO_PREPARO_FIXO_MINUTOS = 45;

const CHAVE_PIX = '15996314700';


/* =========================================================
   REGRAS DE ENTREGA PADRÃO
========================================================= */

const REGRAS_ENTREGA_PADRAO = [
  { km_min: 0, km_max: 3, fee: 5, active: true },
  { km_min: 3.000001, km_max: 6, fee: 8, active: true },
  { km_min: 6.000001, km_max: 8, fee: 11, active: true },
  { km_min: 8.000001, km_max: 12, fee: 15, active: true }
];


/* =========================================================
   SUPABASE
========================================================= */

let supabaseClient = null;

if (
  window.supabase &&
  window.APP_CONFIG?.supabaseUrl &&
  window.APP_CONFIG?.supabaseAnonKey
) {
  supabaseClient = window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabaseAnonKey
  );
}


/* =========================================================
   ESTADO GLOBAL
========================================================= */

let carrinho = [];

let taxaEntrega = 0;

let distanciaEntregaKm = null;

let tempoEntregaTexto = null;

let regrasEntrega = [
  ...REGRAS_ENTREGA_PADRAO
];

let configuracaoLoja = null;

let timeoutCalculoEntrega = null;

let timeoutToastLeLanches = null;

let googleMapsCarregamentoPromise = null;

let produtoPersonalizacaoAtual = null;

let produtoOpcoesAtual = null;

let adicionalPendente = null;

let coordenadaClienteCache = null;

let calculoEntregaCache = null;


/* =========================================================
   INGREDIENTES
========================================================= */

const INGREDIENTES_REMOVIVEIS_PADRAO = [
  'Tomate',
  'Cebola',
  'Alface',
  'Milho',
  'Ketchup',
  'Maionese temperada',
  'Mostarda',
  'Batata palha'
];

const INGREDIENTES_POR_LANCHE = {

  'simples': [
    'Batata palha',
    'Purê de batata',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'duplo': [
    'Batata palha',
    'Purê de batata',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'especial': [
    'Batata palha',
    'Purê de batata',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-burguer': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-salada': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-egg': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-bacon': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-calabresa': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-frango': [
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-tudo': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'calabacon': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'franbacon': [
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'calafrango': [
    'Tomate',
    'Cebola',
    'Alface',
    'Milho',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'x-costela': [
    'Batata palha',
    'Tomate',
    'Cebola',
    'Ketchup',
    'Maionese temperada',
    'Mostarda'
  ],

  'smash salada': [
    'Alface',
    'Tomate',
    'Picles',
    'Cebola',
    'Maionese temperada'
  ],

  'smash oklahoma': [
    'Cebola',
    'Picles',
    'Maionese temperada'
  ],

  'smash bacon': [
    'Maionese temperada'
  ]
};


/* =========================================================
   PRODUTOS COM OPÇÕES
========================================================= */

const PRODUTOS_COM_OPCOES = {

  agua: {
    nome: 'Água',
    preco: 4,
    tipo: 'bebida',
    tituloOpcao: 'Escolha a água',
    opcoes: [
      'Com gás',
      'Sem gás'
    ]
  },

  delvalle450: {
    nome: 'Suco Del Valle 450ml',
    preco: 6,
    tipo: 'bebida',
    tituloOpcao: 'Escolha o sabor',
    opcoes: [
      'Uva',
      'Laranja'
    ]
  },

  bellas500: {
    nome: 'Suco Bellas 500ml',
    preco: 10,
    tipo: 'bebida',
    tituloOpcao: 'Escolha o sabor',
    opcoes: [
      'Goiaba',
      'Laranja',
      'Caju',
      'Maracujá',
      'Acerola',
      'Guaraná com açaí'
    ]
  },

  refriLata: {
    nome: 'Refrigerante Lata',
    preco: 6,
    tipo: 'bebida',
    tituloOpcao: 'Escolha o refrigerante',
    opcoes: [
      'Coca-Cola',
      'Coca-Cola Zero',
      'Fanta Laranja',
      'Fanta Uva',
      'Sprite'
    ]
  },

  cervejaLata: {
    nome: 'Cerveja Lata',
    preco: 6,
    tipo: 'bebida',
    tituloOpcao: 'Escolha a cerveja',
    opcoes: [
      'Brahma',
      'Skol'
    ]
  },

  cervejaLongNeck: {
    nome: 'Cerveja Long Neck 330ml',
    preco: 12,
    tipo: 'bebida',
    tituloOpcao: 'Escolha a cerveja',
    opcoes: [
      'Heineken'
    ]
  },

  refri2l: {
    nome: 'Refrigerante 2 Litros',
    preco: 13,
    tipo: 'bebida',
    tituloOpcao: 'Escolha o refrigerante',
    opcoes: [
      'Fanta',
      'Sprite'
    ]
  },

  vedete2l: {
    nome: 'Vedete 2 Litros',
    preco: 11,
    tipo: 'bebida',
    tituloOpcao: 'Escolha o sabor',
    opcoes: [
      'Tubaína',
      'Guaraná'
    ]
  },

  coca2l: {
    nome: 'Coca-Cola 2 Litros',
    preco: 16,
    tipo: 'bebida',
    tituloOpcao: 'Escolha a Coca-Cola',
    opcoes: [
      'Coca-Cola',
      'Coca-Cola Zero'
    ]
  },

  adicional3: {
    nome: 'Adicionais R$ 3,00',
    preco: 3,
    tipo: 'adicional',
    tituloOpcao: 'Escolha o adicional',
    opcoes: [
      'Ovo',
      'Mussarela',
      'Salsicha'
    ]
  },

  adicional5: {
    nome: 'Adicionais R$ 5,00',
    preco: 5,
    tipo: 'adicional',
    tituloOpcao: 'Escolha o adicional',
    opcoes: [
      'Bacon',
      'Calabresa',
      'Hambúrguer tradicional'
    ]
  },

  adicional6: {
    nome: 'Adicionais R$ 6,00',
    preco: 6,
    tipo: 'adicional',
    tituloOpcao: 'Escolha o adicional',
    opcoes: [
      'Catupiry',
      'Cheddar',
      'Cream Cheese'
    ]
  },

  adicional8: {
    nome: 'Adicionais R$ 8,00',
    preco: 8,
    tipo: 'adicional',
    tituloOpcao: 'Escolha o adicional',
    opcoes: [
      'Hambúrguer Smash',
      'Frango',
      'Costela'
    ]
  }
};


/* =========================================================
   UTILITÁRIOS
========================================================= */

function byId(id) {
  return document.getElementById(id);
}


function formatarPreco(valor) {

  return Number(
    valor || 0
  ).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );
}


function somenteNumeros(texto) {

  return String(
    texto || ''
  ).replace(
    /\D/g,
    ''
  );
}


function removerAcentos(texto) {

  return String(
    texto || ''
  )
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    );
}


function escaparHtml(texto) {

  return String(
    texto || ''
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function formatarTipoEntregaTexto(tipo) {

  return tipo === 'delivery'
    ? 'Delivery'
    : 'Retirada no local';
}


/* =========================================================
   GOOGLE MAPS
========================================================= */

function carregarGoogleMapsApi() {

  if (
    window.google &&
    window.google.maps &&
    window.google.maps.DirectionsService
  ) {
    return Promise.resolve(
      window.google.maps
    );
  }

  if (googleMapsCarregamentoPromise) {
    return googleMapsCarregamentoPromise;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error(
        'Google Maps API Key não configurada.'
      )
    );
  }

  googleMapsCarregamentoPromise =
    new Promise((resolve, reject) => {

      const callbackName =
        '__leLanchesGoogleMapsReady';

      window[callbackName] =
        function () {

          try {

            if (
              window.google &&
              window.google.maps &&
              window.google.maps.DirectionsService
            ) {

              console.log(
                'Google Maps API carregada com sucesso.'
              );

              resolve(
                window.google.maps
              );

            } else {

              reject(
                new Error(
                  'Google Maps carregou, mas DirectionsService não está disponível.'
                )
              );
            }

          } finally {

            try {
              delete window[callbackName];
            } catch (_) {}
          }
        };

      const script =
        document.createElement(
          'script'
        );

      script.id =
        'le-lanches-google-maps';

      script.async = true;

      script.defer = true;

      script.src =
        'https://maps.googleapis.com/maps/api/js' +
        '?key=' +
        encodeURIComponent(
          GOOGLE_MAPS_API_KEY
        ) +
        '&callback=' +
        callbackName +
        '&v=weekly';

      script.onerror =
        function () {

          reject(
            new Error(
              'Falha ao carregar Google Maps JavaScript API.'
            )
          );
        };

      document.head.appendChild(
        script
      );

      setTimeout(
        () => {

          if (
            !window.google ||
            !window.google.maps ||
            !window.google.maps.DirectionsService
          ) {

            reject(
              new Error(
                'Tempo limite ao carregar Google Maps.'
              )
            );
          }

        },
        12000
      );
    });

  return googleMapsCarregamentoPromise;
}


/* =========================================================
   TOAST
========================================================= */

function mostrarToastLeLanches(
  mensagem
) {

  const toast =
    byId('llToast');

  const texto =
    byId('llToastTexto');

  if (
    !toast ||
    !texto
  ) {
    return;
  }

  texto.innerText =
    mensagem ||
    'Item adicionado ao carrinho.';

  toast.classList.add(
    'ativo'
  );

  clearTimeout(
    timeoutToastLeLanches
  );

  timeoutToastLeLanches =
    setTimeout(
      () => {

        toast.classList.remove(
          'ativo'
        );

      },
      2200
    );
}


/* =========================================================
   BUSCA
========================================================= */

function filtrarCardapio() {

  const campo =
    byId('buscaCardapio');

  const mensagem =
    byId('mensagemBuscaVazia');

  if (!campo) {
    return;
  }

  const termo =
    removerAcentos(
      campo.value
        .trim()
        .toLowerCase()
    );

  const cards =
    Array.from(
      document.querySelectorAll(
        '.ll-product-col'
      )
    );

  let visiveis = 0;

  cards.forEach(
    card => {

      const texto =
        removerAcentos(
          String(
            card.dataset.search ||
            card.innerText ||
            ''
          ).toLowerCase()
        );

      const mostrar =
        !termo ||
        texto.includes(
          termo
        );

      card.classList.toggle(
        'd-none',
        !mostrar
      );

      if (mostrar) {
        visiveis += 1;
      }
    }
  );

  document
    .querySelectorAll(
      '.ll-section'
    )
    .forEach(
      secao => {

        const possui =
          Array.from(
            secao.querySelectorAll(
              '.ll-product-col'
            )
          ).some(
            card =>
              !card.classList.contains(
                'd-none'
              )
          );

        secao.classList.toggle(
          'd-none',
          !possui
        );
      }
    );

  if (mensagem) {

    mensagem.classList.toggle(
      'd-none',
      visiveis > 0
    );
  }
}


function limparBuscaCardapio() {

  const campo =
    byId('buscaCardapio');

  if (!campo) {
    return;
  }

  campo.value = '';

  filtrarCardapio();

  campo.focus();
}


/* =========================================================
   WHATSAPP
========================================================= */

function abrirWhatsapp(url) {

  const mobile =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  if (mobile) {

    window.location.href =
      url;

  } else {

    window.open(
      url,
      '_blank'
    );
  }
}


/* =========================================================
   MODAL
========================================================= */

function garantirModalOpcoesForaDoCarrinho() {

  const modal =
    byId(
      'modalOpcoesProduto'
    );

  if (
    modal &&
    modal.parentElement !== document.body
  ) {

    document.body.appendChild(
      modal
    );
  }
}


/* =========================================================
   PAGAMENTO
========================================================= */

function  {

  const pagamento =
    byId(
      'formaPagamento'
    )?.value || '';

  const boxPix =
    byId(
      'boxPix'
    );

  if (!boxPix) {
    return;
  }

  boxPix.style.display =
    pagamento.toLowerCase() === 'pix'
      ? 'block'
      : 'none';
}


function copiarPix() {

  if (!CHAVE_PIX) {

    alert(
      'Chave PIX ainda não configurada.'
    );

    return;
  }

  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {

    navigator.clipboard
      .writeText(
        CHAVE_PIX
      )
      .then(
        () => {

          alert(
            'Chave PIX copiada!'
          );
        }
      );

    return;
  }

  alert(
    'Chave PIX: ' +
    CHAVE_PIX
  );
}


/* =========================================================
   STATUS DA LOJA
========================================================= */

function obterElementoStatusLoja() {

  return (
    byId('statusLoja') ||
    byId('status-loja')
  );
}


function converterHorarioParaMinutos(
  horario
) {

  if (!horario) {
    return null;
  }

  const partes =
    String(
      horario
    ).split(':');

  const hora =
    Number(
      partes[0] || 0
    );

  const minuto =
    Number(
      partes[1] || 0
    );

  return (
    hora * 60 +
    minuto
  );
}


function obterDiasPermitidosLoja() {

  return [
    0,
    3,
    4,
    5,
    6
  ];
}


function lojaAbertaPorHorario(
  config = null
) {

  const agora =
    new Date();

  const dia =
    agora.getDay();

  if (
    !obterDiasPermitidosLoja()
      .includes(
        dia
      )
  ) {
    return false;
  }

  const minutosAgora =
    agora.getHours() * 60 +
    agora.getMinutes();

  const abre =
    converterHorarioParaMinutos(
      config?.open_time
    ) ??
    19 * 60;

  const fecha =
    converterHorarioParaMinutos(
      config?.close_time
    ) ??
    23 * 60;

  return (
    minutosAgora >= abre &&
    minutosAgora < fecha
  );
}


function obterConfiguracaoLojaPadrao() {

  return {

    id: 1,

    store_name:
      nomeLoja,

    whatsapp_number:
      numeroWhatsapp,

    store_address:
      ENDERECO_LOJA_PADRAO,

    store_lat:
      -23.4743826,

    store_lng:
      -47.4619295,

    open_time:
      '19:00:00',

    close_time:
      '23:00:00',

    auto_open:
      true,

    manual_force_open:
      false,

    manual_force_closed:
      false
  };
}


async function carregarConfiguracaoLoja() {

  if (!supabaseClient) {

    configuracaoLoja =
      obterConfiguracaoLojaPadrao();

    return configuracaoLoja;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          'store_settings'
        )
        .select('*')
        .eq(
          'id',
          1
        )
        .single();

    if (error) {

      console.error(
        'Erro ao carregar configuração da loja:',
        error
      );

      configuracaoLoja =
        obterConfiguracaoLojaPadrao();

      return configuracaoLoja;
    }

    configuracaoLoja =
      data ||
      obterConfiguracaoLojaPadrao();

    return configuracaoLoja;

  } catch (erro) {

    console.error(
      'Falha ao carregar configuração:',
      erro
    );

    configuracaoLoja =
      obterConfiguracaoLojaPadrao();

    return configuracaoLoja;
  }
}


async function atualizarConfiguracaoLojaStatus() {

  if (!supabaseClient) {

    return (
      configuracaoLoja ||
      obterConfiguracaoLojaPadrao()
    );
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          'store_settings'
        )
        .select(
          'id, open_time, close_time, auto_open, manual_force_open, manual_force_closed'
        )
        .eq(
          'id',
          1
        )
        .single();

    if (error) {

      console.error(
        'Erro ao atualizar status:',
        error
      );

      return (
        configuracaoLoja ||
        obterConfiguracaoLojaPadrao()
      );
    }

    configuracaoLoja = {

      ...(
        configuracaoLoja ||
        obterConfiguracaoLojaPadrao()
      ),

      ...data
    };

    return configuracaoLoja;

  } catch (erro) {

    console.error(
      erro
    );

    return (
      configuracaoLoja ||
      obterConfiguracaoLojaPadrao()
    );
  }
}


async function lojaAbertaAgora() {

  const config =
    await atualizarConfiguracaoLojaStatus();

  if (!config) {
    return false;
  }

  if (
    config.manual_force_open === true
  ) {
    return true;
  }

  if (
    config.manual_force_closed === true
  ) {
    return false;
  }

  if (
    config.auto_open === true
  ) {

    return lojaAbertaPorHorario(
      config
    );
  }

  return false;
}


async function atualizarStatusLoja() {

  const status =
    obterElementoStatusLoja();

  const btnSalvar =
    byId(
      'btnFinalizar'
    );

  const btnWhatsapp =
    byId(
      'btnFinalizarWhatsapp'
    );

  const aberta =
    await lojaAbertaAgora();

  if (status) {

    status.classList.remove(
      'aberto',
      'fechado'
    );

    if (aberta) {

      status.classList.add(
        'aberto'
      );

      status.innerText =
        '🟢 Aberto agora';

    } else {

      status.classList.add(
        'fechado'
      );

      status.innerText =
        '🔴 Fechado no momento';
    }
  }

  if (btnSalvar) {

    btnSalvar.disabled =
      !aberta;
  }

  if (btnWhatsapp) {

    btnWhatsapp.disabled =
      !aberta;
  }
}


/* =========================================================
   ENDEREÇO
========================================================= */

function obterCamposEndereco() {

  return {

    cep:
      byId('cepEntrega'),

    rua:
      byId('ruaEntrega'),

    numero:
      byId('numeroEntrega'),

    bairro:
      byId('bairroEntrega'),

    cidade:
      byId('cidadeEntrega'),

    complemento:
      byId('complementoEntrega')
  };
}


function definirBloqueioCampos() {

  const {
    cep,
    rua,
    numero,
    bairro,
    cidade
  } =
    obterCamposEndereco();

  if (cep) {
    cep.readOnly = false;
  }

  if (rua) {
    rua.readOnly = true;
  }

  if (bairro) {
    bairro.readOnly = true;
  }

  if (cidade) {
    cidade.readOnly = true;
  }

  if (numero) {
    numero.readOnly = false;
  }
}


function limparBloqueiosEndereco() {

  definirBloqueioCampos();
}


function limparCacheCoordenadaCliente() {

  coordenadaClienteCache =
    null;
}


function obterEnderecoAtualComoChave() {

  const rua =
    byId(
      'ruaEntrega'
    )?.value.trim() || '';

  const numero =
    byId(
      'numeroEntrega'
    )?.value.trim() || '';

  const bairro =
    byId(
      'bairroEntrega'
    )?.value.trim() || '';

  const cidade =
    byId(
      'cidadeEntrega'
    )?.value.trim() ||
    'Sorocaba';

  const cep =
    byId(
      'cepEntrega'
    )?.value.trim() || '';

  return [
    rua,
    numero,
    bairro,
    cidade,
    cep
  ]
    .join('|')
    .toLowerCase();
}


function salvarCoordenadaClienteNoCache(
  coordenada
) {

  if (!coordenada) {
    return;
  }

  coordenadaClienteCache = {
    chave:
      obterEnderecoAtualComoChave(),

    valor:
      coordenada
  };
}


function obterCoordenadaClienteDoCache() {

  const chaveAtual =
    obterEnderecoAtualComoChave();

  if (
    coordenadaClienteCache &&
    coordenadaClienteCache.chave ===
      chaveAtual
  ) {

    return coordenadaClienteCache.valor;
  }

  return null;
}


function limparCacheEntrega() {

  calculoEntregaCache =
    null;
}


function salvarCalculoEntregaNoCache(
  distanciaKm,
  taxa,
  tempo
) {

  calculoEntregaCache = {
    chave:
      obterEnderecoAtualComoChave(),

    distanciaKm:
      Number(distanciaKm),

    taxa:
      Number(taxa),

    tempo:
      tempo || null
  };
}


function obterCalculoEntregaDoCache() {

  const chaveAtual =
    obterEnderecoAtualComoChave();

  if (
    calculoEntregaCache &&
    calculoEntregaCache.chave ===
      chaveAtual
  ) {

    return calculoEntregaCache;
  }

  return null;
}


function montarEnderecoCompletoCliente() {

  const rua =
    byId(
      'ruaEntrega'
    )?.value.trim() || '';

  const numero =
    byId(
      'numeroEntrega'
    )?.value.trim() || '';

  const bairro =
    byId(
      'bairroEntrega'
    )?.value.trim() || '';

  const cidade =
    byId(
      'cidadeEntrega'
    )?.value.trim() ||
    'Sorocaba';

  const cep =
    byId(
      'cepEntrega'
    )?.value.trim() || '';

  const partes = [];

  if (rua) {
    partes.push(
      rua
    );
  }

  if (numero) {
    partes.push(
      numero
    );
  }

  if (bairro) {
    partes.push(
      bairro
    );
  }

  if (cidade) {
    partes.push(
      cidade
    );
  }

  partes.push(
    'SP'
  );

  if (cep) {
    partes.push(
      cep
    );
  }

  partes.push(
    'Brasil'
  );

  return partes.join(
    ', '
  );
}


function enderecoClienteTextoHumano() {

  const rua =
    byId(
      'ruaEntrega'
    )?.value.trim() || '';

  const numero =
    byId(
      'numeroEntrega'
    )?.value.trim() || '';

  const bairro =
    byId(
      'bairroEntrega'
    )?.value.trim() || '';

  const cidade =
    byId(
      'cidadeEntrega'
    )?.value.trim() ||
    'Sorocaba';

  const cep =
    byId(
      'cepEntrega'
    )?.value.trim() || '';

  const complemento =
    byId(
      'complementoEntrega'
    )?.value.trim() || '';

  const partes = [];

  if (rua) {
    partes.push(
      rua
    );
  }

  if (numero) {
    partes.push(
      numero
    );
  }

  if (bairro) {
    partes.push(
      bairro
    );
  }

  if (cidade) {
    partes.push(
      cidade
    );
  }

  if (cep) {

    partes.push(
      `CEP ${cep}`
    );
  }

  if (complemento) {

    partes.push(
      complemento
    );
  }

  return partes.join(
    ', '
  );
}


/* =========================================================
   CEP - VIACEP
========================================================= */

function aplicarMascaraCep() {

  const input =
    byId(
      'cepEntrega'
    );

  if (!input) {
    return;
  }

  input.addEventListener(
    'input',
    function () {

      let valor =
        somenteNumeros(
          input.value
        ).slice(
          0,
          8
        );

      if (
        valor.length > 5
      ) {

        valor =
          valor.slice(
            0,
            5
          ) +
          '-' +
          valor.slice(
            5
          );
      }

      input.value =
        valor;

      limparCacheCoordenadaCliente();
      limparCacheEntrega();

      if (
        somenteNumeros(
          input.value
        ).length === 8
      ) {

        buscarCepEntrega();

      } else {

        agendarCalculoEntrega();
      }
    }
  );

  input.addEventListener(
    'blur',
    buscarCepEntrega
  );
}


function aplicarEventosEntrega() {

  const numeroCampo =
    byId(
      'numeroEntrega'
    );

  if (numeroCampo) {

    numeroCampo.addEventListener(
      'input',
      () => {

        limparCacheCoordenadaCliente();
        limparCacheEntrega();

        agendarCalculoEntrega();
      }
    );

    numeroCampo.addEventListener(
      'change',
      () => {

        limparCacheCoordenadaCliente();
        limparCacheEntrega();

        agendarCalculoEntrega();
      }
    );
  }

  /*
   * O complemento não altera a rota.
   * Portanto ele não dispara novo cálculo.
   */
}


function agendarCalculoEntrega() {

  clearTimeout(
    timeoutCalculoEntrega
  );

  timeoutCalculoEntrega =
    setTimeout(
      () => {

        calcularEntregaAutomaticamente();

      },
      700
    );
}


async function buscarCepEntrega() {

  const cepCampo =
    byId(
      'cepEntrega'
    );

  const ruaCampo =
    byId(
      'ruaEntrega'
    );

  const bairroCampo =
    byId(
      'bairroEntrega'
    );

  const cidadeCampo =
    byId(
      'cidadeEntrega'
    );

  const numeroCampo =
    byId(
      'numeroEntrega'
    );

  const aviso =
    byId(
      'avisoEntrega'
    );

  if (
    !cepCampo ||
    !aviso
  ) {
    return;
  }

  const cep =
    somenteNumeros(
      cepCampo.value
    );

  if (!cep) {

    taxaEntrega = 0;

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    aviso.innerText =
      'Digite o CEP para buscar o endereço.';

    renderizarCarrinho();

    return;
  }

  if (
    cep.length !== 8
  ) {

    taxaEntrega = 0;

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    aviso.innerText =
      'Digite um CEP válido com 8 números.';

    renderizarCarrinho();

    return;
  }

  try {

    aviso.innerText =
      'Consultando CEP...';

    const resposta =
      await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

    if (
      !resposta.ok
    ) {

      throw new Error(
        'ViaCEP retornou ' +
        resposta.status
      );
    }

    const dados =
      await resposta.json();

    if (dados.erro) {

      throw new Error(
        'CEP não encontrado.'
      );
    }

    if (ruaCampo) {

      ruaCampo.value =
        dados.logradouro ||
        '';
    }

    if (bairroCampo) {

      bairroCampo.value =
        dados.bairro ||
        '';
    }

    if (cidadeCampo) {

      cidadeCampo.value =
        dados.localidade ||
        'Sorocaba';
    }

    limparCacheCoordenadaCliente();
    limparCacheEntrega();

    definirBloqueioCampos();

    if (numeroCampo) {

      numeroCampo.readOnly =
        false;

      numeroCampo.focus();
    }

    aviso.innerText =
      'CEP localizado. Informe o número para calcular a entrega.';

    agendarCalculoEntrega();

  } catch (erro) {

    console.error(
      'Erro ViaCEP:',
      erro
    );

    taxaEntrega = 0;

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    aviso.innerText =
      'CEP não encontrado. Confira o número digitado.';

    renderizarCarrinho();
  }
}


async function buscarCepPorEndereco() {

  return;
}


/* =========================================================
   CARRINHO
========================================================= */

function atualizarContadores() {

  const total =
    carrinho.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        Number(
          item.quantidade || 0
        ),
      0
    );

  const contador =
    byId(
      'cartCount'
    );

  if (contador) {

    contador.innerText =
      total;
  }
}


function ehLanche(nome) {

  const n =
    removerAcentos(
      String(
        nome || ''
      ).toLowerCase()
    );

  return (
    !n.includes('coca') &&
    !n.includes('sprite') &&
    !n.includes('fanta') &&
    !n.includes('guarana') &&
    !n.includes('agua') &&
    !n.includes('suco') &&
    !n.includes('refrigerante') &&
    !n.includes('cerveja') &&
    !n.includes('vedete') &&
    !n.includes('fritas') &&
    !n.includes('batata') &&
    !n.includes('adicionais')
  );
}


function obterIngredientesRemoviveisPorLanche(
  nome
) {

  const normalizado =
    removerAcentos(
      String(
        nome || ''
      ).toLowerCase()
    );

  const chaves =
    Object.keys(
      INGREDIENTES_POR_LANCHE
    ).sort(
      (
        a,
        b
      ) =>
        b.length -
        a.length
    );

  for (
    const chave of chaves
  ) {

    const chaveNormalizada =
      removerAcentos(
        chave.toLowerCase()
      );

    if (
      normalizado.includes(
        chaveNormalizada
      )
    ) {

      return INGREDIENTES_POR_LANCHE[
        chave
      ];
    }
  }

  return INGREDIENTES_REMOVIVEIS_PADRAO;
}


function gerarChaveItem(
  nome,
  preco,
  observacao = ''
) {

  return (
    `${nome}||${preco}||${observacao}`
  );
}


function adicionarItemFinalAoCarrinho(
  nome,
  preco,
  observacao = ''
) {

  const chave =
    gerarChaveItem(
      nome,
      preco,
      observacao
    );

  const existente =
    carrinho.find(
      item =>
        item.chave === chave
    );

  if (existente) {

    existente.quantidade += 1;

  } else {

    carrinho.push(
      {
        chave,
        nome,
        preco:
          Number(
            preco || 0
          ),
        quantidade: 1,
        observacao
      }
    );
  }

  renderizarCarrinho();

  mostrarToastLeLanches(
    `${nome} adicionado ao carrinho.`
  );
}


function adicionarAoCarrinho(
  nome,
  preco,
  observacao = ''
) {

  if (
    ehLanche(
      nome
    )
  ) {

    abrirPersonalizacaoLanche(
      {
        nome,
        preco,
        observacaoBase:
          observacao
      }
    );

    return;
  }

  adicionarItemFinalAoCarrinho(
    nome,
    preco,
    observacao
  );
}

/* =========================================================
   PERSONALIZAÇÃO DOS LANCHES
========================================================= */

function abrirPersonalizacaoLanche(
  produto
) {

  garantirModalOpcoesForaDoCarrinho();

  produtoPersonalizacaoAtual =
    produto;

  produtoOpcoesAtual =
    null;

  adicionalPendente =
    null;

  const modal =
    byId(
      'modalOpcoesProduto'
    );

  const titulo =
    byId(
      'tituloOpcoesProduto'
    );

  const descricao =
    byId(
      'descricaoOpcoesProduto'
    );

  const lista =
    byId(
      'listaOpcoesProduto'
    );

  if (
    !modal ||
    !titulo ||
    !descricao ||
    !lista
  ) {
    return;
  }

  const ingredientes =
    obterIngredientesRemoviveisPorLanche(
      produto.nome
    );

  titulo.innerText =
    produto.nome;

  descricao.innerText =
    'Deseja remover algum ingrediente?';

  lista.innerHTML = `

    <div class="ll-options-list">

      ${
        ingredientes
          .map(
            ingrediente => `

              <label class="ll-option-item">

                <input
                  type="checkbox"
                  name="ingredienteRemover"
                  value="${escaparHtml(ingrediente)}"
                >

                <span>
                  Sem ${escaparHtml(ingrediente)}
                </span>

              </label>

            `
          )
          .join('')
      }

      <label class="ll-observacao-item">

        <span>
          Observação do lanche:
        </span>

        <textarea
          id="observacaoItemLanche"
          placeholder="Ex.: carne bem passada, pouco molho..."
        ></textarea>

      </label>

    </div>
  `;

  modal.style.display =
    'flex';

  modal.classList.add(
    'ativo'
  );
}


/* =========================================================
   PRODUTOS COM OPÇÕES
========================================================= */

function abrirOpcoesProduto(
  produtoId
) {

  garantirModalOpcoesForaDoCarrinho();

  const produto =
    PRODUTOS_COM_OPCOES[
      produtoId
    ];

  if (!produto) {

    console.warn(
      'Produto com opções não encontrado:',
      produtoId
    );

    return;
  }

  /*
   * Adicionais possuem um fluxo diferente:
   *
   * 1. escolhe qual adicional;
   * 2. escolhe em qual lanche será colocado.
   */
  if (
    produto.tipo ===
    'adicional'
  ) {

    abrirEscolhaOpcaoAdicional(
      produtoId
    );

    return;
  }

  produtoPersonalizacaoAtual =
    null;

  adicionalPendente =
    null;

  produtoOpcoesAtual = {
    id:
      produtoId,

    ...produto
  };

  const modal =
    byId(
      'modalOpcoesProduto'
    );

  const titulo =
    byId(
      'tituloOpcoesProduto'
    );

  const descricao =
    byId(
      'descricaoOpcoesProduto'
    );

  const lista =
    byId(
      'listaOpcoesProduto'
    );

  if (
    !modal ||
    !titulo ||
    !descricao ||
    !lista
  ) {
    return;
  }

  titulo.innerText =
    produto.nome;

  descricao.innerText =
    produto.tituloOpcao ||
    'Escolha uma opção';

  lista.innerHTML = `

    <div class="ll-options-list">

      ${
        produto.opcoes
          .map(
            (
              opcao,
              index
            ) => `

              <label class="ll-option-item">

                <input
                  type="radio"
                  name="opcaoProduto"
                  value="${escaparHtml(opcao)}"
                  ${
                    produto.opcoes.length === 1 &&
                    index === 0
                      ? 'checked'
                      : ''
                  }
                >

                <span>
                  ${escaparHtml(opcao)}
                </span>

              </label>

            `
          )
          .join('')
      }

    </div>
  `;

  modal.style.display =
    'flex';

  modal.classList.add(
    'ativo'
  );
}


/* =========================================================
   FECHAR MODAL DE OPÇÕES
========================================================= */

function fecharOpcoesProduto() {

  const modal =
    byId(
      'modalOpcoesProduto'
    );

  const lista =
    byId(
      'listaOpcoesProduto'
    );

  produtoOpcoesAtual =
    null;

  adicionalPendente =
    null;

  produtoPersonalizacaoAtual =
    null;

  if (lista) {

    lista.innerHTML =
      '';
  }

  if (modal) {

    modal.classList.remove(
      'ativo'
    );

    modal.style.display =
      'none';
  }
}


/* =========================================================
   CONFIRMAR MODAL
========================================================= */

function confirmarOpcoesProduto() {

  /*
   * ==========================================
   * PERSONALIZAÇÃO DO LANCHE
   * ==========================================
   */

  if (
    produtoPersonalizacaoAtual
  ) {

    const removidos =
      Array.from(
        document.querySelectorAll(
          'input[name="ingredienteRemover"]:checked'
        )
      ).map(
        input =>
          `Sem ${input.value}`
      );

    const observacao =
      byId(
        'observacaoItemLanche'
      )?.value.trim() || '';

    const observacoes =
      [
        produtoPersonalizacaoAtual
          .observacaoBase || '',

        ...removidos,

        observacao
          ? `Obs: ${observacao}`
          : ''
      ]
        .filter(Boolean)
        .join(
          ' | '
        );

    adicionarItemFinalAoCarrinho(
      produtoPersonalizacaoAtual.nome,
      produtoPersonalizacaoAtual.preco,
      observacoes
    );

    fecharOpcoesProduto();

    return;
  }


  /*
   * ==========================================
   * ETAPA 1 DO ADICIONAL
   * ==========================================
   */

  if (
    produtoOpcoesAtual?.tipo ===
    'adicional'
  ) {

    const selecionado =
      document.querySelector(
        'input[name="opcaoAdicional"]:checked'
      );

    if (!selecionado) {

      alert(
        'Escolha qual adicional deseja.'
      );

      return;
    }

    adicionalPendente = {
      nome:
        selecionado.value,

      preco:
        Number(
          produtoOpcoesAtual.preco ||
          0
        )
    };

    abrirEscolhaLancheParaAdicional();

    return;
  }


  /*
   * ==========================================
   * ETAPA 2 DO ADICIONAL
   * ==========================================
   */

  if (
    adicionalPendente &&
    produtoOpcoesAtual?.tipo ===
    'escolha-lanche-adicional'
  ) {

    const selecionado =
      document.querySelector(
        'input[name="lancheAdicional"]:checked'
      );

    if (!selecionado) {

      alert(
        'Escolha em qual lanche deseja colocar o adicional.'
      );

      return;
    }

    const index =
      Number(
        selecionado.value
      );

    aplicarAdicionalNoLanche(
      index
    );

    return;
  }


  /*
   * ==========================================
   * BEBIDAS / PRODUTOS COM OPÇÃO
   * ==========================================
   */

  if (
    produtoOpcoesAtual
  ) {

    const selecionado =
      document.querySelector(
        'input[name="opcaoProduto"]:checked'
      );

    if (!selecionado) {

      alert(
        'Escolha uma opção antes de adicionar ao carrinho.'
      );

      return;
    }

    const opcao =
      selecionado.value;

    const observacao =
      `Opção: ${opcao}`;

    adicionarItemFinalAoCarrinho(
      produtoOpcoesAtual.nome,
      produtoOpcoesAtual.preco,
      observacao
    );

    fecharOpcoesProduto();

    return;
  }

  fecharOpcoesProduto();
}


/* =========================================================
   ADICIONAIS
========================================================= */

function abrirEscolhaOpcaoAdicional(
  produtoId
) {

  garantirModalOpcoesForaDoCarrinho();

  const produto =
    PRODUTOS_COM_OPCOES[
      produtoId
    ];

  if (
    !produto ||
    produto.tipo !==
      'adicional'
  ) {
    return;
  }

  const lanches =
    carrinho.filter(
      item =>
        ehLanche(
          item.nome
        )
    );

  /*
   * O cliente precisa primeiro colocar um lanche
   * no carrinho para depois adicionar um extra.
   */
  if (
    lanches.length === 0
  ) {

    alert(
      'Adicione um lanche ao carrinho antes de escolher um adicional.'
    );

    return;
  }

  produtoPersonalizacaoAtual =
    null;

  adicionalPendente =
    null;

  produtoOpcoesAtual = {
    id:
      produtoId,

    ...produto
  };

  const modal =
    byId(
      'modalOpcoesProduto'
    );

  const titulo =
    byId(
      'tituloOpcoesProduto'
    );

  const descricao =
    byId(
      'descricaoOpcoesProduto'
    );

  const lista =
    byId(
      'listaOpcoesProduto'
    );

  if (
    !modal ||
    !titulo ||
    !descricao ||
    !lista
  ) {
    return;
  }

  titulo.innerText =
    produto.nome;

  descricao.innerText =
    'Qual adicional você deseja?';

  lista.innerHTML = `

    <div class="ll-options-list">

      ${
        produto.opcoes
          .map(
            opcao => `

              <label class="ll-option-item">

                <input
                  type="radio"
                  name="opcaoAdicional"
                  value="${escaparHtml(opcao)}"
                >

                <span class="ll-option-content">

                  <strong>
                    ${escaparHtml(opcao)}
                  </strong>

                  <small>
                    + ${formatarPreco(produto.preco)}
                  </small>

                </span>

              </label>

            `
          )
          .join('')
      }

    </div>
  `;

  modal.style.display =
    'flex';

  modal.classList.add(
    'ativo'
  );
}


/* =========================================================
   ESCOLHER EM QUAL LANCHE COLOCAR O ADICIONAL
========================================================= */

function abrirEscolhaLancheParaAdicional() {

  if (!adicionalPendente) {
    return;
  }

  const lanches =
    carrinho
      .map(
        (
          item,
          index
        ) => ({
          ...item,
          index
        })
      )
      .filter(
        item =>
          ehLanche(
            item.nome
          )
      );

  if (
    lanches.length === 0
  ) {

    alert(
      'Não há nenhum lanche no carrinho.'
    );

    fecharOpcoesProduto();

    return;
  }

  const modal =
    byId(
      'modalOpcoesProduto'
    );

  const titulo =
    byId(
      'tituloOpcoesProduto'
    );

  const descricao =
    byId(
      'descricaoOpcoesProduto'
    );

  const lista =
    byId(
      'listaOpcoesProduto'
    );

  if (
    !modal ||
    !titulo ||
    !descricao ||
    !lista
  ) {
    return;
  }

  produtoOpcoesAtual = {
    tipo:
      'escolha-lanche-adicional'
  };

  titulo.innerText =
    adicionalPendente.nome;

  descricao.innerText =
    'Em qual lanche você deseja colocar este adicional?';

  lista.innerHTML = `

    <div class="ll-options-list">

      ${
        lanches
          .map(
            (
              item,
              posicao
            ) => {

              const observacao =
                item.observacao
                  ? item.observacao
                  : 'Sem alterações';

              return `

                <label class="ll-option-item ll-option-lanche">

                  <input
                    type="radio"
                    name="lancheAdicional"
                    value="${item.index}"
                  >

                  <span class="ll-option-content">

                    <strong>
                      ${escaparHtml(item.nome)}
                    </strong>

                    <small>
                      Lanche ${posicao + 1}
                      ${
                        item.quantidade > 1
                          ? ` • Quantidade: ${item.quantidade}`
                          : ''
                      }
                    </small>

                    <small>
                      ${escaparHtml(observacao)}
                    </small>

                    <small class="ll-option-extra">
                      + ${formatarPreco(adicionalPendente.preco)}
                    </small>

                  </span>

                </label>

              `;
            }
          )
          .join('')
      }

    </div>
  `;

  modal.style.display =
    'flex';

  modal.classList.add(
    'ativo'
  );
}


/* =========================================================
   APLICAR ADICIONAL NO LANCHE ESCOLHIDO
========================================================= */

function aplicarAdicionalNoLanche(
  index
) {

  if (
    !adicionalPendente ||
    !carrinho[index]
  ) {

    return;
  }

  const item =
    carrinho[index];

  /*
   * Se o item tiver quantidade maior que 1,
   * separamos uma unidade para que o adicional
   * não seja aplicado acidentalmente em todas.
   *
   * Exemplo:
   * 2x X-Bacon
   *
   * Ao adicionar Bacon em apenas um:
   *
   * 1x X-Bacon normal
   * 1x X-Bacon + Bacon
   */
  if (
    Number(
      item.quantidade
    ) > 1
  ) {

    item.quantidade -=
      1;

    const novoPreco =
      Number(
        item.preco || 0
      ) +
      Number(
        adicionalPendente.preco || 0
      );

    const novaObservacao =
      item.observacao

        ? item.observacao +
          ' | Adicional: ' +
          adicionalPendente.nome +
          ' (+' +
          formatarPreco(
            adicionalPendente.preco
          ) +
          ')'

        : 'Adicional: ' +
          adicionalPendente.nome +
          ' (+' +
          formatarPreco(
            adicionalPendente.preco
          ) +
          ')';

    carrinho.push(
      {
        chave:
          gerarChaveItem(
            item.nome,
            novoPreco,
            novaObservacao
          ),

        nome:
          item.nome,

        preco:
          novoPreco,

        quantidade:
          1,

        observacao:
          novaObservacao
      }
    );

  } else {

    item.preco =
      Number(
        item.preco || 0
      ) +
      Number(
        adicionalPendente.preco || 0
      );

    item.observacao =
      item.observacao

        ? item.observacao +
          ' | Adicional: ' +
          adicionalPendente.nome +
          ' (+' +
          formatarPreco(
            adicionalPendente.preco
          ) +
          ')'

        : 'Adicional: ' +
          adicionalPendente.nome +
          ' (+' +
          formatarPreco(
            adicionalPendente.preco
          ) +
          ')';

    /*
     * Atualiza a chave porque preço e observação
     * foram alterados.
     */
    item.chave =
      gerarChaveItem(
        item.nome,
        item.preco,
        item.observacao
      );
  }

  const nomeAdicional =
    adicionalPendente.nome;

  const nomeLanche =
    item.nome;

  adicionalPendente =
    null;

  produtoOpcoesAtual =
    null;

  produtoPersonalizacaoAtual =
    null;

  renderizarCarrinho();

  fecharOpcoesProduto();

  mostrarToastLeLanches(
    `${nomeAdicional} adicionado ao ${nomeLanche}.`
  );
}


/* =========================================================
   COMPATIBILIDADE COM CHAMADAS ANTIGAS DE ADICIONAL
========================================================= */

function abrirAdicionalParaLanche(
  nomeAdicional,
  precoAdicional
) {

  const lanches =
    carrinho
      .map(
        (
          item,
          index
        ) => ({
          ...item,
          index
        })
      )
      .filter(
        item =>
          ehLanche(
            item.nome
          )
      );

  if (
    lanches.length === 0
  ) {

    alert(
      'Adicione um lanche ao carrinho primeiro.'
    );

    return;
  }

  adicionalPendente = {
    nome:
      nomeAdicional,

    preco:
      Number(
        precoAdicional || 0
      )
  };

  abrirEscolhaLancheParaAdicional();
}


/* =========================================================
   QUANTIDADES
========================================================= */

function aumentarQuantidade(
  index
) {

  if (
    !carrinho[index]
  ) {
    return;
  }

  carrinho[index].quantidade +=
    1;

  renderizarCarrinho();
}


function diminuirQuantidade(
  index
) {

  if (
    !carrinho[index]
  ) {
    return;
  }

  carrinho[index].quantidade -=
    1;

  if (
    carrinho[index].quantidade <= 0
  ) {

    carrinho.splice(
      index,
      1
    );
  }

  renderizarCarrinho();
}


function removerItem(
  index
) {

  carrinho.splice(
    index,
    1
  );

  renderizarCarrinho();
}


function calcularSubtotal() {

  return carrinho.reduce(
    (
      total,
      item
    ) =>
      total +
      (
        Number(
          item.preco || 0
        ) *
        Number(
          item.quantidade || 0
        )
      ),
    0
  );
}


function calcularTotal() {

  return (
    calcularSubtotal() +
    Number(
      taxaEntrega || 0
    )
  );
}


/* =========================================================
   ENTREGA - INTERFACE
========================================================= */

function atualizarEntrega() {

  const tipo =
    byId(
      'tipoEntrega'
    )?.value ||
    'retirada';

  const campos =
    byId(
      'camposEntrega'
    );

  const aviso =
    byId(
      'avisoEntrega'
    );

  if (
    tipo !== 'delivery'
  ) {

    taxaEntrega = 0;

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    clearTimeout(
      timeoutCalculoEntrega
    );

    if (campos) {

      campos.style.display =
        'none';
    }

    if (aviso) {

      aviso.innerText =
        'Retirada no local sem taxa de entrega.';
    }

    renderizarCarrinho();

    return;
  }

  if (campos) {

    campos.style.display =
      'grid';
  }

  definirBloqueioCampos();

  const cep =
    byId(
      'cepEntrega'
    )?.value.trim() || '';

  const rua =
    byId(
      'ruaEntrega'
    )?.value.trim() || '';

  const numero =
    byId(
      'numeroEntrega'
    )?.value.trim() || '';

  const bairro =
    byId(
      'bairroEntrega'
    )?.value.trim() || '';

  const cidade =
    byId(
      'cidadeEntrega'
    )?.value.trim() || '';

  if (
    !cep ||
    !rua ||
    !numero ||
    !bairro ||
    !cidade
  ) {

    taxaEntrega = 0;

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    if (aviso) {

      aviso.innerText =
        'Digite o CEP e depois informe o número para calcular a entrega.';
    }

    renderizarCarrinho();

    return;
  }

  agendarCalculoEntrega();
}


/* =========================================================
   REGRAS DE ENTREGA
========================================================= */

async function carregarRegrasEntrega() {

  /*
   * As regras abaixo são as regras oficiais do cardápio.
   * Não carregamos a tabela antiga do Supabase para evitar
   * que faixas antigas sobrescrevam os valores atuais.
   */
  regrasEntrega = [
    ...REGRAS_ENTREGA_PADRAO
  ];

  console.log(
    'Regras de entrega atuais:',
    regrasEntrega
  );
}


/* =========================================================
   TEMPO
========================================================= */

function formatarDuracao(
  segundos
) {

  const totalMinutos =
    Math.round(
      Number(
        segundos || 0
      ) / 60
    );

  if (
    totalMinutos < 60
  ) {

    return (
      `${totalMinutos} min`
    );
  }

  const horas =
    Math.floor(
      totalMinutos / 60
    );

  const minutos =
    totalMinutos % 60;

  if (
    minutos === 0
  ) {

    return (
      `${horas}h`
    );
  }

  return (
    `${horas}h ${minutos}min`
  );
}


function somarTempoPreparoComEntrega(
  segundosEntrega
) {

  const minutosEntrega =
    Math.round(
      Number(
        segundosEntrega || 0
      ) / 60
    );

  const total =
    TEMPO_PREPARO_FIXO_MINUTOS +
    minutosEntrega;

  return formatarDuracao(
    total * 60
  );
}


/* =========================================================
   TAXA POR DISTÂNCIA
========================================================= */

function descobrirTaxaPorDistancia(
  distanciaKm
) {

  const distancia =
    Number(
      distanciaKm
    );

  if (
    !Number.isFinite(
      distancia
    ) ||
    distancia < 0
  ) {

    return null;
  }

  if (
    distancia <= 3
  ) {
    return 5;
  }

  if (
    distancia <= 6
  ) {
    return 8;
  }

  if (
    distancia <= 8
  ) {
    return 11;
  }

  if (
    distancia <= 12
  ) {
    return 15;
  }

  /*
   * Acima de 12 km:
   * R$ 15,00 + R$ 2,00 por km excedente.
   * Qualquer fração de km excedente conta como 1 km.
   *
   * Ex.: 12,1 km = 13 km para cobrança => R$ 17,00.
   */
  const kmExcedente =
    Math.ceil(
      distancia - 12
    );

  return (
    15 +
    (
      kmExcedente *
      2
    )
  );
}


/* =========================================================
   COORDENADAS DA LOJA
========================================================= */

function obterCoordenadasLoja() {

  const latitude =
    Number(
      configuracaoLoja?.store_lat
    );

  const longitude =
    Number(
      configuracaoLoja?.store_lng
    );

  if (
    Number.isFinite(
      latitude
    ) &&
    Number.isFinite(
      longitude
    ) &&
    latitude !== 0 &&
    longitude !== 0
  ) {

    return {

      lat:
        latitude,

      lng:
        longitude
    };
  }

  return {

    lat:
      -23.4743826,

    lng:
      -47.4619295
  };
}


/* =========================================================
   GEOCODIFICAÇÃO - OPENSTREETMAP / NOMINATIM
========================================================= */

async function geocodificarEnderecoOpenStreetMap(
  enderecoCompleto
) {

  const endereco =
    String(
      enderecoCompleto || ''
    ).trim();

  if (!endereco) {

    throw new Error(
      'Endereço vazio para geocodificação.'
    );
  }

  const montarUrl =
    texto =>
      'https://nominatim.openstreetmap.org/search' +
      '?format=jsonv2' +
      '&limit=5' +
      '&countrycodes=br' +
      '&addressdetails=1' +
      '&accept-language=pt-BR' +
      '&q=' +
      encodeURIComponent(
        texto
      );

  async function consultar(
    texto
  ) {

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        10000
      );

    try {

      const resposta =
        await fetch(
          montarUrl(
            texto
          ),
          {
            method:
              'GET',

            headers: {
              'Accept':
                'application/json'
            },

            signal:
              controller.signal
          }
        );

      if (!resposta.ok) {

        throw new Error(
          'OpenStreetMap retornou HTTP ' +
          resposta.status
        );
      }

      const dados =
        await resposta.json();

      return Array.isArray(
        dados
      )
        ? dados
        : [];

    } finally {

      clearTimeout(
        timeout
      );
    }
  }

  console.log(
    'OpenStreetMap - procurando endereço:',
    endereco
  );

  let resultados =
    await consultar(
      endereco
    );

  if (
    resultados.length === 0
  ) {

    const rua =
      byId(
        'ruaEntrega'
      )?.value.trim() || '';

    const bairro =
      byId(
        'bairroEntrega'
      )?.value.trim() || '';

    const cidade =
      byId(
        'cidadeEntrega'
      )?.value.trim() ||
      'Sorocaba';

    const cep =
      byId(
        'cepEntrega'
      )?.value.trim() || '';

    const enderecoFallback =
      [
        rua,
        bairro,
        cidade,
        'SP',
        cep,
        'Brasil'
      ]
        .filter(Boolean)
        .join(
          ', '
        );

    console.log(
      'OpenStreetMap - tentando endereço alternativo:',
      enderecoFallback
    );

    resultados =
      await consultar(
        enderecoFallback
      );
  }

  if (
    resultados.length === 0
  ) {

    throw new Error(
      'Endereço não localizado no OpenStreetMap.'
    );
  }

  const resultado =
    resultados.find(
      item => {

        const texto =
          removerAcentos(
            String(
              item.display_name || ''
            ).toLowerCase()
          );

        return texto.includes(
          'sorocaba'
        );
      }
    ) ||
    resultados[0];

  const lat =
    Number(
      resultado.lat
    );

  const lng =
    Number(
      resultado.lon
    );

  if (
    !Number.isFinite(
      lat
    ) ||
    !Number.isFinite(
      lng
    )
  ) {

    throw new Error(
      'OpenStreetMap retornou coordenadas inválidas.'
    );
  }

  console.log(
    'OpenStreetMap - coordenada encontrada:',
    {
      lat,
      lng,
      displayName:
        resultado.display_name
    }
  );

  return {
    lat,
    lng
  };
}


/* =========================================================
   CALCULAR ENTREGA REAL
========================================================= */

async function calcularEntregaAutomaticamente() {

  const tipo =
    byId(
      'tipoEntrega'
    )?.value ||
    'retirada';

  const aviso =
    byId(
      'avisoEntrega'
    );

  if (
    tipo !== 'delivery'
  ) {

    taxaEntrega = 0;
    distanciaEntregaKm = null;
    tempoEntregaTexto = null;

    if (aviso) {

      aviso.innerText =
        'Retirada no local sem taxa de entrega.';
    }

    renderizarCarrinho();

    return;
  }

  const cep =
    byId(
      'cepEntrega'
    )?.value.trim() || '';

  const rua =
    byId(
      'ruaEntrega'
    )?.value.trim() || '';

  const numero =
    byId(
      'numeroEntrega'
    )?.value.trim() || '';

  const bairro =
    byId(
      'bairroEntrega'
    )?.value.trim() || '';

  const cidade =
    byId(
      'cidadeEntrega'
    )?.value.trim() || '';

  if (
    !cep ||
    !rua ||
    !numero ||
    !bairro ||
    !cidade
  ) {

    taxaEntrega = 0;
    distanciaEntregaKm = null;
    tempoEntregaTexto = null;

    if (aviso) {

      aviso.innerText =
        'Digite o CEP e informe o número para calcular a entrega.';
    }

    renderizarCarrinho();

    return;
  }

  const cacheEntrega =
    obterCalculoEntregaDoCache();

  if (cacheEntrega) {

    distanciaEntregaKm =
      cacheEntrega.distanciaKm;

    taxaEntrega =
      cacheEntrega.taxa;

    tempoEntregaTexto =
      cacheEntrega.tempo;

    if (aviso) {

      aviso.innerText =
        `Distância real: ${
          distanciaEntregaKm
            .toFixed(2)
            .replace('.', ',')
        } km | ` +
        `Tempo estimado: ${
          tempoEntregaTexto || '-'
        } | ` +
        `Taxa: ${
          formatarPreco(
            taxaEntrega
          )
        }`;
    }

    console.log(
      'Entrega reaproveitada do cache:',
      cacheEntrega
    );

    renderizarCarrinho();

    return;
  }

  try {

    taxaEntrega = 0;
    distanciaEntregaKm = null;
    tempoEntregaTexto = null;

    if (aviso) {

      aviso.innerText =
        'Localizando endereço...';
    }

    const enderecoCliente =
      montarEnderecoCompletoCliente();

    let destino =
      obterCoordenadaClienteDoCache();

    if (!destino) {

      destino =
        await geocodificarEnderecoOpenStreetMap(
          enderecoCliente
        );

      if (destino) {

        salvarCoordenadaClienteNoCache(
          destino
        );
      }
    }

    if (!destino) {

      throw new Error(
        'Não foi possível localizar o endereço.'
      );
    }

    if (aviso) {

      aviso.innerText =
        'Calculando rota e taxa de entrega...';
    }

    await carregarGoogleMapsApi();

    const origem =
      obterCoordenadasLoja();

    console.log(
      'Google Maps - calculando rota:',
      {
        origem,
        destino
      }
    );

    const directionsService =
      new google.maps.DirectionsService();

    const resultado =
      await new Promise(
        (
          resolve,
          reject
        ) => {

          let finalizado =
            false;

          const timeout =
            setTimeout(
              () => {

                if (finalizado) {
                  return;
                }

                finalizado =
                  true;

                reject(
                  new Error(
                    'Tempo limite ao calcular rota no Google Maps.'
                  )
                );

              },
              15000
            );

          directionsService.route(
            {
              origin:
                origem,

              destination:
                destino,

              travelMode:
                google.maps.TravelMode.DRIVING,

              region:
                'BR',

              provideRouteAlternatives:
                false
            },
            (
              response,
              status
            ) => {

              if (finalizado) {
                return;
              }

              finalizado =
                true;

              clearTimeout(
                timeout
              );

              console.log(
                'Google Maps - status da rota:',
                status
              );

              if (
                status === 'OK' &&
                response
              ) {

                resolve(
                  response
                );

                return;
              }

              reject(
                new Error(
                  'DirectionsService: ' +
                  status
                )
              );
            }
          );
        }
      );

    const trecho =
      resultado
        ?.routes
        ?.[0]
        ?.legs
        ?.[0];

    const distanciaMetros =
      Number(
        trecho
          ?.distance
          ?.value
      );

    const duracaoSegundos =
      Number(
        trecho
          ?.duration
          ?.value
      );

    if (
      !Number.isFinite(
        distanciaMetros
      ) ||
      distanciaMetros <= 0
    ) {

      throw new Error(
        'Google Maps não retornou uma distância válida.'
      );
    }

    const distanciaKm =
      Number(
        (
          distanciaMetros /
          1000
        ).toFixed(
          2
        )
      );

    distanciaEntregaKm =
      distanciaKm;

    const taxa =
      descobrirTaxaPorDistancia(
        distanciaKm
      );

    if (
      taxa === null
    ) {

      taxaEntrega = 0;
      tempoEntregaTexto = null;

      if (aviso) {

        aviso.innerText =
          `Distância real: ${
            distanciaKm
              .toFixed(2)
              .replace('.', ',')
          } km | Fora da área de entrega.`;
      }

      console.warn(
        'Endereço fora da área de entrega:',
        distanciaKm
      );

      renderizarCarrinho();

      return;
    }

    taxaEntrega =
      taxa;

    tempoEntregaTexto =
      somarTempoPreparoComEntrega(
        Number.isFinite(
          duracaoSegundos
        )
          ? duracaoSegundos
          : 0
      );

    salvarCalculoEntregaNoCache(
      distanciaEntregaKm,
      taxaEntrega,
      tempoEntregaTexto
    );

    if (aviso) {

      aviso.innerText =
        `Distância real: ${
          distanciaEntregaKm
            .toFixed(2)
            .replace('.', ',')
        } km | ` +
        `Tempo estimado: ${
          tempoEntregaTexto
        } | ` +
        `Taxa: ${
          formatarPreco(
            taxaEntrega
          )
        }`;
    }

    console.log(
      'Entrega calculada e salva no cache:',
      {
        distanciaEntregaKm,
        taxaEntrega,
        tempoEntregaTexto
      }
    );

    renderizarCarrinho();

  } catch (erro) {

    console.error(
      'Erro ao calcular entrega:',
      erro
    );

    taxaEntrega = 0;
    distanciaEntregaKm = null;
    tempoEntregaTexto = null;

    if (aviso) {

      if (
        erro?.name ===
        'AbortError'
      ) {

        aviso.innerText =
          'A consulta do endereço demorou demais. Tente novamente.';

      } else {

        aviso.innerText =
          'Não foi possível calcular a entrega. Confira o CEP e o número.';
      }
    }

    renderizarCarrinho();
  }
}


/* =========================================================
   RENDERIZAR CARRINHO
========================================================= */

function renderizarCarrinho() {

  const lista =
    byId(
      'listaCarrinho'
    );

  const subtotal =
    calcularSubtotal();

  const total =
    calcularTotal();

  if (lista) {

    if (
      carrinho.length === 0
    ) {

      lista.innerHTML =
        '<div class="carrinho-vazio">Seu carrinho está vazio.</div>';

    } else {

      lista.innerHTML = `

        <div class="lista-carrinho">

          ${
            carrinho
              .map(
                (
                  item,
                  index
                ) => `

                  <div class="item-carrinho">

                    <div>

                      <strong>
                        ${escaparHtml(item.nome)}
                      </strong>

                      ${
                        item.observacao
                          ? `
                            <small style="
                              display:block;
                              margin-top:4px;
                            ">
                              ${escaparHtml(item.observacao)}
                            </small>
                          `
                          : ''
                      }

                      <small>
                        ${formatarPreco(item.preco)} cada
                      </small>

                    </div>

                    <div class="acoes-carrinho">

                      <div class="qtd-box">

                        <button
                          class="qtd-btn"
                          type="button"
                          onclick="diminuirQuantidade(${index})"
                        >
                          -
                        </button>

                        <strong>
                          ${item.quantidade}
                        </strong>

                        <button
                          class="qtd-btn"
                          type="button"
                          onclick="aumentarQuantidade(${index})"
                        >
                          +
                        </button>

                      </div>

                      <strong>
                        ${
                          formatarPreco(
                            Number(
                              item.preco
                            ) *
                            Number(
                              item.quantidade
                            )
                          )
                        }
                      </strong>

                      <button
                        class="btn-remover"
                        type="button"
                        onclick="removerItem(${index})"
                      >
                        Remover
                      </button>

                    </div>

                  </div>

                `
              )
              .join('')
          }

        </div>
      `;
    }
  }

  const resumoItens =
    byId(
      'resumoItens'
    );

  if (resumoItens) {

    resumoItens.innerText =
      carrinho.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantidade || 0
          ),
        0
      );
  }

  const resumoSubtotal =
    byId(
      'resumoSubtotal'
    );

  if (resumoSubtotal) {

    resumoSubtotal.innerText =
      formatarPreco(
        subtotal
      );
  }

  const resumoTaxa =
    byId(
      'resumoTaxaEntrega'
    );

  if (resumoTaxa) {

    const tipo =
      byId(
        'tipoEntrega'
      )?.value ||
      'retirada';

    if (
      tipo === 'delivery' &&
      distanciaEntregaKm === null
    ) {

      resumoTaxa.innerText =
        'A calcular';

    } else {

      resumoTaxa.innerText =
        formatarPreco(
          taxaEntrega
        );
    }
  }

  const resumoTotal =
    byId(
      'resumoTotal'
    );

  if (resumoTotal) {

    resumoTotal.innerText =
      formatarPreco(
        total
      );
  }

  atualizarContadores();

  atualizarStatusLoja();
}


/* =========================================================
   MODAL CARRINHO
========================================================= */

function abrirCarrinho() {

  renderizarCarrinho();

  const modal =
    byId(
      'modalCarrinho'
    );

  if (modal) {

    modal.classList.add(
      'ativo'
    );
  }
}


function fecharCarrinho() {

  const modal =
    byId(
      'modalCarrinho'
    );

  if (modal) {

    modal.classList.remove(
      'ativo'
    );
  }
}


function limparCarrinho() {

  carrinho = [];

  taxaEntrega = 0;

  distanciaEntregaKm =
    null;

  tempoEntregaTexto =
    null;

  produtoOpcoesAtual =
    null;

  adicionalPendente =
    null;

  produtoPersonalizacaoAtual =
    null;

  const campos = [
    'nomeCliente',
    'cepEntrega',
    'ruaEntrega',
    'numeroEntrega',
    'bairroEntrega',
    'complementoEntrega',
    'observacoes'
  ];

  campos.forEach(
    id => {

      const campo =
        byId(
          id
        );

      if (campo) {

        campo.value =
          '';
      }
    }
  );

  if (
    byId(
      'cidadeEntrega'
    )
  ) {

    byId(
      'cidadeEntrega'
    ).value =
      'Sorocaba';
  }

  if (
    byId(
      'tipoEntrega'
    )
  ) {

    byId(
      'tipoEntrega'
    ).value =
      'retirada';
  }

  if (
    byId(
      'formaPagamento'
    )
  ) {

    byId(
      'formaPagamento'
    ).value =
      '';
  }

  ;

  limparCacheCoordenadaCliente();
  limparCacheEntrega();

  limparBloqueiosEndereco();

  atualizarEntrega();

  renderizarCarrinho();
}


/* =========================================================
   SALVAR PEDIDO
========================================================= */

async function salvarPedidoNoBanco(
  payload
) {

  if (!supabaseClient) {

    const pedido = {

      ...payload,

      id:
        Date.now(),

      created_at:
        new Date().toISOString()
    };

    const chave =
      'le_lanches_pedidos';

    let lista = [];

    try {

      lista =
        JSON.parse(
          localStorage.getItem(
            chave
          ) || '[]'
        );

    } catch {

      lista = [];
    }

    lista.push(
      pedido
    );

    localStorage.setItem(
      chave,
      JSON.stringify(
        lista
      )
    );

    return pedido;
  }

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        'orders'
      )
      .insert(
        [
          payload
        ]
      )
      .select()
      .single();

  if (error) {

    console.error(
      'Erro ao salvar pedido:',
      error
    );

    throw error;
  }

  return data;
}


/* =========================================================
   FINALIZAR PEDIDO
========================================================= */

async function finalizarPedido(
  enviarWhatsapp = true
) {

  if (
    carrinho.length === 0
  ) {

    alert(
      'Seu carrinho está vazio.'
    );

    return;
  }

  if (
    !(await lojaAbertaAgora())
  ) {

    alert(
      'A loja está fechada no momento.'
    );

    return;
  }

  const nome =
    byId(
      'nomeCliente'
    )?.value.trim() || '';

  const tipoEntrega =
    byId(
      'tipoEntrega'
    )?.value ||
    'retirada';

  const pagamento =
    byId(
      'formaPagamento'
    )?.value || '';

  const observacoes =
    byId(
      'observacoes'
    )?.value.trim() || '';

  if (!nome) {

    alert(
      'Digite seu nome.'
    );

    return;
  }

  if (!pagamento) {

    alert(
      'Selecione a forma de pagamento.'
    );

    return;
  }

  const endereco =
    enderecoClienteTextoHumano();

  if (
    tipoEntrega === 'delivery'
  ) {

    const cep =
      byId(
        'cepEntrega'
      )?.value.trim() || '';

    const rua =
      byId(
        'ruaEntrega'
      )?.value.trim() || '';

    const numero =
      byId(
        'numeroEntrega'
      )?.value.trim() || '';

    const bairro =
      byId(
        'bairroEntrega'
      )?.value.trim() || '';

    const cidade =
      byId(
        'cidadeEntrega'
      )?.value.trim() || '';

    if (
      !cep ||
      !rua ||
      !numero ||
      !bairro ||
      !cidade
    ) {

      alert(
        'Digite o CEP e informe o número.'
      );

      return;
    }

    if (
      distanciaEntregaKm === null
    ) {

      await calcularEntregaAutomaticamente();
    }

    if (
      distanciaEntregaKm === null
    ) {

      alert(
        'Não foi possível calcular a entrega.'
      );

      return;
    }

    const taxaLocalizada =
      descobrirTaxaPorDistancia(
        distanciaEntregaKm
      );

    if (
      taxaLocalizada === null
    ) {

      alert(
        'Não foi possível calcular a taxa de entrega.'
      );

      return;
    }

    taxaEntrega =
      taxaLocalizada;
  }

  const subtotal =
    calcularSubtotal();

  const total =
    calcularTotal();

  const complemento =
    byId(
      'complementoEntrega'
    )?.value.trim() || '';

  const payload = {

    customer_name:
      nome,

    customer_phone:
      '',

    order_type:
      tipoEntrega,

    customer_address:
      tipoEntrega === 'delivery'
        ? endereco
        : null,

    customer_neighborhood:
      tipoEntrega === 'delivery'
        ? byId(
            'bairroEntrega'
          )?.value.trim() || ''
        : null,

    customer_city:
      tipoEntrega === 'delivery'
        ? byId(
            'cidadeEntrega'
          )?.value.trim() ||
          'Sorocaba'
        : 'Sorocaba',

    customer_notes:
      [
        pagamento
          ? `Pagamento: ${pagamento}`
          : '',

        observacoes
          ? `Observações: ${observacoes}`
          : '',

        tipoEntrega === 'delivery' &&
        complemento
          ? `Complemento: ${complemento}`
          : '',

        tipoEntrega === 'delivery' &&
        tempoEntregaTexto
          ? `Tempo estimado: ${tempoEntregaTexto}`
          : ''
      ]
        .filter(Boolean)
        .join(
          ' | '
        ),

    items:
      carrinho.map(
        item => ({
          nome:
            item.nome,

          preco:
            Number(
              item.preco
            ),

          quantidade:
            Number(
              item.quantidade
            ),

          observacao:
            item.observacao ||
            ''
        })
      ),

    subtotal:
      subtotal,

    delivery_fee:
      tipoEntrega === 'delivery'
        ? taxaEntrega
        : 0,

    total:
      total,

    delivery_distance_km:
      tipoEntrega === 'delivery'
        ? distanciaEntregaKm
        : null,

    status:
      'novo'
  };

  const botao =
    enviarWhatsapp
      ? byId(
          'btnFinalizarWhatsapp'
        )
      : byId(
          'btnFinalizar'
        );

  try {

    if (botao) {

      botao.disabled =
        true;

      botao.innerText =
        'Salvando pedido...';
    }

    const pedido =
      await salvarPedidoNoBanco(
        payload
      );

    let mensagem =
`🍔 *Pedido - ${nomeLoja}*

📦 *Pedido:* #${pedido.id}
👤 *Cliente:* ${nome}
🏠 *Tipo do pedido:* ${formatarTipoEntregaTexto(tipoEntrega)}`;

    if (
      tipoEntrega === 'delivery'
    ) {

      mensagem += `
📍 *Endereço:* ${endereco}`;

      mensagem += `
📏 *Distância:* ${Number(distanciaEntregaKm).toFixed(2).replace('.', ',')} km`;

      if (
        tempoEntregaTexto
      ) {

        mensagem += `
⏱️ *Tempo estimado:* ${tempoEntregaTexto}`;
      }

    } else {

      mensagem += `
⏱️ *Tempo estimado:* ${formatarDuracao(
        TEMPO_PREPARO_FIXO_MINUTOS *
        60
      )}`;
    }

    mensagem += `

🍔 *Itens do pedido:*`;

    payload.items.forEach(
      item => {

        mensagem += `
━━━━━━━━━━━━━━
🍟 *${item.quantidade}x ${item.nome}*
💰 ${formatarPreco(
          item.preco *
          item.quantidade
        )}`;

        if (
          item.observacao
        ) {

          mensagem += `
📝 ${item.observacao}`;
        }
      }
    );

    mensagem += `

━━━━━━━━━━━━━━
💵 *Subtotal:* ${formatarPreco(subtotal)}
🚚 *Taxa de entrega:* ${
  tipoEntrega === 'delivery'
    ? formatarPreco(taxaEntrega)
    : formatarPreco(0)
}
💲 *Total:* ${formatarPreco(total)}
💳 *Pagamento:* ${pagamento}`;

    if (
      observacoes
    ) {

      mensagem += `
📌 *Observações:* ${observacoes}`;
    }

    const url =
      `https://api.whatsapp.com/send?phone=${numeroWhatsapp}&text=${encodeURIComponent(mensagem)}`;

    carrinho = [];

    taxaEntrega = 0;

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    produtoPersonalizacaoAtual =
      null;

    produtoOpcoesAtual =
      null;

    adicionalPendente =
      null;

    limparCacheCoordenadaCliente();

    limparCacheEntrega();

    [
      'nomeCliente',
      'cepEntrega',
      'ruaEntrega',
      'numeroEntrega',
      'bairroEntrega',
      'complementoEntrega',
      'observacoes'
    ].forEach(
      id => {

        const campo =
          byId(
            id
          );

        if (campo) {

          campo.value =
            '';
        }
      }
    );

    if (
      byId(
        'cidadeEntrega'
      )
    ) {

      byId(
        'cidadeEntrega'
      ).value =
        'Sorocaba';
    }

    if (
      byId(
        'tipoEntrega'
      )
    ) {

      byId(
        'tipoEntrega'
      ).value =
        'retirada';
    }

    if (
      byId(
        'formaPagamento'
      )
    ) {

      byId(
        'formaPagamento'
      ).value =
        '';
    }

    fecharCarrinho();

    fecharOpcoesProduto();

    atualizarEntrega();

    ;

    renderizarCarrinho();

    if (
      enviarWhatsapp
    ) {

      setTimeout(
        () => {

          abrirWhatsapp(
            url
          );

        },
        150
      );

    } else {

      alert(
        'Pedido salvo com sucesso!'
      );
    }

  } catch (erro) {

    console.error(
      'Erro ao finalizar pedido:',
      erro
    );

    alert(
      'Erro ao salvar o pedido. Verifique a conexão com o Supabase.'
    );

  } finally {

    if (botao) {

      botao.innerText =
        enviarWhatsapp
          ? 'Finalizar no WhatsApp'
          : 'Salvar pedido';

      botao.disabled =
        !(await lojaAbertaAgora());
    }
  }
}


/* =========================================================
   CLIQUE FORA DOS MODAIS
========================================================= */

window.onclick =
  function (
    event
  ) {

    const modalCarrinho =
      byId(
        'modalCarrinho'
      );

    const modalOpcoes =
      byId(
        'modalOpcoesProduto'
      );

    if (
      event.target ===
      modalCarrinho
    ) {

      fecharCarrinho();
    }

    if (
      event.target ===
      modalOpcoes
    ) {

      fecharOpcoesProduto();
    }
  };


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function iniciarSistema() {

  console.log(
    'Iniciando Lê Lanches...'
  );

  await carregarConfiguracaoLoja();

  console.log(
    'Configuração da loja:',
    configuracaoLoja
  );

  await carregarRegrasEntrega();

  carregarGoogleMapsApi()
    .then(
      () => {

        console.log(
          'Google Maps carregado para cálculo de entrega.'
        );
      }
    )
    .catch(
      erro => {

        console.warn(
          'Google Maps ainda não pôde ser carregado:',
          erro
        );
      }
    );

  garantirModalOpcoesForaDoCarrinho();

  aplicarMascaraCep();

  aplicarEventosEntrega();

  atualizarContadores();

  atualizarEntrega();

  ;

  limparBloqueiosEndereco();

  filtrarCardapio();

  await atualizarStatusLoja();

  setInterval(
    async () => {

      await atualizarStatusLoja();

    },
    5000
  );

  console.log(
    'Lê Lanches 3.0 iniciado.'
  );
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    const tipoEntrega =
      byId(
        'tipoEntrega'
      );

    const camposEntrega =
      byId(
        'camposEntrega'
      );

    if (tipoEntrega) {

      tipoEntrega.value =
        'retirada';
    }

    if (camposEntrega) {

      camposEntrega.style.display =
        'none';
    }

    garantirModalOpcoesForaDoCarrinho();

    ;

    filtrarCardapio();
  }
);


/* =========================================================
   START
========================================================= */

iniciarSistema();
