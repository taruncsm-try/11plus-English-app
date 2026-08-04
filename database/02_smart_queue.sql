-- Drop the old function first
DROP FUNCTION IF EXISTS get_prioritized_spellings(uuid, int);

-- Confidence-based scoring: Graduate faster, but catch regressions
-- Priority 3 (never attempted) further orders 7+ letter words before shorter ones
CREATE OR REPLACE FUNCTION get_prioritized_spellings(
  p_student_id uuid,
  p_limit int
)
RETURNS TABLE (
  id uuid,
  word text,
  sentence text,
  distractor_1 text,
  distractor_2 text,
  distractor_3 text,
  priority_tier int
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_sessions AS (
    -- Get all sessions for this student first
    SELECT ts.id as session_id
    FROM public.test_sessions ts
    WHERE ts.student_id = p_student_id
  ),
  recent_attempts AS (
    SELECT 
      sw.id as word_id,
      ta.is_correct,
      ts.completed_at,
      ROW_NUMBER() OVER (PARTITION BY sw.id ORDER BY ts.completed_at DESC) as attempt_rank
    FROM public.spelling_words sw
    LEFT JOIN public.test_answers ta ON sw.id = ta.word_id
    LEFT JOIN public.test_sessions ts ON ta.session_id = ts.id
    WHERE ts.id IS NULL OR ts.id IN (SELECT ss.session_id FROM student_sessions ss)
  ),
  word_stats AS (
    SELECT 
      sw.id as word_id,
      sw.word,
      sw.sentence,
      sw.distractor_1,
      sw.distractor_2,
      sw.distractor_3,
      
      -- Count consecutive correct answers from most recent attempt backwards
      COALESCE(
        (
          SELECT COUNT(*) 
          FROM recent_attempts ra 
          WHERE ra.word_id = sw.id 
            AND ra.is_correct = true
            AND ra.completed_at IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 
              FROM recent_attempts ra2 
              WHERE ra2.word_id = sw.id 
                AND ra2.is_correct = false 
                AND ra2.completed_at > ra.completed_at
            )
        ), 
        0
      )::int as consecutive_correct_streak,
      
      -- Total attempts for this word (only count rows with completed_at)
      COUNT(ra.word_id) FILTER (WHERE ra.completed_at IS NOT NULL)::int as total_attempts,
      
      -- Most recent attempt result
      BOOL_OR(CASE WHEN ra.attempt_rank = 1 AND ra.completed_at IS NOT NULL THEN ra.is_correct ELSE NULL END) as last_attempt_correct
      
    FROM public.spelling_words sw
    LEFT JOIN recent_attempts ra ON sw.id = ra.word_id
    GROUP BY sw.id, sw.word, sw.sentence, sw.distractor_1, sw.distractor_2, sw.distractor_3
  ),
  ranked AS (
    SELECT 
      ws.word_id,
      ws.word,
      ws.sentence,
      ws.distractor_1,
      ws.distractor_2,
      ws.distractor_3,
      
      -- Smart Priority System
      CASE 
        -- Priority 3 (Medium): Never attempted - CHECK THIS FIRST!
        WHEN ws.total_attempts = 0 THEN 3
        
        -- Priority 1 (Highest): Recently got wrong
        WHEN ws.last_attempt_correct = false THEN 1
        
        -- Priority 2 (Medium-High): Only got correct once (needs confirmation)
        WHEN ws.consecutive_correct_streak = 1 THEN 2
        
        -- Priority 4 (Low): Got correct 2+ times in a row (mastered)
        WHEN ws.consecutive_correct_streak >= 2 THEN 4
        
        -- Fallback: treat as Priority 1 if something is unclear
        ELSE 1
      END AS priority_tier
      
    FROM word_stats ws
  )
  SELECT
    r.word_id,
    r.word,
    r.sentence,
    r.distractor_1,
    r.distractor_2,
    r.distractor_3,
    r.priority_tier
  FROM ranked r
  ORDER BY
    r.priority_tier ASC,
    -- Within priority 3 only: prefer words with 7+ letters before shorter words
    CASE WHEN r.priority_tier = 3 AND LENGTH(r.word) >= 7 THEN 0 ELSE 1 END ASC,
    RANDOM()
  LIMIT p_limit;
END;
$$;
