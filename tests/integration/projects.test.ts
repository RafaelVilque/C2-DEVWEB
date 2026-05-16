import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()

// Helper: registra e retorna token + userId
async function createUser(email: string, name = 'Usuário') {
  const res = await request(app).post('/auth/register').send({
    name,
    email,
    password: 'senha123',
  })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

describe('GET /projects', () => {
  it('deve listar projetos sem autenticação', async () => {
    const res = await request(app).get('/projects')
    expect(res.status).toBe(200)
    expect(res.body.data).toBeInstanceOf(Array)
  })
})

describe('POST /projects', () => {
  it('deve criar projeto para usuário autenticado', async () => {
    const { token } = await createUser('criador@test.com')

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Projeto Alpha', description: 'Descrição' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Projeto Alpha')
    expect(res.body.owner).toBeDefined()
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/projects').send({ title: 'Sem Auth' })
    expect(res.status).toBe(401)
  })

  it('deve retornar 422 com título vazio', async () => {
    const { token } = await createUser('valid2@test.com')
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' })
    expect(res.status).toBe(422)
  })
})

describe('PUT /projects/:id — ownership', () => {
  it('dono pode editar seu projeto', async () => {
    const { token } = await createUser('dono@test.com')
    const created = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Original' })

    const res = await request(app)
      .put(`/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Atualizado' })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Atualizado')
  })

  it('outro usuário não pode editar projeto alheio (403)', async () => {
    const { token: tokenDono } = await createUser('dono2@test.com')
    const { token: tokenOutro } = await createUser('outro@test.com')

    const created = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ title: 'Projeto do Dono' })

    const res = await request(app)
      .put(`/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${tokenOutro}`)
      .send({ title: 'Tentativa de hack' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /projects/:id — soft delete', () => {
  it('dono pode deletar (soft delete)', async () => {
    const { token } = await createUser('deleter@test.com')
    const created = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Para deletar' })

    const res = await request(app)
      .delete(`/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)

    // Não aparece mais na listagem
    const get = await request(app).get(`/projects/${created.body.id}`)
    expect(get.status).toBe(404)
  })

  it('não autenticado retorna 401', async () => {
    const { token } = await createUser('del2@test.com')
    const created = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Projeto X' })

    const res = await request(app).delete(`/projects/${created.body.id}`)
    expect(res.status).toBe(401)
  })
})
