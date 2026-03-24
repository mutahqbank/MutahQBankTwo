const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway',
  ssl: { rejectUnauthorized: false }
});

async function updateDb() {
    try {
        console.log("Adding original_price column...");
        await pool.query("ALTER TABLE packages ADD COLUMN IF NOT EXISTS original_price INTEGER;");
        
        console.log("Updating bundle original prices...");
        // 6th Year Final Bundle (ID 66): was 32
        await pool.query("UPDATE packages SET original_price = 32 WHERE id = 66;");
        // 4th Year Final Bundle (ID 67): was 16
        await pool.query("UPDATE packages SET original_price = 16 WHERE id = 67;");
        // 5th Year Final Bundle (ID 68): was 16
        await pool.query("UPDATE packages SET original_price = 16 WHERE id = 68;");
        // Minors - 5th Year Bundle (ID 69): was 45
        await pool.query("UPDATE packages SET original_price = 45 WHERE id = 69;");
        
        console.log("Database update successful.");
        await pool.end();
    } catch (err) {
        console.error("Database update failed:", err);
        process.exit(1);
    }
}

updateDb();
