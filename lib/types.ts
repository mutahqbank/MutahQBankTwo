// ===== Database Table Types =====

export interface User {
  id: number
  username: string
  email: string
  full_name: string | null
  phone: string | null
  role: "admin" | "user"
  is_banned: boolean
  created_at: string
  updated_at: string
  last_login: string | null
}

export interface Course {
  id: number
  name: string
  slug: string
  description: string | null
  hero_image: string | null
  status_line: string | null
  price_individual: number
  price_group: number
  total_subjects: number
  total_questions: number
  has_explanations: boolean
  has_timed_exams: boolean
  all_time_subscriptions: number
  current_subscriptions: number
  is_active: boolean
  display_order: number
}

export interface Subject {
  id: number
  course_id: number
  parent_subject_id: number | null
  name: string
  display_order: number
  has_children: boolean
  is_expandable: boolean
  year_specific: string | null
  question_count: number
  children?: Subject[]
}

export interface Question {
  id: number
  course_id: number
  subject_id: number
  question_type: "mcq" | "cbq"
  exam_type: string | null
  question_text: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  option_e: string | null
  correct_answer_index: number | null
  case_presentation: string | null
  explanation_html: string | null
  has_images: boolean
  is_flagged: boolean
  stat_option_a: number
  stat_option_b: number
  stat_option_c: number
  stat_option_d: number
  stat_option_e: number
  images?: QuestionImage[]
  sub_questions?: CBQSubQuestion[]
}

export interface QuestionImage {
  id: number
  question_id: number
  image_url: string
  display_order: number
  caption: string | null
}

export interface CBQSubQuestion {
  id: number
  question_id: number
  subquestion_text: string
  answer_html: string
  display_order: number
}

export interface Session {
  id: number
  user_id: number
  course_id: number
  session_name: string | null
  session_type: string
  configuration: SessionConfiguration
  total_questions: number
  questions_answered: number
  correct_answers: number
  score: number
  start_time: string
  end_time: string | null
  is_completed: boolean
}

export interface SessionConfiguration {
  selected_subjects: number[]
  exam_type_filter: string
  flag_filter: string
  progress_filters: {
    include_correct: boolean
    include_incorrect: boolean
    include_new: boolean
  }
  number_of_questions: number
}

export interface SessionAnswer {
  id: number
  session_id: number
  question_id: number
  user_answer: string | null
  is_correct: boolean
  time_spent: number
  is_flagged: boolean
  notes: string | null
  answered_at: string
}

export interface SubscriptionPackage {
  id: number
  course_id: number
  package_name: string
  package_type: "individual" | "group" | "custom"
  users_limit: number
  price: number
  duration: string
  features: string[]
  is_active: boolean
}

export interface Transaction {
  id: number
  user_id: number
  username?: string
  course_id: number
  course_name?: string
  package_id: number
  amount: number
  payment_date: string
  status: "pending" | "accepted" | "rejected"
  payment_method: string
  transfer_screenshot: string | null
  transfer_phone: string | null
  transfer_note: string | null
  coupon_code: string | null
  verified_by: number | null
  verified_at: string | null
}

export interface Subscription {
  id: number
  user_id: number
  course_id: number
  transaction_id: number
  package_id: number
  start_date: string
  end_date: string | null
  is_active: boolean
  course_name?: string
  package_type?: string
}

export interface Feed {
  id: number
  user_id: number
  username?: string
  question_id: number
  question_text?: string
  feedback_type: string
  feedback_text: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  admin_response: string | null
  created_at: string
}

export interface Comment {
  id: number
  user_id: number
  username?: string
  question_id: number
  comment_text: string
  parent_comment_id: number | null
  created_at: string
  replies?: Comment[]
}
