# Sistema de Gestão Escolar

Sistema web desenvolvido para otimizar e centralizar a comunicação acadêmica, o controle de frequência, a solicitação de documentos e o gerenciamento institucional entre alunos e diretoria.

# Contexto e Problema Identificado

Instituições de ensino frequentemente enfrentam desorganização e atrasos no atendimento a solicitações cotidianas de estudantes (declarações, históricos e justificativas de faltas), além de ruídos na comunicação de datas letivas e acompanhamento de frequência. 

**Público afetado:** 
* Alunos da instituição.
* Equipe pedagógica e administrativa (Diretoria/Secretaria).

**Solução proposta:**
Um portal web integrado com controle de permissões que permite aos estudantes acompanhar notas/faltas e solicitar serviços, enquanto a diretoria gerencia solicitações, faltas e o calendário de eventos em tempo real[cite: 1, 3].

# Perfis de Usuário e Permissões

* **Aluno:** Visualização de calendário escolar, acompanhamento de faltas registradas e solicitação de documentos/serviços escolares.
* **Diretoria:** Gestão de solicitações acadêmicas, registro/justificativa de faltas, atualização de calendário e acompanhamento geral de alunos.

# Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3 e JavaScript Vanilla (Manipulação de DOM e API Fetch).
* **Back-end:** Node.js, Express[cite: 1, 2].
* **Banco de Dados:** MySQL com driver `mysql2`.
* **Autenticação:** JSON Web Token (JWT) e proteção de senhas com algoritmo de hash.

# Banco de Dados

O banco relacional conta com integridade referencial via chaves primárias e estrangeiras. O script completo de criação das tabelas e dados iniciais está disponível em:
* `sql/sistema_escolar.sql`

# Como Executar o Projeto

# Pré-requisitos
* Node.js instalado (v16 ou superior).
* Servidor MySQL em execução (ex.: via XAMPP, Workbench ou Docker).

# 1. Configurar o Banco de Dados
Importe o arquivo `sql/sistema_escolar.sql` no seu banco de dados MySQL para criar o banco `sistema_escolar` e suas tabelas relacionadas.

### 2. Configurar o Back-end
Entre na pasta do back-end e instale as dependências:
```bash
cd backend
npm install