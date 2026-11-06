-- =====================================================================
-- SCRIPT SQL PARA MYSQL WORKBENCH (MySQL 8.0+)
-- Projeto: Sistema Escolar EduPortal — Gestão Acadêmica e Documental
-- =====================================================================
SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS sistema_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_escolar;

-- 1. TABELA DE USUÁRIOS (Diretoria e Alunos)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel ENUM('diretoria', 'aluno') NOT NULL DEFAULT 'aluno',
    matricula VARCHAR(30) NULL UNIQUE,
    turma VARCHAR(50) NULL DEFAULT '3º Ano A - Ensino Médio',
    cpf VARCHAR(20) NULL,
    data_nascimento DATE NULL,
    status_matricula ENUM('Ativa', 'Trancada', 'Concluída') NOT NULL DEFAULT 'Ativa',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 2. TABELA DE BOLETIM / NOTAS POR DISCIPLINA
CREATE TABLE IF NOT EXISTS notas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT UNSIGNED NOT NULL,
    disciplina VARCHAR(80) NOT NULL,
    bim1 DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    bim2 DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    bim3 DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    bim4 DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    carga_horaria INT UNSIGNED NOT NULL DEFAULT 80,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_nota_aluno FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY uk_aluno_disciplina (aluno_id, disciplina)
) ENGINE = InnoDB;

-- 3. TABELA DE FALTAS E JUSTIFICATIVAS
CREATE TABLE IF NOT EXISTS faltas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT UNSIGNED NOT NULL,
    disciplina VARCHAR(80) NOT NULL,
    data_falta DATE NOT NULL,
    quantidade INT UNSIGNED NOT NULL DEFAULT 1,
    justificada BOOLEAN NOT NULL DEFAULT FALSE,
    justificativa TEXT NULL,
    status_justificativa ENUM('Sem justificativa', 'Em análise', 'Abonada', 'Indeferida') NOT NULL DEFAULT 'Sem justificativa',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_falta_aluno FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_falta_aluno (aluno_id, data_falta)
) ENGINE = InnoDB;

-- 4. TABELA DE SOLICITAÇÕES E DOCUMENTOS EMITIDOS COM CÓDIGO DE VERIFICAÇÃO
CREATE TABLE IF NOT EXISTS documentos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT UNSIGNED NOT NULL,
    tipo_documento ENUM(
        'Declaração de Frequência',
        'Histórico Escolar',
        'Comprovante de Matrícula',
        'Boletim Escolar Oficial'
    ) NOT NULL,
    finalidade VARCHAR(255) NULL,
    status ENUM('Pendente', 'Emitido', 'Recusado') NOT NULL DEFAULT 'Pendente',
    codigo_verificacao VARCHAR(40) NULL UNIQUE,
    observacao_diretoria VARCHAR(255) NULL,
    dados_snapshot JSON NULL,
    solicitado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emitido_em TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_doc_aluno FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_doc_status (status),
    INDEX idx_doc_codigo (codigo_verificacao)
) ENGINE = InnoDB;

-- 5. TABELA DE MURAL DE AVISOS ESCOLARES
CREATE TABLE IF NOT EXISTS avisos (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(140) NOT NULL,
    mensagem TEXT NOT NULL,
    categoria ENUM('Acadêmico', 'Secretaria', 'Urgente', 'Evento') NOT NULL DEFAULT 'Secretaria',
    autor_nome VARCHAR(100) NOT NULL DEFAULT 'Diretoria Escolar',
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- =====================================================================
-- DADOS INICIAIS DE DEMONSTRAÇÃO
-- Senha padrão das contas abaixo: Didatica@123
-- Hash bcrypt custo 12 compatível com a API
-- =====================================================================
START TRANSACTION;

INSERT INTO usuarios (nome, email, senha, nivel, matricula, turma, cpf, data_nascimento, status_matricula)
SELECT 'Helena Vasconcelos (Diretora)', 'diretoria@escola.com',
       '$2b$12$2hpcQt.hRK9veTDDs37Jh.zfB1dBtSEjk2KATzuqlYQPbeZmRJpmS',
       'diretoria', 'DIR-0001', 'Direção Geral', '111.222.333-44', '1982-04-15', 'Ativa'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'diretoria@escola.com');

