const API_URL = 'http://localhost:3000/api';

function obterToken() {
    return localStorage.getItem('token_escolar');
}

function obterUsuario() {
    const dados = localStorage.getItem('usuario_escolar');
    return dados ? JSON.parse(dados) : null;
}

function headersAutenticados() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obterToken()}`
    };
}

function protegerPagina(perfilExigido) {
    const token = obterToken();
    const usuario = obterUsuario();
    if (!token || !usuario) {
        window.location.href = 'login.html';
        return null;
    }
    if (perfilExigido && usuario.perfil !== perfilExigido) {
        window.location.href = usuario.perfil === 'diretoria' ? 'diretoria.html' : 'aluno.html';
        return null;
    }
    const spanNome = document.getElementById('usuario-logado');
    if (spanNome) {
        spanNome.textContent = `${usuario.nome} (${usuario.perfil.toUpperCase()})`;
    }
    return usuario;
}

function logout() {
    localStorage.removeItem('token_escolar');
    localStorage.removeItem('usuario_escolar');
    window.location.href = 'login.html';
}

function imprimirDocumentoOficial(doc) {
    const container = document.getElementById('area-impressao-pdf');
    container.innerHTML = `
        <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:15px; margin-bottom:20px;">
            <h1 style="margin:0; font-size:22px; text-transform:uppercase;">Instituição de Ensino — Secretaria Acadêmica</h1>
            <p style="margin:5px 0;">Documento Oficial Gerado Eletronicamente</p>
        </div>
        <h2 style="text-align:center; margin-bottom:25px; text-decoration:underline;">${doc.tipo.toUpperCase()}</h2>
        <p style="margin-bottom:10px;"><strong>Estudante:</strong> ${doc.aluno_nome}</p>
        <p style="margin-bottom:10px;"><strong>Matrícula:</strong> ${doc.aluno_matricula || 'N/A'} | <strong>Turma:</strong> ${doc.aluno_turma || 'Regular'}</p>
        <p style="margin-bottom:10px;"><strong>Período Letivo:</strong> ${doc.periodo_letivo} | <strong>Frequência Registrada:</strong> ${doc.frequencia_percentual}%</p>
        ${doc.media_geral ? `<p style="margin-bottom:10px;"><strong>Média Geral Acumulada:</strong> ${doc.media_geral}</p>` : ''}
        <div style="margin:25px 0; padding:15px; border:1px solid #333; min-height:120px; line-height:1.6;">
            <strong>Detalhamento Acadêmico / Registro Oficial:</strong><br>
            ${doc.conteudo_detalhado}
        </div>
        <div style="margin-top:50px; display:flex; justify-content:space-between; font-size:13px;">
            <div>
                <p><strong>Código de Validação:</strong> ${doc.codigo_validacao}</p>
                <p><strong>Data de Emissão:</strong> ${new Date(doc.data_emissao).toLocaleDateString('pt-BR')}</p>
            </div>
            <div style="text-align:center; border-top:1px solid #000; padding-top:5px; width:240px;">
                ${doc.diretor_nome}<br>Diretoria / Secretaria Escolar
            </div>
        </div>
    `;
    window.print();
}