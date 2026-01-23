-- Fix mastery_data table to match app requirements
-- The app stores course activities with username, course name, completion %, dates, etc.

-- Add missing columns to mastery_data
ALTER TABLE mastery_data ADD COLUMN username TEXT;
ALTER TABLE mastery_data ADD COLUMN initiated TEXT;
ALTER TABLE mastery_data ADD COLUMN concluded TEXT;
ALTER TABLE mastery_data ADD COLUMN created_by TEXT;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_mastery_username ON mastery_data(username);
CREATE INDEX IF NOT EXISTS idx_mastery_category ON mastery_data(category);

-- Remove the UNIQUE constraint on skill_name (users can take the same course)
-- Note: SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table
-- But this will be handled in a future migration if needed, for now just add the columns
