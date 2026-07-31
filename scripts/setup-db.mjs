import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { Client } from "pg"

const statements = [
  `CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "role" text NOT NULL DEFAULT 'user',
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expiresAt" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now(),
    "ipAddress" text,
    "userAgent" text,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp,
    "refreshTokenExpiresAt" timestamp,
    "scope" text,
    "password" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamp NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS "lectures" (
    "id" serial PRIMARY KEY,
    "userId" text NOT NULL,
    "title" text NOT NULL,
    "courseName" text,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileSize" integer NOT NULL DEFAULT 0,
    "pageCount" integer NOT NULL DEFAULT 0,
    "wordCount" integer NOT NULL DEFAULT 0,
    "extractedText" text,
    "status" text NOT NULL DEFAULT 'pending',
    "errorMessage" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "lectures_userId_idx" ON "lectures" ("userId")`,
  // Earlier versions stored a public blob URL. The store is private, so the column
  // now holds the blob pathname that the authenticated file route streams from.
  `DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'lectures' AND column_name = 'fileUrl'
    ) THEN
      ALTER TABLE "lectures" RENAME COLUMN "fileUrl" TO "filePath";
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "study_sets" (
    "id" serial PRIMARY KEY,
    "lectureId" integer NOT NULL,
    "userId" text NOT NULL,
    "summary" text,
    "keyConcepts" jsonb,
    "questions" jsonb,
    "flashcards" jsonb,
    "studyNotes" text,
    "analysis" jsonb,
    "model" text,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "study_sets_lecture_idx" ON "study_sets" ("lectureId", "userId")`,
  `CREATE TABLE IF NOT EXISTS "quiz_attempts" (
    "id" serial PRIMARY KEY,
    "lectureId" integer NOT NULL,
    "userId" text NOT NULL,
    "score" integer NOT NULL DEFAULT 0,
    "total" integer NOT NULL DEFAULT 0,
    "answers" jsonb,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS "quiz_attempts_lecture_idx" ON "quiz_attempts" ("lectureId", "userId")`,
  // Progress page reads every attempt for a user in chronological order.
  `CREATE INDEX IF NOT EXISTS "quiz_attempts_user_created_idx" ON "quiz_attempts" ("userId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "study_sets_userId_idx" ON "study_sets" ("userId")`,
  `CREATE TABLE IF NOT EXISTS "lecture_messages" (
    "id" serial PRIMARY KEY,
    "lectureId" integer NOT NULL,
    "userId" text NOT NULL,
    "role" text NOT NULL,
    "content" text NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now()
  )`,
  // The chat panel loads one lecture's thread in chronological order.
  `CREATE INDEX IF NOT EXISTS "lecture_messages_thread_idx" ON "lecture_messages" ("lectureId", "userId", "createdAt")`,
]

const port = Number(process.env.PGPORT ?? 5432)
const username = process.env.PGUSER ?? "postgres"

const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
  region: process.env.AWS_REGION,
  hostname: process.env.PGHOST,
  username,
  port,
})

const client = new Client({
  host: process.env.PGHOST,
  port,
  database: process.env.PGDATABASE ?? "postgres",
  user: username,
  password: await signer.getAuthToken(),
  ssl: { rejectUnauthorized: false },
})
await client.connect()

for (const sql of statements) {
  await client.query(sql)
  console.log("[v0] ok:", sql.slice(0, 60).replace(/\s+/g, " "))
}

const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema = 'public' order by 1",
)
console.log("[v0] tables:", rows.map((r) => r.table_name).join(", "))

await client.end()
