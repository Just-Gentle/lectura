"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { toast } from "sonner"
import { saveQuizAttempt } from "@/app/actions/lectures"
import type { QuizQuestion } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[.\s]+$/g, "")
}

function isCorrect(question: QuizQuestion, given: string) {
  if (!given) return false
  if (question.type === "short-answer") {
    const answer = normalize(question.answer)
    const response = normalize(given)
    return response === answer || (response.length > 3 && answer.includes(response))
  }
  return normalize(given) === normalize(question.answer)
}

const difficultyVariant: Record<string, "outline" | "secondary" | "destructive"> = {
  easy: "outline",
  medium: "secondary",
  hard: "destructive",
}

export function QuizRunner({
  lectureId,
  questions,
}: {
  lectureId: number
  questions: QuizQuestion[]
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const answeredCount = Object.values(answers).filter(Boolean).length
  const score = useMemo(
    () =>
      questions.reduce(
        (total, question, index) =>
          total + (isCorrect(question, answers[index] ?? "") ? 1 : 0),
        0,
      ),
    [answers, questions],
  )

  async function handleSubmit() {
    setSaving(true)
    setSubmitted(true)
    try {
      await saveQuizAttempt({
        lectureId,
        score,
        total: questions.length,
        answers: Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [String(key), value]),
        ),
      })
      toast.success(`You scored ${score} out of ${questions.length}.`)
    } catch {
      toast.error("Your score could not be saved, but your results are below.")
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium">
              {submitted
                ? `Score: ${score} / ${questions.length}`
                : `${answeredCount} of ${questions.length} answered`}
            </p>
            {submitted && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Retake
              </Button>
            )}
          </div>
          <Progress
            value={
              submitted
                ? (score / questions.length) * 100
                : (answeredCount / questions.length) * 100
            }
            aria-label="Quiz progress"
          />
        </CardContent>
      </Card>

      <ol className="flex flex-col gap-6">
        {questions.map((question, index) => {
          const given = answers[index] ?? ""
          const correct = isCorrect(question, given)

          return (
            <li key={index}>
              <Card>
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {index + 1}
                    </Badge>
                    <Badge variant={difficultyVariant[question.difficulty] ?? "outline"}>
                      {question.difficulty}
                    </Badge>
                    <Badge variant="outline">{question.type.replace("-", " ")}</Badge>
                    {submitted &&
                      (correct ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Incorrect
                        </span>
                      ))}
                  </div>
                  <CardTitle className="text-base leading-relaxed text-pretty">
                    {question.question}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  {question.type === "short-answer" ? (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`q-${index}`} className="sr-only">
                        Your answer
                      </Label>
                      <Input
                        id={`q-${index}`}
                        value={given}
                        disabled={submitted}
                        placeholder="Type your answer"
                        onChange={(event) =>
                          setAnswers((prev) => ({ ...prev, [index]: event.target.value }))
                        }
                      />
                    </div>
                  ) : (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="sr-only">Choose an answer</legend>
                      {(question.options ?? []).map((option) => {
                        const selected = given === option
                        const isAnswer =
                          submitted && normalize(option) === normalize(question.answer)

                        return (
                          <label
                            key={option}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-relaxed transition-colors ${
                              isAnswer
                                ? "border-accent bg-accent/10"
                                : selected && submitted
                                  ? "border-destructive bg-destructive/10"
                                  : selected
                                    ? "border-accent"
                                    : "border-border hover:border-accent/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={selected}
                              disabled={submitted}
                              className="mt-1 accent-accent"
                              onChange={() =>
                                setAnswers((prev) => ({ ...prev, [index]: option }))
                              }
                            />
                            <span>{option}</span>
                          </label>
                        )
                      })}
                    </fieldset>
                  )}

                  {submitted && (
                    <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                      <p className="font-medium">Answer: {question.answer}</p>
                      <p className="mt-1 text-muted-foreground">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>

      {!submitted && (
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={saving || answeredCount === 0}
          className="self-start"
        >
          {saving ? "Scoring…" : "Submit answers"}
        </Button>
      )}
    </div>
  )
}
