-- Add business permission columns to users table
-- Migration: 0006_add_business_permissions.sql

-- Add content_business column (defaults to false/0)
ALTER TABLE users ADD COLUMN content_business INTEGER DEFAULT 0;

-- Add channel_business column (defaults to false/0)
ALTER TABLE users ADD COLUMN channel_business INTEGER DEFAULT 0;

-- Set all existing Admin users to have both permissions by default
UPDATE users SET content_business = 1, channel_business = 1 WHERE type = 'Admin';
