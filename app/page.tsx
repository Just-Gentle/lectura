import Image from "next/image"
import Link from "next/link"
import {
  BookOpen,
  Brain,
  FileSearch,
  NotebookPen,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SiteHeader } from "@/components/site-header"
import { getCurrentUser } from "@/lib/session"

const features = [
  {
    icon: Brain,
    title: "AI-Generated Questions",
    description:
      "Automatically create exam-style questions from your lecture content to test your understanding.",
  },
  {
    icon: Zap,
    title: "Smart Summaries",
    description:
      "Get concise, AI-powered summaries highlighting the most important concepts from each lecture.",
  },
  {
    icon: Sparkles,
    title: "Interactive Flashcards",
    description:
      "Study with AI-generated flashcards featuring key terms and definitions from your lectures.",
  },
  {
    icon: BookOpen,
    title: "Key Concepts",
    description:
      "Identify and organize the most critical concepts and topics for focused studying.",
  },
  {
    icon: FileSearch,
    title: "PDF Analysis",
    description:
      "See topic breakdowns, difficulty ratings, prerequisites, and where to focus before the exam.",
  },
  {
    icon: NotebookPen,
    title: "Study Notes",
    description:
      "Get clean, structured revision notes written from your lecture, ready to review anywhere.",
  },
]

const steps = [
  {
    step: "01",
    title: "Upload your lecture",
    description:
      "Drop in a lecture PDF — slides, handouts, or reading. We extract the text automatically.",
  },
  {
    step: "02",
    title: "Let the AI read it",
    description:
      "Your lecture is analysed to pull out concepts, difficulty, and the parts that matter for exams.",
  },
  {
    step: "03",
    title: "Study your way",
    description:
      "Switch between summary, quiz, flashcards, and notes — all generated from your own material.",
  },
]

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="relative min-h-svh text-foreground">
      <SiteHeader signedIn={Boolean(user)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div
          className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Powered by AI
              </p>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
                Transform your lectures into study materials
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
                Upload your lecture PDFs and let AI instantly generate exam
                questions, summaries, flashcards, and key concepts. Study
                smarter, not harder.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  render={<Link href={user ? "/dashboard" : "/sign-up"} />}
                  size="lg"
                  className="text-base"
                >
                  {user ? "Go to dashboard" : "Get started free"}
                </Button>
                <Button
                  render={<Link href="#features" />}
                  variant="outline"
                  size="lg"
                  className="text-base"
                >
                  Learn more
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <Image
                  src="/images/study-dashboard-preview.png"
                  alt="Lecture Assistant showing a generated lecture summary alongside quiz questions and flashcards"
                  width={1200}
                  height={900}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-balance">
            Everything you need to revise
          </h2>
          <p className="text-muted-foreground text-pretty">
            One upload turns into a complete study kit built from your own
            lecture material.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Icon className="h-6 w-6 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/40 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-balance">
              From PDF to revision in three steps
            </h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map(({ step, title, description }) => (
              <li key={step} className="flex flex-col gap-3">
                <span className="font-mono text-sm font-semibold text-accent">
                  {step}
                </span>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-balance">
            Ready to study smarter?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground text-pretty">
            Upload your first lecture and get a full study set in under a
            minute.
          </p>
          <Button
            render={<Link href={user ? "/dashboard" : "/sign-up"} />}
            size="lg"
            className="text-base"
          >
            {user ? "Go to dashboard" : "Start free today"}
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/40 bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} Lecture Assistant. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
