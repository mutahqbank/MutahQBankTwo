const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const res = await client.query('SELECT id, course FROM courses');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
check();
