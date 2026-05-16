import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '../../src/schemas/auth.schema.js'
import { createProjectSchema } from '../../src/schemas/project.schema.js'
import { createTaskSchema } from '../../src/schemas/task.schema.js'

describe('registerSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar email inválido', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'nao-e-email',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar senha muito curta', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@email.com',
      password: '123',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar nome muito curto', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'joao@email.com',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('deve aceitar credenciais válidas', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar sem email', () => {
    const result = loginSchema.safeParse({ password: '123456' })
    expect(result.success).toBe(false)
  })
})

describe('createProjectSchema', () => {
  it('deve aceitar projeto válido', () => {
    const result = createProjectSchema.safeParse({ title: 'Meu Projeto' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar título vazio', () => {
    const result = createProjectSchema.safeParse({ title: '' })
    expect(result.success).toBe(false)
  })
})

describe('createTaskSchema', () => {
  it('deve aceitar tarefa válida com prioridade', () => {
    const result = createTaskSchema.safeParse({ title: 'Tarefa A', priority: 'HIGH' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar status inválido', () => {
    const result = createTaskSchema.safeParse({ title: 'Tarefa', status: 'FEITA' })
    expect(result.success).toBe(false)
  })
})
