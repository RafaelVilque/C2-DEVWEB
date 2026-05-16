import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()

async function createUser(email: string) {
  const res = await request(app).post('/auth/register').send({
    name: 'Usuário Teste',
    email,
    password: 'senha123',
  })
  return { token: res.body.token as string, userId: res.body.user.id as string }
}

async function createProject(token: string, title = 'Projeto Teste') {
  const res = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ title })
  return res.body
}

describe('CRUD /projects/:projectId/tasks', () => {
  it('deve criar tarefa em projeto existente', async () => {
    const { token } = await createUser('task1@test.com')
    const project = await createProject(token)

    const res = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Minha tarefa', priority: 'HIGH' })

    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Minha tarefa')
    expect(res.body.priority).toBe('HIGH')
  })

  it('deve listar tarefas do projeto', async () => {
    const { token } = await createUser('task2@test.com')
    const project = await createProject(token)

    await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa 1' })

    const res = await request(app).get(`/projects/${project.id}/tasks`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBeGreaterThanOrEqual(1)
  })

  it('deve buscar tarefa por id', async () => {
    const { token } = await createUser('task3@test.com')
    const project = await createProject(token)

    const created = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa Específica' })

    const res = await request(app).get(`/projects/${project.id}/tasks/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Tarefa Específica')
  })

  it('deve atualizar tarefa (PATCH)', async () => {
    const { token } = await createUser('task4@test.com')
    const project = await createProject(token)

    const created = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa para Atualizar' })

    const res = await request(app)
      .patch(`/projects/${project.id}/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'DONE' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('DONE')
  })

  it('deve deletar tarefa', async () => {
    const { token } = await createUser('task5@test.com')
    const project = await createProject(token)

    const created = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Deletar' })

    const res = await request(app)
      .delete(`/projects/${project.id}/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(204)
  })

  it('usuário sem ser dono não pode editar tarefa (403)', async () => {
    const { token: tokenDono } = await createUser('dono-task@test.com')
    const { token: tokenOutro } = await createUser('outro-task@test.com')
    const project = await createProject(tokenDono)

    const task = await request(app)
      .post(`/projects/${project.id}/tasks`)
      .set('Authorization', `Bearer ${tokenDono}`)
      .send({ title: 'Tarefa Protegida' })

    const res = await request(app)
      .patch(`/projects/${project.id}/tasks/${task.body.id}`)
      .set('Authorization', `Bearer ${tokenOutro}`)
      .send({ title: 'Tentativa' })

    expect(res.status).toBe(403)
  })
})
