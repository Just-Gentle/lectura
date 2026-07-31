"use client"

import Link from "next/link"
import {
  BookOpen,
  Brain,
  Clock,
  Layers,
  MessageSquare,
  NotebookPen,
  Target,
  Zap,
} from "lucide-react"
import type { LectureMessage, StudySet } from "@/lib/db/schema"
import { FlashcardDeck } from "@/components/flashcard-deck"
import { LectureChat } from "@/components/lecture-chat"
import { QuizRunner } from "@/components/quiz-runner"
import { StudyNotes } from "@/components/study-notes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StudySetView({
  lectureId,
  studySet,
  chatMessages,
}: {
  lectureId: number
  studySet: StudySet
  chatMessages: LectureMessage[]
}) {
  const questions = studySet.questions ?? []
  const flashcards = studySet.flashcards ?? []
  const keyConcepts = studySet.keyConcepts ?? []
  const analysis = studySet.analysis

  return (
    <div className="flex flex-col gap-6">
      {analysis && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Target className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold capitalize">
                  {analysis.difficulty}
                </p>
                <p className="text-xs text-muted-foreground">Difficulty</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">
                  {analysis.estimatedStudyMinutes} min
                </p>
                <p className="text-xs text-muted-foreground">Estimated study time</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Layers className="h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{analysis.topics.length} topics</p>
                <p className="text-xs text-muted-foreground">Covered in this lecture</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="summary">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="summary">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <Brain className="h-4 w-4" aria-hidden="true" />
            Quiz ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Layers className="h-4 w-4" aria-hidden="true" />
            Flashcards ({flashcards.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <NotebookPen className="h-4 w-4" aria-hidden="true" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="ask">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Ask
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 flex flex-col gap-6">
          {studySet.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Lecture summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {studySet.summary.split(/\n{2,}/).map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-muted-foreground text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {analysis && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Topics</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic) => (
                    <Badge key={topic} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Focus for the exam</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="ml-5 flex list-disc flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
                    {analysis.examFocus.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {analysis.prerequisites.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Assumed background knowledge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {analysis.prerequisites.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {keyConcepts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key concepts</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col divide-y divide-border">
                  {keyConcepts.map((concept) => (
                    <div key={concept.term} className="flex flex-col gap-1 py-3">
                      <dt className="text-sm font-semibold">{concept.term}</dt>
                      <dd className="text-sm leading-relaxed text-muted-foreground text-pretty">
                        {concept.definition}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quiz" className="mt-6">
          {questions.length > 0 ? (
            <QuizRunner lectureId={lectureId} questions={questions} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No questions were generated for this lecture.
            </p>
          )}
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          {flashcards.length > 0 ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3">
                <p className="text-sm text-muted-foreground text-pretty">
                  Free browsing below, or let spaced repetition decide what you see
                  next.
                </p>
                <Button size="sm" variant="secondary" render={<Link href="/review" />}>
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  Review scheduled cards
                </Button>
              </div>
              <FlashcardDeck cards={flashcards} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No flashcards were generated for this lecture.
            </p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revision notes</CardTitle>
            </CardHeader>
            <CardContent>
              {studySet.studyNotes ? (
                <StudyNotes markdown={studySet.studyNotes} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No notes were generated for this lecture.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ask" className="mt-6">
          <LectureChat lectureId={lectureId} initialMessages={chatMessages} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
