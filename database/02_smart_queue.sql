-- Function to get prioritized spelling list for a student
create or replace function get_prioritized_spellings(
  p_student_id uuid,
  p_limit int
)
returns table (
  id uuid,
  word text,
  sentence text,
  distractor_1 text,
  distractor_2 text,
  distractor_3 text,
  priority_tier int
) 
language plpgsql
as $$
begin
  return query
  with word_stats as (
    select 
      sw.id,
      sw.word,
      sw.sentence,
      sw.distractor_1,
      sw.distractor_2,
      sw.distractor_3,
      -- Priority 1: Has at least 1 wrong answer in history
      -- Priority 2: Never attempted
      -- Priority 3: attempted and all correct
      case 
        when count(ta.id) filter (where ta.is_correct = false) > 0 then 1
        when count(ta.id) = 0 then 2
        else 3
      end as priority_tier
    from public.spelling_words sw
    left join public.test_answers ta on sw.id = ta.word_id
    left join public.test_sessions ts on ta.session_id = ts.id and ts.student_id = p_student_id
    group by sw.id
  )
  select * from word_stats
  order by priority_tier asc, random() -- Randomize within the same tier
  limit p_limit;
end;
$$;
