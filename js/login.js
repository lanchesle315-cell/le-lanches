/* =========================================================
   LOGIN ADMIN - LÊ LANCHES
   Supabase Auth + profiles
========================================================= */


/* =========================================================
   ELEMENTOS
========================================================= */

const loginForm =
  document.getElementById(
    "loginForm"
  );

const usuarioInput =
  document.getElementById(
    "usuario"
  );

const senhaInput =
  document.getElementById(
    "senha"
  );

const mensagemLogin =
  document.getElementById(
    "mensagemLogin"
  );

const toggleSenhaBtn =
  document.getElementById(
    "toggleSenha"
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

}


/* =========================================================
   MENSAGENS
========================================================= */

function mostrarMensagem(
  texto,
  tipo = "erro"
) {

  if (
    !mensagemLogin
  ) {

    return;
  }


  mensagemLogin.textContent =
    texto || "";


  mensagemLogin.className =
    "mensagem-login";


  if (
    tipo
  ) {

    mensagemLogin.classList.add(
      tipo
    );

  }

}


function limparMensagem() {

  mostrarMensagem(
    "",
    ""
  );

}


/* =========================================================
   BOTÃO
========================================================= */

function definirEstadoBotao(
  carregando
) {

  const botao =
    loginForm?.querySelector(
      'button[type="submit"]'
    );


  if (
    !botao
  ) {

    return;

  }


  botao.disabled =
    carregando;


  botao.textContent =
    carregando
      ? "Entrando..."
      : "Entrar";

}


/* =========================================================
   PERFIL
========================================================= */

async function buscarPerfilUsuario(
  userId
) {

  if (
    !supabaseClient
  ) {

    throw new Error(
      "Supabase não configurado."
    );

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "profiles"
      )
      .select(
        "id, full_name, role, active"
      )
      .eq(
        "id",
        userId
      )
      .single();


  if (
    error
  ) {

    console.error(
      "Erro ao consultar profiles:",
      error
    );


    throw new Error(
      "Não foi possível validar a permissão do usuário."
    );

  }


  return data;

}


/* =========================================================
   PERMISSÃO ADMIN
========================================================= */

function perfilPodeAcessarAdmin(
  perfil
) {

  if (
    !perfil
  ) {

    return false;

  }


  if (
    perfil.active !== true
  ) {

    return false;

  }


  const role =
    String(
      perfil.role || ""
    )
      .trim()
      .toLowerCase();


  return (
    role === "admin" ||
    role === "master"
  );

}


/* =========================================================
   ENCERRAR SESSÃO
========================================================= */

async function encerrarSessao() {

  if (
    !supabaseClient
  ) {

    return;

  }


  try {

    await supabaseClient.auth
      .signOut();

  } catch (
    erro
  ) {

    console.error(
      "Erro ao encerrar sessão:",
      erro
    );

  }

}


/* =========================================================
   REDIRECIONAR
========================================================= */

function abrirPainelAdmin() {

  window.location.href =
    "admin.html";

}


/* =========================================================
   VERIFICAR SESSÃO JÁ EXISTENTE
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
      await supabaseClient.auth
        .getSession();


    if (
      error
    ) {

      throw error;

    }


    const usuario =
      data?.session?.user;


    if (
      !usuario
    ) {

      return;

    }


    const perfil =
      await buscarPerfilUsuario(
        usuario.id
      );


    if (
      perfilPodeAcessarAdmin(
        perfil
      )
    ) {

      abrirPainelAdmin();

      return;

    }


    /*
     * Existe sessão, mas o usuário
     * não possui acesso ao Admin.
     */

    await encerrarSessao();


  } catch (
    erro
  ) {

    console.error(
      "Erro ao validar sessão existente:",
      erro
    );


    await encerrarSessao();

  }

}


/* =========================================================
   MOSTRAR / OCULTAR SENHA
========================================================= */

if (
  toggleSenhaBtn &&
  senhaInput
) {

  toggleSenhaBtn.addEventListener(
    "click",
    () => {

      const tipoAtual =
        senhaInput.getAttribute(
          "type"
        );


      if (
        tipoAtual === "password"
      ) {

        senhaInput.setAttribute(
          "type",
          "text"
        );

        toggleSenhaBtn.textContent =
          "Ocultar";

      } else {

        senhaInput.setAttribute(
          "type",
          "password"
        );

        toggleSenhaBtn.textContent =
          "Mostrar";

      }

    }
  );

}


/* =========================================================
   LOGIN
========================================================= */

if (
  loginForm
) {

  loginForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      limparMensagem();


      /*
       * Agora o campo "usuario"
       * recebe o E-MAIL cadastrado
       * no Supabase Auth.
       */

      const email =
        String(
          usuarioInput?.value ||
          ""
        )
          .trim()
          .toLowerCase();


      const senha =
        String(
          senhaInput?.value ||
          ""
        );


      if (
        !email ||
        !senha
      ) {

        mostrarMensagem(
          "Preencha o e-mail e a senha."
        );

        return;

      }


      if (
        !supabaseClient
      ) {

        mostrarMensagem(
          "Não foi possível conectar ao sistema."
        );

        return;

      }


      try {

        definirEstadoBotao(
          true
        );


        mostrarMensagem(
          "Validando usuário...",
          "aviso"
        );


        /* =================================================
           AUTENTICAÇÃO REAL
        ================================================= */

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
            "Erro Supabase Auth:",
            error
          );


          throw new Error(
            "E-mail ou senha inválidos."
          );

        }


        const usuario =
          data?.user;


        if (
          !usuario
        ) {

          throw new Error(
            "Usuário não encontrado."
          );

        }


        /* =================================================
           VALIDAR PROFILE
        ================================================= */

        mostrarMensagem(
          "Verificando permissão...",
          "aviso"
        );


        const perfil =
          await buscarPerfilUsuario(
            usuario.id
          );


        /* =================================================
           ACTIVE
        ================================================= */

        if (
          perfil?.active !== true
        ) {

          await encerrarSessao();


          mostrarMensagem(
            "Este usuário está desativado."
          );


          return;

        }


        /* =================================================
           ROLE
        ================================================= */

        if (
          !perfilPodeAcessarAdmin(
            perfil
          )
        ) {

          await encerrarSessao();


          mostrarMensagem(
            "Este usuário não possui acesso ao Painel Admin."
          );


          return;

        }


        /* =================================================
           ACESSO LIBERADO
        ================================================= */

        mostrarMensagem(
          "Acesso autorizado.",
          "sucesso"
        );


        setTimeout(
          () => {

            abrirPainelAdmin();

          },
          400
        );


      } catch (
        erro
      ) {

        console.error(
          "Falha no login Admin:",
          erro
        );


        await encerrarSessao();


        mostrarMensagem(
          erro?.message ||
          "Não foi possível realizar o login."
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
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    verificarSessaoExistente();

  }
);
