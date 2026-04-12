"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { z } from "zod"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/shared/image-upload"
import { Globe, Github, AtSign, Loader2 } from "lucide-react"

const editProfileSchema = z.object({
  image: z.string().url("Invalid image URL").or(z.literal("")).optional(),
  name: z.string().min(1, "Name is required").max(60),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, underscores and hyphens"
    ),
  bio: z.string().max(250, "Bio must be 250 characters or less").optional(),
  websiteUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  githubUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
  twitterUrl: z.string().url("Invalid URL").or(z.literal("")).optional(),
})

type EditProfileInput = z.infer<typeof editProfileSchema>

interface EditProfileFormProps {
  user: {
    id: string
    image: string | null
    name: string | null
    username: string | null
    bio: string | null
    websiteUrl: string | null
    githubUrl: string | null
    twitterUrl: string | null
  }
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter()

  const form = useForm<EditProfileInput>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      image: user.image || "",
      name: user.name || "",
      username: user.username || "",
      bio: user.bio || "",
      websiteUrl: user.websiteUrl || "",
      githubUrl: user.githubUrl || "",
      twitterUrl: user.twitterUrl || "",
    },
  })

  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting, isDirty },
  } = form

  const bioLength = useMemo(() => (watch("bio") || "").length, [watch("bio")])

  async function onSubmit(data: EditProfileInput) {
    if (!isDirty) {
      toast.info("No changes to save")
      return
    }

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to update profile",
        }))
        toast.error(errorData.error || "Something went wrong")
        return
      }

      toast.success("Profile updated successfully!")
      router.push("/profile")
      router.refresh()
    } catch {
      toast.error("Failed to update profile. Please try again.")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-surface-container rounded-xl p-5 flex flex-col items-center justify-center gap-4 border border-outline-variant/10">
            <FormField
              control={control}
              name="image"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <ImageUpload value={field.value || ""} onChange={field.onChange} disabled={isSubmitting} iconOnlyRemove />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="md:col-span-2 bg-surface-container rounded-xl p-6 border border-outline-variant/10 flex flex-col justify-center">
            <h3 className="text-xl font-bold font-headline text-white mb-2">Profile Identity</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4">
              Your avatar appears with snippets, blogs, and comments. Use a clear square image for best results.
            </p>
            <p className="text-xs text-on-surface-variant/70">PNG, JPG, GIF or WEBP. Max size 4 MB.</p>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline text-white border-b border-white/5 pb-4">Personal Information</h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Display Name</FormLabel>
                    <FormControl>
                      <Input className="h-12 bg-surface-container-lowest border-none rounded-lg focus-visible:ring-primary/40" placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono">@</span>
                        <Input className="h-12 bg-surface-container-lowest border-none rounded-lg pl-10 font-mono focus-visible:ring-primary/40" placeholder="your_username" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a short description about yourself..."
                      className="resize-none min-h-28 bg-surface-container-lowest border-none rounded-lg focus-visible:ring-primary/40"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <p className="text-xs text-on-surface-variant/50">{bioLength} / 250 characters</p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-headline text-white border-b border-white/5 pb-4">Social Connections</h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <FormField
                control={control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </FormLabel>
                    <FormControl>
                      <Input className="h-11 bg-surface-container-lowest border-none rounded-lg text-sm focus-visible:ring-primary/40" placeholder="https://yoursite.com" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                      <Github className="h-3.5 w-3.5" /> GitHub
                    </FormLabel>
                    <FormControl>
                      <Input className="h-11 bg-surface-container-lowest border-none rounded-lg text-sm focus-visible:ring-primary/40" placeholder="https://github.com/you" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="twitterUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                      <AtSign className="h-3.5 w-3.5" /> Twitter / X
                    </FormLabel>
                    <FormControl>
                      <Input className="h-11 bg-surface-container-lowest border-none rounded-lg text-sm focus-visible:ring-primary/40" placeholder="https://x.com/you" type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </section>

        <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
          <div className="text-xs text-on-surface-variant/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">info</span>
            All changes are permanent once saved.
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/profile")}
              className="text-on-surface-variant hover:text-white uppercase tracking-widest text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="beam-button rounded-lg px-6 h-11 text-white! hover:text-white! focus-visible:text-white! disabled:text-white/80 disabled:opacity-100 uppercase tracking-widest text-xs font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="relative z-1 text-white">Saving</span>
                </>
              ) : (
                <span className="relative z-1 text-white">Save Changes</span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
