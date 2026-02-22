import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await prisma.snippet.update({
      where: { id },
      data: { views: { increment: 1 } },
    })
    return NextResponse.json({ ok: true })
  } catch {
    // Silently fail — views are non-critical
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
