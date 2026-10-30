const pool = require('../database/conexao');

exports.listar = async (req, res) => {
    try {
        const [eventos] = await pool.query('SELECT * FROM calendario_eventos ORDER BY data_evento ASC');
        res.json(eventos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao carregar o calendário.' });
    }
};

exports.criar = async (req, res) => {
    try {
        const { titulo, descricao, data_evento, categoria } = req.body;
        if (!titulo || !data_evento || !categoria) {
            return res.status(400).json({ erro: 'Título, data e categoria são obrigatórios.' });
        }
        const [result] = await pool.query(
            'INSERT INTO calendario_eventos (titulo, descricao, data_evento, categoria) VALUES (?, ?, ?, ?)',
            [titulo, descricao || '', data_evento, categoria]
        );
        res.status(201).json({ mensagem: 'Evento adicionado ao calendário!', id: result.insertId });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao criar evento.' });
    }
};

exports.excluir = async (req, res) => {
    try {
        await pool.query('DELETE FROM calendario_eventos WHERE id = ?', [req.params.id]);
        res.json({ mensagem: 'Evento removido do calendário.' });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao remover evento.' });
    }
};