-- DrumTree Business Tracker Database Schema
-- This creates permanent server-side storage for all business data

-- Services table: Core service definitions
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  account TEXT NOT NULL,
  country TEXT NOT NULL,
  service_version TEXT,
  service_sku TEXT,
  currency TEXT NOT NULL,
  zar_rate REAL NOT NULL DEFAULT 1.0,
  mtd_revenue REAL DEFAULT 0,
  mtd_target REAL DEFAULT 0,
  actual_run_rate REAL DEFAULT 0,
  required_run_rate REAL NOT NULL,
  subscriber_base INTEGER DEFAULT 0,
  mtd_net_additions INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily data table: All daily performance metrics
CREATE TABLE IF NOT EXISTS daily_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  day INTEGER NOT NULL,
  date TEXT NOT NULL,
  business_category TEXT,
  account TEXT,
  country TEXT,
  service_version TEXT,
  currency TEXT,
  zar_rate REAL,
  service_sku TEXT,
  daily_billing_lcu REAL DEFAULT 0,
  revenue REAL DEFAULT 0,
  target REAL DEFAULT 0,
  churned_subs INTEGER DEFAULT 0,
  daily_acquisitions INTEGER DEFAULT 0,
  net_additions INTEGER DEFAULT 0,
  subscriber_base INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(service_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);
CREATE INDEX IF NOT EXISTS idx_services_account ON services(account);
CREATE INDEX IF NOT EXISTS idx_services_country ON services(country);
CREATE INDEX IF NOT EXISTS idx_daily_data_service_id ON daily_data(service_id);
CREATE INDEX IF NOT EXISTS idx_daily_data_date ON daily_data(date);
CREATE INDEX IF NOT EXISTS idx_daily_data_service_date ON daily_data(service_id, date);

-- Audit table: Track all data changes
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER,
  action TEXT NOT NULL,
  user_email TEXT,
  changes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
