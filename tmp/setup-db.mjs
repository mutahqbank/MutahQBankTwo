import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres:sGfWmLAncOMOnzqyOMXGwyKZcDJCMTVN@interchange.proxy.rlwy.net:47823/railway";

async function setup() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Setting up site_announcements table...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_announcements (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date TIMESTAMP NOT NULL,
        button_text VARCHAR(50) DEFAULT 'Explore Package',
        button_link VARCHAR(255) DEFAULT '/subscriptions',
        is_active BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default announcement if none exists
    const check = await pool.query("SELECT COUNT(*) FROM site_announcements");
    if (parseInt(check.rows[0].count) === 0) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      targetDate.setHours(23, 59, 59, 999);

      await pool.query(
        `INSERT INTO site_announcements (title, description, target_date, button_text, button_link)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          "Final Exam Special Package",
          "Get exclusive access to 4 major subjects in one comprehensive bundle and save 25% on your subscription.",
          targetDate,
          "Explore Package",
          "/subscriptions"
        ]
      );
      console.log("Default announcement inserted.");
    }

    console.log("Table setup complete.");
  } catch (error) {
    console.error("Setup failed:", error);
  } finally {
    await pool.end();
  }
}

setup();
