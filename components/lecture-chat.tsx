"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { ArrowUp, Eraser, MessageSquare, Sparkles, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { clearLectureMessages } from "@/app/actions/lectures"
import type { LectureMessage } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Explain the main argument in simple terms",
  "What is most likely to come up in an exam?",
  "Give me a worked example of the key idea",
]

function toUIMessages(stored: LectureMessage[]): UIMessage[] {
  return stored.map((message) => ({
    id: String(message.id),
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  }))
}

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("")
}

export function LectureChat({
  lectureId,
  initialMessages,
}: {
  lectureId: number
  initialMessages: LectureMessage[]
}) {
  const [input, setInput] = useState("")
  const [clearing, setClearing] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    messages: toUIMessages(initialMessages),
    transport: new DefaultChatTransport({ api: `/api/lectures/${lectureId}/chat` }),
    onError: () => toast.error("The tutor could not answer that. Try again."),
  })

  const busy = status === "submitted" || status === "streaming"

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages, status])

  function ask(text: string) {
    const question = text.trim()
    if (!question || busy) return
    sendMessage({ text: question })
    setInput("")
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clearLectureMessages(lectureId)
      setMessages([])
    } catch {
      toast.error("Could not clear this conversation.")
    } finally {
      setClearing(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-accent" aria-hidden="true" />
          Ask this lecture
        </CardTitle>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={busy || clearing}
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            {clearing ? "Clearing…" : "Clear"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div
          className="flex max-h-[28rem] min-h-56 flex-col gap-4 overflow-y-auto pr-1"
          role="log"
          aria-live="polite"
          aria-label="Conversation about this lecture"
        >
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
              <div className="rounded-full bg-accent/10 p-3">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
                Ask anything about this lecture. Answers come only from the
                uploaded material, so nothing is invented.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => ask(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user"
              return (
                <div
                  key={message.id}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-pretty",
                      isUser
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    <span className="sr-only">
                      {isUser ? "You said: " : "Tutor said: "}
                    </span>
                    {messageText(message) ||
                      (busy && !isUser ? "Thinking…" : "")}
                  </div>
                </div>
              )
            })
          )}
          {status === "submitted" && (
            <p className="text-sm text-muted-foreground">Reading the lecture…</p>
          )}
          <div ref={endRef} />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            Something went wrong. Send your question again.
          </p>
        )}

        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            ask(input)
          }}
        >
          <label htmlFor="lecture-question" className="sr-only">
            Your question
          </label>
          <Textarea
            id="lecture-question"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing &&
                event.keyCode !== 229
              ) {
                event.preventDefault()
                ask(input)
              }
            }}
            placeholder="e.g. How does this relate to last week's topic?"
            rows={2}
            maxLength={2000}
            className="min-h-[3rem] resize-none"
          />
          {busy ? (
            <Button type="button" variant="secondary" size="icon" onClick={stop}>
              <Square className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Stop generating</span>
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Send question</span>
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
