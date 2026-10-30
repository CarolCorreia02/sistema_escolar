let cacheDocumentos = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!protegerPagina('diretoria')) return;
    carregarAlunosSelect();
    carregarDocumentos();
    carregarFaltas();
    carregarSolicitacoes();
});

async function carregarAlunosSelect() {
    const res = await fetch(`${API_URL}/auth/alunos`, { headers: headersAutenticados() });
    const alunos = await res.json();
    const selDoc = document.getElementById('doc-aluno');
    const selFalta = document.getElementById('falta-aluno');

    const opcoes = alunos.map(a => `<option value="${a.id}">${a.nome} (${a.matricula}) - ${a.turma}</option>`).join('');
    selDoc.innerHTML = opcoes;
    selFalta.innerHTML = opcoes;
}

async function carregarDocumentos() {
    const res = await fetch(`${API_URL}/documentos`, { headers: headersAutenticados() });
    cacheDocumentos = await res.json();
    const tbody = document.getElementById('tabela-documentos');

    tbody.innerHTML = cacheDocumentos.map(d => `
        <tr>
            <td><span class="badge">${d.codigo_validacao}</span></td>
            <td>${d.aluno_nome}<br><small style="color:var(--text-muted)">${d.aluno_turma || ''}</small></td>
            <td><strong>${d.tipo}</strong></td>
            <td>${d.periodo_letivo}</td>
            <td>${d.frequencia_percentual}%</td>
            <td>${d.media_geral ?? '-'}</td>
            <td>
                <button class="btn-sm" onclick="gerarPdfPorId(${d.id})">🖨️ Gerar PDF</button>
                <button class="btn-sm btn-secondary" onclick="preencherEdicaoDoc(${d.id})">✏️ Editar</button>
                <button class="btn-sm btn-secondary" onclick="excluirDocumento(${d.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function gerarPdfPorId(id) {
    const doc = cacheDocumentos.find(d => d.id === id);
    if (doc) imprimirDocumentoOficial(doc);
}

function preencherEdicaoDoc(id) {
    const d = cacheDocumentos.find(item => item.id === id);
    if (!d) return;
    document.getElementById('titulo-form-doc').textContent = `Editando Documento #${d.id}`;
    document.getElementById('doc-id').value = d.id;
    document.getElementById('doc-aluno').value = d.aluno_id;
    document.getElementById('doc-tipo').value = d.tipo;
    document.getElementById('doc-periodo').value = d.periodo_letivo;
    document.getElementById('doc-frequencia').value = d.frequencia_percentual;
    document.getElementById('doc-media').value = d.media_geral || '';
    document.getElementById('doc-conteudo').value = d.conteudo_detalhado;
}

function limparFormDoc() {
    document.getElementById('titulo-form-doc').textContent = 'Emitir Documento / Boletim (PDF)';
    document.getElementById('doc-id').value = '';
    document.getElementById('form-documento').reset();
}

document.getElementById('form-documento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('doc-id').value;
    const payload = {
        aluno_id: document.getElementById('doc-aluno').value,
        tipo: document.getElementById('doc-tipo').value,
        periodo_letivo: document.getElementById('doc-periodo').value,
        frequencia_percentual: document.getElementById('doc-frequencia').value,
        media_geral: document.getElementById('doc-media').value || null,
        conteudo_detalhado: document.getElementById('doc-conteudo').value
    };

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/documentos/${id}` : `${API_URL}/documentos`;

    const res = await fetch(url, {
        method: metodo,
        headers: headersAutenticados(),
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        limparFormDoc();
        carregarDocumentos();
    } else {
        const erro = await res.json();
        alert(erro.erro || 'Erro ao salvar documento.');
    }
});

async function excluirDocumento(id) {
    if (!confirm('Deseja realmente excluir este documento?')) return;
    await fetch(`${API_URL}/documentos/${id}`, { method: 'DELETE', headers: headersAutenticados() });
    carregarDocumentos();
}

// FALTAS
document.getElementById('form-falta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        aluno_id: document.getElementById('falta-aluno').value,
        disciplina: document.getElementById('falta-disciplina').value,
        data_falta: document.getElementById('falta-data').value,
        quantidade_aulas: document.getElementById('falta-qtd').value
    };
    const res = await fetch(`${API_URL}/faltas`, {
        method: 'POST',
        headers: headersAutenticados(),
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        e.target.reset();
        carregarFaltas();
    }
});

async function carregarFaltas() {
    const res = await fetch(`${API_URL}/faltas`, { headers: headersAutenticados() });
    const faltas = await res.json();
    const tbody = document.getElementById('tabela-faltas');

    tbody.innerHTML = faltas.map(f => `
        <tr>
            <td>${f.aluno_nome}</td>
            <td>${f.disciplina}<br><small>${new Date(f.data_falta).toLocaleDateString('pt-BR')}</small></td>
            <td>${f.quantidade_aulas}</td>
            <td>
                ${f.justificativa_texto ? `<em>"${f.justificativa_texto}"</em><br><small>📎 Anexo: ${f.anexo_justificativa}</small>` : '<span style="color:var(--text-muted)">Nenhuma justificativa enviada</span>'}
            </td>
            <td><span class="badge">${f.status_justificativa}</span></td>
            <td>
                <button class="btn-sm" onclick="avaliarFalta(${f.id}, 'Abonada')">Abonar</button>
                <button class="btn-sm btn-secondary" onclick="avaliarFalta(${f.id}, 'Indeferida')">Indeferir</button>
                <button class="btn-sm btn-secondary" onclick="excluirFalta(${f.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function avaliarFalta(id, status_justificativa) {
    await fetch(`${API_URL}/faltas/${id}/avaliar`, {
        method: 'PUT',
        headers: headersAutenticados(),
        body: JSON.stringify({ status_justificativa })
    });
    carregarFaltas();
}

async function excluirFalta(id) {
    await fetch(`${API_URL}/faltas/${id}`, { method: 'DELETE', headers: headersAutenticados() });
    carregarFaltas();
}

// SOLICITAÇÕES DE AUTOATENDIMENTO
async function carregarSolicitacoes() {
    const res = await fetch(`${API_URL}/solicitacoes`, { headers: headersAutenticados() });
    const lista = await res.json();
    const tbody = document.getElementById('tabela-solicitacoes');

    tbody.innerHTML = lista.map(s => `
        <tr>
            <td>${s.aluno_nome}<br><small>${s.aluno_matricula}</small></td>
            <td><strong>${s.tipo_servico}</strong></td>
            <td>${s.observacoes || '-'}</td>
            <td><span class="badge">${s.status}</span></td>
            <td>${s.resposta_diretoria || '-'}</td>
            <td>
                <button class="btn-sm" onclick="responderSolicitacao(${s.id})">Responder / Concluir</button>
            </td>
        </tr>
    `).join('');
}

async function responderSolicitacao(id) {
    const resposta_diretoria = prompt('Informe o parecer/resposta da Diretoria para o aluno:');
    if (resposta_diretoria === null) return;
    await fetch(`${API_URL}/solicitacoes/${id}`, {
        method: 'PUT',
        headers: headersAutenticados(),
        body: JSON.stringify({ status: 'Pronto / Concluído', resposta_diretoria })
    });
    carregarSolicitacoes();
}

// CALENDÁRIO
document.getElementById('form-calendario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        titulo: document.getElementById('cal-titulo').value,
        data_evento: document.getElementById('cal-data').value,
        categoria: document.getElementById('cal-categoria').value,
        descricao: document.getElementById('cal-desc').value
    };
    const res = await fetch(`${API_URL}/calendario`, {
        method: 'POST',
        headers: headersAutenticados(),
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        alert('Evento publicado no calendário escolar!');
        e.target.reset();
    }
});