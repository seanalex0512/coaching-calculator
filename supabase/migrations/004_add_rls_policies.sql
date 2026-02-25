-- Enable Row Level Security on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for anonymous users
-- (Since this is a single-user app without authentication)

-- Students table policies
CREATE POLICY "Allow all operations on students"
  ON students
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Sessions table policies
CREATE POLICY "Allow all operations on sessions"
  ON sessions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Schedule slots table policies
CREATE POLICY "Allow all operations on schedule_slots"
  ON schedule_slots
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
