import { z } from 'zod'

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Título obrigatório.').max(120),
  description: z.string().max(500).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
