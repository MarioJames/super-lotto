-- Migration: Participant Isolation
-- Description:
--   1. Add activity_id to participants table (direct relationship)
--   2. Add animation_duration_ms to rounds table
--   3. Remove animation_duration_ms from activities table
--   4. Drop activity_participants junction table
-- Requirements: 5.1, 5.4, 6.1, 6.4, 6.5

-- ============================================================
-- Step 1: Add activity_id column to participants table
-- ============================================================

-- First, add the column as nullable to allow data migration
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS activity_id INTEGER;

-- Migrate existing data from activity_participants junction table
-- This assigns each participant to their associated activity
UPDATE participants p
SET activity_id = ap.activity_id
FROM activity_participants ap
WHERE p.id = ap.participant_id
AND p.activity_id IS NULL;

-- For any orphaned participants (not in any activity), we need to handle them
-- Option: Delete orphaned participants or assign to a default activity
-- Here we delete orphaned participants as they won't be accessible anyway
DELETE FROM participants
WHERE activity_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE participants
ALTER COLUMN activity_id SET NOT NULL;

-- Add foreign key constraint with CASCADE DELETE
ALTER TABLE participants
ADD CONSTRAINT participants_activity_id_fkey
FOREIGN KEY (activity_id)
REFERENCES activities(id)
ON DELETE CASCADE;

-- Drop the old global unique constraint on employee_id if it exists
ALTER TABLE participants
DROP CONSTRAINT IF EXISTS participants_employee_id_key;

-- Add new unique constraint: employee_id unique within activity
ALTER TABLE participants
ADD CONSTRAINT participants_activity_employee_unique
UNIQUE (activity_id, employee_id);


-- ============================================================
-- Step 2: Add animation_duration_ms to rounds table
-- Requirements: 6.1, 6.4
-- ============================================================

ALTER TABLE rounds
ADD COLUMN IF NOT EXISTS animation_duration_ms INTEGER DEFAULT 60000 NOT NULL;

-- ============================================================
-- Step 3: Remove animation_duration_ms from activities table
-- Requirements: 6.5
-- ============================================================

ALTER TABLE activities
DROP COLUMN IF EXISTS animation_duration_ms;

-- ============================================================
-- Step 4: Drop activity_participants junction table
-- Requirements: 5.1
-- ============================================================

DROP TABLE IF EXISTS activity_participants;

-- ============================================================
-- Create indexes for better query performance
-- ============================================================

-- Index for querying participants by activity
CREATE INDEX IF NOT EXISTS idx_participants_activity_id
ON participants(activity_id);
