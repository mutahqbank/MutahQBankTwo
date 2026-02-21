-- mutahQbank PostgreSQL schema
-- Safe to run against existing database (IF NOT EXISTS)

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. courses
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  hero_image VARCHAR(255),
  status_line VARCHAR(255),
  price_individual DECIMAL(10,2) DEFAULT 5.00,
  price_group DECIMAL(10,2) DEFAULT 3.00,
  total_subjects INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  has_explanations BOOLEAN DEFAULT TRUE,
  has_timed_exams BOOLEAN DEFAULT TRUE,
  all_time_subscriptions INT DEFAULT 0,
  current_subscriptions INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

-- 3. subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  parent_subject_id INT DEFAULT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  display_order INT DEFAULT 0,
  has_children BOOLEAN DEFAULT FALSE,
  is_expandable BOOLEAN DEFAULT FALSE,
  year_specific VARCHAR(20) DEFAULT NULL,
  question_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_course_id ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_subjects_parent_subject_id ON subjects(parent_subject_id);

-- 4. questions
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  question_type VARCHAR(10) NOT NULL CHECK (question_type IN ('mcq', 'cbq')),
  exam_type VARCHAR(50),
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  option_e TEXT,
  correct_answer_index INT,
  case_presentation TEXT,
  explanation_html TEXT,
  has_images BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  stat_option_a DECIMAL(5,2) DEFAULT 0,
  stat_option_b DECIMAL(5,2) DEFAULT 0,
  stat_option_c DECIMAL(5,2) DEFAULT 0,
  stat_option_d DECIMAL(5,2) DEFAULT 0,
  stat_option_e DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_questions_course_subject ON questions(course_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);

-- 5. question_images
CREATE TABLE IF NOT EXISTS question_images (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  display_order INT DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_images_question_id ON question_images(question_id);

-- 6. cbq_subquestions
CREATE TABLE IF NOT EXISTS cbq_subquestions (
  id SERIAL PRIMARY KEY,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  subquestion_text TEXT NOT NULL,
  answer_html TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cbq_subquestions_question_id ON cbq_subquestions(question_id);

-- 7. sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_name VARCHAR(100),
  session_type VARCHAR(50) DEFAULT 'Study Session',
  configuration JSONB,
  total_questions INT DEFAULT 0,
  questions_answered INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  score DECIMAL(5,2) DEFAULT 0,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_course ON sessions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- 8. session_answers
CREATE TABLE IF NOT EXISTS session_answers (
  id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer VARCHAR(10),
  is_correct BOOLEAN DEFAULT FALSE,
  time_spent INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  notes TEXT,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_question_id ON session_answers(question_id);

-- 9. subscription_packages
CREATE TABLE IF NOT EXISTS subscription_packages (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  package_name VARCHAR(100) NOT NULL,
  package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('individual', 'group', 'custom')),
  users_limit INT DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  duration VARCHAR(50) DEFAULT 'end of course',
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_packages_course_id ON subscription_packages(course_id);

-- 10. transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  package_id INT NOT NULL REFERENCES subscription_packages(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  payment_method VARCHAR(50) DEFAULT 'cliq',
  transfer_screenshot VARCHAR(255),
  transfer_phone VARCHAR(20),
  transfer_note TEXT,
  coupon_code VARCHAR(50),
  verified_by INT REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);

-- 11. subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  transaction_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  package_id INT NOT NULL REFERENCES subscription_packages(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  group_members JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_course ON subscriptions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active);

-- 12. feeds
CREATE TABLE IF NOT EXISTS feeds (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  feedback_type VARCHAR(30) DEFAULT 'general' CHECK (feedback_type IN ('error_report', 'clarification', 'answer_dispute', 'explanation_issue', 'general')),
  feedback_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_response TEXT,
  reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_feeds_question_id ON feeds(question_id);
CREATE INDEX IF NOT EXISTS idx_feeds_status ON feeds(status);

-- 13. coupons
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  applicable_courses JSONB,
  max_uses INT,
  current_uses INT DEFAULT 0,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- 14. comments
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  parent_comment_id INT DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_question_id ON comments(question_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
