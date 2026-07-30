import { generateText, Output } from "ai"
import { z } from "zod"

export const STUDY_MODEL = "openai/gpt-5-mini"

/** Cap the amount of lecture text sent to the model. */
const MAX_CHARS = 60_000

const studySetSchema = z.object({
  summary: z
    .string()
    .describe(
      "A 3-5 paragraph plain-prose summary of the lecture. No markdown headings.",
    ),
  keyConcepts: z
    .array(
      z.object({
        term: z.string().describe("The concept, term, or formula name."),
        definition: z
          .string()
          .describe("A precise 1-3 sentence explanation in the lecture's own terms."),
      }),
    )
    .min(5)
    .max(14)
    .describe("The concepts a student must know to pass an exam on this lecture."),
  questions: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(["multiple-choice", "short-answer", "true-false"]),
        options: z
          .array(z.string())
          .describe(
            "Exactly 4 options for multiple-choice, exactly 2 ('True','False') for true-false, and an empty array for short-answer.",
          ),
        answer: z
          .string()
          .describe(
            "The correct answer. For multiple-choice and true-false this must exactly match one of the options.",
          ),
        explanation: z.string().describe("Why the answer is correct, in 1-2 sentences."),
        difficulty: z.enum(["easy", "medium", "hard"]),
      }),
    )
    .min(6)
    .max(14)
    .describe("A mixed-format exam-style quiz covering the whole lecture."),
  flashcards: z
    .array(z.object({ front: z.string(), back: z.string() }))
    .min(8)
    .max(20)
    .describe("Short recall prompts. The front is a cue, the back is the answer."),
  studyNotes: z
    .string()
    .describe(
      "Condensed revision notes in markdown, using ## headings and - bullets only.",
    ),
  analysis: z.object({
    topics: z.array(z.string()).min(2).max(8),
    difficulty: z.enum(["introductory", "intermediate", "advanced"]),
    estimatedStudyMinutes: z.number().int().min(10).max(600),
    prerequisites: z.array(z.string()).max(6),
    examFocus: z
      .array(z.string())
      .min(2)
      .max(6)
      .describe("The areas most likely to be tested."),
  }),
})

export type GeneratedStudySet = z.infer<typeof studySetSchema>

export async function generateStudySet({
  title,
  courseName,
  text,
}: {
  title: string
  courseName?: string | null
  text: string
}): Promise<GeneratedStudySet> {
  const truncated = text.length > MAX_CHARS
  const body = truncated ? text.slice(0, MAX_CHARS) : text

  const { output } = await generateText({
    model: STUDY_MODEL,
    output: Output.object({ schema: studySetSchema }),
    system: [
      "You are an experienced university teaching assistant who builds revision material from lecture handouts.",
      "Work only from the supplied lecture text. Never invent facts, citations, or figures that are not present.",
      "If the text is fragmented from PDF extraction, infer the intended meaning but stay faithful to the content.",
      "Write for a student revising for an exam: precise, concrete, and free of filler.",
    ].join(" "),
    prompt: [
      `Lecture title: ${title}`,
      courseName ? `Course: ${courseName}` : null,
      truncated
        ? "Note: the lecture text was truncated, so cover what is present without referring to missing sections."
        : null,
      "",
      "Lecture text:",
      body,
    ]
      .filter(Boolean)
      .join("\n"),
  })

  return output
}
