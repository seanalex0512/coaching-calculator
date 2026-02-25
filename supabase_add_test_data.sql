-- Add test sessions with different categories to visualize the donut chart
-- Run this in your Supabase SQL Editor

-- Insert some gym sessions (Orange)
INSERT INTO sessions (student_id, category, session_date, duration_minutes, price, status)
SELECT
  (SELECT id FROM students LIMIT 1),
  'gym',
  CURRENT_DATE - INTERVAL '5 days',
  60,
  80,
  'completed'
FROM generate_series(1, 3);

-- Insert some swimming sessions (Blue)
INSERT INTO sessions (student_id, category, session_date, duration_minutes, price, status)
SELECT
  (SELECT id FROM students LIMIT 1),
  'swimming',
  CURRENT_DATE - INTERVAL '3 days',
  60,
  75,
  'completed'
FROM generate_series(1, 2);

-- Insert some math sessions (Green)
INSERT INTO sessions (student_id, category, session_date, duration_minutes, price, status)
SELECT
  (SELECT id FROM students LIMIT 1),
  'math',
  CURRENT_DATE - INTERVAL '1 day',
  60,
  70,
  'completed'
FROM generate_series(1, 4);

-- Verify the data was added
SELECT
  category,
  COUNT(*) as session_count,
  SUM(price) as total_earnings
FROM sessions
WHERE status = 'completed'
  AND session_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category
ORDER BY total_earnings DESC;
