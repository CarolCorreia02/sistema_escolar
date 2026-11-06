let minhaFicha = null;
let meusDocumentos = [];

if (verificarLogin('aluno')) {
    prepararCabecalho();
    carregarPainelAluno();
}

async function carregarPainelAluno() {
    try {
        const meuId = obterUsuarioId();
        const [ficha, documentos, avisos] = await Promise.all([
            api('/alunos/' + meuId + '/ficha'),
            api('/documentos'),
            api('/avisos')
        ]);

        minhaFicha = ficha;
        meusDocumentos = documentos;

        atualizarResumoAluno();
        renderizarMeuBoletim();
        renderizarMinhasFaltas();
        renderizarMeusDocumentos();
        renderizarMuralAluno(avisos);
    } catch (erro) {
        mostrarToast('Erro ao carregar dados do aluno: ' + erro.message);
    }
}

function atualizarResumoAluno() {
    document.getElementById('aluno-media-geral').textContent = minhaFicha.media_geral;
    document.getElementById('aluno-frequencia').textContent = minhaFicha.frequencia_percentual + '%';
    document.getElementById('aluno-total-faltas').textContent = minhaFicha.total_faltas + ' aula(s)';
    const emitidos = meusDocumentos.filter(d => d.status === 'Emitido').length;
    document.getElementById('aluno-docs-prontos').textContent = emitidos;
}

function renderizarMeuBoletim() {
    const tbody = document.getElementById('tabela-meu-boletim');
    if (!minhaFicha.boletim || minhaFicha.boletim.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Nenhuma nota disponível no boletim.</td></tr>';
        return;
    }

    tbody.innerHTML = minhaFicha.boletim.map(n => {
        const badge = n.situacao === 'Aprovado'
            ? 'badge-success'
            : (n.situacao === 'Em Recuperação' ? 'badge-warning' : 'badge-danger');
        return `
            <tr>
                <td><strong>${n.disciplina}</strong></td>
                <td>${n.carga_horaria}h</td>
                <td>${Number(n.bim1).toFixed(1)}</td>
                <td>${Number(n.bim2).toFixed(1)}</td>
                <td>${Number(n.bim3).toFixed(1)}</td>
                <td>${Number(n.bim4).toFixed(1)}</td>
                <td><strong>${Number(n.media).toFixed(2)}</strong></td>
                <td><span class="badge ${badge}">${n.situacao}</span></td>
            </tr>
        `;
    }).join('');
}

function renderizarMinhasFaltas() {
    const tbody = document.getElementById('tabela-minhas-faltas');
    const faltas = minhaFicha.faltas || [];
    if (faltas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Parabéns! Você não possui faltas registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = faltas.map(f => {
        const abonada = Boolean(f.justificada) || f.status_justificativa === 'Abonada';
        const badge = abonada
            ? 'badge-success'
            : (f.status_justificativa === 'Em análise' ? 'badge-warning' : 'badge-danger');

        return `
            <tr>
                <td><strong>${f.disciplina}</strong></td>
                <td>${formatarData(f.data_falta)}</td>
                <td>${f.quantidade} aula(s)</td>
                <td><span class="badge ${badge}">${abonada ? 'Justificada / Abonada' : f.status_justificativa}</span></td>
                <td>${f.justificativa || '-'}</td>
                <td>
                    ${!abonada && f.status_justificativa !== 'Em análise' ? `
                        <button class="btn btn-primary btn-small" onclick="enviarJustificativaAluno(${f.id})">Enviar Justificativa</button>
                    ` : '<small style="color:var(--text-muted)">Registrado</small>'}
                </td>
            </tr>
        `;
    }).join('');
}

window.enviarJustificativaAluno = async function (faltaId) {
    const motivo = window.prompt('Descreva o motivo da ausência ou número do atestado médico para análise da Diretoria:');
    if (!motivo || motivo.trim().length < 5) {
        mostrarToast('Informe uma justificativa com pelo menos 5 caracteres.');
        return;
    }
    try {
        const res = await api('/faltas/' + faltaId, {
            method: 'PUT',
            body: { justificativa: motivo.trim() }
        });
        mostrarToast(res.mensagem);
        await carregarPainelAluno();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

// SOLICITAÇÃO DE DOCUMENTOS PELO ALUNO E ACOMPANHAMENTO DE STATUS
document.getElementById('form-solicitar-doc').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await api('/documentos', {
            method: 'POST',
            body: {
                tipo_documento: document.getElementById('sol-tipo-doc').value,
                finalidade: document.getElementById('sol-finalidade').value.trim()
            }
        });
        mostrarToast(res.mensagem);
        document.getElementById('sol-finalidade').value = '';
        await carregarPainelAluno();
    } catch (erro) {
        mostrarToast(erro.message);
    }
});

function renderizarMeusDocumentos() {
    const tbody = document.getElementById('tabela-meus-documentos');
    if (meusDocumentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Você ainda não solicitou documentos à Diretoria.</td></tr>';
        return;
    }

    tbody.innerHTML = meusDocumentos.map(d => {
        const badge = d.status === 'Emitido'
            ? 'badge-success'
            : (d.status === 'Pendente' ? 'badge-warning' : 'badge-danger');

        return `
            <tr>
                <td><strong>${d.tipo_documento}</strong></td>
                <td>${d.finalidade || '-'}</td>
                <td>${formatarData(d.solicitado_em)}</td>
                <td><span class="badge ${badge}">${d.status === 'Emitido' ? 'Pronto / Emitido' : d.status}</span></td>
                <td><code>${d.codigo_verificacao || 'Em processamento'}</code></td>
                <td>
                    ${d.status === 'Emitido' ? `
                        <button class="btn btn-teal btn-small" onclick="abrirMeuDocumento(${d.id})">Visualizar / Imprimir</button>
                    ` : '<small style="color:var(--text-muted)">Aguardando Diretoria</small>'}
                </td>
            </tr>
        `;
    }).join('');
}

window.abrirMeuDocumento = function (docId) {
    const doc = meusDocumentos.find(d => d.id === docId);
    if (!doc || !minhaFicha) return;

    const container = document.getElementById('visualizacao-documento-aluno');
    container.hidden = false;
    container.innerHTML = `
        <div class="card">
            <div class="card-title no-print">
                <span>Documento Oficial Emitido pela Diretoria</span>
                <button class="btn btn-primary btn-small" onclick="window.print()">Imprimir / Salvar PDF</button>
            </div>
            ${gerarHtmlDocumentoOficial(minhaFicha, doc.tipo_documento, doc.codigo_verificacao, doc.observacao_diretoria)}
        </div>
    `;
    container.scrollIntoView({ behavior: 'smooth' });
};

function renderizarMuralAluno(avisos) {
    const container = document.getElementById('mural-avisos-aluno');
    if (!container) return;
    container.innerHTML = avisos.map(a => `
        <div style="padding: 1rem; border-left: 4px solid var(--purple-indigo); background: #fff; border-radius: 8px; margin-bottom: 0.85rem; box-shadow: var(--shadow);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge badge-teal">${a.categoria}</span>
                <small style="color:var(--text-muted)">${formatarData(a.criado_em)}</small>
            </div>
            <h4 style="margin: 0.4rem 0 0.2rem; color: var(--purple-deep);">${a.titulo}</h4>
            <p style="font-size: 0.9rem; color: var(--text-muted);">${a.mensagem}</p>
        </div>
    `).join('');
}
