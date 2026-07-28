/**
 * Smart Distractor Generator for 11+ Spelling Tests
 * Automatically generates realistic misspellings for Multiple Choice mode.
 */

// Common 11+ spelling rule transformations
const SPELLING_RULES = [
  // 1. Double vs Single Consonants (e.g., accommodation -> acommodation)
  { pattern: /(c|m|p|t|s|l|f|r)\1/gi, replacement: '$1' }, // Double to single
  { pattern: /([^aeiou])([aeiou])([bcdfglmnprstv])/gi, replacement: '$1$2$3$3' }, // Single to double

  // 2. Silent E removal or addition (e.g., separate -> separat)
  { pattern: /e$/i, replacement: '' },
  { pattern: /([^e])$/i, replacement: '$1e' },

  // 3. Common Vowel Swap Patterns
  { pattern: /ie/gi, replacement: 'ei' }, // ie -> ei (and vice versa)
  { pattern: /ei/gi, replacement: 'ie' },
  { pattern: /able$/gi, replacement: 'ible' }, // -able vs -ible
  { pattern: /ible$/gi, replacement: 'able' },
  { pattern: /ance$/gi, replacement: 'ence' }, // -ance vs -ence
  { pattern: /ence$/gi, replacement: 'ance' },
  { pattern: /ant$/gi, replacement: 'ent' },   // -ant vs -ent
  { pattern: /ent$/gi, replacement: 'ant' },
  { pattern: /tion$/gi, replacement: 'sion' }, // -tion vs -sion
  { pattern: /sion$/gi, replacement: 'tion' },

  // 4. Common Vowel Swaps (a/e/i)
  { pattern: /a/gi, replacement: 'e' },
  { pattern: /e/gi, replacement: 'i' },
  { pattern: /i/gi, replacement: 'a' },
];

/**
 * Generates 3 distinct, realistic misspellings for a given word
 * @param {string} correctWord - The target spelling word
 * @returns {string[]} Array of 3 unique misspelling options
 */
export function generateDistractors(correctWord) {
  if (!correctWord) return ['', '', ''];

  const cleanWord = correctWord.trim();
  const distractors = new Set();
  const lowerCaseDistractors = new Set(); // Track lowercase versions to prevent case-insensitive duplicates
  const lowerCorrectWord = cleanWord.toLowerCase();

  // Helper function to add distractor if unique
  const addDistractor = (distractor) => {
    const lowerDistractor = distractor.toLowerCase();
    if (
      lowerDistractor !== lowerCorrectWord &&
      !lowerCaseDistractors.has(lowerDistractor) &&
      distractor.length > 2
    ) {
      distractors.add(distractor);
      lowerCaseDistractors.add(lowerDistractor);
      return true;
    }
    return false;
  };

  // Try rule-based transformations first
  for (const rule of SPELLING_RULES) {
    if (distractors.size >= 3) break;

    const misspelling = cleanWord.replace(rule.pattern, rule.replacement);
    if (misspelling !== cleanWord) {
      addDistractor(misspelling);
    }
  }

  // Fallback 1: Letter swapping adjacent characters
  if (distractors.size < 3 && cleanWord.length > 3) {
    for (let i = 0; i < cleanWord.length - 1; i++) {
      if (distractors.size >= 3) break;
      const chars = cleanWord.split('');
      // Swap adjacent characters
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      const swapped = chars.join('');
      addDistractor(swapped);
    }
  }

  // Fallback 2: Single character modifications
  if (distractors.size < 3) {
    const fallbacks = [
      `${cleanWord}e`,                    // Add 'e' at end
      cleanWord.replace(/e$/, ''),        // Remove trailing 'e'
      `${cleanWord}s`,                    // Add 's' at end
      cleanWord.slice(0, -1),             // Remove last character
      cleanWord.replace(/([aeiou])/, '$1$1'), // Double first vowel
      cleanWord.replace(/ll/, 'l'),       // Remove double 'l'
      cleanWord.replace(/ss/, 's'),       // Remove double 's'
      cleanWord.replace(/tt/, 't'),       // Remove double 't'
    ];

    for (const fallback of fallbacks) {
      if (distractors.size >= 3) break;
      if (fallback && fallback.length > 2) {
        addDistractor(fallback);
      }
    }
  }

  // Fallback 3: Random character deletion (last resort)
  if (distractors.size < 3 && cleanWord.length > 4) {
    for (let i = 1; i < cleanWord.length - 1; i++) {
      if (distractors.size >= 3) break;
      const deleted = cleanWord.slice(0, i) + cleanWord.slice(i + 1);
      addDistractor(deleted);
    }
  }

  // Convert Set to Array and return exactly 3 distinct distractors
  const result = Array.from(distractors).slice(0, 3);
  
  // Ensure we always return exactly 3 distractors (pad with generic fallbacks if needed)
  while (result.length < 3) {
    const padding = `${cleanWord}_${result.length + 1}`;
    if (addDistractor(padding)) {
      result.push(padding);
    }
  }

  return result;
}