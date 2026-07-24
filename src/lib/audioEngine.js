# Audio engine

/**
 * Web Speech API Helper for 11+ English Spelling
 */

// Voice cache to prevent re-fetching voices continuously
let cachedVoice = null;

/**
 * Get a high-quality British English voice (preferred for UK 11+ exams)
 */
function getPreferredVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  
  // 1. Try to find a British English voice
  const ukVoice = voices.find(
    (voice) => voice.lang === 'en-GB' || voice.lang === 'en_GB'
  );

  // 2. Fallback to any English voice
  const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));

  cachedVoice = ukVoice || englishVoice || voices[0] || null;
  return cachedVoice;
}

// Pre-load voices (browser asynchronously loads voices)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    getPreferredVoice();
  };
}

/**
 * Reads text out loud using browser speech synthesis
 * @param {string} text - The word or sentence to speak
 * @param {Object} options - Custom speech configuration
 * @param {Function} onStart - Callback when audio begins
 * @param {Function} onEnd - Callback when audio finishes
 */
export function speakText(text, options = {}, onStart, onEnd) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this browser environment.');
    if (onEnd) onEnd();
    return;
  }

  // Cancel any active speech to prevent queued overlapping audio
  window.speechSynthesis.cancel();

  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);

  // Configuration optimized for clarity in spelling tests
  utterance.lang = options.lang || 'en-GB';
  utterance.rate = options.rate || 0.85; // Slightly slower for clarity
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  const selectedVoice = getPreferredVoice();
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Event Listeners
  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error('Audio synthesis error:', event);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any current playing audio immediately
 */
export function stopAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
