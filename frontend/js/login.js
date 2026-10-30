document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const dados = await res.json();

        if (!res.ok) {
            msgErro.textContent = dados.erro || 'Falha no login.';
            return;
        }

        localStorage.setItem('token_escolar', dados.token);
        localStorage.setItem('usuario_escolar', JSON.stringify(dados.usuario));

        window.location.href = dados.usuario.perfil === 'diretoria' ? 'diretoria.html' : 'aluno.html';
    } catch (erro) {
        msgErro.textContent = 'Erro de conexão com o servidor.';
    }
});