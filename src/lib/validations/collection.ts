import { z } from "zod"

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  isPublic: z.boolean().default(true),
})

export const updateCollectionSchema = createCollectionSchema.partial()

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
