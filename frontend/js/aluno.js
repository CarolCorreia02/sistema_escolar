let meusDocumentos = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!protegerPagina('aluno')) return;
    carregarMeusDocumentos();
    carregarMinhasFaltas();
    carregarMinhasSolicitacoes();
    carregarCalendario();
});

async function carregarMeusDocumentos() {
    const res = await fetch(`${API_URL}/documentos`, { headers: headersAutenticados() });
    meusDocumentos = await res.json();
    const tbody = document.getElementById('tabela-meus-documentos');

    tbody.innerHTML = meusDocumentos.map(d => `
        <tr>
            <td><span class="badge">${d.codigo_validacao}</span></td>
            <td><strong>${d.tipo}</strong></td>
            <td>${d.periodo_letivo}</td>
            <td>${d.frequencia_percentual}%</td>
            <td>${d.media_geral ?? '-'}</td>
            <td>${d.conteudo_detalhado}</td>
            <td>
                <button class="btn-sm" onclick="baixarMeuPdf(${d.id})">🖨️ Imprimir / Salvar PDF</button>
            </td>
        </tr>
    `).join('');
}

function baixarMeuPdf(id) {
    const doc = meusDocumentos.find(d => d.id === id);
    if (doc) imprimirDocumentoOficial(doc);
}

async function carregarMinhasFaltas() {
    const res = await fetch(`${API_URL}/faltas`, { headers: headersAutenticados() });
    const faltas = await res.json();
    const tbody = document.getElementById('tabela-minhas-faltas');

    tbody.innerHTML = faltas.map(f => `
        <tr>
            <td><strong>${f.disciplina}</strong></td>
            <td>${new Date(f.data_falta).toLocaleDateString('pt-BR')}</td>
            <td>${f.quantidade_aulas}</td>
            <td>${f.justificativa_texto ? `${f.justificativa_texto}<br><small>📎 ${f.anexo_justificativa}</small>` : '-'}</td>
            <td><span class="badge">${f.status_justificativa}</span></td>
            <td>
                <button class="btn-sm" onclick="justificarFalta(${f.id})">📎 Anexar Justificativa</button>
            </td>
        </tr>
    `).join('');
}

async function justificarFalta(id) {
    const justificativa_texto = prompt('Descreva o motivo da ausência (Ex: Atestado médico, compromisso familiar):');
    if (!justificativa_texto) return;
    const anexo_justificativa = prompt('Nome do arquivo/comprovante anexado (Ex: atestado_medico.pdf):', 'atestado_medico.pdf');

    const res = await fetch(`${API_URL}/faltas/${id}/justificar`, {
        method: 'PUT',
        headers: headersAutenticados(),
        body: JSON.stringify({ justificativa_texto, anexo_justificativa })
    });

    if (res.ok) {
        alert('Justificativa enviada com sucesso!');
        carregarMinhasFaltas();
    }
}

document.getElementById('form-solicitacao').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        tipo_servico: document.getElementById('sol-servico').value,
        observacoes: document.getElementById('sol-obs').value
    };

    const res = await fetch(`${API_URL}/solicitacoes`, {
        method: 'POST',
        headers: headersAutenticados(),
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        e.target.reset();
        carregarMinhasSolicitacoes();
    }
});

async function carregarMinhasSolicitacoes() {
    const res = await fetch(`${API_URL}/solicitacoes`, { headers: headersAutenticados() });
    const solicitacoes = await res.json();
    const tbody = document.getElementById('tabela-minhas-solicitacoes');

    tbody.innerHTML = solicitacoes.map(s => `
        <tr>
            <td><strong>${s.tipo_servico}</strong></td>
            <td>${s.observacoes || '-'}</td>
            <td><span class="badge">${s.status}</span></td>
            <td>${s.resposta_diretoria || 'Aguardando análise da secretaria'}</td>
            <td>
                ${s.status === 'Pendente' ? `<button class="btn-sm btn-secondary" onclick="cancelarSolicitacao(${s.id})">Cancelar</button>` : '-'}
            </td>
        </tr>
    `).join('');
}

async function cancelarSolicitacao(id) {
    await fetch(`${API_URL}/solicitacoes/${id}`, { method: 'DELETE', headers: headersAutenticados() });
    carregarMinhasSolicitacoes();
}

async function carregarCalendario() {
    const res = await fetch(`${API_URL}/calendario`, { headers: headersAutenticados() });
    const eventos = await res.json();
    const div = document.getElementById('lista-calendario');

    div.innerHTML = eventos.map(ev => `
        <div style="border-bottom:1px solid var(--border); padding:0.65rem 0;">
            <span class="badge">${ev.categoria}</span>
            <strong style="margin-left:0.4rem;">${ev.titulo}</strong>
            <span style="float:right; font-size:0.85rem; color:var(--text-muted);">${new Date(ev.data_evento).toLocaleDateString('pt-BR')}</span>
            <p style="font-size:0.88rem; color:var(--text-muted); margin-top:0.3rem;">${ev.descricao}</p>
        </div>
    `).join('');
}