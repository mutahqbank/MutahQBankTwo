import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import crypto from "crypto"

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const user_id = formData.get("user_id")?.toString()
    const package_id = formData.get("package_id")?.toString()
    const coupon = formData.get("coupon")?.toString() || null
    const note = formData.get("note")?.toString() || null
    const screenshot = formData.get("screenshot") as File | null

    if (!user_id || !package_id) {
      return NextResponse.json({ error: "user_id and package_id are required." }, { status: 400 })
    }

    if (!screenshot && !coupon) {
      return NextResponse.json({ error: "A transfer screenshot or coupon is required." }, { status: 400 })
    }

    if (screenshot && coupon) {
      return NextResponse.json({ error: "Please provide either a screenshot OR a coupon, not both." }, { status: 400 })
    }

    // --- FILE VALIDATION ---
    if (screenshot) {
      if (screenshot.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Screenshot file is too large. Maximum size is 5MB." }, { status: 400 })
      }
      if (!ALLOWED_TYPES.includes(screenshot.type)) {
        return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed." }, { status: 400 })
      }
    }

    // --- DATABASE CHECKS (Before Upload) ---
    // Check if package exists
    const pkgRes = await query(`SELECT id, price, users_limit FROM packages WHERE id = $1`, [package_id])
    if (pkgRes.rows.length === 0) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 })
    }
    const pkg = pkgRes.rows[0]

    // Validate group package notes
    if (pkg.users_limit > 1 && (!note || !note.trim())) {
      return NextResponse.json({ error: "Group packages require a note listing participant names." }, { status: 400 })
    }

    // Check if the user already has a pending transaction for this package
    const pendingRes = await query(`
      SELECT id FROM transactions 
      WHERE user_id = $1 AND package_id = $2 AND accepted IS NULL
    `, [user_id, package_id])

    if (pendingRes.rows.length > 0) {
      return NextResponse.json({ error: "You already have a pending transaction for this package." }, { status: 409 })
    }

    // Determine associated courses
    const plansRes = await query(`SELECT course_id FROM plans WHERE package_id = $1`, [package_id])
    const courseIds = plansRes.rows.map((r: { course_id: number }) => r.course_id)

    if (courseIds.length === 0) {
      return NextResponse.json({ error: "This package has no linked courses." }, { status: 400 })
    }

    // Check for existing active subscriptions to any of the courses in this package
    const existingRes = await query(`
      SELECT DISTINCT c.course AS course_name
      FROM subscriptions s
      JOIN packages p ON s.package_id = p.id
      JOIN plans pl ON p.id = pl.package_id
      JOIN courses c ON pl.course_id = c.id
      WHERE s.user_id = $1
        AND s.active = true
        AND pl.course_id = ANY($2::int[])
    `, [user_id, courseIds])

    if (existingRes.rows.length > 0) {
      const names = existingRes.rows.map((r: { course_name: string }) => r.course_name).join(", ")
      return NextResponse.json({
        error: `You already have an active subscription to: ${names}. You cannot purchase this package.`
      }, { status: 409 })
    }

    // --- CLOUDINARY UPLOAD ---
    let secureUrl = null
    let publicId = null

    if (screenshot) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME
      const apiKey = process.env.CLOUDINARY_API_KEY
      const apiSecret = process.env.CLOUDINARY_API_SECRET

      if (!cloudName || !apiKey || !apiSecret) {
        return NextResponse.json({ error: "Server configuration error for image upload." }, { status: 500 })
      }

      const timestamp = Math.round(new Date().getTime() / 1000).toString()
      const folder = "transactions"

      // Prevent IDOR by generating a secure random public ID
      const generatedPublicId = crypto.randomBytes(16).toString("hex")

      // The string to sign must have parameters in alphabetical order
      const stringToSign = `folder=${folder}&public_id=${generatedPublicId}&timestamp=${timestamp}${apiSecret}`
      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

      const uploadForm = new FormData()
      uploadForm.append("file", screenshot)
      uploadForm.append("api_key", apiKey)
      uploadForm.append("timestamp", timestamp)
      uploadForm.append("signature", signature)
      uploadForm.append("folder", folder)
      uploadForm.append("public_id", generatedPublicId)

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload` // generic auto for img/pdf
      const cloudRes = await fetch(uploadUrl, { method: "POST", body: uploadForm })

      if (!cloudRes.ok) {
        const cloudErr = await cloudRes.text()
        console.error("Cloudinary upload failed:", cloudErr)
        return NextResponse.json({ error: "Failed to upload screenshot." }, { status: 500 })
      }

      const cloudData = await cloudRes.json()
      secureUrl = cloudData.secure_url
      publicId = cloudData.public_id
    }

    // --- DATABASE INSERT ---
    const finalPrice = coupon && !screenshot ? 0 : pkg.price

    const result = await query(`
      INSERT INTO transactions (user_id, package_id, amount, date, note, coupon, screenshot, public_id, accepted)
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, NULL)
      RETURNING id
    `, [user_id, package_id, finalPrice, note, coupon, secureUrl, publicId])

    return NextResponse.json({
      id: result.rows[0].id,
      message: "Please wait for the admin's approval."
    }, { status: 201 })

  } catch (error) {
    console.error("Transaction error:", error)
    return NextResponse.json({ error: "Failed to process transaction." }, { status: 500 })
  }
}