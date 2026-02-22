import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    await prisma.blog.update({
      where: { slug },
      data: { views: { increment: 1 } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    // Silently fail — views are non-critical
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
