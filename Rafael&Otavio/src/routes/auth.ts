import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { authenticate } from '../middlewares/authenticate.js'

export const authRouter = Router()

// POST /auth/register
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Dados inválidos.', details: parsed.error.flatten() })
    return
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(400).json({ error: 'E-mail já cadastrado.' })
    return
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  const token = signToken({ sub: user.id, email: user.email, role: user.role })
  res.status(201).json({ user, token })
})

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Dados inválidos.', details: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas.' })
    return
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas.' })
    return
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role })
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  })
})

// GET /auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' })
    return
  }

  res.json(user)
})
