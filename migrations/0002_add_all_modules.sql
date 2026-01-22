-- Add missing tables for Users, Mastery, Courses, and Kanban modules
-- This ensures ALL app data is stored in Cloudflare D1, not localStorage

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Admin' or 'User'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mastery tracking table
CREATE TABLE IF NOT EXISTS mastery_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_level INTEGER DEFAULT 0,
  target_level INTEGER DEFAULT 5,
  progress_percentage REAL DEFAULT 0,
  last_practice_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(skill_name)
);

-- Courses library table
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  provider TEXT,
  category TEXT,
  difficulty TEXT,
  duration TEXT,
  url TEXT,
  description TEXT,
  tags TEXT, -- JSON array as text
  status TEXT DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed'
  completion_date TEXT,
  rating INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Kanban cards table
CREATE TABLE IF NOT EXISTS kanban_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL UNIQUE, -- Frontend-generated UUID
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT, -- 'Low', 'Medium', 'High'
  status TEXT NOT NULL, -- 'todo', 'in-progress', 'review', 'done'
  assigned_to TEXT,
  due_date TEXT,
  tags TEXT, -- JSON array as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_mastery_category ON mastery_data(category);
CREATE INDEX IF NOT EXISTS idx_mastery_skill ON mastery_data(skill_name);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_kanban_status ON kanban_cards(status);
CREATE INDEX IF NOT EXISTS idx_kanban_category ON kanban_cards(category);
CREATE INDEX IF NOT EXISTS idx_kanban_card_id ON kanban_cards(card_id);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (username, password, type) 
VALUES ('admin', 'admin123', 'Admin');
