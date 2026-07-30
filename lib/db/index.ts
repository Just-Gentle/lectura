import { Signer } from "@aws-sdk/rds-signer"
import { attachDatabasePool } from "@vercel/functions"
import { awsCredentialsProvider } from "@vercel/functions/oidc"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const host = process.env.PGHOST
const port = Number(process.env.PGPORT ?? 5432)
const database = process.env.PGDATABASE ?? "postgres"
const username = process.env.PGUSER ?? "postgres"

/**
 * Amazon Aurora PostgreSQL uses IAM authentication: the "password" is a
 * short-lived token signed with credentials from Vercel's OIDC provider.
 * Passing a function lets `pg` mint a fresh token per connection.
 */
const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN!,
    clientConfig: { region: process.env.AWS_REGION },
  }),
  region: process.env.AWS_REGION!,
  hostname: host!,
  username,
  port,
})

export const pool = new Pool({
  host,
  port,
  database,
  user: username,
  password: () => signer.getAuthToken(),
  ssl: { rejectUnauthorized: false },
  max: 20,
})

attachDatabasePool(pool)

export const db = drizzle(pool, { schema })
