import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'file:./prisma/test.db'
process.env.JWT_SECRET = 'test-secret-key-very-long-for-tests'
process.env.JWT_EXPIRES_IN = '1h'
process.env.NODE_ENV = 'test'

const prisma = new PrismaClient()

beforeAll(async () => {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
  })
  await prisma.$connect()
})

afterEach(async () => {
  await prisma.task.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
