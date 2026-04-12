"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react"; 
import {
  createSnippetSchema,
  type CreateSnippetInput,
} from "@/lib/validations/snippet";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/languages";
import { toast } from "sonner";
import {
  Form,
  FormControl,
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
import { Loader2, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function CreateSnippetForm() {
  // ==========================================================================
  // ROUTER - For navigation after successful submission
  // ==========================================================================
  const router = useRouter();

  // ==========================================================================
  // LOCAL STATE - Track tags being added in real-time
  // ==========================================================================
  // React Hook Form handles the form fields, but we need separate state
  // for the tag input box BEFORE a tag is added to the array
  const [tagInput, setTagInput] = useState<string>("");

  // ==========================================================================
  // REACT HOOK FORM SETUP
  // ==========================================================================
  /*
    useForm() is the magic hook that:
    - Tracks all form field values
    - Manages validation errors
    - Handles form submission
    - Tracks dirty/touched state
    - And much more!
    
    WITHOUT React Hook Form:
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("");
    const [tags, setTags] = useState([]);
    const [isPublic, setIsPublic] = useState(true);
    ... (plus validation logic, error state, etc.)
    
    WITH React Hook Form:
    const form = useForm({ ... });
    ✨ All state and validation handled automatically!
  */

  const form = useForm({
    resolver: zodResolver(createSnippetSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      language: "javascript", 
      tags: [],
      isPublic: true, 
    },
    mode: "onChange",
  });

  const {
    handleSubmit, 
    control, 
    formState: { isSubmitting, errors }, 
    setValue, 
    watch, 
  } = form;

  const currentTags: string[] = watch("tags") ?? [];
  const codePreview = watch("code") ?? "";
  const totalLines = Math.max(13, codePreview.split("\n").length);


  async function onSubmit(data: CreateSnippetInput) {

    try {
      const response = await fetch("/api/snippets", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to create snippet",
        }));
        toast.error(errorData.error || "Something went wrong");
        return; 
      }

      const snippet = await response.json();

      toast.success("Snippet created successfully! 🎉");
      router.push(`/snippets/${snippet.id}`);

      router.refresh();
    } catch (error) {
      console.error("Error creating snippet:", error);

      toast.error("Failed to create snippet. Please try again.");
    }
  }


  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();

    // Validation checks:
    if (!trimmedTag) return; // Ignore empty tags
    if (currentTags.length >= 10) {
      // Max 10 tags (defined in Zod schema)
      toast.error("Maximum 10 tags allowed");
      return;
    }
    if (currentTags.includes(trimmedTag)) {
      // No duplicates
      toast.error("Tag already added");
      return;
    }

    // Add tag to the array using setValue
    // [...currentTags, trimmedTag] creates new array with all old tags + new tag
    setValue("tags", [...currentTags, trimmedTag], {
      shouldValidate: true, // Re-run validation after updating
    });

    // Clear the input box for next tag
    setTagInput("");
  };

  // Remove a tag from the array
  const handleRemoveTag = (tagToRemove: string) => {
    // Filter creates new array without the removed tag
    // Keep all tags that don't match tagToRemove
    setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true }
    );
  };

  // Handle Enter key in tag input box
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Stop form from submitting
      handleAddTag();
    }
  };

  // ==========================================================================
  // RENDER THE FORM UI
  // ==========================================================================
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-body">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/my-snippets" className="text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors">
            Back to Collection
          </Link>
        </div>

        <header className="mb-6">
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight text-white mb-2">Create New Snippet</h1>
          <p className="text-on-surface-variant max-w-xl text-sm md:text-base">
            Forge a new block of logic. Precise, reusable, and accessible across your stack.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-surface-container-low p-8 rounded-xl border-t border-surface-bright/20">
              <div className="space-y-6">
                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-primary font-bold">Snippet Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Optimized Throttle Hook"
                          {...field}
                          disabled={isSubmitting}
                          className="h-12 bg-surface-container-lowest border-none rounded-lg text-lg placeholder:text-on-surface-variant/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest text-primary font-bold">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe the purpose of this architecture..."
                          rows={3}
                          {...field}
                          disabled={isSubmitting}
                          className="bg-surface-container-lowest border-none rounded-lg text-sm placeholder:text-on-surface-variant/30 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl">
              <div className="flex justify-between items-center px-6 py-4 bg-surface-container-high/50 border-b border-outline-variant/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error/40" />
                  <span className="w-3 h-3 rounded-full bg-tertiary/40" />
                  <span className="w-3 h-3 rounded-full bg-primary/40" />
                  <span className="ml-4 text-[10px] uppercase tracking-widest font-mono text-on-surface-variant/60">editor.v2</span>
                </div>
              </div>

              <div className="flex min-h-125">
                <div className="w-12 bg-surface-container-lowest flex flex-col items-center pt-6 text-[11px] font-mono text-on-surface-variant/20 select-none border-r border-outline-variant/5">
                  {Array.from({ length: totalLines }).map((_, idx) => (
                    <span key={idx}>{idx + 1}</span>
                  ))}
                </div>

                <FormField
                  control={control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="// Paste your high-level logic here..."
                          {...field}
                          disabled={isSubmitting}
                          className="h-full min-h-125 w-full border-none bg-transparent focus-visible:ring-0 rounded-none font-mono text-sm leading-relaxed text-[#ffb783] resize-none placeholder:text-surface-container-highest"
                          spellCheck={false}
                        />
                      </FormControl>
                      <FormMessage className="px-6 pb-4" />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <section className="bg-surface-container p-8 rounded-xl border border-outline-variant/10">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white mb-8">System Configuration</h3>
              <div className="space-y-8">
                <FormField
                  control={control}
                  name="language"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-[10px] uppercase tracking-widest text-primary font-bold">Language</FormLabel>
                        <span className="text-[10px] text-on-surface-variant font-mono">DETECTED: {field.value.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-surface-container-lowest border-none rounded-lg text-on-surface">
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] uppercase tracking-widest text-primary font-bold">Privacy Level</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setValue("isPublic", true, { shouldValidate: true })}
                            disabled={isSubmitting}
                            className={`py-4 rounded-lg flex flex-col items-center gap-2 transition-all border-2 ${field.value ? "bg-[#201f1f] border-primary text-white" : "bg-surface-container-lowest border-transparent text-on-surface-variant"}`}
                          >
                            <span className="material-symbols-outlined text-xl">public</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">Public</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue("isPublic", false, { shouldValidate: true })}
                            disabled={isSubmitting}
                            className={`py-4 rounded-lg flex flex-col items-center gap-2 transition-all border-2 ${!field.value ? "bg-[#201f1f] border-primary text-white" : "bg-surface-container-lowest border-transparent text-on-surface-variant"}`}
                          >
                            <span className="material-symbols-outlined text-xl">lock</span>
                            <span className="text-[10px] font-bold tracking-widest uppercase">Private</span>
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="tags"
                  render={() => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] uppercase tracking-widest text-primary font-bold">Classification Tags</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add tag"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={handleTagKeyDown}
                              disabled={isSubmitting}
                              className="h-10 bg-surface-container-lowest border-none rounded-lg text-sm"
                            />
                            <Button type="button" onClick={handleAddTag} disabled={isSubmitting} variant="outline" className="h-10 border-outline-variant/30">
                              Add
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {currentTags.length === 0 ? (
                              <span className="text-[10px] text-on-surface-variant">No tags yet</span>
                            ) : (
                              currentTags.map((tag) => (
                                <Badge key={tag} className="px-2 py-1 bg-surface-container-lowest text-primary text-[10px] font-mono border border-primary/20 rounded">
                                  #{tag}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTag(tag)}
                                    disabled={isSubmitting}
                                    className="ml-1 opacity-70 hover:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <div className="space-y-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 beam-button text-white! hover:text-white! focus-visible:text-white! disabled:text-white/80 disabled:opacity-100 font-black text-sm tracking-[0.2em] uppercase rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="relative z-1 text-white">Creating</span>
                  </>
                ) : (
                  <span className="relative z-1 text-white">Create Snippet</span>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast.info("Draft saved locally")}
                  className="h-11 border-outline-variant/30 text-on-surface-variant font-bold text-[10px] tracking-widest uppercase hover:bg-surface-bright/10"
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/my-snippets")}
                  className="h-11 text-error/70 hover:text-error font-bold text-[10px] tracking-widest uppercase"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

