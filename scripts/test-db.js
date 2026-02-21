import pg from "pg";

const url = process.env.DATABASE_URL;
console.log("DATABASE_URL hostname:", url ? new URL(url).hostname : "NOT SET");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log("Connected successfully!");
  const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log("Existing tables:", res.rows.map(r => r.table_name));
  await client.end();
} catch (err) {
  console.error("Connection failed:", err.message);
}
