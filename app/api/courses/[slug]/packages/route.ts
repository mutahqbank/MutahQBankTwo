import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

async function getCourseId(slug: string): Promise<number | null> {
  const r = await query(`SELECT id FROM courses WHERE public_id = $1 OR id::text = $1`, [slug])
  return r.rows.length > 0 ? r.rows[0].id : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const courseId = await getCourseId(slug)
    if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const showAll = request.nextUrl.searchParams.get("all") === "true"
    const activeFilter = showAll ? "" : "AND p.active = true"

    // Get packages linked to this course
    const result = await query(`
      SELECT p.id, p.price, p.users_limit, p.duration, p.active
      FROM packages p
      JOIN plans pl ON p.id = pl.package_id
      WHERE pl.course_id = $1 ${activeFilter}
      ORDER BY p.price ASC
    `, [courseId])

    // For each package, get all linked courses with their question counts
    const pkgs = []
    for (const row of result.rows) {
      const coursesResult = await query(`
        SELECT c.id, c.course AS name,
          (SELECT COUNT(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND q.active = true) AS questions_count
        FROM courses c
        JOIN plans pl ON pl.course_id = c.id
        WHERE pl.package_id = $1
        ORDER BY c.course ASC
      `, [row.id])
      pkgs.push({ ...row, courses: coursesResult.rows })
    }

    return NextResponse.json(pkgs)
  } catch (error) {
    console.error("Failed to fetch packages:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const fallbackCourseId = await getCourseId(slug)

    const { price, users_limit, duration, course_ids } = await request.json()

    if (!price || price <= 0) return NextResponse.json({ error: "Price is required" }, { status: 400 })
    if (!users_limit || users_limit < 1) return NextResponse.json({ error: "Users limit must be >= 1" }, { status: 400 })

    // Determine which courses to link
    const linkedCourses: number[] = Array.isArray(course_ids) && course_ids.length > 0
      ? course_ids
      : fallbackCourseId ? [fallbackCourseId] : []

    if (linkedCourses.length === 0) return NextResponse.json({ error: "At least one course is required" }, { status: 400 })

    // Create the package
    const pkgResult = await query(
      `INSERT INTO packages (price, users_limit, duration, active) VALUES ($1, $2, $3, true) RETURNING id`,
      [price, users_limit || 1, duration || 30]
    )
    const packageId = pkgResult.rows[0].id

    // Link to all selected courses
    for (const cId of linkedCourses) {
      await query(`INSERT INTO plans (course_id, package_id) VALUES ($1, $2)`, [cId, packageId])
    }

    return NextResponse.json({ id: packageId, price, users_limit: users_limit || 1, duration: duration || 30, active: true }, { status: 201 })
  } catch (error) {
    console.error("Failed to create package:", error)
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await getCourseId(slug)

    const { id, price, users_limit, duration, active, course_ids } = await request.json()
    if (!id) return NextResponse.json({ error: "Package id is required" }, { status: 400 })

    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (price !== undefined) { fields.push(`price = $${idx++}`); values.push(price) }
    if (users_limit !== undefined) { fields.push(`users_limit = $${idx++}`); values.push(users_limit) }
    if (duration !== undefined) { fields.push(`duration = $${idx++}`); values.push(duration) }
    if (active !== undefined) { fields.push(`active = $${idx++}`); values.push(active) }

    if (fields.length > 0) {
      values.push(id)
      await query(`UPDATE packages SET ${fields.join(", ")} WHERE id = $${idx}`, values)
    }

    // If course_ids provided, re-link courses
    if (Array.isArray(course_ids)) {
      await query(`DELETE FROM plans WHERE package_id = $1`, [id])
      for (const cId of course_ids) {
        await query(`INSERT INTO plans (course_id, package_id) VALUES ($1, $2)`, [cId, id])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update package:", error)
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const courseId = await getCourseId(slug)
    if (!courseId) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "Package id is required" }, { status: 400 })

    await query(`DELETE FROM plans WHERE package_id = $1`, [id])
    await query(`DELETE FROM packages WHERE id = $1`, [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete package:", error)
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 })
  }
}
