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
      {/*
        Form component from shadcn/ui provides context to all form fields.
        {...form} spreads all React Hook Form methods to child components.
        
        handleSubmit wraps onSubmit:
        - Validates form using Zod schema
        - If valid → calls onSubmit
        - If invalid → shows errors
      */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ==================================================================
            TITLE FIELD
            ================================================================== */}
        <FormField
          control={control} // Connect to React Hook Form
          name="title" // Field name (must match schema)
          render={({ field }) => (
            // field contains: value, onChange, onBlur, name, ref
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                {/*
                  {...field} spreads value, onChange, onBlur to input
                  This makes the input "controlled" by React Hook Form
                */}
                <Input
                  placeholder="e.g., React useEffect Hook"
                  {...field}
                  disabled={isSubmitting} // Disable while submitting
                />
              </FormControl>
              <FormDescription>
                Give your snippet a clear, descriptive title
              </FormDescription>
              {/*
                FormMessage automatically shows validation errors
                If Zod validation fails, error appears here
              */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ==================================================================
            DESCRIPTION FIELD (OPTIONAL)
            ================================================================== */}
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

        {/* ==================================================================
            CODE FIELD (MAIN CONTENT)
            ================================================================== */}
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
                  className="font-mono text-sm" // Monospace font for code
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

        {/* ==================================================================
            LANGUAGE FIELD (DROPDOWN)
            ================================================================== */}
        <FormField
          control={control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language *</FormLabel>
              {/*
                Select component from shadcn/ui
                This is a custom dropdown (not native <select>)
                Better UX: searchable, keyboard navigation, custom styling
              */}
              <Select
                onValueChange={field.onChange} // Update form when selection changes
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {/*
                    Map over SUPPORTED_LANGUAGES array
                    Create a dropdown item for each language
                  */}
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {/* Capitalize first letter for display */}
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

        {/* ==================================================================
            TAGS FIELD (ARRAY OF STRINGS)
            ================================================================== */}
        <FormField
          control={control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  {/* Tag Input Box */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag (e.g., react, hooks)"
                      value={tagInput} // Controlled by local state
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown} // Enter to add tag
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button" // Not submit button!
                      onClick={handleAddTag}
                      disabled={isSubmitting}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Display Current Tags as Badges */}
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          {/* Remove tag button */}
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
                Add up to 10 tags to categorize your snippet (press Enter to
                add)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ==================================================================
            IS PUBLIC FIELD (CHECKBOX)
            ================================================================== */}
        <FormField
          control={control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value} // Controlled checkbox
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

        {/* ==================================================================
            SUBMIT BUTTON
            ================================================================== */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {/*
            Show loading spinner while submitting
            Disabled state prevents double-submission
          */}
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Snippet"
          )}
        </Button>
      </form>
    </Form>
  );
}

