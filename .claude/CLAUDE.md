# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coaching Session Calculator - A Progressive Web App (PWA) for tracking coaching sessions, managing students, and generating invoices. Personal-use application (no authentication required) with offline-first capabilities.

## Tech Stack

- **Frontend**: React with Vite, TypeScript
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: Supabase (PostgreSQL)
- **Offline**: TanStack Query with IndexedDB persistence
- **PDF**: Client-side generation (jsPDF or react-pdf)
- **PWA**: vite-plugin-pwa for service worker and manifest

## Data Model

### Students Table
```sql
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hourly_rate numeric(10,2) not null,
  category category_type not null,  -- 'gym', 'swimming', or 'math'
  is_active boolean default true,   -- soft delete
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Sessions Table
```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students not null,
  category category_type not null,
  session_date date not null,
  duration_minutes integer not null,  -- stored as minutes
  price numeric(10,2) not null,       -- auto-calculated: (duration_minutes / 60) * hourly_rate
  notes text,
  status session_status_type default 'completed',  -- 'completed', 'missed', or 'cancelled'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Database Setup
No authentication or Row Level Security required (personal use app).
Run the SQL migration in `supabase/migrations/001_create_tables.sql` in your Supabase SQL editor.

## Key Business Logic

### Price Calculation
- Rate is per hour
- Price auto-calculates from duration × hourly rate
- Formula: `(duration_minutes / 60) * hourly_rate`
- Price is stored on session for historical accuracy (rate changes don't affect past sessions)

### Student Deletion
- Soft delete via `is_active` flag
- Preserves session history for inactive students

## Architecture

### Offline-First Strategy
```
React App
    │
    ▼
useStudents() / useSessions() hooks
    │
    ▼
┌─────────────┐    ┌─────────────┐
│ Local Store │◄──►│ Sync Engine │
│ (IndexedDB) │    │ (background)│
└─────────────┘    └──────┬──────┘
                          │
                          ▼
                    ┌──────────┐
                    │ Supabase │
                    └──────────┘
```

### Project Structure
```
src/
├── components/
│   ├── layout/        # Navigation, app shell
│   ├── students/      # Student CRUD components
│   ├── sessions/      # Session CRUD components
│   ├── dashboard/     # Stats and summaries
│   ├── ui/            # Reusable UI components (Icons, etc.)
│   └── invoices/      # Invoice generation
├── hooks/             # useStudents, useSessions
├── lib/
│   ├── supabase.ts    # Supabase client
│   └── pdf.ts         # Invoice PDF generation
├── pages/             # Route components
├── types/             # TypeScript interfaces
│   ├── index.ts       # Application types
│   └── database.ts    # Supabase database types
└── data/              # Mock data (Phase 1)
```

## UI/UX Guidelines

- **Mobile-first**: Design for phone screens, scale up
- **Bottom tab navigation**: Dashboard | Students | Sessions | More
- **Quick add FAB**: Floating action button for new sessions
- **Swipe actions**: Edit/delete on list items
- **Pull-to-refresh**: Data sync indicator

## Implementation Phases

### Phase 1: Design & UI (Mock Data)
No backend, no auth - focus purely on look and feel.

- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Create TypeScript types/interfaces
- [ ] Set up React Router
- [ ] Create mock data (students, sessions)
- [ ] **Layout & Navigation**
  - [ ] App shell with bottom tab navigation
  - [ ] Header component
- [ ] **Dashboard Page**
  - [ ] Total earnings card
  - [ ] Monthly summary cards
  - [ ] Sessions this month count
- [ ] **Students Page**
  - [ ] Student list with hourly rate display
  - [ ] Add/edit student modal or form
  - [ ] Delete confirmation dialog
- [ ] **Sessions Page**
  - [ ] Session list (grouped by date)
  - [ ] Add/edit session form with duration picker (h:mm)
  - [ ] Student selector dropdown
  - [ ] Auto-calculated price display
  - [ ] FAB for quick add
- [ ] **Invoice Page**
  - [ ] Student selector
  - [ ] Date range picker
  - [ ] Invoice preview (styled for PDF)

### Phase 2: Supabase Database Setup
- [x] Install @supabase/supabase-js
- [x] Create .env and .env.example files
- [x] Create Supabase client configuration
- [x] Create database types (src/types/database.ts)
- [x] Create SQL migration for tables (supabase/migrations/001_create_tables.sql)
- [ ] Create Supabase project in dashboard
- [ ] Run SQL migration to create tables
- [ ] Add Supabase credentials to .env file
- [ ] Test database connection

### Phase 3: Connect Features to Database
- [ ] Replace mock data with Supabase queries
- [ ] Create useStudents hook (CRUD operations)
- [ ] Create useSessions hook (CRUD operations)
- [ ] Wire up all forms to real data
- [ ] Add form validation and error handling

### Phase 4: Invoice PDF Generation
- [ ] Implement PDF generation (jsPDF)
- [ ] Style PDF to match preview
- [ ] Add download/share functionality

### Phase 5: PWA & Offline
- [ ] Configure vite-plugin-pwa
- [ ] Create app manifest (icons, theme colors)
- [ ] Set up service worker for caching
- [ ] Add IndexedDB persistence for TanStack Query
- [ ] Implement background sync
- [ ] Add install prompt UI

### Phase 6: Polish
- [ ] Add loading states and skeletons
- [ ] Implement toast notifications
- [ ] Add pull-to-refresh
- [ ] Test on mobile devices
- [ ] Performance optimization