INSERT INTO usuarios (nome, email, senha, nivel, matricula, turma, cpf, data_nascimento, status_matricula)
SELECT 'Lucas Gabriel Mendes', 'lucas@aluno.com',
       '$2b$12$kUNcbZuaW2zes67MbDmnteimGhyD64LhdpV3eU4dmIBuv4DtBRqEi',
       'aluno', '20260101', '3º Ano A - Ensino Médio Técnico', '458.912.300-18', '2008-08-21', 'Ativa'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'lucas@aluno.com');

INSERT INTO usuarios (nome, email, senha, nivel, matricula, turma, cpf, data_nascimento, status_matricula)
SELECT 'Mariana Costa Oliveira', 'mariana@aluno.com',
       '$2b$12$kUNcbZuaW2zes67MbDmnteimGhyD64LhdpV3eU4dmIBuv4DtBRqEi',
       'aluno', '20260102', '3º Ano A - Ensino Médio Técnico', '329.841.700-92', '2008-11-03', 'Ativa'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'mariana@aluno.com');

INSERT INTO usuarios (nome, email, senha, nivel, matricula, turma, cpf, data_nascimento, status_matricula)
SELECT 'Rafael Almeida Santos', 'rafael@aluno.com',
       '$2b$12$kUNcbZuaW2zes67MbDmnteimGhyD64LhdpV3eU4dmIBuv4DtBRqEi',
       'aluno', '20260103', '2º Ano B - Ensino Médio Técnico', '741.209.650-05', '2009-02-14', 'Ativa'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'rafael@aluno.com');

SET @lucas_id = (SELECT id FROM usuarios WHERE email = 'lucas@aluno.com');
SET @mariana_id = (SELECT id FROM usuarios WHERE email = 'mariana@aluno.com');
SET @rafael_id = (SELECT id FROM usuarios WHERE email = 'rafael@aluno.com');

-- Notas de Lucas
INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @lucas_id, 'Desenvolvimento Web', 9.0, 8.5, 9.2, 9.5, 100
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @lucas_id AND disciplina = 'Desenvolvimento Web');

INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @lucas_id, 'Banco de Dados', 8.0, 8.5, 7.8, 8.8, 80
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @lucas_id AND disciplina = 'Banco de Dados');

INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @lucas_id, 'Matemática Aplicada', 7.5, 7.0, 8.0, 8.2, 120
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @lucas_id AND disciplina = 'Matemática Aplicada');

INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @lucas_id, 'Língua Portuguesa', 8.5, 9.0, 8.5, 9.0, 120
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @lucas_id AND disciplina = 'Língua Portuguesa');

-- Notas de Mariana
INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @mariana_id, 'Desenvolvimento Web', 9.5, 9.8, 9.5, 10.0, 100
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @mariana_id AND disciplina = 'Desenvolvimento Web');

INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @mariana_id, 'Banco de Dados', 9.0, 9.2, 9.5, 9.5, 80
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @mariana_id AND disciplina = 'Banco de Dados');

INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @mariana_id, 'Matemática Aplicada', 8.5, 8.8, 9.0, 9.2, 120
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @mariana_id AND disciplina = 'Matemática Aplicada');

-- Notas de Rafael
INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @rafael_id, 'Desenvolvimento Web', 6.5, 5.8, 7.0, 6.8, 100
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @rafael_id AND disciplina = 'Desenvolvimento Web');

INSERT INTO notas (aluno_id, disciplina, bim1, bim2, bim3, bim4, carga_horaria)
SELECT @rafael_id, 'Matemática Aplicada', 5.5, 6.0, 6.5, 6.0, 120
WHERE NOT EXISTS (SELECT 1 FROM notas WHERE aluno_id = @rafael_id AND disciplina = 'Matemática Aplicada');

