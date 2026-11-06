let listaAlunos = [];
let listaDocumentos = [];
let listaFaltas = [];

if (verificarLogin('diretoria')) {
    prepararCabecalho();
    const campoData = document.getElementById('falta-data');
    if (campoData) campoData.value = new Date().toISOString().split('T')[0];
    carregarPainelDiretoria();
}

async function carregarPainelDiretoria() {
    try {
        const [alunos, documentos, faltas, avisos] = await Promise.all([
            api('/alunos'),
            api('/documentos'),
            api('/faltas'),
            api('/avisos')
        ]);

        listaAlunos = alunos;
        listaDocumentos = documentos;
        listaFaltas = faltas;

        atualizarIndicadores();
        preencherSelectsAlunos();
        renderizarPreviaDocumento();
        renderizarTabelaSolicitacoes();
        renderizarTabelaFaltas();
        renderizarBoletimDiretoria();
        renderizarAvisosDiretoria(avisos);
    } catch (erro) {
        mostrarToast('Erro ao carregar dados: ' + erro.message);
    }
}

function atualizarIndicadores() {
    document.getElementById('stat-total-alunos').textContent = listaAlunos.length;
    const pendentes = listaDocumentos.filter(d => d.status === 'Pendente').length;
    document.getElementById('stat-docs-pendentes').textContent = pendentes;

    const faltasAnalise = listaFaltas.filter(f => f.status_justificativa === 'Em análise').length;
    document.getElementById('stat-faltas-analise').textContent = faltasAnalise;

    const mediaGlobal = listaAlunos.length
        ? (listaAlunos.reduce((acc, a) => acc + Number(a.frequencia_percentual || 100), 0) / listaAlunos.length).toFixed(1) + '%'
        : '100%';
    document.getElementById('stat-freq-media').textContent = mediaGlobal;
}

function preencherSelectsAlunos() {
    const idsSelect = ['doc-aluno-id', 'falta-aluno-id', 'boletim-aluno-id'];
    idsSelect.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const valorAtual = sel.value;
        sel.innerHTML = listaAlunos.map(a =>
            `<option value="${a.id}">${a.nome} — Matrícula: ${a.matricula} (${a.turma})</option>`
        ).join('');
        if (valorAtual && listaAlunos.some(a => String(a.id) === String(valorAtual))) {
            sel.value = valorAtual;
        }
    });
}

// 1. GERADOR AUTOMÁTICO DE DOCUMENTOS BASEADO NOS DADOS DO ALUNO
function renderizarPreviaDocumento(codigoEmitido = null) {
    const idAluno = Number(document.getElementById('doc-aluno-id').value);
    const tipoDoc = document.getElementById('doc-tipo').value;
    const obs = document.getElementById('doc-observacao').value.trim();
    const container = document.getElementById('container-documento-gerado');

    const aluno = listaAlunos.find(a => a.id === idAluno);
    if (!aluno) {
        container.innerHTML = '<p>Selecione um aluno cadastrado para gerar o documento oficial automaticamente.</p>';
        return;
    }

    container.innerHTML = gerarHtmlDocumentoOficial(aluno, tipoDoc, codigoEmitido, obs);
}

document.getElementById('doc-aluno-id').addEventListener('change', () => renderizarPreviaDocumento());
document.getElementById('doc-tipo').addEventListener('change', () => renderizarPreviaDocumento());
document.getElementById('doc-observacao').addEventListener('input', () => renderizarPreviaDocumento());

document.getElementById('form-gerar-documento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const aluno_id = Number(document.getElementById('doc-aluno-id').value);
    const tipo_documento = document.getElementById('doc-tipo').value;
    const observacao_diretoria = document.getElementById('doc-observacao').value.trim();

    try {
        const res = await api('/documentos', {
            method: 'POST',
            body: {
                aluno_id,
                tipo_documento,
                finalidade: 'Emissão oficial direta pela Diretoria',
                observacao_diretoria
            }
        });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
        renderizarPreviaDocumento(res.codigo_verificacao);
    } catch (erro) {
        mostrarToast(erro.message);
    }
});

document.getElementById('btn-imprimir-doc').addEventListener('click', () => {
    window.print();
});

