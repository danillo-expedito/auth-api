# Auth API

API REST de autenticação construída com Node.js, TypeScript e PostgreSQL.

## 🚀 Stack

- **Runtime:** Node.js
- **Linguagem:** TypeScript
- **Framework:** Express
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticação:** JWT (Access + Refresh Token)
- **Validação:** Zod
- **Testes:** Vitest + Supertest
- **Email:** Nodemailer

## ✨ Funcionalidades

- Cadastro de usuário com validação de senha forte
- Login com geração de access token e refresh token
- Renovação de access token via refresh token
- Logout com revogação de refresh token
- Rota protegida por JWT
- Recuperação de senha via email
- Rate limiting por endpoint
- Proteção contra timing attacks
- Error handling centralizado

## 📦 Como rodar localmente

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- pnpm

### Instalação

```bash
# Clone o repositório
git clone https://github.com/danillo-expedito/auth-api
cd auth-api

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Execute as migrations
pnpm exec prisma migrate dev

# Inicie o servidor
pnpm dev
```

## ⚙️ Variáveis de ambiente

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de dados
DATABASE_URL=
SHADOW_DATABASE_URL=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
FRONTEND_URL=
```

## 🔗 Endpoints

### Auth

| Método | Rota                    | Descrição                | Auth |
| ------ | ----------------------- | ------------------------ | ---- |
| POST   | `/auth/register`        | Cadastro de usuário      | ❌   |
| POST   | `/auth/login`           | Login                    | ❌   |
| POST   | `/auth/refresh`         | Renovar access token     | ❌   |
| POST   | `/auth/logout`          | Logout                   | ❌   |
| POST   | `/auth/forgot-password` | Solicitar reset de senha | ❌   |
| POST   | `/auth/reset-password`  | Redefinir senha          | ❌   |

### Users

| Método | Rota        | Descrição               | Auth |
| ------ | ----------- | ----------------------- | ---- |
| GET    | `/users/me` | Dados do usuário logado | ✅   |

> ✅ Requer token JWT no header `Authorization: Bearer <token>`  
> ❌ Não requer autenticação

### Exemplos de requisição

**Cadastro:**

```json
POST /auth/register
{
  "name": "Danillo Expedito",
  "email": "danillo@email.com",
  "password": "Senha123@"
}
```

**Login:**

```json
POST /auth/login
{
  "email": "danillo@email.com",
  "password": "Senha123@"
}
```

**Rota protegida:**

```
GET /users/me
Authorization: Bearer <access_token>
```

## 🧪 Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar com cobertura
pnpm test --coverage
```

## 👤 Autor

**Danillo Expedito**

[LinkedIn](https://linkedin.com/in/danillo-expedito) · [GitHub](https://github.com/danillo-expedito)