-- Faltas de demonstração
INSERT INTO faltas (aluno_id, disciplina, data_falta, quantidade, justificada, justificativa, status_justificativa)
SELECT @lucas_id, 'Matemática Aplicada', '2026-03-10', 2, TRUE, 'Atestado médico odontológico entregue na secretaria.', 'Abonada'
WHERE NOT EXISTS (SELECT 1 FROM faltas WHERE aluno_id = @lucas_id AND data_falta = '2026-03-10');

INSERT INTO faltas (aluno_id, disciplina, data_falta, quantidade, justificada, justificativa, status_justificativa)
SELECT @lucas_id, 'Banco de Dados', '2026-03-18', 2, FALSE, NULL, 'Sem justificativa'
WHERE NOT EXISTS (SELECT 1 FROM faltas WHERE aluno_id = @lucas_id AND data_falta = '2026-03-18');

INSERT INTO faltas (aluno_id, disciplina, data_falta, quantidade, justificada, justificativa, status_justificativa)
SELECT @rafael_id, 'Desenvolvimento Web', '2026-03-20', 4, FALSE, 'Problemas com transporte intermunicipal (comprovante enviado).', 'Em análise'
WHERE NOT EXISTS (SELECT 1 FROM faltas WHERE aluno_id = @rafael_id AND data_falta = '2026-03-20');

-- Documentos solicitados e emitidos com código de verificação
INSERT INTO documentos (aluno_id, tipo_documento, finalidade, status, codigo_verificacao, observacao_diretoria, emitido_em)
SELECT @lucas_id, 'Comprovante de Matrícula', 'Solicitação de meia-entrada estudantil e passe escolar.', 'Emitido',
       'EDU-2026-LUC9A1', 'Documento conferido e assinado digitalmente pela Diretoria.', NOW()
WHERE NOT EXISTS (SELECT 1 FROM documentos WHERE codigo_verificacao = 'EDU-2026-LUC9A1');

INSERT INTO documentos (aluno_id, tipo_documento, finalidade, status, codigo_verificacao, observacao_diretoria)
SELECT @lucas_id, 'Declaração de Frequência', 'Apresentação no programa de Jovem Aprendiz.', 'Pendente',
       NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM documentos WHERE aluno_id = @lucas_id AND tipo_documento = 'Declaração de Frequência');

INSERT INTO documentos (aluno_id, tipo_documento, finalidade, status, codigo_verificacao, observacao_diretoria, emitido_em)
SELECT @mariana_id, 'Histórico Escolar', 'Inscrição em bolsa de iniciação científica.', 'Emitido',
       'EDU-2026-MAR8B2', 'Histórico parcial emitido com média global de excelência.', NOW()
WHERE NOT EXISTS (SELECT 1 FROM documentos WHERE codigo_verificacao = 'EDU-2026-MAR8B2');

-- Avisos iniciais
INSERT INTO avisos (titulo, mensagem, categoria, autor_nome)
SELECT 'Entrega de Boletins do 1º Semestre',
       'As notas e frequências atualizadas já podem ser consultadas no portal e validadas com código de autenticidade.',
       'Acadêmico', 'Helena Vasconcelos (Diretora)'
WHERE NOT EXISTS (SELECT 1 FROM avisos WHERE titulo = 'Entrega de Boletins do 1º Semestre');

INSERT INTO avisos (titulo, mensagem, categoria, autor_nome)
SELECT 'Prazo para Justificativa de Faltas',
       'Lembramos que atestados médicos ou justificativas devem ser enviados pelo Painel do Aluno em até 5 dias úteis após a ausência.',
       'Secretaria', 'Secretaria Acadêmica'
WHERE NOT EXISTS (SELECT 1 FROM avisos WHERE titulo = 'Prazo para Justificativa de Faltas');

COMMIT;
