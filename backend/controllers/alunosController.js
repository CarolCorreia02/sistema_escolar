const pool = require('../database/conexao');

// Monta a ficha completa de um aluno com cálculo automático de frequência e médias
async function montarFichaAluno(alunoId) {
    const [usuarios] = await pool.execute(
        `SELECT id, nome, email, nivel, matricula, turma, cpf, data_nascimento, status_matricula, criado_em
         FROM usuarios WHERE id = ? AND nivel = 'aluno'`,
        [alunoId]
    );
    if (usuarios.length === 0) return null;
    const aluno = usuarios[0];

    const [notas] = await pool.execute(
        'SELECT id, disciplina, bim1, bim2, bim3, bim4, carga_horaria FROM notas WHERE aluno_id = ? ORDER BY disciplina',
        [alunoId]
    );

    const [faltas] = await pool.execute(
        `SELECT id, disciplina, data_falta, quantidade, justificada, justificativa, status_justificativa
         FROM faltas WHERE aluno_id = ? ORDER BY data_falta DESC`,
        [alunoId]
    );

    let cargaTotal = 0;
    let somaMedias = 0;
    const boletim = notas.map(n => {
        const b1 = Number(n.bim1);
        const b2 = Number(n.bim2);
        const b3 = Number(n.bim3);
        const b4 = Number(n.bim4);
        const media = Number(((b1 + b2 + b3 + b4) / 4).toFixed(2));
        cargaTotal += Number(n.carga_horaria || 80);
        somaMedias += media;
        let situacao = 'Aprovado';
        if (media < 5.0) situacao = 'Reprovado';
        else if (media < 7.0) situacao = 'Em Recuperação';
        return { ...n, bim1: b1, bim2: b2, bim3: b3, bim4: b4, media, situacao };
    });

    if (cargaTotal === 0) cargaTotal = 400; // Carga horária base caso não haja disciplinas

    const totalFaltas = faltas.reduce((acc, f) => acc + Number(f.quantidade), 0);
    const faltasNaoAbonadas = faltas
        .filter(f => !f.justificada && f.status_justificativa !== 'Abonada')
        .reduce((acc, f) => acc + Number(f.quantidade), 0);

    const percentualFrequencia = Math.max(
        0,
        Number((((cargaTotal - faltasNaoAbonadas) / cargaTotal) * 100).toFixed(1))
    );
    const mediaGeral = boletim.length > 0 ? Number((somaMedias / boletim.length).toFixed(2)) : 0;

    return {
        ...aluno,
        carga_horaria_total: cargaTotal,
        total_faltas: totalFaltas,
        faltas_computadas: faltasNaoAbonadas,
        frequencia_percentual: percentualFrequencia,
        media_geral: mediaGeral,
        boletim,
        faltas
    };
}

async function listarAlunos(req, res, next) {
    try {
        const [alunos] = await pool.execute(
            "SELECT id FROM usuarios WHERE nivel = 'aluno' ORDER BY nome"
        );
        const fichas = [];
        for (const a of alunos) {
            const ficha = await montarFichaAluno(a.id);
            if (ficha) fichas.push(ficha);
        }
        return res.json(fichas);
    } catch (erro) {
        next(erro);
    }
}

async function obterFichaCompleta(req, res, next) {
    try {
        const id = Number(req.params.id);
        // Aluno só pode consultar a própria ficha; diretoria pode consultar qualquer aluno
        if (req.usuario.nivel === 'aluno' && req.usuario.id !== id) {
            return res.status(403).json({ mensagem: 'Você só pode visualizar seus próprios dados acadêmicos.' });
        }
        const ficha = await montarFichaAluno(id);
        if (!ficha) {
            return res.status(404).json({ mensagem: 'Aluno não encontrado.' });
        }
        return res.json(ficha);
    } catch (erro) {
        next(erro);
    }
}

async function atualizarDadosAluno(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { nome, turma, cpf, data_nascimento, status_matricula } = req.body;
        if (!nome || !turma) {
            return res.status(400).json({ mensagem: 'Nome e turma são obrigatórios.' });
        }
        await pool.execute(
            `UPDATE usuarios SET nome = ?, turma = ?, cpf = ?, data_nascimento = ?, status_matricula = ?
             WHERE id = ? AND nivel = 'aluno'`,
            [nome.trim(), turma.trim(), cpf || '', data_nascimento || null, status_matricula || 'Ativa', id]
        );
        return res.json({ mensagem: 'Cadastro do aluno atualizado com sucesso!' });
    } catch (erro) {
        next(erro);
    }
}

module.exports = { montarFichaAluno, listarAlunos, obterFichaCompleta, atualizarDadosAluno };
