import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema.js'

export const projectsRouter = Router()

// GET /projects
projectsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const search = req.query.search as string | undefined

  const where = {
    deletedAt: null,
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ])

  res.json({ data: projects, meta: { page, limit, total, pages: Math.ceil(total / limit) } })
})

// GET /projects/:id
projectsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      tasks: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado.' })
    return
  }

  res.json(project)
})

// POST /projects
projectsRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const parsed = createProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Dados inválidos.', details: parsed.error.flatten() })
    return
  }

  const project = await prisma.project.create({
    data: { ...parsed.data, ownerId: req.user!.sub },
    include: { owner: { select: { id: true, name: true, email: true } } },
  })

  res.status(201).json(project)
})

// PUT /projects/:id
projectsRouter.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado.' })
    return
  }

  const isOwner = project.ownerId === req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Acesso negado: você não é o dono deste projeto.' })
    return
  }

  const parsed = updateProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Dados inválidos.', details: parsed.error.flatten() })
    return
  }

  const updated = await prisma.project.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { owner: { select: { id: true, name: true, email: true } } },
  })

  res.json(updated)
})

// DELETE /projects/:id (soft delete)
projectsRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.id, deletedAt: null },
  })

  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado.' })
    return
  }

  const isOwner = project.ownerId === req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Acesso negado: você não é o dono deste projeto.' })
    return
  }

  await prisma.project.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  })

  res.status(204).send()
})
