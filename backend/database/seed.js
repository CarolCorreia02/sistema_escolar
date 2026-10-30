const pool = require('./conexao');
const bcrypt = require('bcryptjs');

async function popularBanco() {
    try {
        const senhaHash = await bcrypt.hash('123456', 10);

        const [diretores] = await pool.query(
            `INSERT IGNORE INTO usuarios (id, nome, email, senha, perfil, matricula, turma) VALUES
            (1, 'Diretora Helena Martins', 'diretoria@escola.edu.br', ?, 'diretoria', 'DIR-001', 'Administração'),
            (2, 'Lucas Mendes', 'aluno@escola.edu.br', ?, 'aluno', '20261045', '3º Ano - Ensino Médio Técnico'),
            (3, 'Mariana Costa', 'mariana@escola.edu.br', ?, 'aluno', '20261046', '2º Ano - Ensino Médio')`,
            [senhaHash, senhaHash, senhaHash]
        );

        await pool.query(
            `INSERT IGNORE INTO documentos (id, aluno_id, diretor_id, tipo, periodo_letivo, frequencia_percentual, media_geral, conteudo_detalhado, codigo_validacao) VALUES
            (1, 2, 1, 'Boletim Escolar', '2026/1', 94.50, 8.85, 'Matemática: 9.0 | Português: 8.5 | Desenvolvimento Web: 9.5 | Banco de Dados: 8.4 - Situação: Aprovado no Semestre.', 'DOC-2026-8841A'),
            (2, 2, 1, 'Comprovante de Matrícula', '2026', 94.50, NULL, 'Declaramos para os devidos fins que o(a) estudante encontra-se regularmente matriculado(a) e frequentando as aulas no turno matutino.', 'DOC-2026-9920B')`
        );

        await pool.query(
            `INSERT IGNORE INTO faltas (id, aluno_id, disciplina, data_falta, quantidade_aulas, justificativa_texto, anexo_justificativa, status_justificativa) VALUES
            (1, 2, 'Matemática', '2026-09-14', 2, 'Consulta médica odontológica no horário da aula.', 'atestado_odonto_lucas.pdf', 'Pendente'),
            (2, 2, 'História', '2026-09-20', 1, NULL, NULL, 'Sem Justificativa')`
        );

        await pool.query(
            `INSERT IGNORE INTO solicitacoes (id, aluno_id, tipo_servico, observacoes, status, resposta_diretoria) VALUES
            (1, 2, '2ª Via de Histórico Escolar', 'Preciso apresentar para vaga de estágio em TI.', 'Pronto / Concluído', 'Documento emitido! Já disponível na sua aba de Documentos para impressão.')`
        );

        await pool.query(
            `INSERT IGNORE INTO calendario_eventos (id, titulo, descricao, data_evento, categoria) VALUES
            (1, 'Entrega da Etapa Final do Projeto Web', 'Apresentação dos sistemas completos com banco de dados e autenticação JWT.', '2026-11-20', 'Prova'),
            (2, 'Conselho de Classe Participativo', 'Reunião geral entre diretoria, professores e representantes de turma.', '2026-11-28', 'Reunião'),
            (3, 'Prazo Final para Abono de Faltas', 'Último dia para anexar atestados referentes ao bimestre atual.', '2026-11-15', 'Prazo Secretaria')`
        );

        console.log('Seed executado com sucesso! Logins de teste (senha: 123456):');
        console.log('- Diretoria: diretoria@escola.edu.br');
        console.log('- Aluno: aluno@escola.edu.br');
        process.exit(0);
    } catch (erro) {
        console.error('Erro ao executar seed:', erro);
        process.exit(1);
    }
}

popularBanco();