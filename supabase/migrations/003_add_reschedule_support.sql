-- Add 'pending' to the session_status_type enum (needed for rescheduled sessions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pending'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_status_type')
  ) THEN
    ALTER TYPE session_status_type ADD VALUE 'pending';
  END IF;
END $$;

-- Add 'rescheduled' to the session_status_type enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'rescheduled'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'session_status_type')
  ) THEN
    ALTER TYPE session_status_type ADD VALUE 'rescheduled';
  END IF;
END $$;

-- Add rescheduled_to_date and rescheduled_to_time columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS rescheduled_to_date TEXT,
ADD COLUMN IF NOT EXISTS rescheduled_to_time TEXT;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
