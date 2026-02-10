import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";


export const createSnippetSchema = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Title is required" : "Title must be text",
    })
    .min(3, {
      message: "Title must be at least 3 characters long",
    })
    .max(100, {
      message: "Title cannot exceed 100 characters",
    })
    .trim(), 
  description: z
    .string()
    .max(500, {
      message: "Description cannot exceed 500 characters",
    })
    .trim()
    .optional() 
    .or(z.literal("")), 
  code: z
    .string({
      error: () => "Code is required."
    })
    .min(1, {
      message: "Code cannot be empty",
    })
    .max(50000, {
      message: "Code is too large (max 50,000 characters)",
    }),

  language: z.enum(SUPPORTED_LANGUAGES, {
    error: (issue)=>{
        issue.input === undefined ? "Please select a language." : "Invalid Language Selected"
    }
  }),

  tags: z
    .array(
      z
        .string()
        .min(1, "Tags cannot be empty")
        .max(20, "Each tag must be 20 characters or less")
        .trim()
        .toLowerCase() 
    )
    .max(10, {
      message: "Maximum 10 tags allowed",
    })
    .default([]), 
  isPublic: z.boolean().default(true), 
});


export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
