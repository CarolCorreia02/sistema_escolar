const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const express = require('express');
const pool = require('./database/conexao');
const corsMiddleware = require('./middlewares/corsMiddleware');

const authRoutes = require('./routes/authRoutes');
const alunosRoutes = require('./routes/alunosRoutes');
const boletimRoutes = require('./routes/boletimRoutes');
const faltasRoutes = require('./routes/faltasRoutes');
const documentosRoutes = require('./routes/documentosRoutes');
const avisosRoutes = require('./routes/avisosRoutes');

const app = express();
const PORTA = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(express.json({ limit: '200kb' }));

// Rotas da API (aceita com e sem prefixo /api para compatibilidade total)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/alunos', alunosRoutes);
app.use('/api/alunos', alunosRoutes);

app.use('/boletim', boletimRoutes);
app.use('/api/boletim', boletimRoutes);

app.use('/faltas', faltasRoutes);
app.use('/api/faltas', faltasRoutes);

app.use('/documentos', documentosRoutes);
app.use('/api/documentos', documentosRoutes);

app.use('/avisos', avisosRoutes);
app.use('/api/avisos', avisosRoutes);

// Servir arquivos estáticos da pasta frontend
app.get('/', (req, res) => {
    res.redirect('/login.html');
});
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use((req, res) => {
    res.status(404).json({ mensagem: 'Rota não encontrada na API.' });
});

app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);
    console.error('Erro na API:', erro.message);
    res.status(erro.status || 500).json({
        mensagem: erro.message || 'Erro interno no servidor. Verifique a conexão com o MySQL Workbench.'
    });
});

async function iniciar() {
    try {
        await pool.execute('SELECT 1');
        console.log('Conexão com MySQL (sistema_escolar) estabelecida com sucesso!');
    } catch (erro) {
        console.warn('Aviso: Banco MySQL ainda não acessível ou não importado (' + erro.message + ').');
        console.warn('Execute o arquivo sql/sistema_escolar.sql no MySQL Workbench ou rode: npm run seed');
    }

    app.listen(PORTA, () => {
        console.log('============================================================');
        console.log('EduPortal — Servidor rodando em: http://localhost:' + PORTA);
        console.log('Login Diretoria: diretoria@escola.com | Senha: Didatica@123');
        console.log('Login Aluno:     lucas@aluno.com      | Senha: Didatica@123');
        console.log('============================================================');
    });
}

if (require.main === module) iniciar();
module.exports = app;
