const pool = require('../database/conexao');

exports.listar = async (req, res) => {
    try {
        let query = `
            SELECT s.*, u.nome AS aluno_nome, u.matricula AS aluno_matricula, u.turma AS aluno_turma
            FROM solicitacoes s
            JOIN usuarios u ON s.aluno_id = u.id
        `;
        const params = [];

        if (req.usuario.perfil === 'aluno') {
            query += ' WHERE s.aluno_id = ?';
            params.push(req.usuario.id);
        }

        query += ' ORDER BY s.data_solicitacao DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar solicitações.' });
    }
};

exports.criar = async (req, res) => {
    try {
        const { tipo_servico, observacoes } = req.body;
        if (!tipo_servico) {
            return res.status(400).json({ erro: 'Selecione o serviço desejado.' });
        }

        const [result] = await pool.query(
            'INSERT INTO solicitacoes (aluno_id, tipo_servico, observacoes) VALUES (?, ?, ?)',
            [req.usuario.id, tipo_servico, observacoes || '']
        );

        res.status(201).json({ mensagem: 'Solicitação aberta com sucesso!', id: result.insertId });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao criar solicitação.' });
    }
};

exports.responderDiretoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resposta_diretoria } = req.body;

        await pool.query(
            'UPDATE solicitacoes SET status = ?, resposta_diretoria = ? WHERE id = ?',
            [status, resposta_diretoria || '', id]
        );
        res.json({ mensagem: 'Solicitação atualizada com sucesso!' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao atualizar solicitação.' });
    }
};

exports.excluir = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.usuario.perfil === 'aluno') {
            const [check] = await pool.query("SELECT * FROM solicitacoes WHERE id = ? AND aluno_id = ? AND status = 'Pendente'", [id, req.usuario.id]);
            if (check.length === 0) {
                return res.status(400).json({ erro: 'Só é possível cancelar solicitações próprias ainda Pendentes.' });
            }
        }
        await pool.query('DELETE FROM solicitacoes WHERE id = ?', [id]);
        res.json({ mensagem: 'Solicitação removida com sucesso!' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao excluir solicitação.' });
    }
};