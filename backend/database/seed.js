const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

async function popularBanco() {
    let conexao;
    try {
        const scriptSql = await fs.readFile(path.join(__dirname, '..', '..', 'sql', 'sistema_escolar.sql'), 'utf8');
        conexao = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });
        await conexao.query(scriptSql);
        console.log('Banco de dados sistema_escolar criado e populado com sucesso!');
        console.log('Conta Diretoria: diretoria@escola.com | Senha: Didatica@123');
        console.log('Conta Aluno:     lucas@aluno.com      | Senha: Didatica@123');
    } catch (erro) {
        console.error('Erro ao executar seed:', erro.message);
        process.exitCode = 1;
    } finally {
        if (conexao) await conexao.end();
    }
}

popularBanco();
