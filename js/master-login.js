/* =========================================================
   MASTER LOGIN - LÊ LANCHES
========================================================= */

const masterLoginForm =
  document.getElementById(
    'masterLoginForm'
  );

const masterEmailInput =
  document.getElementById(
    'masterEmail'
  );

const masterSenhaInput =
  document.getElementById(
    'masterSenha'
  );

const mensagemMasterLogin =
  document.getElementById(
    'mensagemMasterLogin'
  );

const toggleMasterSenha =
  document.getElementById(
    'toggleMasterSenha'
  );

const btnMasterLogin =
  document.getElementById(
    'btnMasterLogin'
  );

const btnMasterLoginTexto =
  document.getElementById(
    'btnMasterLoginTexto'
  );

const btnEsqueciSenha =
  document.getElementById(
    'btnEsqueciSenha'
  );


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
   MENSAGENS
========================================================= */

function mostrarMensagemMaster(
  texto,
  tipo = 'erro'
) {

  if (
    !mensagemMasterLogin
  ) {
    return;
  }

  mensagemMasterLogin.textContent =
    texto || '';

  mensagemMasterLogin.className =
    'mensagem-login';

  if (
    tipo
  ) {

    mensagemMasterLogin.classList.add(
      tipo
    );
  }
}


function limparMensagemMaster() {

  mostrarMensagemMaster(
    '',
    ''
  );
}


/* =========================================================
   BOTÃO LOGIN
========================================================= */

function definirEstadoBotao(
  carregando
) {

  if (
    !btnMasterLogin
  ) {
    return;
  }

  btnMasterLogin.disabled =
    !!carregando;

  if (
    btnMasterLoginTexto
  ) {

    btnMasterLoginTexto.textContent =
      carregando
        ? 'Validando acesso...'
        : 'Entrar no Painel Master';
  }
}


/* =========================================================
   CONSULTAR PERFIL
========================================================= */

async function buscarPerfilUsuario(
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
      'Erro ao buscar perfil:',
      error
    );

    throw new Error(
      'Não foi possível consultar o perfil do usuário.'
    );
  }


  return data;
}


/* =========================================================
   VERIFICAR SE É MASTER
========================================================= */

function perfilEhMaster(
  perfil
) {

  return (
    perfil &&
    perfil.role === 'master' &&
    perfil.active === true
  );
}


/* =========================================================
   LOGOUT
========================================================= */

async function encerrarSessaoMaster() {

  if (
    !supabaseClient
  ) {
    return;
  }

  try {

    await supabaseClient.auth.signOut();

  } catch (
    erro
  ) {

    console.error(
      'Erro ao encerrar sessão:',
      erro
    );
  }
}


/* =========================================================
   ABRIR PAINEL MASTER
========================================================= */

function abrirPainelMaster() {

  window.location.href =
    'master.html';
}


/* =========================================================
   SESSÃO EXISTENTE
========================================================= */

async function verificarSessaoExistente() {

  if (
    !supabaseClient
  ) {
    return;
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
        'Erro ao consultar sessão:',
        error
      );

      return;
    }


    const sessao =
      data?.session;


    if (
      !sessao?.user
    ) {

      return;
    }


    const perfil =
      await buscarPerfilUsuario(
        sessao.user.id
      );


    /*
     * IMPORTANTE:
     *
     * Enquanto o master.html ainda não foi criado,
     * NÃO redirecionamos automaticamente.
     *
     * Apenas avisamos que já existe uma sessão válida.
     */

    if (
      perfilEhMaster(
        perfil
      )
    ) {

      mostrarMensagemMaster(
        'Sessão Master já autenticada. Você pode entrar novamente quando o painel estiver disponível.',
        'sucesso'
      );

      return;
    }


    /*
     * Se existe sessão, mas não é Master,
     * encerra por segurança.
     */

    await encerrarSessaoMaster();


  } catch (
    erro
  ) {

    console.error(
      'Erro ao validar sessão existente:',
      erro
    );
  }
}


/* =========================================================
   MOSTRAR / OCULTAR SENHA
========================================================= */

if (
  toggleMasterSenha &&
  masterSenhaInput
) {

  toggleMasterSenha.addEventListener(
    'click',
    () => {

      const mostrando =
        masterSenhaInput.type ===
        'text';


      if (
        mostrando
      ) {

        masterSenhaInput.type =
          'password';

        toggleMasterSenha.textContent =
          'Mostrar';

      } else {

        masterSenhaInput.type =
          'text';

        toggleMasterSenha.textContent =
          'Ocultar';
      }

    }
  );
}


/* =========================================================
   LOGIN
========================================================= */

