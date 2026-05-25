import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { projectsRouter } from './routes/projects.js'
import { tasksRouter } from './routes/tasks.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Serve o frontend estático
  app.use(express.static(path.join(__dirname, '..', 'public')))

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Rotas da API
  app.use('/auth', authRouter)
  app.use('/users', usersRouter)
  app.use('/projects', projectsRouter)
  app.use('/projects/:projectId/tasks', tasksRouter)

  // 404 para rotas de API não encontradas
  app.use('/auth', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))
  app.use('/users', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))
  app.use('/projects', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))

  // Fallback SPA: retorna index.html para rotas não-API
  app.use((_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
  })

  // Error handler global
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Erro interno do servidor.' })
  })

  return app
}
