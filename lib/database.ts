import { Pool } from "pg"

const RAILWAY_PUBLIC_URL = "postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway"

const pool = new Pool({
  connectionString: RAILWAY_PUBLIC_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export default pool
