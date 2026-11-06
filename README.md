# EduPortal — Sistema de Gestão Escolar, Boletim Online e Emissão de Documentos

Sistema web completo desenvolvido em **Node.js, Express, MySQL e JavaScript (DOM + Fetch)** com autenticação **JWT**, controle de permissões (**Diretoria** e **Aluno**) e **Sistema de Verificação de Autenticidade de Documentos**.

## 1. Problema Identificado e Proposta de Solução

- **Problema:** Secretarias escolares enfrentam filas e lentidão para emitir declarações de frequência, comprovantes de matrícula e históricos escolares manualmente, além da dificuldade de comunicação entre diretoria e alunos sobre faltas justificadas e lançamento de notas.
- **Público Afetado:** Equipe diretiva, secretaria acadêmica e estudantes.
- **Proposta de Solução:** O **EduPortal** centraliza os dados acadêmicos no MySQL e permite que a **Diretoria** gere documentos oficiais automaticamente a partir do aluno selecionado, publique notas no boletim online e gerencie faltas e justificativas. Já o **Aluno** consulta seu boletim, envia justificativas de ausência, solicita documentos online e acompanha se o documento já foi emitido, contando ainda com um **Sistema Público de Verificação de Autenticidade** por código único.

## 2. Perfis de Usuário e Controle de Acesso (JWT)

1. **Diretoria (`diretoria`):**
   - Gerador automático de documentos oficiais (*Declaração de Frequência*, *Histórico Escolar*, *Comprovante de Matrícula* e *Boletim Oficial*) a partir dos dados cadastrados do aluno.
   - Aprovação e emissão de documentos solicitados pelos alunos (gerando código único de verificação `EDU-2026-XXXXXX`).
   - Registro de faltas (marcando se possuem justificativa ou não) e abono de justificativas enviadas pelos estudantes.
   - Lançamento e edição do Boletim Online por disciplina e bimestre.
   - Publicação de comunicados no Mural Escolar.
2. **Aluno (`aluno`):**
   - Visualização do Boletim Online (notas dos 4 bimestres, média calculada e situação).
   - Solicitação de documentos para a diretoria e acompanhamento em tempo real se o documento foi feito (`Pendente` ou `Emitido`).
   - Visualização e impressão dos documentos emitidos com selo de verificação.
   - Consulta de faltas e envio de justificativa/atestado para análise da diretoria.

## 3. Como Executar no VS Code e MySQL Workbench

### Passo 1 — Banco de Dados no MySQL Workbench
1. Abra o **MySQL Workbench** e conecte-se ao seu servidor local (`localhost:3306`).
2. Abra o arquivo `sql/sistema_escolar.sql` e clique no ícone do raio (**Execute**) para criar o banco `sistema_escolar`, as 5 tabelas relacionadas e os dados iniciais de demonstração.

### Passo 2 — Configurar e Rodar o Back-end no VS Code
1. Abra o terminal do VS Code na pasta `backend`:
   ```bash
   cd backend
   npm install
   ```
2. Crie um arquivo `.env` dentro da pasta `backend` (copiando o conteúdo de `.env.example`) e ajuste `DB_PASSWORD` com a senha do seu MySQL Workbench:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=sua_senha_do_mysql
   DB_NAME=sistema_escolar
   JWT_SECRET=chave_secreta_super_segura_eduportal_2026_jwt
   CODIGO_DIRETORIA=DIRET2026
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Acesse no navegador: **`http://localhost:3000`** (ou abra `frontend/login.html` com a extensão Live Server).

## 4. Credenciais de Teste Prontas

| Perfil | E-mail | Senha | Código de Verificação (Cadastro) |
| :--- | :--- | :--- | :--- |
| **Diretoria** | `diretoria@escola.com` | `Didatica@123` | `DIRET2026` |
| **Aluno (Lucas)** | `lucas@aluno.com` | `Didatica@123` | *(Não exige código)* |
| **Aluna (Mariana)** | `mariana@aluno.com` | `Didatica@123` | *(Não exige código)* |

**Códigos de documentos já emitidos para testar o Verificador na tela de Login:**
- `EDU-2026-LUC9A1` (Comprovante de Matrícula — Lucas Gabriel Mendes)
- `EDU-2026-MAR8B2` (Histórico Escolar — Mariana Costa Oliveira)