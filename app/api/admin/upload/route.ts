import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getServerUser } from "@/lib/auth-server"

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: NextRequest) {
  try {
    // Basic admin check
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image file is too large. Maximum size is 15MB." }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, and WEBP are allowed for questions." }, { status: 400 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Server configuration error for image upload." }, { status: 500 })
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString()
    const folder = "questions"

    const generatedPublicId = crypto.randomBytes(16).toString("hex")
    const stringToSign = `folder=${folder}&public_id=${generatedPublicId}&timestamp=${timestamp}${apiSecret}`
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex")

    const uploadForm = new FormData()
    uploadForm.append("file", file)
    uploadForm.append("api_key", apiKey)
    uploadForm.append("timestamp", timestamp)
    uploadForm.append("signature", signature)
    uploadForm.append("folder", folder)
    uploadForm.append("public_id", generatedPublicId)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
    const cloudRes = await fetch(uploadUrl, { method: "POST", body: uploadForm })

    if (!cloudRes.ok) {
      const cloudErr = await cloudRes.text()
      console.error("Cloudinary upload failed:", cloudErr)
      return NextResponse.json({ error: "Failed to upload image." }, { status: 500 })
    }

    const cloudData = await cloudRes.json()

    return NextResponse.json({
      secure_url: cloudData.secure_url,
      public_id: cloudData.public_id
    }, { status: 201 })

  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json({ error: "Failed to process image upload." }, { status: 500 })
  }
}
