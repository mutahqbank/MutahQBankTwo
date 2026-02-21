import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const questionId = searchParams.get("question_id")

    if (!questionId) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 })
    }

    const result = await query(
      `SELECT c.*, u.username FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.question_id = $1
       ORDER BY c.created_at ASC`,
      [parseInt(questionId)]
    )

    // Build tree (replies nested)
    const comments = result.rows
    const topLevel = comments.filter((c: { parent_comment_id: number | null }) => !c.parent_comment_id)
    const tree = topLevel.map((parent: { id: number; [key: string]: unknown }) => ({
      ...parent,
      replies: comments.filter((child: { parent_comment_id: number | null }) => child.parent_comment_id === parent.id),
    }))

    return NextResponse.json(tree)
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, question_id, comment_text, parent_comment_id } = await request.json()

    const result = await query(
      `INSERT INTO comments (user_id, question_id, comment_text, parent_comment_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [user_id, question_id, comment_text, parent_comment_id || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
