-- Add user_id column to all tables to track data ownership

-- Add user_id to students table
ALTER TABLE students
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to sessions table
ALTER TABLE sessions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to schedule_slots table
ALTER TABLE schedule_slots
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_schedule_slots_user_id ON schedule_slots(user_id);

-- Drop old policies
DROP POLICY IF EXISTS "Allow all operations on students" ON students;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all operations on schedule_slots" ON schedule_slots;

-- Create new RLS policies that check user_id

-- Students table policies
CREATE POLICY "Users can view their own students"
  ON students FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
  ON students FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
  ON students FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sessions table policies
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Schedule slots table policies
CREATE POLICY "Users can view their own schedule slots"
  ON schedule_slots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedule slots"
  ON schedule_slots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedule slots"
  ON schedule_slots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedule slots"
  ON schedule_slots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
