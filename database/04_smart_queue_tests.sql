-- =============================================================================
-- Tests for get_prioritized_spellings priority-3 ordering change
--
-- These tests verify that within priority 3 (never-attempted words),
-- words with 7 or more letters are selected before words with fewer letters.
--
-- Run manually in Supabase SQL editor or psql after applying 02_smart_queue.sql.
-- Each test block uses a DO $$ ... $$ block with RAISE EXCEPTION on failure.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: set up isolated test data in a transaction and roll back afterwards
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_student_id uuid := gen_random_uuid();

  -- IDs for short (<7 letters) and long (>=7 letters) never-attempted words
  v_short_id_1 uuid := gen_random_uuid();  -- "cat"   (3 letters)
  v_short_id_2 uuid := gen_random_uuid();  -- "tiger" (5 letters)
  v_long_id_1  uuid := gen_random_uuid();  -- "elephant" (8 letters)
  v_long_id_2  uuid := gen_random_uuid();  -- "giraffe"  (7 letters)

  v_result RECORD;
  v_first_priority_3_word text;
  v_found_short_before_long boolean := false;
  v_row_index int := 0;
BEGIN
  -- -----------------------------------------------------------------
  -- Insert test spelling words (no prior attempts = priority 3)
  -- -----------------------------------------------------------------
  INSERT INTO public.spelling_words (id, word, sentence, distractor_1, distractor_2, distractor_3)
  VALUES
    (v_short_id_1, 'cat',      'The cat sat on the mat.',      'kat',      'catt',     'katt'),
    (v_short_id_2, 'tiger',    'The tiger roared loudly.',     'tigger',   'tiger',    'tyger'),
    (v_long_id_1,  'elephant', 'An elephant never forgets.',   'elefant',  'elephent', 'elephants'),
    (v_long_id_2,  'giraffe',  'A giraffe has a long neck.',   'girrafe',  'girafffe', 'girafe');

  -- -----------------------------------------------------------------
  -- TEST 1: All 4 words are returned (limit = 10) and priority-3
  --         words with 7+ letters appear before shorter ones.
  -- -----------------------------------------------------------------
  FOR v_result IN
    SELECT word, priority_tier
    FROM get_prioritized_spellings(v_student_id, 10)
    WHERE priority_tier = 3
  LOOP
    v_row_index := v_row_index + 1;

    -- First two rows must be the 7+ letter words
    IF v_row_index <= 2 THEN
      IF LENGTH(v_result.word) < 7 THEN
        RAISE EXCEPTION
          'TEST 1 FAILED: expected 7+ letter word in row %, got "%" (% letters)',
          v_row_index, v_result.word, LENGTH(v_result.word);
      END IF;
    ELSE
      -- Rows 3+ must be shorter words
      IF LENGTH(v_result.word) >= 7 THEN
        RAISE EXCEPTION
          'TEST 1 FAILED: expected short word in row %, got "%" (% letters)',
          v_row_index, v_result.word, LENGTH(v_result.word);
      END IF;
    END IF;
  END LOOP;

  IF v_row_index <> 4 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: expected 4 priority-3 rows, got %', v_row_index;
  END IF;

  RAISE NOTICE 'TEST 1 PASSED: 7+ letter words appear before shorter words in priority 3';

  -- -----------------------------------------------------------------
  -- TEST 2: When limit forces partial selection of priority-3 words,
  --         the returned words should all be 7+ letters (if enough exist).
  -- -----------------------------------------------------------------
  v_row_index := 0;
  FOR v_result IN
    SELECT word, priority_tier
    FROM get_prioritized_spellings(v_student_id, 2)
    WHERE priority_tier = 3
  LOOP
    v_row_index := v_row_index + 1;
    IF LENGTH(v_result.word) < 7 THEN
      RAISE EXCEPTION
        'TEST 2 FAILED: with limit=2 and 2 long words available, got short word "%" (% letters)',
        v_result.word, LENGTH(v_result.word);
    END IF;
  END LOOP;

  IF v_row_index <> 2 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: expected 2 priority-3 rows, got %', v_row_index;
  END IF;

  RAISE NOTICE 'TEST 2 PASSED: partial selection correctly returns only 7+ letter priority-3 words';

  -- -----------------------------------------------------------------
  -- TEST 3: Fallback — when there are only short priority-3 words,
  --         they are still returned (no words are dropped).
  -- -----------------------------------------------------------------
  -- Remove the long words temporarily by deleting them and checking with only short ones
  DELETE FROM public.spelling_words WHERE id IN (v_long_id_1, v_long_id_2);

  v_row_index := 0;
  FOR v_result IN
    SELECT word, priority_tier
    FROM get_prioritized_spellings(v_student_id, 10)
    WHERE priority_tier = 3
  LOOP
    v_row_index := v_row_index + 1;
  END LOOP;

  IF v_row_index <> 2 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: expected 2 short priority-3 words as fallback, got %', v_row_index;
  END IF;

  RAISE NOTICE 'TEST 3 PASSED: fallback correctly returns short words when no 7+ letter words exist';

  -- -----------------------------------------------------------------
  -- Clean up: roll back all test data
  -- -----------------------------------------------------------------
  -- Re-insert long words so the DELETE above can be rolled back with ROLLBACK
  -- (In a real test runner the whole block would be inside a transaction.)
  RAISE EXCEPTION 'ROLLBACK_MARKER';

EXCEPTION
  WHEN OTHERS THEN
    -- Always clean up
    DELETE FROM public.spelling_words WHERE id IN (v_short_id_1, v_short_id_2, v_long_id_1, v_long_id_2);
    IF SQLERRM <> 'ROLLBACK_MARKER' THEN
      RAISE; -- re-raise real failures
    ELSE
      RAISE NOTICE 'All tests passed. Test data cleaned up.';
    END IF;
END $$;
