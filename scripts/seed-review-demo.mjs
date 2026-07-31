import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { Client } from "pg"

const email = process.argv[2]
if (!email) throw new Error("usage: node scripts/seed-review-demo.mjs <email>")

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

const {
  rows: [user],
} = await client.query('select id from "user" where email = $1', [email])
if (!user) throw new Error(`no user with email ${email}`)

const flashcards = [
  { front: "What is the Nyquist rate?", back: "Twice the highest frequency present in a signal." },
  { front: "Define aliasing.", back: "High frequencies masquerading as low ones after undersampling." },
  { front: "What does an anti-alias filter do?", back: "Removes energy above the Nyquist frequency before sampling." },
  { front: "Units of angular frequency?", back: "Radians per second." },
  { front: "What is quantisation error?", back: "The difference between the analogue value and its nearest digital level." },
]

const {
  rows: [lecture],
} = await client.query(
  `insert into "lectures" ("userId","title","courseName","fileName","filePath","fileSize","pageCount","wordCount","extractedText","status")
   values ($1,'Sampling and Aliasing','Signals & Systems','sampling.pdf','seed/sampling.pdf',1024,24,3200,'seed text','ready')
   returning id`,
  [user.id],
)

await client.query(
  `insert into "study_sets" ("lectureId","userId","summary","flashcards","model")
   values ($1,$2,'Seeded study set for review testing.',$3::jsonb,'seed')`,
  [lecture.id, user.id, JSON.stringify(flashcards)],
)

console.log("[v0] seeded lecture", lecture.id, "with", flashcards.length, "cards")
await client.end()
