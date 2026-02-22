"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleRemove = () => {
    onChange("")
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.")
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be smaller than 4 MB.")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? "Upload failed")
      }

      const { url } = await res.json()
      onChange(url)
      toast.success("Image uploaded successfully!")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed"
      toast.error(message)
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  if (value) {
    return (
      <div className="relative w-full h-64 rounded-lg overflow-hidden border">
        <img
          src={value}
          alt="Cover image"
          className="w-full h-full object-cover"
        />
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 hover:bg-muted/20 transition-colors text-muted-foreground text-sm gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-6 w-6" />
            <span>Click to upload image</span>
            <span className="text-xs">PNG, JPG, GIF, WEBP up to 4 MB</span>
          </>
        )}
      </button>
    </>
  )
}
