const pool = require('../database/conexao');

async function listarAvisos(req, res, next) {
    try {
        const [avisos] = await pool.execute('SELECT * FROM avisos ORDER BY criado_em DESC LIMIT 20');
        return res.json(avisos);
    } catch (erro) {
        next(erro);
    }
}

async function criarAviso(req, res, next) {
    try {
        const { titulo, mensagem, categoria } = req.body;
        if (!titulo || !mensagem) {
            return res.status(400).json({ mensagem: 'Título e mensagem são obrigatórios.' });
        }
        const [resultado] = await pool.execute(
            'INSERT INTO avisos (titulo, mensagem, categoria, autor_nome) VALUES (?, ?, ?, ?)',
            [titulo.trim(), mensagem.trim(), categoria || 'Secretaria', req.usuario.nome]
        );
        return res.status(201).json({ mensagem: 'Comunicado publicado no mural!', id: resultado.insertId });
    } catch (erro) {
        next(erro);
    }
}

async function excluirAviso(req, res, next) {
    try {
        const id = Number(req.params.id);
        await pool.execute('DELETE FROM avisos WHERE id = ?', [id]);
        return res.json({ mensagem: 'Comunicado removido.' });
    } catch (erro) {
        next(erro);
    }
}

module.exports = { listarAvisos, criarAviso, excluirAviso };