// 2. TABELA DE DOCUMENTOS SOLICITADOS PELOS ALUNOS + VERIFICADOR INTERNO
function renderizarTabelaSolicitacoes() {
    const tbody = document.getElementById('tabela-solicitacoes');
    if (listaDocumentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum documento solicitado até o momento.</td></tr>';
        return;
    }

    tbody.innerHTML = listaDocumentos.map(d => {
        const badgeClass = d.status === 'Emitido'
            ? 'badge-success'
            : (d.status === 'Pendente' ? 'badge-warning' : 'badge-danger');

        return `
            <tr>
                <td>#${d.id}</td>
                <td><strong>${d.aluno_nome}</strong><br><small>Mat: ${d.matricula}</small></td>
                <td>${d.tipo_documento}</td>
                <td>${d.finalidade || '-'}</td>
                <td><span class="badge ${badgeClass}">${d.status}</span></td>
                <td><code>${d.codigo_verificacao || 'Aguardando emissão'}</code></td>
                <td>
                    ${d.status === 'Pendente' ? `
                        <button class="btn btn-primary btn-small" onclick="aprovarSolicitacao(${d.id})">Gerar e Emitir</button>
                        <button class="btn btn-accent btn-small" onclick="recusarSolicitacao(${d.id})">Recusar</button>
                    ` : `
                        <button class="btn btn-outline btn-small" onclick="visualizarDocEmitido(${d.aluno_id}, '${d.tipo_documento}', '${d.codigo_verificacao || ''}')">Ver Documento</button>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

window.aprovarSolicitacao = async function (id) {
    try {
        const res = await api('/documentos/' + id, {
            method: 'PUT',
            body: {
                status: 'Emitido',
                observacao_diretoria: 'Solicitação atendida e liberada pela Diretoria Escolar.'
            }
        });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

window.recusarSolicitacao = async function (id) {
    try {
        const res = await api('/documentos/' + id, {
            method: 'PUT',
            body: {
                status: 'Recusado',
                observacao_diretoria: 'Solicitação recusada. Procure a secretaria presencialmente.'
            }
        });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

window.visualizarDocEmitido = function (alunoId, tipoDoc, codigo) {
    document.querySelector('[data-aba="documentos"]').click();
    document.getElementById('doc-aluno-id').value = String(alunoId);
    document.getElementById('doc-tipo').value = tipoDoc;
    renderizarPreviaDocumento(codigo);
    mostrarToast('Documento carregado na pré-visualização oficial.');
};

// 3. CONTROLE DE FALTAS E JUSTIFICATIVAS
document.getElementById('form-registrar-falta').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await api('/faltas', {
            method: 'POST',
            body: {
                aluno_id: Number(document.getElementById('falta-aluno-id').value),
                disciplina: document.getElementById('falta-disciplina').value,
                data_falta: document.getElementById('falta-data').value,
                quantidade: Number(document.getElementById('falta-quantidade').value),
                justificada: document.getElementById('falta-justificada').value === 'true',
                justificativa: document.getElementById('falta-motivo').value.trim()
            }
        });
        mostrarToast(res.mensagem);
        document.getElementById('falta-motivo').value = '';
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
});

function renderizarTabelaFaltas() {
    const tbody = document.getElementById('tabela-faltas-diretoria');
    if (listaFaltas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhuma falta registrada.</td></tr>';
        return;
    }

    tbody.innerHTML = listaFaltas.map(f => {
        const abonada = Boolean(f.justificada) || f.status_justificativa === 'Abonada';
        const badge = abonada
            ? 'badge-success'
            : (f.status_justificativa === 'Em análise' ? 'badge-warning' : 'badge-danger');

        return `
            <tr>
                <td><strong>${f.aluno_nome}</strong><br><small>${f.turma}</small></td>
                <td>${f.disciplina}</td>
                <td>${formatarData(f.data_falta)}</td>
                <td>${f.quantidade} aula(s)</td>
                <td><span class="badge ${badge}">${abonada ? 'Com Justificativa (Abonada)' : f.status_justificativa}</span></td>
                <td>${f.justificativa || '<span style="color:var(--text-muted)">Sem justificativa anexada</span>'}</td>
                <td>
                    ${!abonada ? `<button class="btn btn-teal btn-small" onclick="abonarFalta(${f.id})">Abonar Falta</button>` : ''}
                    <button class="btn btn-accent btn-small" onclick="removerFalta(${f.id})">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.abonarFalta = async function (id) {
    try {
        const res = await api('/faltas/' + id, {
            method: 'PUT',
            body: { justificada: true, status_justificativa: 'Abonada' }
        });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

window.removerFalta = async function (id) {
    try {
        const res = await api('/faltas/' + id, { method: 'DELETE' });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

// 4. BOLETIM DO ALUNO ONLINE
document.getElementById('boletim-aluno-id').addEventListener('change', renderizarBoletimDiretoria);

function renderizarBoletimDiretoria() {
    const idAluno = Number(document.getElementById('boletim-aluno-id').value);
    const aluno = listaAlunos.find(a => a.id === idAluno);
    const tbody = document.getElementById('tabela-boletim-diretoria');
    if (!aluno) return;

    document.getElementById('resumo-boletim-aluno').textContent =
        `${aluno.nome} • Média Geral: ${aluno.media_geral} • Frequência: ${aluno.frequencia_percentual}%`;

    if (!aluno.boletim || aluno.boletim.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Nenhuma nota cadastrada para este aluno.</td></tr>';
        return;
    }

    tbody.innerHTML = aluno.boletim.map(n => `
        <tr>
            <td><strong>${n.disciplina}</strong></td>
            <td>${n.carga_horaria}h</td>
            <td>${Number(n.bim1).toFixed(1)}</td>
            <td>${Number(n.bim2).toFixed(1)}</td>
            <td>${Number(n.bim3).toFixed(1)}</td>
            <td>${Number(n.bim4).toFixed(1)}</td>
            <td><strong>${Number(n.media).toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-outline btn-small" onclick="carregarNotaNoFormulario('${n.disciplina}', ${n.bim1}, ${n.bim2}, ${n.bim3}, ${n.bim4}, ${n.carga_horaria})">Editar</button>
                <button class="btn btn-accent btn-small" onclick="excluirDisciplinaBoletim(${n.id})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

window.carregarNotaNoFormulario = function (disc, b1, b2, b3, b4, ch) {
    document.getElementById('nota-disciplina').value = disc;
    document.getElementById('nota-bim1').value = b1;
    document.getElementById('nota-bim2').value = b2;
    document.getElementById('nota-bim3').value = b3;
    document.getElementById('nota-bim4').value = b4;
    document.getElementById('nota-ch').value = ch;
    mostrarToast('Disciplina carregada no formulário para edição.');
};

window.excluirDisciplinaBoletim = async function (id) {
    try {
        const res = await api('/boletim/' + id, { method: 'DELETE' });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

document.getElementById('form-salvar-nota').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await api('/boletim', {
            method: 'POST',
            body: {
                aluno_id: Number(document.getElementById('boletim-aluno-id').value),
                disciplina: document.getElementById('nota-disciplina').value.trim(),
                bim1: Number(document.getElementById('nota-bim1').value),
                bim2: Number(document.getElementById('nota-bim2').value),
                bim3: Number(document.getElementById('nota-bim3').value),
                bim4: Number(document.getElementById('nota-bim4').value),
                carga_horaria: Number(document.getElementById('nota-ch').value)
            }
        });
        mostrarToast(res.mensagem);
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
});

// 5. MURAL DE AVISOS E VERIFICAÇÃO DE DOCUMENTO
function renderizarAvisosDiretoria(avisos) {
    const lista = document.getElementById('lista-avisos-diretoria');
    if (!lista) return;
    lista.innerHTML = avisos.map(a => `
        <div style="padding: 0.9rem; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
            <div>
                <span class="badge badge-teal">${a.categoria}</span>
                <h4 style="margin-top: 0.35rem; color: var(--purple-deep);">${a.titulo}</h4>
                <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.2rem;">${a.mensagem}</p>
            </div>
            <button class="btn btn-accent btn-small" onclick="removerAviso(${a.id})">Remover</button>
        </div>
    `).join('');
}

window.removerAviso = async function (id) {
    try {
        await api('/avisos/' + id, { method: 'DELETE' });
        mostrarToast('Comunicado removido.');
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
};

document.getElementById('form-novo-aviso').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await api('/avisos', {
            method: 'POST',
            body: {
                titulo: document.getElementById('aviso-titulo').value.trim(),
                categoria: document.getElementById('aviso-categoria').value,
                mensagem: document.getElementById('aviso-mensagem').value.trim()
            }
        });
        mostrarToast(res.mensagem);
        document.getElementById('form-novo-aviso').reset();
        await carregarPainelDiretoria();
    } catch (erro) {
        mostrarToast(erro.message);
    }
});
