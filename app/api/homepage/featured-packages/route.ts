import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get featured packages
    const result = await query(`
      SELECT p.id, p.price, p.users_limit, p.duration, p.active, p.custom_name, p.design_level, p.original_price, fp.display_order
      FROM packages p
      JOIN homepage_featured_packages fp ON p.id = fp.package_id
      ORDER BY fp.display_order ASC, p.price ASC
    `)

    if (result.rows.length === 0) {
      return NextResponse.json([])
    }

    const pkgs = []
    for (const row of result.rows) {
      // Get linked courses for each package
      const coursesResult = await query(`
        SELECT c.id, c.course AS name, c.public_id AS slug,
          (SELECT COUNT(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND q.active = true) AS questions_count
        FROM courses c
        JOIN plans pl ON pl.course_id = c.id
        WHERE pl.package_id = $1
        ORDER BY c.course ASC
      `, [row.id])
      
      // Get the primary course slug for the direct payment link (using ID to avoid 404s with complex public_ids)
      const primarySlug = coursesResult.rows.length > 0 ? coursesResult.rows[0].id.toString() : "all"

      pkgs.push({ 
        ...row, 
        courses: coursesResult.rows,
        primary_slug: primarySlug,
        is_coming_soon: !row.active
      })
    }

    return NextResponse.json(pkgs)
  } catch (error) {
    console.error("Failed to fetch featured packages:", error)
    return NextResponse.json({ error: "Failed to fetch featured packages" }, { status: 500 })
  }
}
