import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import { and, asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { lectureMessages, lectures, studySets } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/session"

export const maxDuration = 60

/** Keep the grounding context well inside the model's context window. */
const MAX_CONTEXT_CHARS = 45_000
/** Only the tail of the thread is replayed to the model. */
const MAX_HISTORY_MESSAGES = 20

export const CHAT_MODEL = "openai/gpt-5-mini"

function textOf(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("\n")
    .trim()
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const lectureId = Number(id)
  if (!Number.isInteger(lectureId)) {
    return Response.json({ error: "Invalid lecture id" }, { status: 400 })
  }

  const [lecture] = await db
    .select()
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.userId, user.id)))
    .limit(1)
  if (!lecture) {
    return Response.json({ error: "Lecture not found" }, { status: 404 })
  }

  const { messages }: { messages: UIMessage[] } = await req.json()
  const incoming = messages.at(-1)
  const question = incoming ? textOf(incoming) : ""

  if (incoming?.role !== "user" || !question) {
    return Response.json({ error: "No question provided" }, { status: 400 })
  }
  if (question.length > 2_000) {
    return Response.json({ error: "That question is too long." }, { status: 400 })
  }

  const [studySet] = await db
    .select({ summary: studySets.summary })
    .from(studySets)
    .where(and(eq(studySets.lectureId, lectureId), eq(studySets.userId, user.id)))
    .limit(1)

  // Replay the stored thread rather than trusting client-supplied history.
  const stored = await db
    .select({ role: lectureMessages.role, content: lectureMessages.content })
    .from(lectureMessages)
    .where(
      and(
        eq(lectureMessages.lectureId, lectureId),
        eq(lectureMessages.userId, user.id),
      ),
    )
    .orderBy(asc(lectureMessages.createdAt))

  const history: UIMessage[] = stored
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message, index) => ({
      id: `stored-${index}`,
      role: message.role,
      parts: [{ type: "text", text: message.content }],
    }))

  const lectureText = (lecture.extractedText ?? "").slice(0, MAX_CONTEXT_CHARS)

  const result = streamText({
    model: CHAT_MODEL,
    system: [
      "You are a study tutor answering questions about one specific university lecture.",
      "Answer only from the lecture material provided below. Never invent facts, figures, or citations.",
      "If the answer is not in the lecture, say so plainly and then offer the closest related point that is covered.",
      "Be concise: 1-3 short paragraphs, or a short bulleted list when comparing things.",
      "Use plain text. Do not use markdown headings or bold.",
      "",
      `Lecture title: ${lecture.title}`,
      lecture.courseName ? `Course: ${lecture.courseName}` : "",
      studySet?.summary ? `\nLecture summary:\n${studySet.summary}` : "",
      `\nLecture text:\n${lectureText}`,
    ]
      .filter(Boolean)
      .join("\n"),
    messages: await convertToModelMessages([
      ...history,
      { id: "current", role: "user", parts: [{ type: "text", text: question }] },
    ]),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onEnd: async ({ messages: finished }) => {
        const answer = finished
          .filter((message) => message.role === "assistant")
          .map(textOf)
          .join("\n")
          .trim()
        // Store the exchange only once an answer exists, so a failed
        // generation does not leave an orphaned question in the thread.
        if (!answer) return
        await db.insert(lectureMessages).values([
          { lectureId, userId: user.id, role: "user", content: question },
          { lectureId, userId: user.id, role: "assistant", content: answer },
        ])
      },
    }),
  })
}
