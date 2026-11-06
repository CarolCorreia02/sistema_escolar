const formLogin = document.getElementById('form-login');
const msgLogin = document.getElementById('mensagem-login');

const motivo = new URLSearchParams(window.location.search).get('motivo');
if (motivo) {
    msgLogin.textContent = motivo;
    msgLogin.className = 'alert-box alert-success';
    msgLogin.hidden = false;
}

if (obterToken() && paginasPorNivel[obterNivel()]) {
    window.location.replace(paginasPorNivel[obterNivel()]);
}

// Botões de preenchimento rápido para avaliação do professor
document.querySelectorAll('[data-demo-email]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('email').value = btn.dataset.demoEmail;
        document.getElementById('senha').value = 'Didatica@123';
    });
});

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgLogin.hidden = true;
    const btn = document.getElementById('btn-entrar');
    btn.disabled = true;
    btn.textContent = 'Autenticando...';

    try {
        const dados = await api('/auth/login', {
            method: 'POST',
            body: {
                email: document.getElementById('email').value.trim(),
                senha: document.getElementById('senha').value
            }
        });

        sessionStorage.clear();
        sessionStorage.setItem('token', dados.token);
        sessionStorage.setItem('id', String(dados.usuario.id));
        sessionStorage.setItem('nome', dados.usuario.nome);
        sessionStorage.setItem('email', dados.usuario.email);
        sessionStorage.setItem('nivel', dados.usuario.nivel);
        sessionStorage.setItem('matricula', dados.usuario.matricula || '');
        sessionStorage.setItem('turma', dados.usuario.turma || '');

        window.location.replace(paginasPorNivel[dados.usuario.nivel] || 'aluno.html');
    } catch (erro) {
        msgLogin.textContent = erro.message;
        msgLogin.className = 'alert-box alert-error';
        msgLogin.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Entrar no Portal';
    }
});

// SISTEMA PÚBLICO DE VERIFICAÇÃO DE AUTENTICIDADE DE DOCUMENTOS
const formVerificar = document.getElementById('form-verificar-doc');
const resultadoVerificacao = document.getElementById('resultado-verificacao');

if (formVerificar) {
    formVerificar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const codigo = document.getElementById('codigo-verificacao').value.trim().toUpperCase();
        if (!codigo) return;

        resultadoVerificacao.hidden = false;
        resultadoVerificacao.innerHTML = '<p>Consultando banco de dados MySQL...</p>';

        try {
            const res = await api('/documentos/verificar/' + encodeURIComponent(codigo));
            resultadoVerificacao.innerHTML = `
                <div class="alert-box alert-success" style="margin-top: 0.75rem;">
                    ✅ <strong>DOCUMENTO AUTÊNTICO!</strong><br>
                    Tipo: <strong>${res.documento.tipo_documento}</strong><br>
                    Aluno: <strong>${res.documento.aluno_nome}</strong> (Matrícula: ${res.documento.matricula})<br>
                    Turma: ${res.documento.turma}<br>
                    Código: <strong>${res.documento.codigo_verificacao}</strong>
                </div>
            `;
        } catch (erro) {
            resultadoVerificacao.innerHTML = `
                <div class="alert-box alert-error" style="margin-top: 0.75rem;">
                    ❌ <strong>Código Inválido ou Não Encontrado:</strong> ${erro.message}
                </div>
            `;
        }
    });
}
