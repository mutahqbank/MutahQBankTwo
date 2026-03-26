const { query } = require("./lib/database")

async function debug() {
  const slug = "pediatrics" // Common slug
  const userId = 1 // Common test user ID

  try {
    const courseRes = await query("SELECT id FROM courses WHERE slug = $1", [slug])
    if (courseRes.rows.length === 0) {
      console.log("Course not found")
      return
    }
    const courseId = courseRes.rows[0].id
    console.log("Course ID:", courseId)

    const sql = `SELECT 
        c.*, 
        a.username, 
        q.question_text,
        p.comment_text as parent_text,
        (SELECT username FROM accounts WHERE user_id = p.user_id) as parent_username
      FROM comments c
      JOIN questions q ON c.question_id = q.id
      JOIN accounts a ON c.user_id = a.user_id
      LEFT JOIN comments p ON c.parent_comment_id = p.id
      WHERE q.course_id = $1 AND c.user_id = $2
      ORDER BY c.created_at DESC`
    
    const res = await query(sql, [courseId, userId])
    console.log("Results count:", res.rows.length)
  } catch (err) {
    console.error("SQL ERROR:", err.message)
    console.error(err)
  }
}

debug()
