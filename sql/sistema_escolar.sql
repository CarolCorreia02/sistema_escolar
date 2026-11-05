CREATE DATABASE IF NOT EXISTS sistema_escolar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_escolar;

-- 1. Tabela de Usuários (Diretoria e Alunos)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('diretoria', 'aluno') NOT NULL DEFAULT 'aluno',
    matricula VARCHAR(30) UNIQUE NULL,
    turma VARCHAR(50) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Documentos Emitidos (CRUD Principal da Diretoria + Impressão PDF)
CREATE TABLE documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    diretor_id INT NOT NULL,
    tipo ENUM('Comprovante de Matrícula', 'Histórico Escolar', 'Boletim Escolar', 'Declaração de Frequência', 'Certificado de Conclusão') NOT NULL,
    periodo_letivo VARCHAR(30) NOT NULL,
    frequencia_percentual DECIMAL(5,2) DEFAULT 100.00,
    media_geral DECIMAL(4,2) NULL,
    conteudo_detalhado TEXT NOT NULL,
    codigo_validacao VARCHAR(40) NOT NULL,
    data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (diretor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Tabela de Faltas e Justificativas
CREATE TABLE faltas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    disciplina VARCHAR(80) NOT NULL,
    data_falta DATE NOT NULL,
    quantidade_aulas INT NOT NULL DEFAULT 1,
    justificativa_texto TEXT NULL,
    anexo_justificativa VARCHAR(255) NULL,
    status_justificativa ENUM('Sem Justificativa', 'Pendente', 'Abonada', 'Indeferida') DEFAULT 'Sem Justificativa',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Tabela de Solicitações de Autoatendimento (Portal do Aluno)
CREATE TABLE solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    tipo_servico VARCHAR(100) NOT NULL,
    observacoes TEXT NULL,
    status ENUM('Pendente', 'Em Análise', 'Pronto / Concluído', 'Recusado') DEFAULT 'Pendente',
    resposta_diretoria TEXT NULL,
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Tabela de Calendário Escolar e Avisos
CREATE TABLE calendario_eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    data_evento DATE NOT NULL,
    categoria ENUM('Prova', 'Feriado', 'Reunião', 'Evento', 'Prazo Secretaria') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

USE sistema_escolar;

-- Insere ou atualiza os usuários solicitados
USE sistema_escolar;

INSERT INTO usuarios (nome, email, senha, perfil, matricula, turma) VALUES
('Diretoria', 'carolinacorreia0210+diretoria@gmail.com', '$2a$10$wK1FmR7aZqF7gA.k0c87ueG/e1xQd7sIqEwK.aE4QoK6hK2c2H0q6', 'diretoria', 'DIR-100', 'Direção Geral'),
('Aluno', 'carolinacorreia0210+aluno@gmail.com', '$2a$10$V6m1L6jFzL.3g8z4b8DxeO/b7zC4p8s9aQ2yX5e8wN3vR1m7k9uLe', 'aluno', 'ALU-200', '3º Ano Técnico')
AS novo
ON DUPLICATE KEY UPDATE 
    nome = novo.nome, 
    senha = novo.senha, 
    perfil = novo.perfil;
    
    