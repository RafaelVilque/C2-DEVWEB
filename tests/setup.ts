import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'file:./prisma/test.db'
process.env.JWT_SECRET = 'test-secret-key-very-long-for-tests'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'

const prisma = new PrismaClient()

// Roda migrations no banco de teste antes de tudo
beforeAll(async () => {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
  })
  await prisma.$connect()
})

// Limpa todas as tabelas entre cada teste
afterEach(async () => {
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
