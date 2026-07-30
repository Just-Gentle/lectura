import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

/* ---------------------------------------------------------------------------
 * Better Auth tables — column names must stay camelCase to match Better Auth
 * -------------------------------------------------------------------------*/

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

/* ---------------------------------------------------------------------------
 * App tables — plain userId columns for scoping, no foreign keys
 * -------------------------------------------------------------------------*/

export type LectureStatus = "pending" | "processing" | "ready" | "failed"

export const lectures = pgTable("lectures", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  courseName: text("courseName"),
  fileName: text("fileName").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: integer("fileSize").default(0).notNull(),
  pageCount: integer("pageCount").default(0).notNull(),
  wordCount: integer("wordCount").default(0).notNull(),
  extractedText: text("extractedText"),
  status: text("status").$type<LectureStatus>().default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export type KeyConcept = {
  term: string
  definition: string
}

export type QuizQuestion = {
  question: string
  type: "multiple-choice" | "short-answer" | "true-false"
  options?: string[]
  answer: string
  explanation: string
  difficulty: "easy" | "medium" | "hard"
}

export type Flashcard = {
  front: string
  back: string
}

export type LectureAnalysis = {
  topics: string[]
  difficulty: string
  estimatedStudyMinutes: number
  prerequisites: string[]
  examFocus: string[]
}

export const studySets = pgTable("study_sets", {
  id: serial("id").primaryKey(),
  lectureId: integer("lectureId").notNull(),
  userId: text("userId").notNull(),
  summary: text("summary"),
  keyConcepts: jsonb("keyConcepts").$type<KeyConcept[]>(),
  questions: jsonb("questions").$type<QuizQuestion[]>(),
  flashcards: jsonb("flashcards").$type<Flashcard[]>(),
  studyNotes: text("studyNotes"),
  analysis: jsonb("analysis").$type<LectureAnalysis>(),
  model: text("model"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  lectureId: integer("lectureId").notNull(),
  userId: text("userId").notNull(),
  score: integer("score").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  answers: jsonb("answers").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
})

export type Lecture = typeof lectures.$inferSelect
export type StudySet = typeof studySets.$inferSelect
export type QuizAttempt = typeof quizAttempts.$inferSelect
export type User = typeof user.$inferSelect
