
import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions'
    `);
    
    return NextResponse.json({
      columns: columns.rows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
