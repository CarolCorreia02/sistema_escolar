const jwt = require('jsonwebtoken');
const pool = require('../database/conexao');

// Sistema de Verificação de Token JWT e Sessão Ativa no Banco
async function autenticacaoMiddleware(req, res, next) {
    const cabecalho = req.get('Authorization');
    const partes = typeof cabecalho === 'string' ? cabecalho.split(' ') : [];
    if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
        return res.status(401).json({ mensagem: 'Informe um token de autenticação válido.' });
    }

    const segredo = process.env.JWT_SECRET || 'chave_secreta_super_segura_eduportal_2026_jwt';
    let dados;
    try {
        dados = jwt.verify(partes[1], segredo, { algorithms: ['HS256'] });
        if (!Number.isInteger(dados.id) || dados.id <= 0) {
            return res.status(401).json({ mensagem: 'Token inválido.' });
        }
    } catch (erro) {
        return res.status(401).json({ mensagem: 'Sessão expirada ou token inválido. Faça login novamente.' });
    }

    try {
        const [usuarios] = await pool.execute(
            'SELECT id, nome, email, nivel, matricula, turma, cpf, data_nascimento, status_matricula FROM usuarios WHERE id = ?',
            [dados.id]
        );
        if (usuarios.length === 0) {
            return res.status(401).json({ mensagem: 'Usuário não encontrado. Entre novamente.' });
        }
        req.usuario = usuarios[0];
        next();
    } catch (erro) {
        next(erro);
    }
}

module.exports = autenticacaoMiddleware;
