/* =========================================================
   RESET PASSWORD - LÊ LANCHES
========================================================= */

const resetPasswordForm =
  document.getElementById(
    'resetPasswordForm'
  );

const novaSenhaInput =
  document.getElementById(
    'novaSenha'
  );

const confirmarSenhaInput =
  document.getElementById(
    'confirmarSenha'
  );

const mensagemReset =
  document.getElementById(
    'mensagemReset'
  );

const btnSalvarSenha =
  document.getElementById(
    'btnSalvarSenha'
  );

const btnSalvarSenhaTexto =
  document.getElementById(
    'btnSalvarSenhaTexto'
  );

const toggleNovaSenha =
  document.getElementById(
    'toggleNovaSenha'
  );

const toggleConfirmarSenha =
  document.getElementById(
    'toggleConfirmarSenha'
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

function mostrarMensagemReset(
  texto,
  tipo = 'erro'
) {

  if (
    !mensagemReset
  ) {
    return;
  }

  mensagemReset.textContent =
    texto || '';

  mensagemReset.className =
    'mensagem-reset';

  if (
    tipo
  ) {

    mensagemReset.classList.add(
      tipo
    );
  }
}


/* =========================================================
   BOTÃO
========================================================= */

function definirEstadoBotao(
  carregando
) {

  if (
    !btnSalvarSenha
  ) {
    return;
  }

  btnSalvarSenha.disabled =
    !!carregando;

  if (
    btnSalvarSenhaTexto
  ) {

    btnSalvarSenhaTexto.textContent =
      carregando
        ? 'Salvando nova senha...'
        : 'Salvar nova senha';
  }
}


/* =========================================================
   MOSTRAR / OCULTAR SENHA
========================================================= */

function configurarToggleSenha(
  botao,
  input
) {

  if (
    !botao ||
    !input
  ) {
    return;
  }

  botao.addEventListener(
    'click',
    () => {

      const visivel =
        input.type === 'text';

      input.type =
        visivel
          ? 'password'
          : 'text';

      botao.textContent =
        visivel
          ? 'Mostrar'
          : 'Ocultar';
    }
  );
}


configurarToggleSenha(
  toggleNovaSenha,
  novaSenhaInput
);

configurarToggleSenha(
  toggleConfirmarSenha,
  confirmarSenhaInput
);


/* =========================================================
   VERIFICAR SESSÃO DE RECUPERAÇÃO
========================================================= */

async function verificarSessaoRecovery() {

  if (
    !supabaseClient
  ) {

    mostrarMensagemReset(
      'Não foi possível conectar ao sistema.',
      'erro'
    );

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
        'Erro ao verificar sessão:',
        error
      );

      mostrarMensagemReset(
        'Não foi possível validar o link de recuperação.',
        'erro'
      );

      return false;
    }


    if (
      !data?.session?.user
    ) {

      mostrarMensagemReset(
        'Link de recuperação inválido ou expirado. Solicite um novo e-mail.',
        'erro'
      );

      return false;
    }


    mostrarMensagemReset(
      'Link validado. Digite sua nova senha.',
      'sucesso'
    );

    return true;

  } catch (
    erro
  ) {

    console.error(
      'Erro ao validar recuperação:',
      erro
    );

    mostrarMensagemReset(
      'Não foi possível validar o link de recuperação.',
      'erro'
    );

    return false;
  }
}


/* =========================================================
   SALVAR NOVA SENHA
========================================================= */

if (
  resetPasswordForm
) {

  resetPasswordForm.addEventListener(
    'submit',
    async evento => {

      evento.preventDefault();


      if (
        !supabaseClient
      ) {

        mostrarMensagemReset(
          'Supabase não configurado.',
          'erro'
        );

        return;
      }


      const novaSenha =
        String(
          novaSenhaInput?.value ||
          ''
        );


      const confirmarSenha =
        String(
          confirmarSenhaInput?.value ||
          ''
        );


      if (
        !novaSenha ||
        !confirmarSenha
      ) {

        mostrarMensagemReset(
          'Preencha os dois campos de senha.',
          'erro'
        );

        return;
      }


      if (
        novaSenha.length < 8
      ) {

        mostrarMensagemReset(
          'A senha precisa ter no mínimo 8 caracteres.',
          'erro'
        );

        return;
      }


      if (
        novaSenha !== confirmarSenha
      ) {

        mostrarMensagemReset(
          'As senhas digitadas não são iguais.',
          'erro'
        );

        return;
      }


      try {

        definirEstadoBotao(
          true
        );


        mostrarMensagemReset(
          'Atualizando sua senha...',
          'aviso'
        );


        const {
          data: sessaoData,
          error: sessaoErro
        } =
          await supabaseClient.auth.getSession();


        if (
          sessaoErro ||
          !sessaoData?.session?.user
        ) {

          throw new Error(
            'A sessão de recuperação expirou. Solicite um novo link.'
          );
        }


        const {
          error
        } =
          await supabaseClient.auth.updateUser(
            {
              password:
                novaSenha
            }
          );


        if (
          error
        ) {

          console.error(
            'Erro ao atualizar senha:',
            error
          );

          throw new Error(
            error.message ||
            'Não foi possível alterar a senha.'
          );
        }


        mostrarMensagemReset(
          'Senha alterada com sucesso! Redirecionando para o Painel Master...',
          'sucesso'
        );


        if (
          novaSenhaInput
        ) {

          novaSenhaInput.value =
            '';
        }


        if (
          confirmarSenhaInput
        ) {

          confirmarSenhaInput.value =
            '';
        }


        setTimeout(
          async () => {

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


            window.location.href =
              'master-login.html';

          },
          1200
        );

      } catch (
        erro
      ) {

        console.error(
          'Erro ao salvar nova senha:',
          erro
        );


        mostrarMensagemReset(
          erro?.message ||
          'Não foi possível alterar a senha.',
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
   EVENTOS DE RECUPERAÇÃO DO SUPABASE
========================================================= */

if (
  supabaseClient
) {

  supabaseClient.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

      console.log(
        'Evento Auth:',
        event
      );


      if (
        event === 'PASSWORD_RECOVERY'
      ) {

        mostrarMensagemReset(
          'Link de recuperação validado. Digite sua nova senha.',
          'sucesso'
        );
      }
    }
  );
}

/* =========================================================
   RECUPERAÇÃO DE SENHA
========================================================= */

const btnEsqueciSenha =
  document.getElementById(
    'btnEsqueciSenha'
  );


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
          'Falha na recuperação:',
          erro
        );


        if (
          String(
            erro?.message ||
            ''
          )
            .toLowerCase()
            .includes(
              'rate limit'
            )
        ) {

          mostrarMensagemMaster(
            'Muitas tentativas de recuperação foram feitas. Aguarde alguns minutos e tente novamente.',
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
  async () => {

    definirEstadoBotao(
      true
    );


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          500
        )
    );


    await verificarSessaoRecovery();


    definirEstadoBotao(
      false
    );
  }
);
