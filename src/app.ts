import express from 'express'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { projectsRouter } from './routes/projects.js'
import { tasksRouter } from './routes/tasks.js'

export function createApp() {
  const app = express()

  app.use(express.json())

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Rotas
  app.use('/auth', authRouter)
  app.use('/users', usersRouter)
  app.use('/projects', projectsRouter)
  app.use('/projects/:projectId/tasks', tasksRouter)

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' })
  })

  // Error handler global
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  })

  return app
}
