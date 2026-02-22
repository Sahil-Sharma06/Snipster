import { z } from "zod"

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  excerpt: z
    .string()
    .max(500, "Excerpt cannot exceed 500 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  content: z.string().min(1, "Content is required"),
  coverImage: z
    .string()
    .url("Cover image must be a valid URL")
    .optional()
    .or(z.literal("")),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tags cannot be empty")
        .max(30, "Each tag must be 30 characters or less")
        .trim()
        .toLowerCase()
    )
    .max(10, "You can add up to 10 tags")
    .default([]),
  published: z.boolean().default(false),
})

export const updateBlogSchema = createBlogSchema.partial().extend({
  published: z.boolean().optional(),
})

export type CreateBlogInput = z.infer<typeof createBlogSchema>
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>
