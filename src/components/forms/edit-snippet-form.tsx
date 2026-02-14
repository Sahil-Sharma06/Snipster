"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSnippetSchema,
  type CreateSnippetInput,
} from "@/lib/validations/snippet";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/constants/languages";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

interface EditSnippetFormProps {
  snippet: {
    id: string;
    title: string;
    description: string | null;
    code: string;
    language: string;
    tags: string[];
    isPublic: boolean;
  };
}

export function EditSnippetForm({ snippet }: EditSnippetFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: {
      title: snippet.title,
      description: snippet.description || "",
      code: snippet.code,
      language: snippet.language as SupportedLanguage,
      tags: snippet.tags,
      isPublic: snippet.isPublic,
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    setValue,
    watch,
  } = form;

  const currentTags: string[] = watch("tags") ?? [];

  async function onSubmit(data: CreateSnippetInput) {
    try {
      const response = await fetch(`/api/snippets/${snippet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to update snippet",
        }));
        toast.error(errorData.error || "Something went wrong");
        return;
      }

      const updatedSnippet = await response.json();
      toast.success("Snippet updated successfully! 🎉");
      router.push(`/snippets/${updatedSnippet.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating snippet:", error);
      toast.error("Failed to update snippet. Please try again.");
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();

    if (!trimmedTag) return;
    if (currentTags.length >= 10) {
      toast.error("Maximum 10 tags allowed");
      return;
    }
    if (currentTags.includes(trimmedTag)) {
      toast.error("Tag already added");
      return;
    }

    setValue("tags", [...currentTags, trimmedTag], {
      shouldValidate: true,
    });

    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true }
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., React useEffect Hook"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Give your snippet a clear, descriptive title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What does this code do? When would you use it?"
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                Optional: Explain what this code does (max 500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste your code here..."
                  rows={12}
                  className="font-mono text-sm"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                The actual code you want to save (max 50,000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the programming language
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag (e.g., react, hooks)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      disabled={isSubmitting}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>

                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            disabled={isSubmitting}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Add up to 10 tags to categorize your snippet (press Enter to add)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  className="h-4 w-4"
                />
              </FormControl>
              <div className="space-y-0">
                <FormLabel className="font-normal">
                  Make this snippet public
                </FormLabel>
                <FormDescription>
                  Public snippets can be viewed by anyone
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Snippet"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
