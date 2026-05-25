import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()

describe('POST /auth/register', () => {
  it('deve registrar novo usuário com sucesso', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Maria Teste',
      email: 'maria@teste.com',
      password: 'senha123',
    })

    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('maria@teste.com')
    expect(res.body.token).toBeDefined()
    expect(res.body.user.password).toBeUndefined() // senha nunca exposta
  })

  it('deve rejeitar email duplicado', async () => {
    await request(app).post('/auth/register').send({
      name: 'Usuário A',
      email: 'dup@teste.com',
      password: 'senha123',
    })

    const res = await request(app).post('/auth/register').send({
      name: 'Usuário B',
      email: 'dup@teste.com',
      password: 'outrasenha',
    })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/E-mail já cadastrado/)
  })

  it('deve rejeitar senha muito curta (422)', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Teste',
      email: 'a@b.com',
      password: '123',
    })
    expect(res.status).toBe(422)
  })
})

describe('POST /auth/login', () => {
  it('deve fazer login e retornar token válido', async () => {
    await request(app).post('/auth/register').send({
      name: 'Login Teste',
      email: 'login@teste.com',
      password: 'senha123',
    })

    const res = await request(app).post('/auth/login').send({
      email: 'login@teste.com',
      password: 'senha123',
    })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('login@teste.com')
  })

  it('deve rejeitar credencial inválida', async () => {
    await request(app).post('/auth/register').send({
      name: 'Teste Falha',
      email: 'falha@teste.com',
      password: 'correta',
    })

    const res = await request(app).post('/auth/login').send({
      email: 'falha@teste.com',
      password: 'errada',
    })

    expect(res.status).toBe(401)
  })

  it('deve rejeitar email inexistente', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'naoexiste@teste.com',
      password: 'qualquer',
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('deve retornar dados do usuário autenticado', async () => {
    const reg = await request(app).post('/auth/register').send({
      name: 'Me Teste',
      email: 'me@teste.com',
      password: 'senha123',
    })

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('me@teste.com')
    expect(res.body.password).toBeUndefined()
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /auth/me', () => {
  it('deve atualizar o nome do usuário', async () => {
    const reg = await request(app).post('/auth/register').send({
      name: 'Nome Original',
      email: 'patch@teste.com',
      password: 'senha123',
    })

    const res = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({ name: 'Nome Atualizado' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Nome Atualizado')
    expect(res.body.password).toBeUndefined()
  })

  it('deve retornar 422 sem nenhum campo', async () => {
    const reg = await request(app).post('/auth/register').send({
      name: 'Teste Vazio',
      email: 'patchvazio@teste.com',
      password: 'senha123',
    })

    const res = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`)
      .send({})

    expect(res.status).toBe(422)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).patch('/auth/me').send({ name: 'Sem Token' })
    expect(res.status).toBe(401)
  })
})
