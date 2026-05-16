import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../../src/app.js'
import { hashPassword, signToken } from '../../src/lib/auth.js'

const app = createApp()
const prisma = new PrismaClient()

async function createAdminUser() {
  const hashed = await hashPassword('adminpass')
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: `admin-${Date.now()}@test.com`,
      password: hashed,
      role: 'ADMIN',
    },
  })
  const token = signToken({ sub: admin.id, email: admin.email, role: admin.role })
  return { admin, token }
}

describe('GET /users — somente ADMIN', () => {
  it('ADMIN pode listar todos os usuários', async () => {
    const { token } = await createAdminUser()

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toBeInstanceOf(Array)
  })

  it('USER comum recebe 403 ao tentar listar usuários', async () => {
    const userRes = await request(app).post('/auth/register').send({
      name: 'Comum',
      email: `user-${Date.now()}@test.com`,
      password: 'senha123',
    })

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${userRes.body.token}`)

    expect(res.status).toBe(403)
  })

  it('sem token retorna 401', async () => {
    const res = await request(app).get('/users')
    expect(res.status).toBe(401)
  })
})
