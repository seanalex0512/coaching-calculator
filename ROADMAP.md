# Coaching Calculator - Product Roadmap

## Current State (Phase 3 Complete)
- Students CRUD with Supabase database
- Sessions CRUD with Supabase database
- Dashboard with earnings overview
- Insights page with charts
- Category filtering (Gym, Swimming, Math)
- Mobile-first PWA design

---

## Phase 4: Schedule-Based Check-in System

### Problem Statement
Currently, users must manually add each session by filling out a form. This is tedious for coaches with a recurring weekly schedule (e.g., same students at the same time each week).

### Solution: Weekly Schedule + Daily Check-in

Instead of manually logging each session, coaches:
1. Set up their recurring weekly schedule once
2. Each day, simply tap "Done" or "Missed" for scheduled classes

---

## Design Decisions (Confirmed)

| Decision | Choice |
|----------|--------|
| Home page scope | **Today only** |
| Other days | **Separate calendar/schedule page** |
| Sessions page | **History only** (logged sessions) |
| Confirmation | **Quick animation** |
| Undo | **Not needed** |

---

## User Flow

### 1. Schedule Setup (One-time, under "More")
Create recurring time slots:
```
┌─────────────────────────────────────────────┐
│  My Weekly Schedule                         │
├─────────────────────────────────────────────┤
│  Monday                                     │
│  ├─ 3:00 PM - John - Gym - 1hr - $70       │
│  └─ 5:00 PM - Mike - Math - 1.5hr - $90    │
│                                             │
│  Tuesday                                    │
│  └─ 4:00 PM - Sarah - Swimming - 1hr - $80 │
│                                             │
│  Wednesday                                  │
│  └─ 3:00 PM - John - Gym - 1hr - $70       │
│                                             │
│  [+ Add Time Slot]                          │
└─────────────────────────────────────────────┘
```

### 2. Home Page (Daily Check-in)
Keep existing top section (earnings, chart, stats), replace bottom:
```
┌─────────────────────────────────────────────┐
│  Dashboard                                  │
│  Track your coaching business               │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │ Total Earnings                        │  │
│  │ $1,250.00                             │  │
│  │ [Sep][Oct][Nov][Dec][Jan][Feb]        │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ This Month  │  │ Active      │          │
│  │ $350        │  │ Students 10 │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Today's Classes                            │
│  Tuesday, Feb 25 · 2 classes                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 3:00 PM                              │   │
│  │ J  John · Gym · 1hr                  │   │
│  │    $70                               │   │
│  │                                      │   │
│  │   [✗ Missed]      [✓ Done]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 5:00 PM                              │   │
│  │ M  Mike · Math · 1.5hr               │   │
│  │    $90                               │   │
│  │                                      │   │
│  │   [✗ Missed]      [✓ Done]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ── or if no classes ──                     │
│                                             │
│  No classes today. Enjoy your day off!      │
│                                             │
└─────────────────────────────────────────────┘
```

**Removed from Home:**
- Top Students section
- Recent Sessions section

### 3. Sessions Page (History Only)
- Shows only **logged/completed sessions** (Done or Missed)
- Updates when a session is marked from Home check-in
- Keeps current filter functionality (All/Completed/Missed, Categories)
- **Remove the + FAB** (sessions come from check-in or schedule)

### 4. Calendar/Schedule Page (New, under "More")
Separate page for:
- Viewing and managing the **weekly schedule**
- Checking in for **other days** (past forgotten sessions or future cancellations)
- Week/month calendar view

### 5. Session States
| State | Description | Appears in History |
|-------|-------------|-------------------|
| Pending | Generated from schedule, awaiting check-in | No |
| Completed | Marked "Done", earnings logged | Yes |
| Missed | Marked "Missed", no earnings | Yes |
| Cancelled | Cancelled in advance | Yes (optional) |

---

## Database Changes

### New Table: `schedule_slots`
```sql
CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  day_of_week INTEGER NOT NULL,  -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Updated Sessions Table
```sql
ALTER TABLE sessions ADD COLUMN schedule_slot_id UUID REFERENCES schedule_slots(id);
-- NULL = manual/one-off session
-- NOT NULL = generated from schedule
```

### Session Generation Logic
- On app load, check today's schedule slots
- Generate pending sessions for today if not already created
- When marked Done/Missed, update status and it appears in Sessions history

---

## Implementation Steps

### Step 1: Database
- [ ] Create `schedule_slots` table migration
- [ ] Add `schedule_slot_id` column to sessions table
- [ ] Create `useSchedule` hook for CRUD operations

### Step 2: Schedule Management Page
- [ ] Create Schedule page under "More" menu
- [ ] Add/Edit/Delete schedule slots UI
- [ ] Group slots by day of week
- [ ] Student picker, time picker, duration, price inputs

### Step 3: Home Page Redesign
- [ ] Remove "Top Students" section
- [ ] Remove "Recent Sessions" section
- [ ] Add "Today's Classes" section
- [ ] Fetch today's schedule slots
- [ ] Generate/fetch pending sessions for today
- [ ] Done/Missed buttons with quick animation
- [ ] Empty state: "No classes today"

### Step 4: Sessions Page Update
- [ ] Remove FAB (+ button)
- [ ] Only show completed/missed sessions (history)
- [ ] Filter out pending sessions

### Step 5: Calendar Page (Phase 4.5)
- [ ] Create calendar view for checking other days
- [ ] Allow past check-ins (forgot to log)
- [ ] Allow future cancellations

---

## Edge Cases

| Case | Solution |
|------|----------|
| Add one-off session | From Calendar page or minimal + option |
| Cancel in advance | Calendar page - mark future as cancelled |
| Forgot to log yesterday | Calendar page - past check-ins allowed |
| Student on break | Pause individual slot (is_active = false) |
| Vacation mode | Pause all slots temporarily |

---

## Future Ideas (Phase 5+)

### Notifications
- Push notifications: "Don't forget to log today's sessions"
- "You have 2 unlogged sessions from yesterday"

### Reports & Export
- Monthly summary PDF
- Export to spreadsheet
- Tax-ready earnings report

### Multi-device Sync
- Already handled by Supabase
- PWA installable on multiple devices
