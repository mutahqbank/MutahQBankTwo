import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit
    const status = searchParams.get("status") // "accepted", "pending", "all"

    let whereClause = ""
    const params: unknown[] = []

    if (status === "accepted") {
      whereClause = "WHERE t.accepted = true"
    } else if (status === "pending") {
      whereClause = "WHERE t.accepted = false"
    }

    const sql = `
      SELECT
        t.id,
        a.username,
        c.course AS course_name,
        t.amount,
        t.date,
        t.accepted,
        t.note,
        t.coupon,
        t.screenshot,
        t.public_id,
        p.price AS package_price,
        p.duration AS package_duration
      FROM transactions t
      JOIN accounts a ON a.user_id = t.user_id
      JOIN packages p ON t.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      JOIN courses c ON pl.course_id = c.id
      ${whereClause}
      ORDER BY t.date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    params.push(limit, offset)
    const result = await query(sql, params)

    const countParams: unknown[] = []
    const countSql = `
      SELECT COUNT(*) FROM transactions t
      JOIN accounts a ON a.user_id = t.user_id
      JOIN packages p ON t.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      JOIN courses c ON pl.course_id = c.id
      ${whereClause}
    `
    const countResult = await query(countSql, countParams)

    return NextResponse.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    })
  } catch (error) {
    console.error("Failed to fetch transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// Toggle accepted status — when accepting, also create a subscription
export async function PATCH(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id, accepted } = await request.json()

    // Fetch the transaction to get user_id and package_id
    const txResult = await query(
      `SELECT t.id, t.user_id, t.package_id, p.duration
       FROM transactions t
       JOIN packages p ON t.package_id = p.id
       WHERE t.id = $1`,
      [id]
    )

    if (txResult.rows.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    const tx = txResult.rows[0]

    if (accepted) {
      // Step 1: Create a subscription record
      await query(
        `INSERT INTO subscriptions (transaction_id, user_id, package_id, date, active, duration)
         VALUES ($1, $2, $3, NOW(), true, $4)`,
        [tx.id, tx.user_id, tx.package_id, tx.duration]
      )

      // Step 2: Update the transaction accepted field to true
      await query(
        `UPDATE transactions SET accepted = true WHERE id = $1`,
        [id]
      )
    } else {
      // Rejecting / revoking: deactivate any subscription linked to this transaction
      await query(
        `UPDATE subscriptions SET active = false WHERE transaction_id = $1`,
        [id]
      )

      // Set accepted to false
      await query(
        `UPDATE transactions SET accepted = false WHERE id = $1`,
        [id]
      )
    }

    // Return the updated transaction
    const updated = await query(
      `SELECT t.id, t.user_id, t.package_id, t.amount, t.date, t.accepted,
              t.note, t.coupon, t.screenshot, t.public_id
       FROM transactions t WHERE t.id = $1`,
      [id]
    )

    return NextResponse.json(updated.rows[0])
  } catch (error) {
    console.error("Failed to update transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
