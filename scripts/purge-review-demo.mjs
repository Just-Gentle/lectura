import { Signer } from "@aws-sdk/rds-signer"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { Client } from "pg"

const email = process.argv[2]
if (!email) throw new Error("usage: node scripts/purge-review-demo.mjs <email>")

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
if (user) {
  for (const table of [
    "card_reviews",
    "quiz_attempts",
    "lecture_messages",
    "study_sets",
    "lectures",
  ]) {
    const res = await client.query(`delete from "${table}" where "userId" = $1`, [user.id])
    console.log("[v0] deleted", res.rowCount, "from", table)
  }
  await client.query('delete from "user" where id = $1', [user.id])
  console.log("[v0] deleted user", email)
}

await client.end()
