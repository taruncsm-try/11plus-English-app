-- 1. Create Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('student', 'parent')) default 'student',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Word Lists table
create table public.spelling_words (
  id uuid primary key default gen_random_uuid(),
  word text not null,
  sentence text, -- Context sentence (e.g. "The cat sat on the mat.")
  distractor_1 text, -- Misspelling option 1 for Mode 2
  distractor_2 text, -- Misspelling option 2 for Mode 2
  distractor_3 text, -- Misspelling option 3 for Mode 2
  difficulty_level text default '11plus',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Test Sessions table
create table public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  test_mode text check (test_mode in ('type_in', 'multiple_choice')) not null,
  total_questions integer not null,
  score integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Detailed Answers table (for retakes & tracking missed words)
create table public.test_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.test_sessions(id) on delete cascade not null,
  word_id uuid references public.spelling_words(id) on delete cascade not null,
  student_answer text,
  is_correct boolean not null
);# Schema SQL
