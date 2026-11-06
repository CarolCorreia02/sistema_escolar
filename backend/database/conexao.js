const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_escolar',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 100,
    connectTimeout: 10000,
    charset: 'utf8mb4',
    timezone: 'Z'
});

pool.on('connection', async function configurarFuso(conexao) {
    try {
        await conexao.promise().query("SET SESSION time_zone = '+00:00'");
    } catch (erro) {
        console.error('Erro ao configurar fuso horário da sessão MySQL:', erro.message);
    }
});

module.exports = pool;
