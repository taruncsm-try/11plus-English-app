# Distractors helper

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
 * @returns {string[]} Array of 3 misspelling options
 */
export function generateDistractors(correctWord) {
  if (!correctWord) return ['', '', ''];

  const cleanWord = correctWord.trim();
  const distractors = new Set();

  // Try rule-based transformations first
  for (const rule of SPELLING_RULES) {
    if (distractors.size >= 3) break;

    const misspelling = cleanWord.replace(rule.pattern, rule.replacement);
    if (misspelling !== cleanWord && misspelling.length > 2) {
      distractors.add(misspelling);
    }
  }

  // Fallback 1: Letter swapping adjacent characters if we don't have 3 distractors yet
  if (distractors.size < 3 && cleanWord.length > 3) {
    for (let i = 1; i < cleanWord.length - 2; i++) {
      if (distractors.size >= 3) break;
      const chars = cleanWord.split('');
      // Swap adjacent characters
      [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
      const swapped = chars.join('');
      if (swapped !== cleanWord) {
        distractors.add(swapped);
      }
    }
  }

  // Fallback 2: Truncating or appending a common letter
  if (distractors.size < 3) {
    distractors.add(`${cleanWord}e`);
    distractors.add(cleanWord.replace(/e$/, ''));
    distractors.add(`${cleanWord}s`);
  }

  // Convert Set to Array and return top 3 distinct distractors
  return Array.from(distractors)
    .filter((d) => d.toLowerCase() !== cleanWord.toLowerCase())
    .slice(0, 3);
}
