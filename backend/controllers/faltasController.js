const pool = require('../database/conexao');

// READ - Listar faltas (todas para diretoria ou apenas as do aluno logado)
async function listarFaltas(req, res, next) {
    try {
        let sql = `SELECT f.*, u.nome AS aluno_nome, u.matricula, u.turma
                   FROM faltas f INNER JOIN usuarios u ON u.id = f.aluno_id`;
        const params = [];

        if (req.usuario.nivel === 'aluno') {
            sql += ' WHERE f.aluno_id = ?';
            params.push(req.usuario.id);
        } else if (req.query.aluno_id) {
            sql += ' WHERE f.aluno_id = ?';
            params.push(Number(req.query.aluno_id));
        }

        sql += ' ORDER BY f.data_falta DESC, f.id DESC';
        const [linhas] = await pool.execute(sql, params);
        return res.json(linhas);
    } catch (erro) {
        next(erro);
    }
}

// CREATE - Diretoria registra falta para um aluno (com ou sem justificativa imediata)
async function registrarFalta(req, res, next) {
    try {
        const { aluno_id, disciplina, data_falta, quantidade, justificada, justificativa } = req.body;
        if (!aluno_id || !disciplina || !data_falta) {
            return res.status(400).json({ mensagem: 'Aluno, disciplina e data da falta são obrigatórios.' });
        }

        const qtd = Math.max(1, Number(quantidade || 1));
        const possuiJust = Boolean(justificada);
        const statusJust = possuiJust ? 'Abonada' : (justificativa ? 'Em análise' : 'Sem justificativa');

        const [resultado] = await pool.execute(
            `INSERT INTO faltas (aluno_id, disciplina, data_falta, quantidade, justificada, justificativa, status_justificativa)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [Number(aluno_id), disciplina.trim(), data_falta, qtd, possuiJust, justificativa || null, statusJust]
        );

        return res.status(201).json({
            mensagem: 'Falta registrada com sucesso!',
            id: resultado.insertId
        });
    } catch (erro) {
        next(erro);
    }
}

// UPDATE - Aluno envia justificativa OU Diretoria abona/indefere falta
async function atualizarJustificativa(req, res, next) {
    try {
        const id = Number(req.params.id);
        const [faltas] = await pool.execute('SELECT * FROM faltas WHERE id = ?', [id]);
        if (faltas.length === 0) {
            return res.status(404).json({ mensagem: 'Registro de falta não encontrado.' });
        }

        const falta = faltas[0];

        if (req.usuario.nivel === 'aluno') {
            if (falta.aluno_id !== req.usuario.id) {
                return res.status(403).json({ mensagem: 'Você só pode justificar suas próprias faltas.' });
            }
            const { justificativa } = req.body;
            if (!justificativa || justificativa.trim().length < 5) {
                return res.status(400).json({ mensagem: 'Descreva o motivo ou atestado com pelo menos 5 caracteres.' });
            }
            await pool.execute(
                "UPDATE faltas SET justificativa = ?, status_justificativa = 'Em análise' WHERE id = ?",
                [justificativa.trim(), id]
            );
            return res.json({ mensagem: 'Justificativa enviada para análise da Diretoria!' });
        } else {
            // Diretoria aprova (abona) ou reprova justificativa
            const { justificada, status_justificativa, justificativa } = req.body;
            const abonada = Boolean(justificada) || status_justificativa === 'Abonada';
            const novoStatus = status_justificativa || (abonada ? 'Abonada' : 'Sem justificativa');

            await pool.execute(
                'UPDATE faltas SET justificada = ?, status_justificativa = ?, justificativa = COALESCE(?, justificativa) WHERE id = ?',
                [abonada, novoStatus, justificativa !== undefined ? justificativa : null, id]
            );
            return res.json({ mensagem: 'Status da falta atualizado pela Diretoria!' });
        }
    } catch (erro) {
        next(erro);
    }
}

// DELETE - Diretoria remove registro de falta
async function excluirFalta(req, res, next) {
    try {
        const id = Number(req.params.id);
        await pool.execute('DELETE FROM faltas WHERE id = ?', [id]);
        return res.json({ mensagem: 'Falta removida com sucesso.' });
    } catch (erro) {
        next(erro);
    }
}

module.exports = { listarFaltas, registrarFalta, atualizarJustificativa, excluirFalta };
