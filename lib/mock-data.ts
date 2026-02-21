import type {
  User, Course, Subject, Question, Session,
  SubscriptionPackage, Transaction, Feed, Comment, CBQSubQuestion
} from "./types"

// ===== USERS =====
export const mockUsers: User[] = [
  { id: 1, username: "ibrahim", email: "ibrahim.mohanad.zubaidi@gmail.com", full_name: "Ibrahim Zubaidi", phone: "+962790036378", role: "admin", is_banned: false, created_at: "2025-01-15T10:00:00Z", updated_at: "2026-02-15T10:00:00Z", last_login: "2026-02-15T08:00:00Z" },
  { id: 2, username: "mkbnat", email: "mkabanat@gmail.com", full_name: "Mohammad Kabanat", phone: "+962778101941", role: "admin", is_banned: false, created_at: "2025-01-15T10:00:00Z", updated_at: "2026-02-15T10:00:00Z", last_login: "2026-02-15T09:00:00Z" },
  { id: 3, username: "radwan", email: "radwan@gmail.com", full_name: "Mohammad Radwan Alzuraiqi", phone: "+962796198217", role: "admin", is_banned: false, created_at: "2025-01-15T10:00:00Z", updated_at: "2026-02-15T10:00:00Z", last_login: "2026-02-14T20:00:00Z" },
  { id: 5, username: "zhraa", email: "alzhraalmayti@gmail.com", full_name: "Alzhraa Almaitah", phone: "+962790555298", role: "user", is_banned: false, created_at: "2025-08-20T14:30:00Z", updated_at: "2026-02-10T10:00:00Z", last_login: "2026-02-15T10:00:00Z" },
  { id: 6, username: "hadeelm125", email: "hadeel.m125@gmail.com", full_name: "Hadeel Mahmoud", phone: "+962791234567", role: "user", is_banned: false, created_at: "2025-09-01T09:00:00Z", updated_at: "2026-02-15T10:00:00Z", last_login: "2026-02-15T07:00:00Z" },
  { id: 7, username: "nabakhta", email: "nabakhta@gmail.com", full_name: "Naba Khta", phone: "+962792345678", role: "user", is_banned: false, created_at: "2025-09-10T11:00:00Z", updated_at: "2026-02-15T10:00:00Z", last_login: "2026-02-15T06:00:00Z" },
  { id: 8, username: "tmtmtm", email: "tmtm@gmail.com", full_name: "Tamam Tamam", phone: "+962793456789", role: "user", is_banned: false, created_at: "2025-09-15T08:00:00Z", updated_at: "2026-02-15T10:00:00Z", last_login: "2026-02-14T22:00:00Z" },
  { id: 9, username: "ahmad_ali", email: "ahmad.ali@gmail.com", full_name: "Ahmad Ali", phone: "+962794567890", role: "user", is_banned: false, created_at: "2025-09-20T12:00:00Z", updated_at: "2026-02-13T10:00:00Z", last_login: "2026-02-13T10:00:00Z" },
  { id: 10, username: "haya", email: "haya.sarayrah1@gmail.com", full_name: "Haya Sarayrah", phone: "+962795678901", role: "user", is_banned: false, created_at: "2025-10-01T10:00:00Z", updated_at: "2026-02-12T10:00:00Z", last_login: "2026-02-12T10:00:00Z" },
  { id: 11, username: "sarahs", email: "sarah.s@gmail.com", full_name: "Sarah Suleiman", phone: "+962796789012", role: "user", is_banned: false, created_at: "2025-10-05T14:00:00Z", updated_at: "2026-02-11T10:00:00Z", last_login: "2026-02-11T10:00:00Z" },
  { id: 12, username: "omar_h", email: "omar.h@gmail.com", full_name: "Omar Hassan", phone: "+962797890123", role: "user", is_banned: true, created_at: "2025-10-10T09:00:00Z", updated_at: "2026-01-20T10:00:00Z", last_login: "2026-01-20T10:00:00Z" },
  { id: 13, username: "lujain", email: "lujain@gmail.com", full_name: "Lujain Mohammad", phone: "+962798901234", role: "user", is_banned: false, created_at: "2025-10-15T11:00:00Z", updated_at: "2026-02-10T10:00:00Z", last_login: "2026-02-10T10:00:00Z" },
  { id: 14, username: "boshraomoush", email: "boshra.o@gmail.com", full_name: "Boshra Omoush", phone: "+962790012345", role: "user", is_banned: false, created_at: "2025-10-20T10:00:00Z", updated_at: "2026-02-09T10:00:00Z", last_login: "2026-02-09T10:00:00Z" },
  { id: 15, username: "randmadadha_9", email: "rand.m@gmail.com", full_name: "Rand Madadha", phone: "+962791123456", role: "user", is_banned: false, created_at: "2025-10-25T13:00:00Z", updated_at: "2026-02-08T10:00:00Z", last_login: "2026-02-08T10:00:00Z" },
  { id: 16, username: "asia", email: "asia@gmail.com", full_name: "Asia Khalid", phone: "+962792234567", role: "user", is_banned: false, created_at: "2025-11-01T08:00:00Z", updated_at: "2026-02-07T10:00:00Z", last_login: "2026-02-07T10:00:00Z" },
  { id: 17, username: "dina_r", email: "dina.r@gmail.com", full_name: "Dina Rawashdeh", phone: "+962793345678", role: "user", is_banned: false, created_at: "2025-11-05T10:00:00Z", updated_at: "2026-02-06T10:00:00Z", last_login: "2026-02-06T10:00:00Z" },
  { id: 18, username: "moh_khaled", email: "moh.k@gmail.com", full_name: "Mohammad Khaled", phone: "+962794456789", role: "user", is_banned: false, created_at: "2025-11-10T12:00:00Z", updated_at: "2026-02-05T10:00:00Z", last_login: "2026-02-05T10:00:00Z" },
  { id: 19, username: "yasmin_a", email: "yasmin.a@gmail.com", full_name: "Yasmin Abu Samra", phone: "+962795567890", role: "user", is_banned: false, created_at: "2025-11-15T14:00:00Z", updated_at: "2026-02-04T10:00:00Z", last_login: "2026-02-04T10:00:00Z" },
  { id: 20, username: "faris_q", email: "faris.q@gmail.com", full_name: "Faris Qasem", phone: "+962796678901", role: "user", is_banned: false, created_at: "2025-11-20T09:00:00Z", updated_at: "2026-02-03T10:00:00Z", last_login: "2026-02-03T10:00:00Z" },
  { id: 21, username: "noor_s", email: "noor.s@gmail.com", full_name: "Noor Safa", phone: "+962797789012", role: "user", is_banned: false, created_at: "2025-11-25T11:00:00Z", updated_at: "2026-02-02T10:00:00Z", last_login: "2026-02-02T10:00:00Z" },
  { id: 22, username: "amal_j", email: "amal.j@gmail.com", full_name: "Amal Jarrar", phone: "+962798890123", role: "user", is_banned: false, created_at: "2025-12-01T10:00:00Z", updated_at: "2026-02-01T10:00:00Z", last_login: "2026-02-01T10:00:00Z" },
  { id: 23, username: "khaled_m", email: "khaled.m@gmail.com", full_name: "Khaled Mansour", phone: "+962790901234", role: "user", is_banned: false, created_at: "2025-12-05T13:00:00Z", updated_at: "2026-01-31T10:00:00Z", last_login: "2026-01-31T10:00:00Z" },
  { id: 24, username: "reem_t", email: "reem.t@gmail.com", full_name: "Reem Tawalbeh", phone: "+962791012345", role: "user", is_banned: false, created_at: "2025-12-10T08:00:00Z", updated_at: "2026-01-30T10:00:00Z", last_login: "2026-01-30T10:00:00Z" },
  { id: 25, username: "sami_b", email: "sami.b@gmail.com", full_name: "Sami Batayneh", phone: "+962792123456", role: "user", is_banned: false, created_at: "2025-12-15T10:00:00Z", updated_at: "2026-01-29T10:00:00Z", last_login: "2026-01-29T10:00:00Z" },
  { id: 26, username: "layla_z", email: "layla.z@gmail.com", full_name: "Layla Zughayer", phone: "+962793234567", role: "user", is_banned: false, created_at: "2025-12-20T12:00:00Z", updated_at: "2026-01-28T10:00:00Z", last_login: "2026-01-28T10:00:00Z" },
  { id: 27, username: "tariq_n", email: "tariq.n@gmail.com", full_name: "Tariq Nasser", phone: "+962794345678", role: "user", is_banned: false, created_at: "2025-12-25T14:00:00Z", updated_at: "2026-01-27T10:00:00Z", last_login: "2026-01-27T10:00:00Z" },
  { id: 28, username: "rana_k", email: "rana.k@gmail.com", full_name: "Rana Khatatbeh", phone: "+962795456789", role: "user", is_banned: false, created_at: "2026-01-01T09:00:00Z", updated_at: "2026-01-26T10:00:00Z", last_login: "2026-01-26T10:00:00Z" },
  { id: 29, username: "waleed_a", email: "waleed.a@gmail.com", full_name: "Waleed Abu Zaid", phone: "+962796567890", role: "user", is_banned: false, created_at: "2026-01-05T11:00:00Z", updated_at: "2026-01-25T10:00:00Z", last_login: "2026-01-25T10:00:00Z" },
  { id: 30, username: "maysa_h", email: "maysa.h@gmail.com", full_name: "Maysa Haddad", phone: "+962797678901", role: "user", is_banned: false, created_at: "2026-01-10T10:00:00Z", updated_at: "2026-01-24T10:00:00Z", last_login: "2026-01-24T10:00:00Z" },
  { id: 31, username: "jaber_y", email: "jaber.y@gmail.com", full_name: "Jaber Yousef", phone: "+962798789012", role: "user", is_banned: false, created_at: "2026-01-15T13:00:00Z", updated_at: "2026-01-23T10:00:00Z", last_login: "2026-01-23T10:00:00Z" },
  { id: 32, username: "hanan_d", email: "hanan.d@gmail.com", full_name: "Hanan Darwish", phone: "+962790890123", role: "user", is_banned: false, created_at: "2026-01-20T08:00:00Z", updated_at: "2026-01-22T10:00:00Z", last_login: "2026-01-22T10:00:00Z" },
]

