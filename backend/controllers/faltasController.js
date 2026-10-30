const pool = require('../database/conexao');

exports.listar = async (req, res) => {
    try {
        let query = `
            SELECT f.*, u.nome AS aluno_nome, u.matricula AS aluno_matricula, u.turma AS aluno_turma
            FROM faltas f
            JOIN usuarios u ON f.aluno_id = u.id
        `;
        const params = [];

        if (req.usuario.perfil === 'aluno') {
            query += ' WHERE f.aluno_id = ?';
            params.push(req.usuario.id);
        }

        query += ' ORDER BY f.data_falta DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar faltas.' });
    }
};

exports.registrarFalta = async (req, res) => {
    try {
        const { aluno_id, disciplina, data_falta, quantidade_aulas } = req.body;
        if (!aluno_id || !disciplina || !data_falta) {
            return res.status(400).json({ erro: 'Aluno, disciplina e data são obrigatórios.' });
        }

        const [result] = await pool.query(
            'INSERT INTO faltas (aluno_id, disciplina, data_falta, quantidade_aulas) VALUES (?, ?, ?, ?)',
            [aluno_id, disciplina, data_falta, quantidade_aulas || 1]
        );
        res.status(201).json({ mensagem: 'Falta registrada com sucesso!', id: result.insertId });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao registrar falta.' });
    }
};

exports.enviarJustificativaAluno = async (req, res) => {
    try {
        const { id } = req.params;
        const { justificativa_texto, anexo_justificativa } = req.body;

        if (!justificativa_texto) {
            return res.status(400).json({ erro: 'Descreva o motivo da justificativa.' });
        }

        const [falta] = await pool.query('SELECT * FROM faltas WHERE id = ? AND aluno_id = ?', [id, req.usuario.id]);
        if (falta.length === 0) {
            return res.status(404).json({ erro: 'Registro de falta não encontrado para este aluno.' });
        }

        await pool.query(
            `UPDATE faltas SET justificativa_texto = ?, anexo_justificativa = ?, status_justificativa = 'Pendente' WHERE id = ?`,
            [justificativa_texto, anexo_justificativa || 'comprovante_anexo.pdf', id]
        );

        res.json({ mensagem: 'Justificativa e anexo enviados para análise da diretoria!' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao enviar justificativa.' });
    }
};

exports.avaliarJustificativaDiretoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { status_justificativa } = req.body;

        await pool.query('UPDATE faltas SET status_justificativa = ? WHERE id = ?', [status_justificativa, id]);
        res.json({ mensagem: `Status da falta atualizado para: ${status_justificativa}` });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao avaliar justificativa.' });
    }
};

exports.excluir = async (req, res) => {
    try {
        await pool.query('DELETE FROM faltas WHERE id = ?', [req.params.id]);
        res.json({ mensagem: 'Registro de falta removido.' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao remover falta.' });
    }
};