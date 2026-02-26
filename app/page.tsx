import { HomeClient } from "./home-client"
import { query } from "@/lib/database"

const MAJOR_SLUGS = [
  "surgery(miniosce)",
  "pediatric(miniosce)",
  "obs-&-gyn(miniosce)",
  "internal-medicine(miniosce)",
  "surgery(final)",
  "obs-&-gyn(final)",
  "internal-medicine(final)",
  "pediatric(final)"
];
const MINOR_4TH_SLUGS = ["anesthesia", "forensic", "radiology"]

async function getStats() {
  try {
    const [coursesRes, subjectsRes, questionsRes] = await Promise.all([
      query(`SELECT count(*) as count FROM courses WHERE active = true`),
      query(`SELECT count(*) as count FROM subjects WHERE active = true`),
      query(`SELECT count(*) as count FROM questions WHERE active = true`),
    ])

    return {
      total_courses: parseInt(coursesRes.rows[0].count, 10),
      total_subjects: parseInt(subjectsRes.rows[0].count, 10),
      total_questions: parseInt(questionsRes.rows[0].count, 10),
    }
  } catch (error) {
    console.error("Failed to fetch stats for home page:", error)
    return null
  }
}

async function getCourses() {
  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.course as name, 
        c.description, 
        c.about, 
        c.active as is_active, 
        c.background as hero_image,
        c.public_id,
        LOWER(REPLACE(c.course, ' ', '-')) as slug,
        (SELECT count(*) FROM subjects s WHERE s.course_id = c.id AND s.active = true) as total_subjects,
        (SELECT count(*) FROM questions q JOIN subjects s ON q.subject_id = s.id WHERE s.course_id = c.id AND s.active = true AND q.active = true) as total_questions
      FROM courses c
      WHERE c.active = true
      ORDER BY c.id ASC
    `)
    return res.rows
  } catch (error) {
    console.error("Failed to fetch courses for home page:", error)
    return []
  }
}

export default async function HomePage() {
  const [activeCourses, stats] = await Promise.all([
    getCourses(),
    getStats(),
  ])

  const majors = activeCourses.filter((c: any) => MAJOR_SLUGS.includes(c.slug))
  const minors4th = activeCourses.filter((c: any) => MINOR_4TH_SLUGS.includes(c.slug))
  const minors5th = activeCourses.filter((c: any) => !MAJOR_SLUGS.includes(c.slug) && !MINOR_4TH_SLUGS.includes(c.slug))

  return (
    <HomeClient
      majors={majors}
      minors4th={minors4th}
      minors5th={minors5th}
      stats={stats}
    />
  )
}
