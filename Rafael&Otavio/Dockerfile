FROM node:20-alpine
WORKDIR /app

# Instala dependências (camada cacheada se package.json não mudar)
COPY package*.json ./
RUN npm install

# Gera o Prisma Client para PostgreSQL
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate

# Copia código-fonte e arquivos estáticos
COPY src ./src
COPY public ./public

# Compila TypeScript → dist/
RUN npm run build

EXPOSE 3000

# Aplica schema no banco e inicia o servidor
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]
