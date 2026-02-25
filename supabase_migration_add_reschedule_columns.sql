-- Add rescheduled_to_date and rescheduled_to_time columns to sessions table
-- Run this in your Supabase SQL Editor

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS rescheduled_to_date TEXT,
ADD COLUMN IF NOT EXISTS rescheduled_to_time TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
