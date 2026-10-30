const pool = require('../database/conexao');

exports.listar = async (req, res) => {
    try {
        let query = `
            SELECT d.*, u.nome AS aluno_nome, u.matricula AS aluno_matricula, u.turma AS aluno_turma, dir.nome AS diretor_nome
            FROM documentos d
            JOIN usuarios u ON d.aluno_id = u.id
            JOIN usuarios dir ON d.diretor_id = dir.id
        `;
        const params = [];

        if (req.usuario.perfil === 'aluno') {
            query += ' WHERE d.aluno_id = ?';
            params.push(req.usuario.id);
        }

        query += ' ORDER BY d.data_emissao DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar documentos.', detalhes: erro.message });
    }
};

exports.criar = async (req, res) => {
    try {
        const { aluno_id, tipo, periodo_letivo, frequencia_percentual, media_geral, conteudo_detalhado } = req.body;
        if (!aluno_id || !tipo || !periodo_letivo || !conteudo_detalhado) {
            return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios do documento.' });
        }

        const freq = parseFloat(frequencia_percentual ?? 100);
        if (freq < 0 || freq > 100) {
            return res.status(400).json({ erro: 'Regra de negócio: A frequência deve estar entre 0% e 100%.' });
        }

        const codigo_validacao = 'DOC-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const [result] = await pool.query(
            `INSERT INTO documentos (aluno_id, diretor_id, tipo, periodo_letivo, frequencia_percentual, media_geral, conteudo_detalhado, codigo_validacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [aluno_id, req.usuario.id, tipo, periodo_letivo, freq, media_geral || null, conteudo_detalhado, codigo_validacao]
        );

        res.status(201).json({ mensagem: 'Documento oficial gerado com sucesso!', id: result.insertId, codigo_validacao });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao emitir documento.', detalhes: erro.message });
    }
};

exports.atualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, periodo_letivo, frequencia_percentual, media_geral, conteudo_detalhado } = req.body;

        const [result] = await pool.query(
            `UPDATE documentos SET tipo = ?, periodo_letivo = ?, frequencia_percentual = ?, media_geral = ?, conteudo_detalhado = ?
             WHERE id = ?`,
            [tipo, periodo_letivo, frequencia_percentual, media_geral || null, conteudo_detalhado, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Documento não encontrado.' });
        }
        res.json({ mensagem: 'Documento atualizado com sucesso!' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar documento.' });
    }
};

exports.excluir = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM documentos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Documento não encontrado.' });
        }
        res.json({ mensagem: 'Documento excluído com sucesso!' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao excluir documento.' });
    }
};