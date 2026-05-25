import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'

export const usersRouter = Router()

// GET /users — somente ADMIN
usersRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (_req: Request, res: Response): Promise<void> => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  }
)

// GET /users/:id — somente ADMIN
usersRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' })
      return
    }

    res.json(user)
  }
)

// DELETE /users/:id — somente ADMIN
usersRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' })
      return
    }

    await prisma.user.delete({ where: { id: req.params.id } })
    res.status(204).send()
  }
)
