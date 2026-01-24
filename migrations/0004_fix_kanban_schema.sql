-- Fix kanban_cards table to match frontend requirements
-- Add missing fields for proper activity card tracking

-- Add missing columns to kanban_cards
ALTER TABLE kanban_cards ADD COLUMN capability TEXT;
ALTER TABLE kanban_cards ADD COLUMN owner TEXT;
ALTER TABLE kanban_cards ADD COLUMN start_date TEXT;
ALTER TABLE kanban_cards ADD COLUMN target_date TEXT;
ALTER TABLE kanban_cards ADD COLUMN lane TEXT;
ALTER TABLE kanban_cards ADD COLUMN comments TEXT;

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_kanban_owner ON kanban_cards(owner);
CREATE INDEX IF NOT EXISTS idx_kanban_lane ON kanban_cards(lane);
CREATE INDEX IF NOT EXISTS idx_kanban_capability ON kanban_cards(capability);
