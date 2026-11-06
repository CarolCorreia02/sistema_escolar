const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/conexao');

function emailValido(email) {
    return typeof email === 'string' && email.length <= 180 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function cadastrar(req, res, next) {
    try {
        const { nome, email, senha, nivel, codigo_diretoria, turma, cpf, data_nascimento } = req.body;

        if (typeof nome !== 'string' || nome.trim().length < 3 || nome.trim().length > 120 ||
            !emailValido(email) || typeof senha !== 'string' || senha.length < 6) {
            return res.status(400).json({
                mensagem: 'Preencha nome completo (mínimo 3 letras), e-mail válido e senha com no mínimo 6 caracteres.'
            });
        }

        // Sistema de Verificação de Nível no Cadastro:
        // Se escolher 'diretoria', exige o código de verificação da instituição (padrão DIRET2026)
        let nivelEscolhido = 'aluno';
        if (nivel === 'diretoria') {
            const codigoEsperado = process.env.CODIGO_DIRETORIA || 'DIRET2026';
            if (codigo_diretoria !== codigoEsperado) {
                return res.status(403).json({
                    mensagem: 'Código de verificação da Diretoria inválido. Para teste, utilize: DIRET2026'
                });
            }
            nivelEscolhido = 'diretoria';
        }

        const senhaProtegida = await bcrypt.hash(senha, 12);
        const matriculaGerada = nivelEscolhido === 'diretoria'
            ? 'DIR-' + Math.floor(1000 + Math.random() * 9000)
            : '2026' + Math.floor(1000 + Math.random() * 9000);

        const turmaPadrao = nivelEscolhido === 'diretoria'
            ? 'Direção Geral'
            : (turma && turma.trim() ? turma.trim() : '3º Ano A - Ensino Médio Técnico');

        const [resultado] = await pool.execute(
            `INSERT INTO usuarios (nome, email, senha, nivel, matricula, turma, cpf, data_nascimento)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome.trim(),
                email.trim().toLowerCase(),
                senhaProtegida,
                nivelEscolhido,
                matriculaGerada,
                turmaPadrao,
                cpf ? cpf.trim() : '000.000.000-00',
                data_nascimento || '2008-01-01'
            ]
        );

        // Se for um novo aluno, cria disciplinas iniciais no boletim para facilitar o uso imediato
        if (nivelEscolhido === 'aluno') {
            const disciplinasPadrao = [
                ['Desenvolvimento Web', 100],
                ['Banco de Dados', 80],
                ['Matemática Aplicada', 120],
                ['Língua Portuguesa', 120]
            ];
            for (const [disc, carga] of disciplinasPadrao) {
                await pool.execute(
                    'INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria) VALUES (?, ?, 0, 0, 0, 0, ?)',
                    [resultado.insertId, disc, carga]
                );
            }
        }

        return res.status(201).json({
            mensagem: 'Cadastro realizado com sucesso! Matrícula gerada: ' + matriculaGerada,
            id: resultado.insertId,
            matricula: matriculaGerada
        });
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensagem: 'Este e-mail já está cadastrado no sistema.' });
        }
        next(erro);
    }
}

async function login(req, res, next) {
    try {
        const { email, senha } = req.body;
        if (!emailValido(email) || typeof senha !== 'string' || senha.length === 0) {
            return res.status(400).json({ mensagem: 'Informe seu e-mail e senha.' });
        }

        const [usuarios] = await pool.execute('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
        if (usuarios.length === 0 || !(await bcrypt.compare(senha, usuarios[0].senha))) {
            return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
        }

        const u = usuarios[0];
        const segredo = process.env.JWT_SECRET || 'chave_secreta_super_segura_eduportal_2026_jwt';
        const token = jwt.sign(
            { id: u.id, email: u.email, nivel: u.nivel },
            segredo,
            { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
        );

        return res.json({
            mensagem: 'Login realizado com sucesso.',
            token,
            usuario: {
                id: u.id,
                nome: u.nome,
                email: u.email,
                nivel: u.nivel,
                matricula: u.matricula,
                turma: u.turma
            }
        });
    } catch (erro) {
        next(erro);
    }
}

async function perfil(req, res) {
    return res.json(req.usuario);
}

module.exports = { cadastrar, login, perfil };
