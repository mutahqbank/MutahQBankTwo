import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Get all packages
    const allPkgsRes = await query(`
        SELECT p.id, p.price, p.users_limit, p.duration, p.active, p.custom_name, p.design_level, p.original_price
        FROM packages p
        ORDER BY p.price ASC
    `)

    // Get featured IDs
    const featuredRes = await query(`
        SELECT package_id, display_order 
        FROM homepage_featured_packages 
        ORDER BY display_order ASC
    `)

    const pkgs = []
    for (const row of allPkgsRes.rows) {
        // Get courses for each package
        const courses = await query(`
            SELECT c.course AS name 
            FROM courses c 
            JOIN plans pl ON pl.course_id = c.id 
            WHERE pl.package_id = $1
        `, [row.id])

        const isFeatured = featuredRes.rows.find(f => f.package_id === row.id)
        pkgs.push({
            ...row,
            courses: courses.rows.map(c => c.name),
            is_featured: !!isFeatured,
            order: isFeatured ? isFeatured.display_order : null
        })
    }

    return NextResponse.json(pkgs)
  } catch (error) {
    console.error("Failed to fetch admin featured packages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Expecting an array of package IDs in the desired order
    const { packageIds } = await request.json()
    if (!Array.isArray(packageIds)) return NextResponse.json({ error: "packageIds must be an array" }, { status: 400 })

    await query("BEGIN")
    try {
        // Clear existing featured packages
        await query("DELETE FROM homepage_featured_packages")

        // Insert new ones in order
        for (let i = 0; i < packageIds.length; i++) {
            await query(
                "INSERT INTO homepage_featured_packages (package_id, display_order) VALUES ($1, $2)",
                [packageIds[i], i]
            )
        }
        await query("COMMIT")
    } catch (err) {
        await query("ROLLBACK")
        throw err
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update featured packages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUser()
  if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { packageId, active } = await request.json()
    if (typeof packageId !== 'number' || typeof active !== 'boolean') {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    await query(
      "UPDATE packages SET active = $1 WHERE id = $2",
      [active, packageId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update package status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
