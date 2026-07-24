-- Add timer configurations and time tracking to test_sessions
alter table public.test_sessions 
  add column time_limit_seconds integer default null, -- null = untimed
  add column time_taken_seconds integer default 0;

-- Optional: Create a Daily Test tracking flag
alter table public.test_sessions
  add column is_daily_test boolean default false;
