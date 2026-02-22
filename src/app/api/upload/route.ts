import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Convert the File to a base64 data URI for Cloudinary's upload API
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const dataUri = `data:${file.type};base64,${base64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "snipster",
    resource_type: "image",
  })

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id })
}
