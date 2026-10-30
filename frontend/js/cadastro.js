document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        senha: document.getElementById('senha').value,
        perfil: document.getElementById('perfil').value,
        matricula: document.getElementById('matricula').value,
        turma: document.getElementById('turma').value
    };

    const res = await fetch(`${API_URL}/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const dados = await res.json();
    const msg = document.getElementById('msg-retorno');

    if (res.ok) {
        alert('Cadastro realizado com sucesso! Faça login.');
        window.location.href = 'login.html';
    } else {
        msg.style.color = 'var(--accent)';
        msg.textContent = dados.erro || 'Erro ao cadastrar.';
    }
});