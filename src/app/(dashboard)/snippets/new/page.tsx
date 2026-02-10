import { CreateSnippetForm } from "@/components/forms/create-snippet-form"

export default function NewSnippetPage() {
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Snippet</h1>
        <p className="text-muted-foreground">
          Save your code snippets for later reference and share them with the community
        </p>
      </div>
      
      <CreateSnippetForm />
    </div>
  )
}
