const pool = require('../database/conexao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_escolar_jwt_2026';

exports.cadastrar = async (req, res) => {
    try {
        const { nome, email, senha, perfil, matricula, turma } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existente.length > 0) {
            return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const perfilFinal = perfil === 'diretoria' ? 'diretoria' : 'aluno';
        const matriculaFinal = matricula || (perfilFinal === 'aluno' ? 'MAT-' + Math.floor(100000 + Math.random() * 900000) : 'DIR-' + Math.floor(100 + Math.random() * 900));

        const [resultado] = await pool.query(
            'INSERT INTO usuarios (nome, email, senha, perfil, matricula, turma) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, email, senhaHash, perfilFinal, matriculaFinal, turma || 'Ensino Médio']
        );

        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id: resultado.insertId });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao realizar cadastro.', detalhes: erro.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const usuario = usuarios[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil, matricula: usuario.matricula, turma: usuario.turma },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                matricula: usuario.matricula,
                turma: usuario.turma
            }
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao processar login.', detalhes: erro.message });
    }
};

exports.listarAlunos = async (req, res) => {
    try {
        const [alunos] = await pool.query(
            "SELECT id, nome, email, matricula, turma FROM usuarios WHERE perfil = 'aluno' ORDER BY nome ASC"
        );
        res.json(alunos);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao listar alunos.' });
    }
};