(function inicializarTema() {
    const temaSalvo = localStorage.getItem('tema_escolar') || 'dark';
    document.documentElement.setAttribute('data-theme', temaSalvo);
})();

function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novoTema = atual === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', novoTema);
    localStorage.setItem('tema_escolar', novoTema);
    atualizarTextoBotaoTema();
}

function atualizarTextoBotaoTema() {
    const btn = document.getElementById('btn-tema');
    if (!btn) return;
    const atual = document.documentElement.getAttribute('data-theme');
    btn.textContent = atual === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro';
}

document.addEventListener('DOMContentLoaded', atualizarTextoBotaoTema);