-- ============================================================================
-- TaskFlow Studio — MySQL 8.0+ Relational Schema
-- Compatible with MySQL 8+, PlanetScale, TiDB, Aiven, and AWS Aurora MySQL
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'todo',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority VARCHAR(32) NOT NULL DEFAULT 'medium',
  category VARCHAR(120) NOT NULL DEFAULT 'Work',
  tags JSON NOT NULL,
  due_date VARCHAR(32) DEFAULT '',
  due_time VARCHAR(32) DEFAULT '',
  reminder BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_time VARCHAR(32) DEFAULT '',
  recurrence VARCHAR(32) NOT NULL DEFAULT 'none',
  subtasks JSON NOT NULL,
  dependencies JSON NOT NULL,
  notes TEXT,
  attachments JSON NOT NULL,
  time_spent INT NOT NULL DEFAULT 0,
  estimated_time INT NOT NULL DEFAULT 30,
  important BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  trashed BOOLEAN NOT NULL DEFAULT FALSE,
  task_order INT NOT NULL DEFAULT 0,
  assignees JSON NOT NULL,
  activity JSON NOT NULL,
  created_at VARCHAR(64) NOT NULL,
  completed_at VARCHAR(64),
  INDEX idx_tasks_user_id (user_id),
  INDEX idx_tasks_due_date (due_date),
  INDEX idx_tasks_status (status),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