// ===== COURSES =====
export const mockCourses: Course[] = [
  { id: 1, name: "Psychiatry", slug: "psychiatry", description: "We've gone through all Psychiatry exam archives, verified the content, and reorganized every question into clear, specific topics\u2014so you can study faster and smarter. The bank lets you drill by topic or run mixed, exam-style sessions, with accurate keys and concise explanatory notes where available.", hero_image: "/images/courses/psychiatry.jpg", status_line: "Mini-OSCE: Ready to practice | Final: Countdown in progress", price_individual: 5, price_group: 3, total_subjects: 28, total_questions: 690, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 166, current_subscriptions: 12, is_active: true, display_order: 1 },
  { id: 2, name: "Neurosurgery", slug: "neurosurgery", description: "Comprehensive neurosurgery question bank covering brain tumors, spinal disorders, traumatic brain injuries, and surgical techniques. Each question is carefully organized by topic with detailed explanations.", hero_image: "/images/courses/neurosurgery.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 5, price_group: 3, total_subjects: 15, total_questions: 320, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 89, current_subscriptions: 8, is_active: true, display_order: 2 },
  { id: 3, name: "Ophthalmology", slug: "ophthalmology", description: "Complete ophthalmology question bank with questions on refractive errors, glaucoma, retinal diseases, and ocular emergencies. Step-by-step explanations included.", hero_image: "/images/courses/ophthalmology.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 5, price_group: 3, total_subjects: 22, total_questions: 480, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 134, current_subscriptions: 15, is_active: true, display_order: 3 },
  { id: 4, name: "Orthopedic", slug: "orthopedic", description: "Thorough orthopedic question bank covering fractures, joint disorders, sports injuries, and musculoskeletal pathology. Organized by anatomical region and topic.", hero_image: "/images/courses/orthopedic.jpg", status_line: "Mini-OSCE: Ready | Final: Countdown in progress", price_individual: 5, price_group: 3, total_subjects: 30, total_questions: 520, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 145, current_subscriptions: 10, is_active: true, display_order: 4 },
  { id: 5, name: "Neuromedicine", slug: "neuromedicine", description: "We've gone through all Neuromedicine exam archives, verified the content, and reorganized every question into clear, specific topics\u2014so you can study faster and smarter. The bank lets you drill by topic or run mixed, exam-style sessions, with accurate keys and concise explanatory notes where available.", hero_image: "/images/courses/neuromedicine.jpg", status_line: "Mini-OSCE: Ready to practice | Final: Countdown in progress", price_individual: 5, price_group: 3, total_subjects: 28, total_questions: 690, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 166, current_subscriptions: 14, is_active: true, display_order: 5 },
  { id: 6, name: "ENT", slug: "ent", description: "Ear, Nose, and Throat question bank covering otology, rhinology, laryngology, and head & neck surgery. Comprehensive coverage of common ENT conditions.", hero_image: "/images/courses/ent.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 7, price_group: 5, total_subjects: 35, total_questions: 780, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 198, current_subscriptions: 22, is_active: true, display_order: 6 },
  { id: 7, name: "Family Medicine", slug: "family-medicine", description: "Family medicine question bank covering preventive care, chronic disease management, patient counseling, and community health. Perfect for primary care rotations.", hero_image: "/images/courses/family-medicine.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 5, price_group: 3, total_subjects: 25, total_questions: 410, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 112, current_subscriptions: 9, is_active: true, display_order: 7 },
  { id: 8, name: "Urology", slug: "urology", description: "Urology question bank with coverage of renal diseases, urinary tract conditions, male reproductive health, and urological procedures.", hero_image: "/images/courses/urology.jpg", status_line: "Mini-OSCE: Ready | Final: Countdown in progress", price_individual: 5, price_group: 3, total_subjects: 18, total_questions: 290, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 78, current_subscriptions: 6, is_active: true, display_order: 8 },
  { id: 9, name: "Dermatology", slug: "dermatology", description: "Dermatology question bank covering skin infections, autoimmune conditions, skin cancers, and dermatological procedures. Includes clinical image-based questions.", hero_image: "/images/courses/dermatology.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 5, price_group: 3, total_subjects: 20, total_questions: 350, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 95, current_subscriptions: 11, is_active: true, display_order: 9 },
  { id: 10, name: "Forensic", slug: "forensic", description: "Forensic medicine question bank covering medicolegal aspects, toxicology, forensic pathology, and legal medicine. Essential for medicolegal practice.", hero_image: "/images/courses/forensic.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 3, price_group: 2, total_subjects: 12, total_questions: 180, has_explanations: true, has_timed_exams: false, all_time_subscriptions: 45, current_subscriptions: 3, is_active: true, display_order: 10 },
  { id: 11, name: "Anesthesia", slug: "anesthesia", description: "Anesthesia question bank covering general and regional anesthesia, pain management, critical care, and perioperative medicine.", hero_image: "/images/courses/anesthesia.jpg", status_line: "Mini-OSCE: Ready | Final: Countdown in progress", price_individual: 5, price_group: 3, total_subjects: 16, total_questions: 260, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 72, current_subscriptions: 5, is_active: true, display_order: 11 },
  { id: 12, name: "Surgery", slug: "surgery", description: "General surgery question bank covering GI surgery, trauma, vascular surgery, endocrine surgery, and surgical principles. Comprehensive exam preparation.", hero_image: "/images/courses/surgery.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 7, price_group: 5, total_subjects: 40, total_questions: 890, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 210, current_subscriptions: 25, is_active: true, display_order: 12 },
  { id: 13, name: "Pediatric", slug: "pediatric", description: "Pediatric question bank covering neonatology, growth & development, infectious diseases, pediatric emergencies, and subspecialties. Includes hierarchical subject organization.", hero_image: "/images/courses/pediatric.jpg", status_line: "Mini-OSCE: Ready | Final: Countdown in progress", price_individual: 7, price_group: 5, total_subjects: 45, total_questions: 1026, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 245, current_subscriptions: 30, is_active: true, display_order: 13 },
  { id: 14, name: "OBS & GYN", slug: "obs-gyn", description: "Obstetrics and Gynecology question bank covering pregnancy, labor & delivery, gynecological conditions, reproductive endocrinology, and maternal-fetal medicine.", hero_image: "/images/courses/obs-gyn.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 7, price_group: 5, total_subjects: 38, total_questions: 850, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 230, current_subscriptions: 28, is_active: true, display_order: 14 },
  { id: 15, name: "Internal Medicine", slug: "internal-medicine", description: "Internal medicine question bank covering cardiology, pulmonology, gastroenterology, nephrology, hematology, and other internal medicine subspecialties.", hero_image: "/images/courses/internal-medicine.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 10, price_group: 7, total_subjects: 50, total_questions: 1200, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 280, current_subscriptions: 35, is_active: true, display_order: 15 },
  { id: 16, name: "Radiology", slug: "radiology", description: "Radiology question bank covering X-ray interpretation, CT scans, MRI, ultrasound, and nuclear medicine. Image-based questions for diagnostic skill building.", hero_image: "/images/courses/radiology.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 5, price_group: 3, total_subjects: 14, total_questions: 220, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 65, current_subscriptions: 4, is_active: true, display_order: 16 },
  { id: 17, name: "Pharmacology", slug: "pharmacology", description: "Pharmacology question bank covering drug mechanisms, pharmacokinetics, drug interactions, and clinical pharmacology across all medical specialties.", hero_image: "/images/courses/pharmacology.jpg", status_line: "Mini-OSCE: Ready | Final: Countdown in progress", price_individual: 5, price_group: 3, total_subjects: 18, total_questions: 310, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 88, current_subscriptions: 7, is_active: true, display_order: 17 },
  { id: 18, name: "Pathology", slug: "pathology", description: "Pathology question bank covering general pathology, systemic pathology, histopathology, and clinical pathology. Foundation for understanding disease processes.", hero_image: "/images/courses/pathology.jpg", status_line: "Mini-OSCE: Ready | Final: Ready", price_individual: 5, price_group: 3, total_subjects: 20, total_questions: 380, has_explanations: true, has_timed_exams: true, all_time_subscriptions: 102, current_subscriptions: 8, is_active: true, display_order: 18 },
]

// ===== SUBJECTS (sample per course) =====
export const mockSubjects: Subject[] = [
  // Neuromedicine (course 5) - flat structure
  { id: 1, course_id: 5, parent_subject_id: null, name: "Consciousness abnormalities", display_order: 1, has_children: false, is_expandable: false, year_specific: null, question_count: 25 },
  { id: 2, course_id: 5, parent_subject_id: null, name: "Visual abnormalities", display_order: 2, has_children: false, is_expandable: false, year_specific: null, question_count: 30 },
  { id: 3, course_id: 5, parent_subject_id: null, name: "Speech abnormalities", display_order: 3, has_children: false, is_expandable: false, year_specific: null, question_count: 18 },
  { id: 4, course_id: 5, parent_subject_id: null, name: "Motor abnormalities", display_order: 4, has_children: false, is_expandable: false, year_specific: null, question_count: 35 },
  { id: 5, course_id: 5, parent_subject_id: null, name: "Consciousness assessment GCS", display_order: 5, has_children: false, is_expandable: false, year_specific: null, question_count: 20 },
  { id: 6, course_id: 5, parent_subject_id: null, name: "Mini-Mental Status Exam", display_order: 6, has_children: false, is_expandable: false, year_specific: null, question_count: 15 },
  { id: 7, course_id: 5, parent_subject_id: null, name: "Cranial nerve examination", display_order: 7, has_children: false, is_expandable: false, year_specific: null, question_count: 40 },
  { id: 8, course_id: 5, parent_subject_id: null, name: "Headache", display_order: 8, has_children: false, is_expandable: false, year_specific: null, question_count: 45 },
  { id: 9, course_id: 5, parent_subject_id: null, name: "Epilepsy", display_order: 9, has_children: false, is_expandable: false, year_specific: null, question_count: 38 },
  { id: 10, course_id: 5, parent_subject_id: null, name: "Stroke", display_order: 10, has_children: false, is_expandable: false, year_specific: null, question_count: 50 },
  { id: 11, course_id: 5, parent_subject_id: null, name: "Multiple sclerosis", display_order: 11, has_children: false, is_expandable: false, year_specific: null, question_count: 28 },
  { id: 12, course_id: 5, parent_subject_id: null, name: "Meningitis", display_order: 12, has_children: false, is_expandable: false, year_specific: null, question_count: 17 },
  // Pediatric (course 13) - hierarchical structure
  { id: 100, course_id: 13, parent_subject_id: null, name: "Neurology", display_order: 1, has_children: true, is_expandable: true, year_specific: null, question_count: 120 },
  { id: 101, course_id: 13, parent_subject_id: 100, name: "Developmental assessment", display_order: 1, has_children: false, is_expandable: false, year_specific: null, question_count: 25 },
  { id: 102, course_id: 13, parent_subject_id: 100, name: "Immunization", display_order: 2, has_children: false, is_expandable: false, year_specific: null, question_count: 30 },
  { id: 103, course_id: 13, parent_subject_id: 100, name: "Epilepsy", display_order: 3, has_children: false, is_expandable: false, year_specific: null, question_count: 35 },
  { id: 104, course_id: 13, parent_subject_id: 100, name: "Febrile seizures & Status epilepticus", display_order: 4, has_children: false, is_expandable: false, year_specific: null, question_count: 30 },
  { id: 110, course_id: 13, parent_subject_id: null, name: "Neonatology", display_order: 2, has_children: true, is_expandable: true, year_specific: null, question_count: 90 },
  { id: 111, course_id: 13, parent_subject_id: 110, name: "Neonatal history", display_order: 1, has_children: false, is_expandable: false, year_specific: null, question_count: 20 },
  { id: 112, course_id: 13, parent_subject_id: 110, name: "Neonatal Jaundice", display_order: 2, has_children: false, is_expandable: false, year_specific: null, question_count: 35 },
  { id: 113, course_id: 13, parent_subject_id: 110, name: "Respiratory distress syndrome", display_order: 3, has_children: false, is_expandable: false, year_specific: null, question_count: 35 },
  { id: 120, course_id: 13, parent_subject_id: null, name: "Cardiology", display_order: 3, has_children: true, is_expandable: true, year_specific: null, question_count: 80 },
  { id: 121, course_id: 13, parent_subject_id: 120, name: "Congenital heart disease", display_order: 1, has_children: false, is_expandable: false, year_specific: null, question_count: 40 },
  { id: 122, course_id: 13, parent_subject_id: 120, name: "Rheumatic fever", display_order: 2, has_children: false, is_expandable: false, year_specific: null, question_count: 20 },
  { id: 123, course_id: 13, parent_subject_id: 120, name: "Kawasaki disease", display_order: 3, has_children: false, is_expandable: false, year_specific: null, question_count: 20 },
  { id: 130, course_id: 13, parent_subject_id: null, name: "Gastroenterology", display_order: 4, has_children: false, is_expandable: false, year_specific: null, question_count: 65 },
  { id: 131, course_id: 13, parent_subject_id: null, name: "Nephrology", display_order: 5, has_children: false, is_expandable: false, year_specific: null, question_count: 55 },
  { id: 132, course_id: 13, parent_subject_id: null, name: "Hematology", display_order: 6, has_children: false, is_expandable: false, year_specific: null, question_count: 70 },
  { id: 133, course_id: 13, parent_subject_id: null, name: "Infectious diseases", display_order: 7, has_children: false, is_expandable: false, year_specific: null, question_count: 85 },
  { id: 134, course_id: 13, parent_subject_id: null, name: "Endocrinology", display_order: 8, has_children: false, is_expandable: false, year_specific: "6th year", question_count: 45 },
  // ENT (course 6) - flat
  { id: 200, course_id: 6, parent_subject_id: null, name: "Otitis media", display_order: 1, has_children: false, is_expandable: false, year_specific: null, question_count: 30 },
  { id: 201, course_id: 6, parent_subject_id: null, name: "Hearing loss", display_order: 2, has_children: false, is_expandable: false, year_specific: null, question_count: 25 },
  { id: 202, course_id: 6, parent_subject_id: null, name: "Vertigo and balance disorders", display_order: 3, has_children: false, is_expandable: false, year_specific: null, question_count: 35 },
  { id: 203, course_id: 6, parent_subject_id: null, name: "Sinusitis", display_order: 4, has_children: false, is_expandable: false, year_specific: null, question_count: 20 },
  { id: 204, course_id: 6, parent_subject_id: null, name: "Tonsillitis and adenoids", display_order: 5, has_children: false, is_expandable: false, year_specific: null, question_count: 22 },
  { id: 205, course_id: 6, parent_subject_id: null, name: "Laryngeal disorders", display_order: 6, has_children: false, is_expandable: false, year_specific: null, question_count: 28 },
  { id: 206, course_id: 6, parent_subject_id: null, name: "Nasal polyps", display_order: 7, has_children: false, is_expandable: false, year_specific: null, question_count: 15 },
  { id: 207, course_id: 6, parent_subject_id: null, name: "Head and neck tumors", display_order: 8, has_children: false, is_expandable: false, year_specific: null, question_count: 40 },
]

// ===== QUESTIONS (sample) =====
export const mockQuestions: Question[] = [
  // MCQ Questions for ENT
  {
    id: 1001, course_id: 6, subject_id: 202, question_type: "mcq", exam_type: "Final",
    question_text: "Which disease causes unilateral sensorineural hearing loss and tinnitus?",
    option_a: "M\u00e9ni\u00e8re's disease", option_b: "Benign paroxysmal positional vertigo (BPPV)",
    option_c: "Vestibular neuritis", option_d: "Labyrinthitis", option_e: "Multiple sclerosis",
    correct_answer_index: 0, case_presentation: null,
    explanation_html: `<p><strong>M\u00e9ni\u00e8re's disease</strong> is the condition that classically presents with the triad of <strong>recurrent vertigo</strong>, <strong>unilateral sensorineural hearing loss</strong>, and <strong>tinnitus</strong> (\u00b1 aural fullness). It is due to <strong>endolymphatic hydrops</strong>, an abnormal accumulation of endolymphatic fluid in the inner ear.</p><p>Vertigo episodes last minutes to hours. Hearing loss is typically fluctuating at first but may progress to permanent unilateral sensorineural hearing loss.</p><h3 style="color:#28a745">Why the correct answer is right:</h3><p>M\u00e9ni\u00e8re's disease uniquely combines <strong>both auditory and vestibular symptoms</strong>.</p><h3 style="color:#dc3545">Why the other choices are wrong:</h3><ul><li><strong>BPPV:</strong> Brief positional vertigo with NO hearing loss or tinnitus</li><li><strong>Vestibular neuritis:</strong> Prolonged vertigo but NO hearing loss</li><li><strong>Labyrinthitis:</strong> Vertigo WITH hearing loss, but usually viral and self-limiting</li><li><strong>Multiple sclerosis:</strong> Can cause vertigo but rarely isolated hearing loss with tinnitus</li></ul><table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;margin-top:16px"><caption><strong>High-Yield Table: Vertigo + Hearing Loss Patterns</strong></caption><thead style="background:#1a2332;color:white"><tr><th>Condition</th><th>Vertigo</th><th>Hearing Loss</th><th>Tinnitus</th><th>Key Point</th></tr></thead><tbody><tr><td>M\u00e9ni\u00e8re's</td><td>Recurrent</td><td>Unilateral SNHL</td><td>Present</td><td>Classic triad</td></tr><tr><td>BPPV</td><td>Brief, positional</td><td>Absent</td><td>Absent</td><td>No auditory symptoms</td></tr><tr><td>Vestibular neuritis</td><td>Prolonged</td><td>Absent</td><td>Absent</td><td>Pure vestibular</td></tr><tr><td>Labyrinthitis</td><td>Prolonged</td><td>Present</td><td>May be present</td><td>Infection-related</td></tr></tbody></table>`,
    has_images: false, is_flagged: false,
    stat_option_a: 91.84, stat_option_b: 3.06, stat_option_c: 3.57, stat_option_d: 1.02, stat_option_e: 0.51,
  },
  {
    id: 1002, course_id: 6, subject_id: 200, question_type: "mcq", exam_type: "Mini-OSCE",
    question_text: "A 5-year-old child presents with ear pain, fever, and decreased hearing in the right ear. Otoscopic examination reveals a bulging, erythematous tympanic membrane. What is the most likely diagnosis?",
    option_a: "Acute otitis media", option_b: "Otitis externa",
    option_c: "Cholesteatoma", option_d: "Serous otitis media", option_e: "Tympanosclerosis",
    correct_answer_index: 0, case_presentation: null,
    explanation_html: `<p><strong>Acute otitis media (AOM)</strong> is the most common diagnosis in a child presenting with ear pain, fever, and a bulging erythematous tympanic membrane.</p><p>AOM is caused by bacterial or viral infection of the middle ear, most commonly following an upper respiratory tract infection.</p><h3 style="color:#28a745">Key features of AOM:</h3><ul><li>Ear pain (otalgia)</li><li>Fever</li><li>Bulging, erythematous tympanic membrane</li><li>Decreased hearing</li><li>Possible otorrhea if TM perforates</li></ul>`,
    has_images: false, is_flagged: false,
    stat_option_a: 88.50, stat_option_b: 5.20, stat_option_c: 2.10, stat_option_d: 3.50, stat_option_e: 0.70,
  },
  {
    id: 1003, course_id: 5, subject_id: 12, question_type: "mcq", exam_type: "Final",
    question_text: "A 2-year-old child presents with high fever, neck stiffness, and a positive Brudzinski sign. CSF analysis shows elevated WBC with neutrophilic predominance, decreased glucose, and elevated protein. What is the most likely diagnosis?",
    option_a: "Viral meningitis", option_b: "Acute bacterial meningitis",
    option_c: "Tuberculous meningitis", option_d: "Fungal meningitis", option_e: "Brain abscess",
    correct_answer_index: 1, case_presentation: null,
    explanation_html: `<p><strong>Acute bacterial meningitis</strong> is characterized by the triad of fever, neck stiffness, and altered mental status. In children, irritability, poor feeding, and bulging fontanelle may be additional signs.</p><p>CSF findings in bacterial meningitis:</p><ul><li>Elevated WBC (100-10,000 cells/\u00b5L) with neutrophilic predominance</li><li>Decreased glucose (&lt;40 mg/dL or CSF/serum ratio &lt;0.4)</li><li>Elevated protein (&gt;45 mg/dL)</li><li>Positive Gram stain and culture</li></ul>`,
    has_images: false, is_flagged: false,
    stat_option_a: 4.20, stat_option_b: 85.70, stat_option_c: 5.30, stat_option_d: 2.80, stat_option_e: 2.00,
  },
  {
    id: 1004, course_id: 5, subject_id: 10, question_type: "mcq", exam_type: "Final",
    question_text: "A 65-year-old male with a history of atrial fibrillation presents with sudden onset right-sided hemiplegia and aphasia. CT scan of the brain is normal. What is the most appropriate next step?",
    option_a: "Repeat CT in 24 hours", option_b: "MRI brain with diffusion-weighted imaging",
    option_c: "Lumbar puncture", option_d: "Carotid Doppler ultrasound", option_e: "Cerebral angiography",
    correct_answer_index: 1, case_presentation: null,
    explanation_html: `<p>In a patient presenting with acute neurological deficits and a normal CT scan, <strong>MRI with diffusion-weighted imaging (DWI)</strong> is the most sensitive imaging modality to detect <strong>acute ischemic stroke</strong> within the first few hours.</p><p>A normal CT in the hyperacute phase does NOT rule out ischemic stroke, as CT changes may take 6-12 hours to appear.</p>`,
    has_images: false, is_flagged: true,
    stat_option_a: 8.50, stat_option_b: 78.30, stat_option_c: 3.20, stat_option_d: 6.80, stat_option_e: 3.20,
  },
  // More MCQ questions
  {
    id: 1005, course_id: 5, subject_id: 8, question_type: "mcq", exam_type: "Final",
    question_text: "Which of the following is the most common type of primary headache?",
    option_a: "Migraine", option_b: "Tension-type headache",
    option_c: "Cluster headache", option_d: "Trigeminal neuralgia", option_e: "Hemiplegic migraine",
    correct_answer_index: 1, case_presentation: null,
    explanation_html: `<p><strong>Tension-type headache (TTH)</strong> is the most common primary headache disorder, affecting up to 80% of the population. It presents as bilateral, non-pulsating, mild-to-moderate headache without nausea or photophobia.</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 35.40, stat_option_b: 52.10, stat_option_c: 5.30, stat_option_d: 4.20, stat_option_e: 3.00,
  },
  {
    id: 1006, course_id: 5, subject_id: 9, question_type: "mcq", exam_type: "Mini-OSCE",
    question_text: "A 22-year-old female presents with episodes of staring spells lasting 10-15 seconds with lip smacking and hand automatisms. She has no memory of the events. EEG shows temporal lobe spikes. What type of seizure is this?",
    option_a: "Generalized tonic-clonic seizure", option_b: "Absence seizure",
    option_c: "Focal seizure with impaired awareness", option_d: "Myoclonic seizure", option_e: "Atonic seizure",
    correct_answer_index: 2, case_presentation: null,
    explanation_html: `<p><strong>Focal seizures with impaired awareness</strong> (formerly complex partial seizures) arise from a specific brain region, most commonly the temporal lobe. Key features include automatisms (lip smacking, hand movements), impaired awareness, and post-ictal confusion.</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 5.10, stat_option_b: 18.30, stat_option_c: 68.40, stat_option_d: 4.20, stat_option_e: 4.00,
  },
  // CBQ Question
  {
    id: 2001, course_id: 13, subject_id: 133, question_type: "cbq", exam_type: "Final",
    question_text: null,
    option_a: null, option_b: null, option_c: null, option_d: null, option_e: null,
    correct_answer_index: null,
    case_presentation: "An 18-month-old patient presents with fever and irritability. A lumbar puncture is performed, and CSF analysis suggests acute bacterial meningitis. On examination, there is a purpuric rash on the trunk and extremities, and the child is in an opisthotonic posture.",
    explanation_html: `<p><strong>Mandatory Notice:</strong> Rapid recognition of meningeal signs and the characteristic rash is vital for the survival of children with invasive bacterial disease.</p><h3>Clinical Manifestations of Invasive Bacterial Infections</h3><p><strong>Step 1: Microbiological Identification</strong></p><p>The Gram stain of CSF is the fastest way to identify the pathogen.</p><ul><li><strong>Streptococcus pneumoniae:</strong> Appears as Gram-positive diplococci (lancet-shaped). Most common cause of post-neonatal bacterial meningitis.</li><li><strong>Neisseria meningitidis:</strong> Appears as Gram-negative diplococci (kidney-bean shaped). Classically associated with purpuric rash.</li></ul><p><strong>Step 2: Clinical Correlation</strong></p><p>The purpuric rash in this case strongly suggests <strong>meningococcemia</strong>, caused by Neisseria meningitidis. The rash results from vascular damage and disseminated intravascular coagulation (DIC).</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 0, stat_option_b: 0, stat_option_c: 0, stat_option_d: 0, stat_option_e: 0,
    sub_questions: [
      { id: 1, question_id: 2001, subquestion_text: "If the gram stain shows gram positive diplococci, what's the causative organism?", answer_html: "<strong>Streptococcus pneumoniae (Pneumococcus)</strong>", display_order: 1 },
      { id: 2, question_id: 2001, subquestion_text: "What's your diagnosis?", answer_html: "<strong>Acute Bacterial Meningitis</strong> (likely associated with <strong>Meningococcemia</strong> given the rash).", display_order: 2 },
      { id: 3, question_id: 2001, subquestion_text: "What's the cause of the purpuric rash?", answer_html: "<strong>Meningococcemia</strong> (Septicemia caused by <em>Neisseria meningitidis</em> leading to vascular damage/DIC).", display_order: 3 },
      { id: 4, question_id: 2001, subquestion_text: "What's the cause of the opisthotonic posture?", answer_html: "<strong>Opisthotonus</strong> \u2014 This extreme posture, characterized by an arched back and neck retraction, is a sign of severe meningeal irritation.", display_order: 4 },
    ] as CBQSubQuestion[],
  },
  // More MCQ for session variety
  {
    id: 1007, course_id: 5, subject_id: 11, question_type: "mcq", exam_type: "Final",
    question_text: "A 30-year-old female presents with optic neuritis, followed 6 months later by transverse myelitis. MRI shows periventricular white matter lesions. What is the most likely diagnosis?",
    option_a: "Neuromyelitis optica", option_b: "Multiple sclerosis",
    option_c: "Acute disseminated encephalomyelitis", option_d: "Sarcoidosis", option_e: "Systemic lupus erythematosus",
    correct_answer_index: 1, case_presentation: null,
    explanation_html: `<p><strong>Multiple sclerosis (MS)</strong> is characterized by demyelinating lesions disseminated in time and space. The combination of optic neuritis and transverse myelitis occurring at different times, with periventricular white matter lesions on MRI, fulfills the McDonald criteria for MS.</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 15.20, stat_option_b: 72.50, stat_option_c: 5.30, stat_option_d: 4.00, stat_option_e: 3.00,
  },
  {
    id: 1008, course_id: 5, subject_id: 7, question_type: "mcq", exam_type: "Mini-OSCE",
    question_text: "Which cranial nerve is most commonly affected in raised intracranial pressure?",
    option_a: "Cranial nerve III (Oculomotor)", option_b: "Cranial nerve IV (Trochlear)",
    option_c: "Cranial nerve V (Trigeminal)", option_d: "Cranial nerve VI (Abducens)", option_e: "Cranial nerve VII (Facial)",
    correct_answer_index: 3, case_presentation: null,
    explanation_html: `<p>The <strong>abducens nerve (CN VI)</strong> has the longest intracranial course of all cranial nerves, making it the most vulnerable to raised intracranial pressure. It can be compressed against the petrous bone, resulting in lateral rectus palsy and inability to abduct the eye.</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 22.10, stat_option_b: 3.50, stat_option_c: 2.80, stat_option_d: 67.30, stat_option_e: 4.30,
  },
  {
    id: 1009, course_id: 5, subject_id: 1, question_type: "mcq", exam_type: "Final",
    question_text: "A patient is found unresponsive. He opens his eyes to pain, makes incomprehensible sounds, and withdraws from pain. What is his Glasgow Coma Scale score?",
    option_a: "6", option_b: "7", option_c: "8", option_d: "9", option_e: "10",
    correct_answer_index: 2, case_presentation: null,
    explanation_html: `<p>GCS scoring: Eye opening to pain = 2, Verbal response (incomprehensible sounds) = 2, Motor response (withdrawal) = 4. Total = 2 + 2 + 4 = <strong>8</strong>.</p><p>A GCS of 8 or less indicates severe brain injury and is the threshold for intubation.</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 8.20, stat_option_b: 12.30, stat_option_c: 65.40, stat_option_d: 10.10, stat_option_e: 4.00,
  },
  {
    id: 1010, course_id: 6, subject_id: 205, question_type: "mcq", exam_type: "Final",
    question_text: "A 55-year-old male smoker presents with progressive hoarseness for 3 months. Laryngoscopy reveals a whitish lesion on the left vocal cord. What is the most important next step?",
    option_a: "Voice therapy", option_b: "Biopsy of the lesion",
    option_c: "CT scan of the neck", option_d: "Trial of antibiotics", option_e: "Observation for 6 weeks",
    correct_answer_index: 1, case_presentation: null,
    explanation_html: `<p>In a smoker with progressive hoarseness and a whitish vocal cord lesion, <strong>biopsy</strong> is essential to rule out <strong>laryngeal carcinoma</strong> or premalignant lesions (leukoplakia).</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 3.40, stat_option_b: 82.10, stat_option_c: 8.50, stat_option_d: 3.20, stat_option_e: 2.80,
  },
  {
    id: 1011, course_id: 6, subject_id: 203, question_type: "mcq", exam_type: "Mini-OSCE",
    question_text: "Which is the most common organism causing acute bacterial sinusitis?",
    option_a: "Staphylococcus aureus", option_b: "Streptococcus pneumoniae",
    option_c: "Haemophilus influenzae", option_d: "Moraxella catarrhalis", option_e: "Pseudomonas aeruginosa",
    correct_answer_index: 1, case_presentation: null,
    explanation_html: `<p><strong>Streptococcus pneumoniae</strong> is the most common bacterial cause of acute sinusitis, followed by Haemophilus influenzae and Moraxella catarrhalis.</p>`,
    has_images: false, is_flagged: false,
    stat_option_a: 10.20, stat_option_b: 62.30, stat_option_c: 18.50, stat_option_d: 6.80, stat_option_e: 2.20,
  },
]

// ===== SESSIONS =====
export const mockSessions: Session[] = [
  { id: 1, user_id: 5, course_id: 5, session_name: "Study Session", session_type: "Study Session", configuration: { selected_subjects: [1, 3, 5, 7], exam_type_filter: "All", flag_filter: "All", progress_filters: { include_correct: true, include_incorrect: true, include_new: true }, number_of_questions: 11 }, total_questions: 11, questions_answered: 11, correct_answers: 8, score: 72.73, start_time: "2026-01-09T10:30:00Z", end_time: "2026-01-09T11:45:00Z", is_completed: true },
  { id: 2, user_id: 5, course_id: 5, session_name: "Study Session", session_type: "Study Session", configuration: { selected_subjects: [8, 9, 10], exam_type_filter: "All", flag_filter: "All", progress_filters: { include_correct: true, include_incorrect: true, include_new: true }, number_of_questions: 20 }, total_questions: 20, questions_answered: 20, correct_answers: 15, score: 75.00, start_time: "2025-11-20T14:00:00Z", end_time: "2025-11-20T15:30:00Z", is_completed: true },
  { id: 3, user_id: 5, course_id: 5, session_name: "Study Session", session_type: "Study Session", configuration: { selected_subjects: [2, 4, 6], exam_type_filter: "Mini-OSCE", flag_filter: "All", progress_filters: { include_correct: true, include_incorrect: true, include_new: true }, number_of_questions: 15 }, total_questions: 15, questions_answered: 10, correct_answers: 7, score: 70.00, start_time: "2025-10-16T09:00:00Z", end_time: null, is_completed: false },
  { id: 4, user_id: 5, course_id: 6, session_name: "ENT Review", session_type: "Study Session", configuration: { selected_subjects: [200, 201, 202], exam_type_filter: "All", flag_filter: "All", progress_filters: { include_correct: true, include_incorrect: true, include_new: true }, number_of_questions: 11 }, total_questions: 11, questions_answered: 0, correct_answers: 0, score: 0, start_time: "2026-02-10T08:00:00Z", end_time: null, is_completed: false },
]

// ===== SUBSCRIPTION PACKAGES =====
export const mockPackages: SubscriptionPackage[] = [
  { id: 1, course_id: 1, package_name: "Normal Package", package_type: "individual", users_limit: 1, price: 5, duration: "end of course", features: ["View all 690 questions", "Clear explanations", "Watch from anywhere", "Timed tests and tutor-led exams"], is_active: true },
  { id: 2, course_id: 1, package_name: "Group package", package_type: "group", users_limit: 3, price: 3, duration: "end of course", features: ["View all 690 questions", "Clear explanations", "Watch from anywhere", "Timed tests and tutor-led exams"], is_active: true },
]

// ===== TRANSACTIONS =====
export const mockTransactions: Transaction[] = [
  { id: 1, user_id: 6, username: "hadeelm125", course_id: 6, course_name: "ENT", package_id: 1, amount: 7, payment_date: "2026-02-15", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/1_screenshot.jpg", transfer_phone: "+962791234567", transfer_note: null, coupon_code: null, verified_by: 1, verified_at: "2026-02-15T11:00:00Z" },
  { id: 2, user_id: 7, username: "nabakhta", course_id: 7, course_name: "Family Medicine", package_id: 1, amount: 5, payment_date: "2026-02-15", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/2_screenshot.jpg", transfer_phone: "+962792345678", transfer_note: "\u062e\u0630\u064a \u0631\u0628\u064a \u0645\u0627", coupon_code: null, verified_by: 1, verified_at: "2026-02-15T10:30:00Z" },
  { id: 3, user_id: 8, username: "tmtmtm", course_id: 2, course_name: "Neurosurgery", package_id: 1, amount: 5, payment_date: "2026-02-15", status: "rejected", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/3_screenshot.jpg", transfer_phone: "+962793456789", transfer_note: null, coupon_code: null, verified_by: 1, verified_at: "2026-02-15T10:00:00Z" },
  { id: 4, user_id: 5, username: "zhraa", course_id: 13, course_name: "Pediatric", package_id: 1, amount: 7, payment_date: "2026-02-14", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/4_screenshot.jpg", transfer_phone: "+962790555298", transfer_note: null, coupon_code: null, verified_by: 2, verified_at: "2026-02-14T16:00:00Z" },
  { id: 5, user_id: 9, username: "ahmad_ali", course_id: 15, course_name: "Internal Medicine", package_id: 2, amount: 7, payment_date: "2026-02-13", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/5_screenshot.jpg", transfer_phone: "+962794567890", transfer_note: "Ahmad Ali, Sara Mohammad, Omar Hassan", coupon_code: null, verified_by: 1, verified_at: "2026-02-13T14:00:00Z" },
  { id: 6, user_id: 10, username: "haya", course_id: 12, course_name: "Surgery", package_id: 1, amount: 7, payment_date: "2026-02-12", status: "pending", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/6_screenshot.jpg", transfer_phone: "+962795678901", transfer_note: null, coupon_code: "SAVE20", verified_by: null, verified_at: null },
  { id: 7, user_id: 11, username: "sarahs", course_id: 14, course_name: "OBS & GYN", package_id: 1, amount: 7, payment_date: "2026-02-11", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/7_screenshot.jpg", transfer_phone: "+962796789012", transfer_note: null, coupon_code: null, verified_by: 2, verified_at: "2026-02-11T12:00:00Z" },
  { id: 8, user_id: 13, username: "lujain", course_id: 5, course_name: "Neuromedicine", package_id: 1, amount: 5, payment_date: "2026-02-10", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/8_screenshot.jpg", transfer_phone: "+962798901234", transfer_note: null, coupon_code: null, verified_by: 1, verified_at: "2026-02-10T11:00:00Z" },
  { id: 9, user_id: 14, username: "boshraomoush", course_id: 1, course_name: "Psychiatry", package_id: 2, amount: 3, payment_date: "2026-02-09", status: "pending", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/9_screenshot.jpg", transfer_phone: "+962790012345", transfer_note: "Boshra Omoush, Rand Madadha, Asia Khalid", coupon_code: null, verified_by: null, verified_at: null },
  { id: 10, user_id: 17, username: "dina_r", course_id: 9, course_name: "Dermatology", package_id: 1, amount: 5, payment_date: "2026-02-08", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/10_screenshot.jpg", transfer_phone: "+962793345678", transfer_note: null, coupon_code: null, verified_by: 1, verified_at: "2026-02-08T15:00:00Z" },
  { id: 11, user_id: 18, username: "moh_khaled", course_id: 3, course_name: "Ophthalmology", package_id: 1, amount: 5, payment_date: "2026-02-07", status: "rejected", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/11_screenshot.jpg", transfer_phone: "+962794456789", transfer_note: null, coupon_code: null, verified_by: 2, verified_at: "2026-02-07T10:00:00Z" },
  { id: 12, user_id: 19, username: "yasmin_a", course_id: 4, course_name: "Orthopedic", package_id: 1, amount: 5, payment_date: "2026-02-06", status: "accepted", payment_method: "cliq", transfer_screenshot: "/uploads/transactions/12_screenshot.jpg", transfer_phone: "+962795567890", transfer_note: null, coupon_code: null, verified_by: 1, verified_at: "2026-02-06T09:00:00Z" },
]

// ===== FEEDS =====
export const mockFeeds: Feed[] = [
  { id: 1, user_id: 13, username: "lujain", question_id: 1004, question_text: "What is the most likely abnormality seen in this i...", feedback_type: "error_report", feedback_text: "\u0644\u0627\u0646\u0647 \u062e\u0637\u0623 \u062d\u0643\u064a\u062a\u0648 \u0643\u0644\u0645\u0629 occipital \u0641\u064a infarction \u0628\u062f\u064a \u0627\u0639\u0631\u0641 ...", status: "pending", admin_response: null, created_at: "2025-08-26T14:20:00Z" },
  { id: 2, user_id: 14, username: "boshraomoush", question_id: 1005, question_text: "Which of the following is an early side effect...", feedback_type: "answer_dispute", feedback_text: "Wt gain and polyuris both earlier", status: "reviewed", admin_response: null, created_at: "2025-11-04T10:15:00Z" },
  { id: 3, user_id: 15, username: "randmadadha_9", question_id: 1006, question_text: "Which of the following is wrong about the muscle...", feedback_type: "error_report", feedback_text: "The picture is wrong", status: "pending", admin_response: null, created_at: "2025-10-08T16:30:00Z" },
  { id: 4, user_id: 16, username: "asia", question_id: 1007, question_text: "All are causes of this lesion except:", feedback_type: "explanation_issue", feedback_text: "wrong explanation", status: "pending", admin_response: null, created_at: "2025-12-27T11:00:00Z" },
  { id: 5, user_id: 5, username: "zhraa", question_id: 1001, question_text: "Which disease causes unilateral sensorineural...", feedback_type: "clarification", feedback_text: "Why not E? Multiple sclerosis can cause hearing loss too", status: "resolved", admin_response: "MS can cause hearing loss but it's rare and not the classic presentation.", created_at: "2025-09-15T08:45:00Z" },
  { id: 6, user_id: 10, username: "haya", question_id: 1003, question_text: "A 2-year-old child presents with high fever...", feedback_type: "general", feedback_text: "\u0645\u062d\u062a\u0627\u062c \u0634\u0648\u064a \u0634\u0631\u062d", status: "pending", admin_response: null, created_at: "2026-01-05T13:20:00Z" },
  { id: 7, user_id: 17, username: "dina_r", question_id: 1002, question_text: "A 5-year-old child presents with ear pain...", feedback_type: "error_report", feedback_text: "wrong pic", status: "dismissed", admin_response: "Image has been verified and is correct.", created_at: "2025-11-20T09:00:00Z" },
  { id: 8, user_id: 20, username: "faris_q", question_id: 1008, question_text: "Which cranial nerve is most commonly affected...", feedback_type: "answer_dispute", feedback_text: "So the right ans is Systemic steroid", status: "pending", admin_response: null, created_at: "2026-01-15T17:40:00Z" },
  { id: 9, user_id: 21, username: "noor_s", question_id: 1009, question_text: "A patient is found unresponsive...", feedback_type: "clarification", feedback_text: "There is no case", status: "pending", admin_response: null, created_at: "2026-01-22T10:10:00Z" },
  { id: 10, user_id: 22, username: "amal_j", question_id: 1010, question_text: "A 55-year-old male smoker presents with...", feedback_type: "general", feedback_text: "Great question, very helpful for exam prep!", status: "reviewed", admin_response: null, created_at: "2026-02-01T14:55:00Z" },
]

// ===== SUBSCRIPTIONS =====
export const mockSubscriptions: Subscription[] = [
  { id: 1, user_id: 5, course_id: 5, transaction_id: 8, package_id: 50, start_date: "2026-01-05T00:00:00Z", end_date: null, is_active: true, course_name: "Neuromedicine", package_type: "individual" },
  { id: 2, user_id: 5, course_id: 6, transaction_id: 9, package_id: 60, start_date: "2026-01-20T00:00:00Z", end_date: null, is_active: true, course_name: "ENT", package_type: "individual" },
  { id: 3, user_id: 5, course_id: 13, transaction_id: 4, package_id: 130, start_date: "2026-02-14T00:00:00Z", end_date: null, is_active: true, course_name: "Pediatric", package_type: "individual" },
  { id: 4, user_id: 5, course_id: 1, transaction_id: 10, package_id: 10, start_date: "2025-11-01T00:00:00Z", end_date: "2026-01-01T00:00:00Z", is_active: false, course_name: "Psychiatry", package_type: "individual" },
  { id: 5, user_id: 6, course_id: 6, transaction_id: 1, package_id: 60, start_date: "2026-02-15T00:00:00Z", end_date: null, is_active: true, course_name: "ENT", package_type: "individual" },
  { id: 6, user_id: 7, course_id: 7, transaction_id: 2, package_id: 70, start_date: "2026-02-15T00:00:00Z", end_date: null, is_active: true, course_name: "Family Medicine", package_type: "individual" },
  { id: 7, user_id: 9, course_id: 15, transaction_id: 5, package_id: 151, start_date: "2026-02-13T00:00:00Z", end_date: null, is_active: true, course_name: "Internal Medicine", package_type: "group" },
  { id: 8, user_id: 13, course_id: 5, transaction_id: 8, package_id: 50, start_date: "2026-02-10T00:00:00Z", end_date: null, is_active: true, course_name: "Neuromedicine", package_type: "individual" },
]

// ===== COMMENTS =====
export const mockComments: Comment[] = [
  { id: 1, user_id: 5, username: "zhraa", question_id: 1001, comment_text: "Great explanation! The table really helps.", parent_comment_id: null, created_at: "2026-02-15T14:30:00Z" },
  { id: 2, user_id: 9, username: "ahmad_ali", question_id: 1001, comment_text: "I found this question tricky. Thanks for the clear breakdown.", parent_comment_id: null, created_at: "2026-02-14T10:00:00Z" },
  { id: 3, user_id: 10, username: "haya", question_id: 1003, comment_text: "Is the CSF glucose always decreased in bacterial meningitis?", parent_comment_id: null, created_at: "2026-02-13T16:00:00Z" },
]

// ===== HELPER FUNCTIONS =====

export function getCourseBySlug(slug: string): Course | undefined {
  return mockCourses.find(c => c.slug === slug)
}

export function getSubjectsForCourse(courseId: number): Subject[] {
  return mockSubjects.filter(s => s.course_id === courseId)
}

export function getSubjectTree(courseId: number): Subject[] {
  const subjects = getSubjectsForCourse(courseId)
  const topLevel = subjects.filter(s => s.parent_subject_id === null)
  return topLevel.map(s => ({
    ...s,
    children: subjects.filter(child => child.parent_subject_id === s.id)
  }))
}

export function getQuestionsForSession(sessionId: number): Question[] {
  const session = mockSessions.find(s => s.id === sessionId)
  if (!session) return []
  return mockQuestions.filter(q => q.course_id === session.course_id).slice(0, session.total_questions)
}

export function getPackagesForCourse(courseId: number): SubscriptionPackage[] {
  // Return default packages for any course
  const course = mockCourses.find(c => c.id === courseId)
  if (!course) return []
  return [
    { id: courseId * 10, course_id: courseId, package_name: "Normal Package", package_type: "individual", users_limit: 1, price: course.price_individual, duration: "end of course", features: [`View all ${course.total_questions} questions`, "Clear explanations", "Watch from anywhere", "Timed tests and tutor-led exams"], is_active: true },
    { id: courseId * 10 + 1, course_id: courseId, package_name: "Group package", package_type: "group", users_limit: 3, price: course.price_group, duration: "end of course", features: [`View all ${course.total_questions} questions`, "Clear explanations", "Watch from anywhere", "Timed tests and tutor-led exams"], is_active: true },
  ]
}

export function getQuestionTypes(): string[] {
  return ["MCQ", "CBQ"]
}

export function getExamPeriods(): string[] {
  return ["2024 S1", "2024 S2", "2025 S1", "2025 S2", "2026 S1"]
}

// Platform statistics
export const platformStats = {
  totalCourses: 18,
  totalSubjects: 579,
  totalQuestions: 6723,
}
