import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../src/lib/auth.js'

describe('hashPassword', () => {
  it('deve retornar hash diferente da senha original', async () => {
    const plain = 'senha123'
    const hash = await hashPassword(plain)
    expect(hash).not.toBe(plain)
  })

  it('deve gerar hashes diferentes para a mesma senha (salt)', async () => {
    const hash1 = await hashPassword('senha123')
    const hash2 = await hashPassword('senha123')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('deve retornar true para senha correta', async () => {
    const plain = 'minhasenha'
    const hash = await hashPassword(plain)
    const result = await verifyPassword(plain, hash)
    expect(result).toBe(true)
  })

  it('deve retornar false para senha incorreta', async () => {
    const hash = await hashPassword('correta')
    const result = await verifyPassword('errada', hash)
    expect(result).toBe(false)
  })
})

describe('signToken / verifyToken', () => {
  const payload = { sub: 'user-id-123', email: 'test@test.com', role: 'USER' }

  it('deve assinar e decodificar o payload corretamente', () => {
    const token = signToken(payload)
    const decoded = verifyToken(token)
    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('deve lançar erro para token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow()
  })

  it('deve lançar erro para token adulterado', () => {
    const token = signToken(payload)
    const tampered = token.slice(0, -5) + 'XXXXX'
    expect(() => verifyToken(tampered)).toThrow()
  })
})
