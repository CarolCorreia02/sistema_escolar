const paginasPorNivel = {
    diretoria: 'diretoria.html',
    aluno: 'aluno.html'
};

// Funciona tanto abrindo via Live Server (porta 5500/5501) quanto direto pelo Node (porta 3000)
const API_BASE = ['5500', '5501'].includes(window.location.port) || window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : window.location.origin;

function obterToken() { return sessionStorage.getItem('token'); }
function obterNivel() { return sessionStorage.getItem('nivel'); }
function obterNome() { return sessionStorage.getItem('nome') || 'Usuário'; }
function obterUsuarioId() { return Number(sessionStorage.getItem('id') || 0); }

function logout(motivo = '') {
    sessionStorage.clear();
    window.location.replace('login.html' + (motivo ? '?motivo=' + encodeURIComponent(motivo) : ''));
}

function verificarLogin(...niveisPermitidos) {
    if (!obterToken()) {
        window.location.replace('login.html');
        return false;
    }
    try {
        const payload = JSON.parse(atob(obterToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (!payload.exp || payload.exp * 1000 <= Date.now()) {
            logout('Sua sessão expirou. Faça login novamente.');
            return false;
        }
    } catch (e) {
        logout('Sessão inválida. Entre novamente.');
        return false;
    }

    const nivelAtual = obterNivel();
    if (niveisPermitidos.length > 0 && !niveisPermitidos.includes(nivelAtual)) {
        window.location.replace(paginasPorNivel[nivelAtual] || 'login.html');
        return false;
    }
    return true;
}

async function api(caminho, opcoes = {}) {
    const headers = { Accept: 'application/json' };
    if (obterToken()) {
        headers.Authorization = 'Bearer ' + obterToken();
    }
    const config = {
        method: opcoes.method || 'GET',
        headers
    };
    if (opcoes.body !== undefined) {
        headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(opcoes.body);
    }

    let resposta;
    try {
        resposta = await fetch(API_BASE + caminho, config);
    } catch (erro) {
        throw new Error('Não foi possível conectar ao servidor Node.js na porta 3000. Verifique se rodou "npm start" na pasta backend.');
    }

    const dados = await resposta.json().catch(() => ({}));
    if (resposta.status === 401 && obterToken()) {
        logout('Sessão expirada. Faça login novamente.');
        throw new Error('Sessão expirada.');
    }
    if (!resposta.ok) {
        throw new Error(dados.mensagem || 'Erro ao processar requisição.');
    }
    return dados;
}

let timerToast;
function mostrarToast(mensagem) {
    let el = document.getElementById('toast-global');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-global';
        el.className = 'toast';
        document.body.appendChild(el);
    }
    clearTimeout(timerToast);
    el.textContent = mensagem;
    el.hidden = false;
    timerToast = setTimeout(() => { el.hidden = true; }, 4500);
}

function formatarData(valor) {
    if (!valor) return '-';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor);
    return d.toLocaleDateString('pt-BR');
}

function prepararCabecalho() {
    document.querySelectorAll('[data-nome-usuario]').forEach(el => {
        el.textContent = obterNome();
    });
    document.querySelectorAll('[data-matricula-usuario]').forEach(el => {
        el.textContent = sessionStorage.getItem('matricula') || '';
    });
    document.querySelectorAll('[data-logout]').forEach(btn => {
        btn.addEventListener('click', () => logout());
    });

    // Navegação por abas
    const botoesAba = document.querySelectorAll('[data-aba]');
    botoesAba.forEach(btn => {
        btn.addEventListener('click', () => {
            const alvo = btn.dataset.aba;
            botoesAba.forEach(b => b.classList.toggle('active', b.dataset.aba === alvo));
            document.querySelectorAll('.painel-aba').forEach(painel => {
                painel.hidden = painel.id !== 'aba-' + alvo;
            });
        });
    });
}

