import { CreateCollectionForm } from "@/components/forms/create-collection-form"

export default function NewCollectionPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Collection</h1>
        <p className="text-sm text-muted-foreground">
          Create a collection to organize your snippets
        </p>
      </div>
      <CreateCollectionForm />
    </div>
  )
}
