-- ============================================================================
-- TaskFlow Studio — PostgreSQL Relational Schema
-- Compatible with PostgreSQL 14+, Supabase, Neon, AWS RDS, and Railway
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(80) DEFAULT 'Product Lead',
  initials VARCHAR(8) DEFAULT 'AR',
  avatar_color VARCHAR(32) DEFAULT 'bg-indigo-600',
  streak_days INT DEFAULT 12,
  best_streak INT DEFAULT 19,
  daily_goal INT DEFAULT 5,
  weekly_goal INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(32) NOT NULL DEFAULT 'todo',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority VARCHAR(32) NOT NULL DEFAULT 'medium',
  category VARCHAR(120) NOT NULL DEFAULT 'Work',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  due_date VARCHAR(32) DEFAULT '',
  due_time VARCHAR(32) DEFAULT '',
  reminder BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time VARCHAR(32) DEFAULT '',
  recurrence VARCHAR(32) NOT NULL DEFAULT 'none',
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_spent INT NOT NULL DEFAULT 0,
  estimated_time INT NOT NULL DEFAULT 30,
  important BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  trashed BOOLEAN NOT NULL DEFAULT FALSE,
  task_order INT NOT NULL DEFAULT 0,
  assignees JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at VARCHAR(64) NOT NULL,
  completed_at VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