// Renderiza o HTML de um Documento Escolar Oficial (usado na Diretoria, no Aluno e na Verificação)
function gerarHtmlDocumentoOficial(ficha, tipoDocumento, codigoVerificacao, observacao = '') {
    const dataHoje = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const codigo = codigoVerificacao || 'PREVIA-SEM-EMISSAO';

    let conteudoEspecifico = '';

    if (tipoDocumento === 'Declaração de Frequência') {
        conteudoEspecifico = `
            <p style="margin-bottom: 1rem; text-align: justify;">
                Declaramos, para os devidos fins de comprovação junto a instituições de ensino, programas de estágio ou órgãos públicos,
                que o(a) estudante <strong>${ficha.nome}</strong>, portador(a) do CPF <strong>${ficha.cpf || 'Não informado'}</strong>,
                regularmente matriculado(a) sob o nº <strong>${ficha.matricula}</strong> na turma <strong>${ficha.turma}</strong>,
                apresenta frequência global de <strong>${ficha.frequencia_percentual}%</strong> até a presente data letiva.
            </p>
            <div class="stats-grid" style="margin: 1rem 0;">
                <div class="stat-card teal"><div class="stat-label">Carga Horária Total</div><div class="stat-value">${ficha.carga_horaria_total}h</div></div>
                <div class="stat-card"><div class="stat-label">Faltas Registradas</div><div class="stat-value">${ficha.total_faltas} aulas</div></div>
                <div class="stat-card terracotta"><div class="stat-label">Faltas Não Abonadas</div><div class="stat-value">${ficha.faltas_computadas} aulas</div></div>
                <div class="stat-card burgundy"><div class="stat-label">Frequência Oficial</div><div class="stat-value">${ficha.frequencia_percentual}%</div></div>
            </div>
        `;
    } else if (tipoDocumento === 'Comprovante de Matrícula') {
        conteudoEspecifico = `
            <p style="margin-bottom: 1rem; text-align: justify;">
                Certificamos que <strong>${ficha.nome}</strong> (CPF: <strong>${ficha.cpf || '-'}</strong>,
                Data de Nascimento: <strong>${formatarData(ficha.data_nascimento)}</strong>) possui vínculo estudantil e
                matrícula <strong>${ficha.status_matricula || 'Ativa'}</strong> nesta instituição de ensino no ano letivo de 2026,
                sob o registro acadêmico nº <strong>${ficha.matricula}</strong>, cursando <strong>${ficha.turma}</strong>.
            </p>
        `;
    } else {
        // Histórico Escolar ou Boletim Escolar Oficial
        const linhasNotas = (ficha.boletim || []).map(n => `
            <tr>
                <td><strong>${n.disciplina}</strong></td>
                <td>${n.carga_horaria}h</td>
                <td>${Number(n.bim1).toFixed(1)}</td>
                <td>${Number(n.bim2).toFixed(1)}</td>
                <td>${Number(n.bim3).toFixed(1)}</td>
                <td>${Number(n.bim4).toFixed(1)}</td>
                <td><strong>${Number(n.media).toFixed(2)}</strong></td>
                <td><span class="badge ${n.situacao === 'Aprovado' ? 'badge-success' : (n.situacao === 'Em Recuperação' ? 'badge-warning' : 'badge-danger')}">${n.situacao}</span></td>
            </tr>
        `).join('');

        conteudoEspecifico = `
            <p style="margin-bottom: 1rem;">
                Registro oficial de aproveitamento acadêmico, notas bimestrais e frequência consolidada do(a) discente
                <strong>${ficha.nome}</strong> — Matrícula <strong>${ficha.matricula}</strong> (${ficha.turma}).
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Disciplina</th>
                        <th>C.H.</th>
                        <th>1º Bim</th>
                        <th>2º Bim</th>
                        <th>3º Bim</th>
                        <th>4º Bim</th>
                        <th>Média Final</th>
                        <th>Resultado</th>
                    </tr>
                </thead>
                <tbody>${linhasNotas || '<tr><td colspan="8">Nenhuma disciplina lançada.</td></tr>'}</tbody>
            </table>
            <p style="margin-top: 1rem; font-weight: 600;">
                Média Geral Acumulada: <span style="color: var(--purple-deep);">${ficha.media_geral}</span> |
                Frequência Escolar: <span style="color: var(--teal-blue);">${ficha.frequencia_percentual}%</span>
            </p>
        `;
    }

    return `
        <div class="official-doc">
            <div class="official-doc-header">
                <div>
                    <h3 style="color: var(--purple-deep); font-size: 1.25rem;">COLÉGIO TÉCNICO EDUPORTAL</h3>
                    <p style="font-size: 0.84rem; color: var(--text-muted);">Secretaria Acadêmica Digital • Diretoria de Ensino</p>
                </div>
                <div class="official-seal">
                    <div><strong>CÓDIGO DE VERIFICAÇÃO</strong></div>
                    <div style="font-size: 1rem; font-weight: 800; color: var(--terracotta);">${codigo}</div>
                    <div>Autenticidade verificável no portal</div>
                </div>
            </div>

            <h2 style="text-align: center; color: var(--purple-indigo); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.8px;">
                ${tipoDocumento}
            </h2>

            ${conteudoEspecifico}

            ${observacao ? `<p style="margin-top: 1rem; padding: 0.7rem; background: var(--purple-light); border-radius: 6px; font-size: 0.85rem;"><strong>Observação da Diretoria:</strong> ${observacao}</p>` : ''}

            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; font-size: 0.82rem;">
                <div>
                    <p>Emitido eletronicamente em ${dataHoje}.</p>
                    <p>Valide este documento em <strong>login.html</strong> usando o código <strong>${codigo}</strong>.</p>
                </div>
                <div style="text-align: center;">
                    <div style="border-top: 1px solid #333; width: 220px; padding-top: 0.3rem; font-weight: 700;">
                        Diretoria Acadêmica EduPortal
                    </div>
                    <small>Assinatura Digital Certificada JWT/Hash</small>
                </div>
            </div>
        </div>
    `;
}
