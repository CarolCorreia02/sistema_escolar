const pool = require('../database/conexao');
const { montarFichaAluno } = require('./alunosController');

const TIPOS_VALIDOS = [
    'Declaração de Frequência',
    'Histórico Escolar',
    'Comprovante de Matrícula',
    'Boletim Escolar Oficial'
];

function gerarCodigoAutenticidade(nomeAluno = 'EDU') {
    const prefixo = nomeAluno.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'DOC';
    const aleatorio = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EDU-2026-${prefixo}${aleatorio}`;
}

// READ - Listar solicitações e documentos emitidos
async function listarDocumentos(req, res, next) {
    try {
        let sql = `SELECT d.*, u.nome AS aluno_nome, u.matricula, u.turma, u.cpf
                   FROM documentos d INNER JOIN usuarios u ON u.id = d.aluno_id`;
        const params = [];

        if (req.usuario.nivel === 'aluno') {
            sql += ' WHERE d.aluno_id = ?';
            params.push(req.usuario.id);
        } else if (req.query.aluno_id) {
            sql += ' WHERE d.aluno_id = ?';
            params.push(Number(req.query.aluno_id));
        }

        sql += ' ORDER BY d.solicitado_em DESC, d.id DESC';
        const [linhas] = await pool.execute(sql, params);
        return res.json(linhas);
    } catch (erro) {
        next(erro);
    }
}

// CREATE (Aluno solicita documento OU Diretoria emite automaticamente na hora)
async function criarOuEmitirDocumento(req, res, next) {
    try {
        const { aluno_id, tipo_documento, finalidade, observacao_diretoria } = req.body;
        if (!TIPOS_VALIDOS.includes(tipo_documento)) {
            return res.status(400).json({ mensagem: 'Selecione um tipo de documento oficial válido.' });
        }

        if (req.usuario.nivel === 'aluno') {
            const [resultado] = await pool.execute(
                `INSERT INTO documentos (aluno_id, tipo_documento, finalidade, status)
                 VALUES (?, ?, ?, 'Pendente')`,
                [req.usuario.id, tipo_documento, finalidade ? finalidade.trim() : 'Solicitação via Portal do Aluno']
            );
            return res.status(201).json({
                mensagem: 'Documento solicitado à Diretoria! Acompanhe o status na sua lista.',
                id: resultado.insertId
            });
        } else {
            // Diretoria gera e emite automaticamente um documento baseado nos dados do aluno cadastrado
            const idAluno = Number(aluno_id);
            const ficha = await montarFichaAluno(idAluno);
            if (!ficha) {
                return res.status(404).json({ mensagem: 'Aluno não encontrado para emissão.' });
            }

            const codigo = gerarCodigoAutenticidade(ficha.nome);
            const [resultado] = await pool.execute(
                `INSERT INTO documentos
                 (aluno_id, tipo_documento, finalidade, status, codigo_verificacao, observacao_diretoria, dados_snapshot, emitido_em)
                 VALUES (?, ?, ?, 'Emitido', ?, ?, ?, NOW())`,
                [
                    idAluno,
                    tipo_documento,
                    finalidade || 'Emissão direta pela Secretaria/Diretoria',
                    codigo,
                    observacao_diretoria || 'Documento oficial gerado automaticamente com dados consolidados do sistema.',
                    JSON.stringify(ficha)
                ]
            );

            return res.status(201).json({
                mensagem: 'Documento gerado e emitido com código de verificação ' + codigo,
                id: resultado.insertId,
                codigo_verificacao: codigo,
                ficha
            });
        }
    } catch (erro) {
        next(erro);
    }
}

// UPDATE - Diretoria aprova/emite um documento que estava Pendente (ou recusa)
async function atualizarStatusDocumento(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status, observacao_diretoria } = req.body;

        const [docs] = await pool.execute('SELECT * FROM documentos WHERE id = ?', [id]);
        if (docs.length === 0) {
            return res.status(404).json({ mensagem: 'Solicitação de documento não encontrada.' });
        }

        const doc = docs[0];
        const ficha = await montarFichaAluno(doc.aluno_id);
        if (!ficha) {
            return res.status(404).json({ mensagem: 'Dados do aluno não encontrados.' });
        }

        if (status === 'Recusado') {
            await pool.execute(
                "UPDATE documentos SET status = 'Recusado', observacao_diretoria = ? WHERE id = ?",
                [observacao_diretoria || 'Solicitação indeferida pela secretaria.', id]
            );
            return res.json({ mensagem: 'Solicitação marcada como recusada.' });
        }

        const codigo = doc.codigo_verificacao || gerarCodigoAutenticidade(ficha.nome);
        await pool.execute(
            `UPDATE documentos
             SET status = 'Emitido',
                 codigo_verificacao = ?,
                 observacao_diretoria = ?,
                 dados_snapshot = ?,
                 emitido_em = NOW()
             WHERE id = ?`,
            [
                codigo,
                observacao_diretoria || 'Documento conferido e emitido digitalmente pela Diretoria.',
                JSON.stringify(ficha),
                id
            ]
        );

        return res.json({
            mensagem: 'Documento emitido e liberado para o aluno! Código: ' + codigo,
            codigo_verificacao: codigo,
            ficha
        });
    } catch (erro) {
        next(erro);
    }
}

// SISTEMA PÚBLICO DE VERIFICAÇÃO DE AUTENTICIDADE DE DOCUMENTOS
async function verificarAutenticidade(req, res, next) {
    try {
        const codigo = String(req.params.codigo || '').trim().toUpperCase();
        if (!codigo) {
            return res.status(400).json({ mensagem: 'Informe o código de verificação do documento.' });
        }

        const [docs] = await pool.execute(
            `SELECT d.id, d.aluno_id, d.tipo_documento, d.finalidade, d.status,
                    d.codigo_verificacao, d.observacao_diretoria, d.solicitado_em, d.emitido_em,
                    u.nome AS aluno_nome, u.matricula, u.turma
             FROM documentos d
             INNER JOIN usuarios u ON u.id = d.aluno_id
             WHERE d.codigo_verificacao = ? AND d.status = 'Emitido'`,
            [codigo]
        );

        if (docs.length === 0) {
            return res.status(404).json({
                valido: false,
                mensagem: 'Nenhum documento ativo encontrado com o código ' + codigo + '.'
            });
        }

        const doc = docs[0];
        const fichaAtual = await montarFichaAluno(doc.aluno_id);

        return res.json({
            valido: true,
            mensagem: 'Documento autêntico e válido emitido pelo Sistema Escolar EduPortal.',
            documento: doc,
            ficha: fichaAtual
        });
    } catch (erro) {
        next(erro);
    }
}

module.exports = {
    listarDocumentos,
    criarOuEmitirDocumento,
    atualizarStatusDocumento,
    verificarAutenticidade
};
