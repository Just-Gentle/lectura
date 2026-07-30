import { get } from "@vercel/blob"
import { and, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { lectures } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/session"

// The Blob store is private, so the original PDF is streamed through this route
// after confirming the signed-in user owns the lecture.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const lectureId = Number(id)
  if (!Number.isInteger(lectureId)) {
    return NextResponse.json({ error: "Invalid lecture id" }, { status: 400 })
  }

  const [lecture] = await db
    .select({ filePath: lectures.filePath, fileName: lectures.fileName })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, user.id)))
    .limit(1)

  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 })
  }

  try {
    const result = await get(lecture.filePath, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      })
    }

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(lecture.fileName)}"`,
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (error) {
    console.log("[v0] lecture file stream failed:", error)
    return NextResponse.json({ error: "Could not load file" }, { status: 500 })
  }
}
