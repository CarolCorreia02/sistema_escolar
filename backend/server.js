require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./middlewares/corsMiddleware');

const authRoutes = require('./routes/authRoutes');
const documentosRoutes = require('./routes/documentosRoutes');
const faltasRoutes = require('./routes/faltasRoutes');
const solicitacoesRoutes = require('./routes/solicitacoesRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');

const app = express();
app.use(corsMiddleware);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/faltas', faltasRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/calendario', calendarioRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Escolar rodando em http://localhost:${PORT}`);
});