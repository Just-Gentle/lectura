"use server"

import { del, put } from "@vercel/blob"
import { and, asc, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { generateStudySet, STUDY_MODEL } from "@/lib/ai/generate-study-set"
import { db } from "@/lib/db"
import { lectureMessages, lectures, quizAttempts, studySets } from "@/lib/db/schema"
import { extractPdfText } from "@/lib/pdf"
import { getUserId } from "@/lib/session"

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB
const MIN_WORDS = 120

export type ActionResult = { ok: true; lectureId: number } | { ok: false; error: string }

export async function listLectures() {
  const userId = await getUserId()
  return db
    .select()
    .from(lectures)
    .where(eq(lectures.userId, userId))
    .orderBy(desc(lectures.createdAt))
}

export async function getLecture(id: number) {
  const userId = await getUserId()
  const [lecture] = await db
    .select()
    .from(lectures)
    .where(and(eq(lectures.id, id), eq(lectures.userId, userId)))
    .limit(1)
  return lecture ?? null
}

export async function getStudySet(lectureId: number) {
  const userId = await getUserId()
  const [set] = await db
    .select()
    .from(studySets)
    .where(and(eq(studySets.lectureId, lectureId), eq(studySets.userId, userId)))
    .orderBy(desc(studySets.createdAt))
    .limit(1)
  return set ?? null
}

export async function listQuizAttempts(lectureId: number) {
  const userId = await getUserId()
  return db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.lectureId, lectureId), eq(quizAttempts.userId, userId)))
    .orderBy(desc(quizAttempts.createdAt))
}

export async function listLectureMessages(lectureId: number) {
  const userId = await getUserId()
  return db
    .select()
    .from(lectureMessages)
    .where(
      and(eq(lectureMessages.lectureId, lectureId), eq(lectureMessages.userId, userId)),
    )
    .orderBy(asc(lectureMessages.createdAt))
}

export async function clearLectureMessages(lectureId: number) {
  const userId = await getUserId()
  await db
    .delete(lectureMessages)
    .where(
      and(eq(lectureMessages.lectureId, lectureId), eq(lectureMessages.userId, userId)),
    )
  revalidatePath(`/lectures/${lectureId}`)
}

export async function uploadLecture(formData: FormData): Promise<ActionResult> {
  const userId = await getUserId()

  const file = formData.get("file")
  const rawTitle = String(formData.get("title") ?? "").trim()
  const rawCourse = String(formData.get("courseName") ?? "").trim()

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a PDF file to upload." }
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, error: "Only PDF files are supported." }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: "That file is larger than 20 MB." }
  }

  const title = rawTitle || file.name.replace(/\.pdf$/i, "")

  let extracted
  try {
    extracted = await extractPdfText(await file.arrayBuffer())
  } catch {
    return {
      ok: false,
      error: "That PDF could not be read. It may be corrupted or password protected.",
    }
  }

  if (extracted.wordCount < MIN_WORDS) {
    return {
      ok: false,
      error:
        "Only a little text could be read from that PDF. Scanned or image-only slides are not supported yet.",
    }
  }

  // The Blob store is private: the returned URL is not publicly fetchable, so we
  // persist the pathname and stream the PDF back through an authenticated route.
  const blob = await put(`lectures/${userId}/${file.name}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: "application/pdf",
  })

  const [lecture] = await db
    .insert(lectures)
    .values({
      userId,
      title,
      courseName: rawCourse || null,
      fileName: file.name,
      filePath: blob.pathname,
      fileSize: file.size,
      pageCount: extracted.pageCount,
      wordCount: extracted.wordCount,
      extractedText: extracted.text,
      status: "pending",
    })
    .returning({ id: lectures.id })

  revalidatePath("/dashboard")
  return { ok: true, lectureId: lecture.id }
}

export async function generateStudySetForLecture(
  lectureId: number,
): Promise<{ ok: boolean; error?: string }> {
  const userId = await getUserId()

  const [lecture] = await db
    .select()
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))
    .limit(1)

  if (!lecture) return { ok: false, error: "Lecture not found." }
  if (!lecture.extractedText) {
    return { ok: false, error: "This lecture has no readable text." }
  }

  await db
    .update(lectures)
    .set({ status: "processing", errorMessage: null, updatedAt: new Date() })
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))
  revalidatePath(`/lectures/${lectureId}`)

  try {
    const generated = await generateStudySet({
      title: lecture.title,
      courseName: lecture.courseName,
      text: lecture.extractedText,
    })

    await db
      .delete(studySets)
      .where(and(eq(studySets.lectureId, lectureId), eq(studySets.userId, userId)))

    await db.insert(studySets).values({
      lectureId,
      userId,
      summary: generated.summary,
      keyConcepts: generated.keyConcepts,
      questions: generated.questions,
      flashcards: generated.flashcards,
      studyNotes: generated.studyNotes,
      analysis: generated.analysis,
      model: STUDY_MODEL,
    })

    await db
      .update(lectures)
      .set({ status: "ready", errorMessage: null, updatedAt: new Date() })
      .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Study set generation failed."
    console.log("[v0] generateStudySetForLecture failed:", message)

    await db
      .update(lectures)
      .set({ status: "failed", errorMessage: message, updatedAt: new Date() })
      .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))

    revalidatePath(`/lectures/${lectureId}`)
    revalidatePath("/dashboard")
    return { ok: false, error: message }
  }

  revalidatePath(`/lectures/${lectureId}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function saveQuizAttempt({
  lectureId,
  score,
  total,
  answers,
}: {
  lectureId: number
  score: number
  total: number
  answers: Record<string, string>
}) {
  const userId = await getUserId()

  // Confirm the lecture belongs to this user before recording anything.
  const [lecture] = await db
    .select({ id: lectures.id })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))
    .limit(1)
  if (!lecture) throw new Error("Lecture not found")

  await db.insert(quizAttempts).values({ lectureId, userId, score, total, answers })
  revalidatePath(`/lectures/${lectureId}`)
  revalidatePath("/progress")
}

export async function deleteLecture(lectureId: number) {
  const userId = await getUserId()

  const [lecture] = await db
    .select({ filePath: lectures.filePath })
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))
    .limit(1)
  if (!lecture) return

  await db
    .delete(studySets)
    .where(and(eq(studySets.lectureId, lectureId), eq(studySets.userId, userId)))
  await db
    .delete(quizAttempts)
    .where(and(eq(quizAttempts.lectureId, lectureId), eq(quizAttempts.userId, userId)))
  await db
    .delete(lectureMessages)
    .where(
      and(eq(lectureMessages.lectureId, lectureId), eq(lectureMessages.userId, userId)),
    )
  await db
    .delete(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, userId)))

  try {
    await del(lecture.filePath)
  } catch (error) {
    console.log("[v0] blob delete failed:", error)
  }

  revalidatePath("/dashboard")
  revalidatePath("/progress")
}
