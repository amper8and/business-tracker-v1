-- Add last_login column to users table for tracking user login history
-- This allows the system to display when each user last logged in

ALTER TABLE users ADD COLUMN last_login DATETIME;

-- Verification: Check the column was added
SELECT sql FROM sqlite_master WHERE type='table' AND name='users';
