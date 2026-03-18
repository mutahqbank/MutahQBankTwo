import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getServerUser } from "@/lib/auth-server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let { id } = await params
  if (Array.isArray(id)) {
    id = id[0]
  }
  const numericId = Number(id)
  
  console.log(`PATCH Kitchen Question [${numericId}] - Start`);

  if (!numericId || isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  try {
    const body = await request.json()
    console.log(`PATCH Body:`, JSON.stringify(body));
    const { 
      status, 
      subject_id, 
      question, 
      explanation,
      active,
      type_id
    } = body

    // 1. Fetch current question to check ownership/permissions
    const currentQ = await query("SELECT course_id FROM questions WHERE id = $1", [numericId])
    if (currentQ.rows.length === 0) {
      console.log(`PATCH Error: Question [${numericId}] not found`);
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    
    const courseId = currentQ.rows[0].course_id
    const courseResult = await query("SELECT course FROM courses WHERE id = $1", [courseId])
    
    if (courseResult.rows.length === 0) {
      console.log(`PATCH Error: Course [${courseId}] not found for question [${numericId}]`);
      return NextResponse.json({ error: "Course not found", details: `Course ID ${courseId} is missing` }, { status: 404 })
    }

    const courseName = courseResult.rows[0].course
    console.log(`Question [${numericId}] Course ID: ${courseId}, Course Name: ${courseName}`);

    if (user.role === "instructor") {
      const allowed = (user.allowed_courses || []).map((c: string) => c.toLowerCase())
      if (!allowed.includes(courseName.toLowerCase())) {
        console.log(`PATCH Error: Forbidden for instructor [${user.id}]. Course "${courseName}" not in [${allowed.join(', ')}]`);
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // 2. Build Update SQL
    const updates: string[] = []
    const values: any[] = []
    let i = 1

    console.log(`Processing updates for question [${id}]`);

    if (status !== undefined) {
      updates.push(`status = $${i++}`)
      values.push(status)
      console.log(`- Status: ${status}`);
    }
    if (subject_id !== undefined) {
      const numericSubjectId = subject_id === null ? null : Number(subject_id);
      updates.push(`subject_id = $${i++}`)
      values.push(numericSubjectId)
      console.log(`- Subject ID: ${numericSubjectId}`);
    }
    if (question !== undefined) {
      updates.push(`question = $${i++}`)
      values.push(question)
      console.log(`- Question (truncated): ${question.substring(0, 50)}...`);
    }
    if (explanation !== undefined) {
      // Ensure explanation is never null if the column is NOT NULL
      updates.push(`explanation = $${i++}`)
      values.push(explanation || "")
      console.log(`- Explanation (truncated): ${(explanation || "").substring(0, 50)}...`);
    }
    if (active !== undefined) {
      updates.push(`active = $${i++}`)
      values.push(Boolean(active))
      console.log(`- Active: ${active}`);
    }
    if (type_id !== undefined) {
      updates.push(`type_id = $${i++}`)
      values.push(type_id === null ? null : Number(type_id))
      console.log(`- Type ID: ${type_id}`);
    }

    if (updates.length === 0) {
      console.log("No updates requested");
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    values.push(Number(id))
    const updateSql = `
      UPDATE questions 
      SET ${updates.join(", ")}
      WHERE id = $${i}
    `;
    console.log(`Executing SQL: ${updateSql}`);
    console.log(`SQL Values:`, JSON.stringify(values));

    await query(updateSql, values)

    // 3. Update Options if provided
    if (body.options && Array.isArray(body.options)) {
      const { options, correct_index } = body
      console.log(`Updating options for question [${id}]. Count: ${options.length}, Correct Index: ${correct_index}`);
      
      // Delete old options
      await query("DELETE FROM options WHERE question_id = $1", [Number(id)])
      
      // Insert new options
      for (let j = 0; j < options.length; j++) {
        // Handle both string and object options just in case
        const optionText = typeof options[j] === 'string' ? options[j] : (options[j].option || options[j].text || "");
        const isCorrect = correct_index !== undefined ? (j === Number(correct_index)) : (options[j].correct || false);
        
        await query(`
          INSERT INTO options (question_id, option, correct)
          VALUES ($1, $2, $3)
        `, [Number(id), optionText, isCorrect])
      }
    }

    console.log(`PATCH Kitchen Question [${id}] - Success`);
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`PATCH ERROR [Question ${id}]:`, error.message);
    if (error.stack) console.error(error.stack);
    
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error.message,
      code: error.code || "UNKNOWN"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getServerUser()
  if (!user || (user.role !== "admin" && user.role !== "instructor")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let { id } = await params
  if (Array.isArray(id)) {
    id = id[0]
  }
  const numericId = Number(id)

  try {
    const currentQ = await query("SELECT course_id FROM questions WHERE id = $1", [numericId])
    if (currentQ.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    const courseId = currentQ.rows[0].course_id
    const courseResult = await query("SELECT course FROM courses WHERE id = $1", [courseId])
    if (user.role === "instructor") {
      const allowed = (user.allowed_courses || []).map((c: string) => c.toLowerCase())
      if (!allowed.includes(courseResult.rows[0].course.toLowerCase())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    await query("DELETE FROM questions WHERE id = $1", [numericId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete kitchen question:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
