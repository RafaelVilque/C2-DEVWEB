import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema.js'

export const tasksRouter = Router({ mergeParams: true })

// GET /projects/:projectId/tasks
tasksRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params

  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } })
  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado.' })
    return
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  res.json(tasks)
})

// GET /projects/:projectId/tasks/:id
tasksRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, projectId: req.params.projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, title: true, ownerId: true } },
    },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada.' })
    return
  }

  res.json(task)
})

// POST /projects/:projectId/tasks — autenticado
tasksRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params

  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } })
  if (!project) {
    res.status(404).json({ error: 'Projeto não encontrado.' })
    return
  }

  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Dados inválidos.', details: parsed.error.flatten() })
    return
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      projectId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  })

  res.status(201).json(task)
})

// PATCH /projects/:projectId/tasks/:id — somente dono do projeto ou ADMIN
tasksRouter.patch('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, projectId: req.params.projectId },
    include: { project: true },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada.' })
    return
  }

  const isOwner = task.project.ownerId === req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Acesso negado: apenas o dono do projeto pode editar tarefas.' })
    return
  }

  const parsed = updateTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(422).json({ error: 'Dados inválidos.', details: parsed.error.flatten() })
    return
  }

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  })

  res.json(updated)
})

// DELETE /projects/:projectId/tasks/:id — somente dono do projeto ou ADMIN
tasksRouter.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, projectId: req.params.projectId },
    include: { project: true },
  })

  if (!task) {
    res.status(404).json({ error: 'Tarefa não encontrada.' })
    return
  }

  const isOwner = task.project.ownerId === req.user!.sub
  const isAdmin = req.user!.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    res.status(403).json({ error: 'Acesso negado: apenas o dono do projeto pode deletar tarefas.' })
    return
  }

  await prisma.task.delete({ where: { id: req.params.id } })
  res.status(204).send()
})
