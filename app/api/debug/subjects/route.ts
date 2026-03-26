import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export async function GET() {
  try {
    const res = await query(`
      SELECT s.id, s.subject, c.course, s.active, s.is_restricted 
      FROM subjects s 
      JOIN courses c ON s.course_id = c.id 
      WHERE c.course ILIKE '%Pediatric%'
    `);
    
    // Group by course
    const grouped = res.rows.reduce((acc: any, s: any) => {
      if (!acc[s.course]) acc[s.course] = [];
      acc[s.course].push(s);
      return acc;
    }, {});

    return NextResponse.json({ 
      coursesMatched: Object.keys(grouped),
      counts: Object.keys(grouped).map(c => ({ course: c, count: grouped[c].length })),
      subjects: grouped 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
