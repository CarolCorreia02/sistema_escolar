# EduDocs & Portal Escolar - Gestão Acadêmica e Autoatendimento

## 1. Problema Identificado e Público Afetado
Em muitas instituições de ensino, a solicitação e emissão de documentos escolares (declarações de matrícula, históricos, boletins e frequência), bem como o controle de faltas e entrega de atestados/justificativas, ainda ocorrem de forma manual ou presencial na secretaria. Isso gera filas, lentidão no atendimento, perda de prazos e sobrecarga administrativa para a diretoria, afetando diretamente alunos, responsáveis e a equipe diretiva/secretaria.

## 2. Proposta de Solução
Desenvolver um sistema web integrado onde a Diretoria possa gerenciar alunos, lançar e abonar faltas, aprovar solicitações, manter o calendário escolar e emitir documentos oficiais prontos para impressão/PDF. Paralelamente, os Alunos contam com um portal de autoatendimento para solicitar documentos, visualizar seu boletim/frequência, anexar justificativas de ausência e consultar o calendário letivo, contando ainda com personalização de tema (Modo Claro e Modo Escuro).

## 3. Tipos de Usuários e Permissões
* Diretoria: Acesso total aos CRUDs administrativos. Pode cadastrar/editar/excluir documentos e boletins, registrar e atualizar faltas, aprovar/concluir solicitações de alunos e gerenciar eventos do calendário escolar.
* Aluno: Acesso ao portal do estudante. Pode visualizar seus documentos/boletins emitidos, consultar suas faltas e enviar justificativas/atestados, abrir e cancelar solicitações de serviços de autoatendimento e consultar o calendário escolar.

## 4. Fluxo Básico de Funcionamento
1. O usuário realiza o cadastro ou login no sistema.
2. O back-end valida as credenciais, gera um token JWT contendo o `id` e o `perfil` (`diretoria` ou `aluno`) e retorna ao front-end.
3. O front-end redireciona automaticamente para `diretoria.html` ou `aluno.html` e aplica a preferência de tema (Claro/Escuro).
4. Todas as operações subsequentes passam pelos middlewares de autenticação e autorização na API REST antes de persistirem no banco de dados MySQL.

## 5. Tecnologias Utilizadas
* Front-end: HTML5, CSS3 (Variáveis CSS para Dark/Light Mode), JavaScript (DOM, Fetch API, `window.print` para geração de PDF).
* Back-end: Node.js, Express.js, JSON Web Token (`jsonwebtoken`), `bcryptjs` (hash de senhas), `dotenv`.
* Banco de Dados: MySQL (`mysql2/promise`).

## 6. Instalação e Execução
1. Clone o repositório e execute o script `sql/sistema_escolar.sql` no MySQL Workbench.
2. Na pasta `backend/`, copie `.env.example` para `.env` e configure suas credenciais do MySQL.
3. Instale as dependências e inicie o servidor:
   ```bash
   cd backend
   npm init -y
   npm install express mysql2 dotenv cors
   npm run seed
   npm start