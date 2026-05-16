# Todo API — Projeto C2

API REST completa em **Node.js + TypeScript**, desenvolvida como avaliação prática da Composição 2 (C2).

## Domínio: Plataforma de Tarefas (To-do)

Três entidades relacionadas:
- **User** — autenticação, papéis USER/ADMIN
- **Project** — projetos pertencentes a um usuário (soft delete)
- **Task** — tarefas aninhadas em projetos, com assignee opcional

---

## Stack

| Tecnologia | Uso |
|------------|-----|
| Node.js 20+ | Runtime |
| TypeScript (ES Modules) | Linguagem |
| Express.js | Framework HTTP |
| Prisma ORM | Acesso ao banco |
| SQLite (better-sqlite3) | Banco de dados |
| JWT (jsonwebtoken) | Autenticação |
| bcryptjs | Hash de senhas |
| Zod | Validação de entrada |
| Vitest + Supertest | Testes automatizados |

---

## Como rodar

### 1. Clonar e instalar

```bash
git clone <url-do-repo>
cd projeto-c2
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env e defina um JWT_SECRET seguro
```

### 3. Rodar migrations e gerar client

```bash
npx prisma migrate dev --name init
```

### 4. Iniciar o servidor

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`.

---

## Rotas disponíveis

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | ❌ | Cria conta nova |
| POST | `/auth/login` | ❌ | Login, retorna JWT |
| GET | `/auth/me` | ✅ | Dados do usuário logado |

### Usuários (ADMIN only)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/users` | ADMIN | Lista todos os usuários |
| GET | `/users/:id` | ADMIN | Busca usuário por ID |
| DELETE | `/users/:id` | ADMIN | Remove usuário |

### Projetos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/projects` | ❌ | Lista projetos (paginação + busca) |
| GET | `/projects/:id` | ❌ | Busca projeto com tarefas |
| POST | `/projects` | ✅ | Cria projeto |
| PUT | `/projects/:id` | Dono/ADMIN | Atualiza projeto |
| DELETE | `/projects/:id` | Dono/ADMIN | Soft delete |

### Tarefas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/projects/:id/tasks` | ❌ | Lista tarefas do projeto |
| GET | `/projects/:id/tasks/:taskId` | ❌ | Busca tarefa |
| POST | `/projects/:id/tasks` | ✅ | Cria tarefa |
| PATCH | `/projects/:id/tasks/:taskId` | Dono/ADMIN | Atualiza tarefa |
| DELETE | `/projects/:id/tasks/:taskId` | Dono/ADMIN | Remove tarefa |

---

## Exemplos de requisição (curl)

### Registrar usuário
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@email.com","password":"senha123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@email.com","password":"senha123"}'
```

### Criar projeto (com token)
```bash
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Meu Projeto","description":"Descrição opcional"}'
```

### Criar tarefa
```bash
curl -X POST http://localhost:3000/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Implementar feature X","priority":"HIGH","status":"PENDING"}'
```

### Listar projetos com paginação
```bash
curl "http://localhost:3000/projects?page=1&limit=10&search=api"
```

---

## Testes

```bash
# Rodar todos os testes
npm test

# Modo watch
npm run test:watch

# Relatório de cobertura
npm run test:coverage
```

O banco de testes (`prisma/test.db`) é isolado e limpo automaticamente entre os testes.

### Cenários cobertos

**Unitários (7):**
- Hash de senha gera valor diferente do original
- Hashes distintos para mesma senha (salt)
- `verifyPassword` correto/incorreto
- Assinar e decodificar token JWT
- Token inválido lança erro
- Validações Zod para todos os schemas

**Integração (18+):**
- Registro com sucesso e falha (email duplicado, senha curta)
- Login com sucesso e credencial inválida
- `GET /auth/me` autenticado e sem token (401)
- CRUD completo de projetos
- Controle de propriedade em edição/exclusão (403)
- Soft delete
- CRUD completo de tarefas
- Restrição de acesso ADMIN em `/users`
- USER tentando rota ADMIN → 403

---

## Pontos extras implementados

- ✅ **Paginação e filtros** em `GET /projects` (`?page`, `?limit`, `?search`)
- ✅ **Soft delete** no Project com campo `deletedAt`

---

## Variáveis de ambiente (.env.example)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-muito-segura-aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```
