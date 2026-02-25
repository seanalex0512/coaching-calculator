-- Create schedule_slots table for recurring weekly schedule
CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for efficient queries by student and day
CREATE INDEX idx_schedule_slots_student ON schedule_slots(student_id);
CREATE INDEX idx_schedule_slots_day ON schedule_slots(day_of_week);
CREATE INDEX idx_schedule_slots_active ON schedule_slots(is_active) WHERE is_active = true;

-- Add schedule_slot_id to sessions table to link sessions to their schedule
ALTER TABLE sessions ADD COLUMN schedule_slot_id UUID REFERENCES schedule_slots(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX idx_sessions_schedule_slot ON sessions(schedule_slot_id);

-- Add status column if not exists (for pending sessions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE sessions ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;
END $$;
