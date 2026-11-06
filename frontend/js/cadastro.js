const selectNivel = document.getElementById('nivel');
const grupoCodigoDiretoria = document.getElementById('grupo-codigo-diretoria');
const grupoTurmaAluno = document.getElementById('grupo-turma-aluno');
const formCadastro = document.getElementById('form-cadastro');
const msgCadastro = document.getElementById('mensagem-cadastro');

selectNivel.addEventListener('change', () => {
    const isDiretoria = selectNivel.value === 'diretoria';
    grupoCodigoDiretoria.hidden = !isDiretoria;
    grupoTurmaAluno.hidden = isDiretoria;
});

formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgCadastro.hidden = true;

    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar-senha').value;

    if (senha !== confirmar) {
        msgCadastro.textContent = 'As senhas informadas não coincidem.';
        msgCadastro.className = 'alert-box alert-error';
        msgCadastro.hidden = false;
        return;
    }

    const btn = document.getElementById('btn-cadastrar');
    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
        const resposta = await api('/auth/cadastro', {
            method: 'POST',
            body: {
                nome: document.getElementById('nome').value.trim(),
                email: document.getElementById('email').value.trim(),
                cpf: document.getElementById('cpf').value.trim(),
                data_nascimento: document.getElementById('data-nascimento').value,
                nivel: selectNivel.value,
                codigo_diretoria: document.getElementById('codigo-diretoria').value.trim(),
                turma: document.getElementById('turma').value.trim(),
                senha
            }
        });

        window.location.assign('login.html?motivo=' + encodeURIComponent(resposta.mensagem));
    } catch (erro) {
        msgCadastro.textContent = erro.message;
        msgCadastro.className = 'alert-box alert-error';
        msgCadastro.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Concluir Cadastro';
    }
});