if (
  masterLoginForm
) {

  masterLoginForm.addEventListener(
    'submit',
    async evento => {

      evento.preventDefault();


      limparMensagemMaster();


      const email =
        String(
          masterEmailInput?.value ||
          ''
        )
          .trim()
          .toLowerCase();


      const senha =
        String(
          masterSenhaInput?.value ||
          ''
        );


      if (
        !email ||
        !senha
      ) {

        mostrarMensagemMaster(
          'Preencha o e-mail e a senha.',
          'erro'
        );

        return;
      }


      if (
        !supabaseClient
      ) {

        mostrarMensagemMaster(
          'Não foi possível conectar ao sistema.',
          'erro'
        );

        return;
      }


      try {

        definirEstadoBotao(
          true
        );


        mostrarMensagemMaster(
          'Validando usuário...',
          'aviso'
        );


        /*
         * LOGIN REAL NO SUPABASE AUTH
         */

        const {
          data,
          error
        } =
          await supabaseClient.auth
            .signInWithPassword(
              {

                email:
                  email,

                password:
                  senha

              }
            );


        if (
          error
        ) {

          console.error(
            'Erro de autenticação:',
            error
          );


          throw new Error(
            'E-mail ou senha inválidos.'
          );
        }


        const usuario =
          data?.user;


        if (
          !usuario
        ) {

          throw new Error(
            'Usuário não encontrado.'
          );
        }


        /*
         * CONFERE O PERFIL MASTER
         */

        mostrarMensagemMaster(
          'Verificando permissão Master...',
          'aviso'
        );


        const perfil =
          await buscarPerfilUsuario(
            usuario.id
          );


        if (
          !perfilEhMaster(
            perfil
          )
        ) {

          await encerrarSessaoMaster();


          mostrarMensagemMaster(
            'Este usuário não possui acesso ao Painel Master.',
            'erro'
          );


          return;
        }


        /*
         * LOGIN CORRETO
         */

        mostrarMensagemMaster(
          'Acesso autorizado.',
          'sucesso'
        );


        /*
         * Quando master.html existir,
         * este redirecionamento será usado.
         */

        setTimeout(
          () => {

            abrirPainelMaster();

          },
          700
        );


      } catch (
        erro
      ) {

        console.error(
          'Falha no login Master:',
          erro
        );


        await encerrarSessaoMaster();


        mostrarMensagemMaster(
          erro?.message ||
          'Não foi possível realizar o login.',
          'erro'
        );


      } finally {

        definirEstadoBotao(
          false
        );
      }

    }
  );
}


/* =========================================================
   RECUPERAÇÃO DE SENHA
========================================================= */

if (
  btnEsqueciSenha
) {

  btnEsqueciSenha.addEventListener(
    'click',
    async () => {

      limparMensagemMaster();


      const email =
        String(
          masterEmailInput?.value ||
          ''
        )
          .trim()
          .toLowerCase();


      if (
        !email
      ) {

        mostrarMensagemMaster(
          'Digite seu e-mail primeiro.',
          'erro'
        );


        if (
          masterEmailInput
        ) {

          masterEmailInput.focus();
        }


        return;
      }


      if (
        !supabaseClient
      ) {

        mostrarMensagemMaster(
          'Não foi possível conectar ao sistema.',
          'erro'
        );

        return;
      }


      try {

        btnEsqueciSenha.disabled =
          true;


        btnEsqueciSenha.textContent =
          'Enviando...';


        mostrarMensagemMaster(
          'Enviando e-mail de recuperação...',
          'aviso'
        );


        const {
          error
        } =
          await supabaseClient.auth
            .resetPasswordForEmail(
              email,
              {

                redirectTo:
                  'https://le-lanches.vercel.app/reset-password.html'

              }
            );


        if (
          error
        ) {

          console.error(
            'Erro ao enviar recuperação:',
            error
          );


          throw error;
        }


        mostrarMensagemMaster(
          'E-mail de recuperação enviado. Verifique sua caixa de entrada.',
          'sucesso'
        );


      } catch (
        erro
      ) {

        console.error(
          'Falha na recuperação de senha:',
          erro
        );


        const mensagemErro =
          String(
            erro?.message ||
            ''
          )
            .toLowerCase();


        if (
          mensagemErro.includes(
            'rate limit'
          )
        ) {

          mostrarMensagemMaster(
            'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.',
            'erro'
          );

        } else {

          mostrarMensagemMaster(
            'Não foi possível enviar o e-mail de recuperação.',
            'erro'
          );
        }


      } finally {

        btnEsqueciSenha.disabled =
          false;


        btnEsqueciSenha.textContent =
          'Esqueci minha senha';
      }

    }
  );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    verificarSessaoExistente()
      .catch(
        erro => {

          console.error(
            'Erro ao verificar sessão inicial:',
            erro
          );

        }
      );

  }
);
