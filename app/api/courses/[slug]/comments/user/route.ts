import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getServerUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get the course ID using public_id or numeric id (matching courses/[slug]/route.ts)
    const courseRes = await query("SELECT id FROM courses WHERE public_id = $1 OR id::text = $1", [slug])
    if (courseRes.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    const courseId = courseRes.rows[0].id

    // 2. Fetch all comments made by the user in this course
    // Note: Actual columns are 'question' (not question_text) and 'course' in courses table.
    // Joining questions q on course_id.
    const userComments = await query(
      `SELECT 
        c.*, 
        a.username, 
        q.question as question_text,
        q.subject_id,
        p.comment_text as parent_text,
        (SELECT username FROM accounts WHERE user_id = p.user_id) as parent_username
      FROM comments c
      JOIN questions q ON c.question_id = q.id
      JOIN accounts a ON c.user_id = a.user_id
      LEFT JOIN comments p ON c.parent_comment_id = p.id
      WHERE q.course_id = $1 AND c.user_id = $2
      ORDER BY c.created_at DESC`,
      [courseId, user.id]
    )

    // 3. For each comment, if it has replies, fetch them
    const comments = await Promise.all(userComments.rows.map(async (row) => {
      const repliesRes = await query(
        `SELECT c.*, a.username 
         FROM comments c 
         JOIN accounts a ON c.user_id = a.user_id 
         WHERE c.parent_comment_id = $1 
         ORDER BY c.created_at ASC`,
        [row.id]
      )
      return {
        ...row,
        replies: repliesRes.rows
      }
    }))

    return NextResponse.json(comments)
  } catch (error: any) {
    console.error("GET USER COMMENTS ERROR:", error)
    // Cleanup: I'll stop logging to the file now that I found the issue
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
