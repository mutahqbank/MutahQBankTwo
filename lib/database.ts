import { Pool } from "pg"

const RAILWAY_PUBLIC_URL = process.env.DATABASE_URL

declare global {
  var db_pool: Pool | undefined
}

const pool = globalThis.db_pool || new Pool({
  connectionString: RAILWAY_PUBLIC_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Increased from 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

if (process.env.NODE_ENV !== "production") {
  globalThis.db_pool = pool
}

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export { pool }
export default pool
