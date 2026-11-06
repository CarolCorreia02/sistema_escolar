const pool = require('../database/conexao');

// READ - Listar notas (de um aluno específico ou do aluno logado)
async function listarNotas(req, res, next) {
    try {
        const alunoId = req.usuario.nivel === 'aluno'
            ? req.usuario.id
            : Number(req.query.aluno_id || 0);

        let sql = `SELECT n.*, u.nome AS aluno_nome, u.matricula, u.turma
                   FROM notas n INNER JOIN usuarios u ON u.id = n.aluno_id`;
        const params = [];

        if (alunoId > 0) {
            sql += ' WHERE n.aluno_id = ?';
            params.push(alunoId);
        }
        sql += ' ORDER BY u.nome, n.disciplina';

        const [linhas] = await pool.execute(sql, params);
        return res.json(linhas);
    } catch (erro) {
        next(erro);
    }
}

// CREATE / UPDATE - Salvar ou atualizar nota de uma disciplina no Boletim Online
async function salvarNota(req, res, next) {
    try {
        const { aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria } = req.body;
        const idAluno = Number(aluno_id);
        if (!idAluno || !disciplina || typeof disciplina !== 'string') {
            return res.status(400).json({ mensagem: 'Selecione o aluno e informe a disciplina.' });
        }

        const notasBim = [Number(bim1 || 0), Number(bim2 || 0), Number(bim3 || 0), Number(bim4 || 0)];
        for (const n of notasBim) {
            if (Number.isNaN(n) || n < 0 || n > 10) {
                return res.status(400).json({ mensagem: 'As notas bimestrais devem estar entre 0.0 e 10.0.' });
            }
        }

        const carga = Number(carga_horaria || 80);

        await pool.execute(
            `INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             bim1 = VALUES(bim1), bim2 = VALUES(bim2), bim3 = VALUES(bim3), bim4 = VALUES(bim4), carga_horaria = VALUES(carga_horaria)`,
            [idAluno, disciplina.trim(), notasBim[0], notasBim[1], notasBim[2], notasBim[3], carga]
        );

        return res.status(200).json({ mensagem: 'Boletim online atualizado com sucesso!' });
    } catch (erro) {
        next(erro);
    }
}

// DELETE - Excluir disciplina do boletim
async function excluirNota(req, res, next) {
    try {
        const id = Number(req.params.id);
        await pool.execute('DELETE FROM notas WHERE id = ?', [id]);
        return res.json({ mensagem: 'Registro removido do boletim.' });
    } catch (erro) {
        next(erro);
    }
}

module.exports = { listarNotas, salvarNota, excluirNota };
