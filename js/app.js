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

const CHAVE_PIX = '';


/* =========================================================
   REGRAS DE ENTREGA PADRÃO
========================================================= */

const REGRAS_ENTREGA_PADRAO = [
  { km_min: 0, km_max: 2, fee: 4, active: true },
  { km_min: 2.01, km_max: 3, fee: 5, active: true },
  { km_min: 3.01, km_max: 4, fee: 6, active: true },
  { km_min: 4.01, km_max: 6, fee: 8, active: true },
  { km_min: 6.01, km_max: 7, fee: 9, active: true },
  { km_min: 7.01, km_max: 8, fee: 11, active: true },
  { km_min: 8.01, km_max: 9, fee: 13, active: true },
  { km_min: 9.01, km_max: 10, fee: 15, active: true }
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

const PRODUTOS_COM_OPCOES = {};


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

  if (
    googleMapsCarregamentoPromise
  ) {
    return googleMapsCarregamentoPromise;
  }

  if (
    !GOOGLE_MAPS_API_KEY
  ) {

    return Promise.reject(
      new Error(
        'Google Maps API Key não configurada.'
      )
    );
  }

  googleMapsCarregamentoPromise =
    new Promise(
      (resolve, reject) => {

        const existente =
          document.querySelector(
            'script[data-le-lanches-google-maps="true"]'
          );

        if (existente) {

          existente.addEventListener(
            'load',
            () => {

              if (
                window.google?.maps
              ) {
                resolve(
                  window.google.maps
                );
              } else {
                reject(
                  new Error(
                    'Google Maps não ficou disponível.'
                  )
                );
              }
            },
            {
              once: true
            }
          );

          existente.addEventListener(
            'error',
            () => {
              reject(
                new Error(
                  'Erro ao carregar Google Maps.'
                )
              );
            },
            {
              once: true
            }
          );

          return;
        }

        const script =
          document.createElement(
            'script'
          );

        script.dataset.leLanchesGoogleMaps =
          'true';

        script.async = true;

        script.defer = true;

        script.src =
          'https://maps.googleapis.com/maps/api/js' +
          '?key=' +
          encodeURIComponent(
            GOOGLE_MAPS_API_KEY
          ) +
          '&loading=async&v=weekly';

        script.onload =
          () => {

            if (
              window.google &&
              window.google.maps &&
              window.google.maps.DirectionsService
            ) {

              resolve(
                window.google.maps
              );

              return;
            }

            reject(
              new Error(
                'Google Maps carregou, mas DirectionsService não está disponível.'
              )
            );
          };

        script.onerror =
          () => {

            reject(
              new Error(
                'Não foi possível carregar Google Maps JavaScript API.'
              )
            );
          };

        document.head.appendChild(
          script
        );
      }
    );

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

function atualizarPagamento() {

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

  /*
   * Domingo = 0
   * Quarta = 3
   * Quinta = 4
   * Sexta = 5
   * Sábado = 6
   */

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

  [
    'numeroEntrega',
    'complementoEntrega'
  ].forEach(
    id => {

      const campo =
        byId(
          id
        );

      if (!campo) {
        return;
      }

      campo.addEventListener(
        'input',
        () => {

          limparCacheCoordenadaCliente();

          agendarCalculoEntrega();
        }
      );

      campo.addEventListener(
        'change',
        () => {

          limparCacheCoordenadaCliente();

          agendarCalculoEntrega();
        }
      );

      campo.addEventListener(
        'blur',
        () => {

          agendarCalculoEntrega();
        }
      );
    }
  );
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
    !n.includes('fritas') &&
    !n.includes('batata')
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
   PERSONALIZAÇÃO
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

    <div style="
      display:grid;
      gap:10px;
      padding-bottom:15px;
    ">

      ${
        ingredientes
          .map(
            ingrediente => `

              <label style="
                display:flex;
                align-items:center;
                gap:10px;
                padding:12px;
                border:1px solid rgba(255,255,255,.12);
                border-radius:12px;
                cursor:pointer;
              ">

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

      <label style="
        display:block;
        margin-top:8px;
      ">

        <span style="
          display:block;
          margin-bottom:6px;
        ">
          Observação do lanche:
        </span>

        <textarea
          id="observacaoItemLanche"
          placeholder="Ex.: carne bem passada, pouco molho..."
          style="
            width:100%;
            min-height:70px;
            border-radius:12px;
            padding:10px;
            box-sizing:border-box;
          "
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


function abrirOpcoesProduto(
  produtoId
) {

  const produto =
    PRODUTOS_COM_OPCOES[
      produtoId
    ];

  if (!produto) {
    return;
  }

  produtoOpcoesAtual =
    produto;

  abrirPersonalizacaoLanche(
    produto
  );
}


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


function confirmarOpcoesProduto() {

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

  fecharOpcoesProduto();
}


/* =========================================================
   ADICIONAIS
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
      'Escolha um lanche primeiro.'
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

  const index =
    lanches[0].index;

  carrinho[index].preco +=
    adicionalPendente.preco;

  carrinho[index].observacao =
    carrinho[index].observacao

      ? carrinho[index].observacao +
        ' | Adicional: ' +
        nomeAdicional

      : 'Adicional: ' +
        nomeAdicional;

  adicionalPendente =
    null;

  renderizarCarrinho();
}


function abrirEscolhaOpcaoAdicional() {

  return;
}


function abrirEscolhaLancheParaAdicional() {

  return;
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

  if (!supabaseClient) {

    regrasEntrega =
      [
        ...REGRAS_ENTREGA_PADRAO
      ];

    return;
  }

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          'delivery_rules'
        )
        .select('*')
        .eq(
          'active',
          true
        )
        .order(
          'km_min',
          {
            ascending: true
          }
        );

    if (error) {

      console.error(
        'Erro ao carregar regras de entrega:',
        error
      );

      regrasEntrega =
        [
          ...REGRAS_ENTREGA_PADRAO
        ];

      return;
    }

    regrasEntrega =
      data?.length
        ? data
        : [
            ...REGRAS_ENTREGA_PADRAO
          ];

    console.log(
      'Regras de entrega carregadas:',
      regrasEntrega
    );

  } catch (erro) {

    console.error(
      'Falha ao carregar regras:',
      erro
    );

    regrasEntrega =
      [
        ...REGRAS_ENTREGA_PADRAO
      ];
  }
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

  if (
    !Number.isFinite(
      distanciaKm
    ) ||
    distanciaKm < 0
  ) {

    return null;
  }

  const regra =
    regrasEntrega.find(
      item => {

        if (
          item.active === false
        ) {
          return false;
        }

        const min =
          Number(
            item.km_min
          );

        const max =
          Number(
            item.km_max
          );

        return (
          distanciaKm >= min &&
          distanciaKm <= max
        );
      }
    );

  if (!regra) {

    return null;
  }

  return Number(
    regra.fee || 0
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

  /*
   * Fallback do Lê Lanches
   */

  return {

    lat:
      -23.4743826,

    lng:
      -47.4619295
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

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

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

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    if (aviso) {

      aviso.innerText =
        'Digite o CEP e informe o número para calcular a entrega.';
    }

    renderizarCarrinho();

    return;
  }

  try {

    if (aviso) {

      aviso.innerText =
        'Calculando distância e taxa de entrega...';
    }

    /*
     * Carrega Google Maps JS.
     */

    await carregarGoogleMapsApi();

    /*
     * Origem = Lê Lanches.
     */

    const origem =
      obterCoordenadasLoja();

    /*
     * Destino montado com CEP + número.
     *
     * O próprio DirectionsService resolve o
     * endereço. Não usamos Geocoding REST aqui.
     */

    const destino =
      montarEnderecoCompletoCliente();

    console.log(
      'Calculando entrega:',
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

    const rota =
      resultado
        ?.routes
        ?.[0];

    const trecho =
      rota
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
        'Google Maps não retornou distância válida.'
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

    /*
     * Localiza regra cadastrada no Supabase.
     */

    const taxa =
      descobrirTaxaPorDistancia(
        distanciaKm
      );

    if (
      taxa === null
    ) {

      taxaEntrega = 0;

      tempoEntregaTexto =
        null;

      if (aviso) {

        aviso.innerText =
          `Distância real: ${
            distanciaKm
              .toFixed(2)
              .replace('.', ',')
          } km | Endereço fora da área de entrega.`;
      }

      renderizarCarrinho();

      return;
    }

    taxaEntrega =
      taxa;

    tempoEntregaTexto =
      somarTempoPreparoComEntrega(
        duracaoSegundos
      );

    if (aviso) {

      aviso.innerText =
        `Distância real: ${
          distanciaKm
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
      'Entrega calculada:',
      {
        distanciaKm,
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

    distanciaEntregaKm =
      null;

    tempoEntregaTexto =
      null;

    if (aviso) {

      aviso.innerText =
        'Não foi possível calcular a entrega. Confira o CEP e o número.';
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

  atualizarPagamento();

  limparCacheCoordenadaCliente();

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
        'Este endereço está fora da nossa área de entrega.'
      );

      return;
    }
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
          )?.value.trim() || 'Sorocaba'
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

    /*
     * Limpa pedido.
     */

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

    atualizarPagamento();

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

  /*
   * 1. Configuração da loja.
   */

  await carregarConfiguracaoLoja();

  console.log(
    'Configuração da loja:',
    configuracaoLoja
  );

  /*
   * 2. Regras de entrega.
   */

  await carregarRegrasEntrega();

  /*
   * 3. Carrega Google Maps antecipadamente.
   */

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

  /*
   * 4. Eventos.
   */

  garantirModalOpcoesForaDoCarrinho();

  aplicarMascaraCep();

  aplicarEventosEntrega();

  atualizarContadores();

  atualizarEntrega();

  atualizarPagamento();

  limparBloqueiosEndereco();

  filtrarCardapio();

  await atualizarStatusLoja();

  /*
   * Atualiza status a cada 5 segundos para
   * refletir mudanças feitas no painel admin.
   */

  setInterval(
    async () => {

      await atualizarStatusLoja();

    },
    5000
  );

  console.log(
    'Lê Lanches 2.1 iniciado.'
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

    atualizarPagamento();

    filtrarCardapio();
  }
);


/* =========================================================
   START
========================================================= */

iniciarSistema();
