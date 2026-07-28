'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateDistractors } from '@/lib/distractors';

export default function TestRunner({ words = [], config, onTestComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState([]);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(null);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  // Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Current word state
  const currentWordObj = words[currentIndex] || {};
  const { word = '', sentence = '', distractor_1, distractor_2, distractor_3 } = currentWordObj;

  // Options state for Multiple Choice (shuffled)
  const [shuffledOptions, setShuffledOptions] = useState([]);

  // Ref for timer interval
  const timerRef = useRef(null);

  // --- 1. Audio Synthesis Function ---
  const speakText = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB'; // British English for 11+
      utterance.rate = 0.85; // Slightly slower for clarity
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // --- 2. Shuffle Options for Mode 2 ---
  const prepareOptions = useCallback(() => {
    if (config.testMode === 'multiple_choice' && currentWordObj.word) {
      // Use database distractors if available, otherwise generate them
      let distractorsList = [];
      
      if (distractor_1 && distractor_2 && distractor_3) {
        distractorsList = [distractor_1, distractor_2, distractor_3];
      } else {
        // Generate distractors if not in database
        distractorsList = generateDistractors(word);
      }

      // Create options array with correct word + 3 distractors
      const opts = [word, ...distractorsList];

      // Remove any duplicates (case-insensitive)
      const uniqueOpts = [];
      const seenLowerCase = new Set();
      
      for (const opt of opts) {
        const lowerOpt = opt.toLowerCase();
        if (!seenLowerCase.has(lowerOpt)) {
          uniqueOpts.push(opt);
          seenLowerCase.add(lowerOpt);
        }
      }

      // Ensure we have exactly 4 unique options
      while (uniqueOpts.length < 4) {
        const generated = generateDistractors(word);
        for (const distractor of generated) {
          const lowerDistractor = distractor.toLowerCase();
          if (!seenLowerCase.has(lowerDistractor) && uniqueOpts.length < 4) {
            uniqueOpts.push(distractor);
            seenLowerCase.add(lowerDistractor);
          }
        }
        // Safety break to prevent infinite loop
        if (uniqueOpts.length === seenLowerCase.size) break;
      }

      // Fisher-Yates Shuffle
      for (let i = uniqueOpts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueOpts[i], uniqueOpts[j]] = [uniqueOpts[j], uniqueOpts[i]];
      }
      
      setShuffledOptions(uniqueOpts.slice(0, 4));
    }
  }, [config.testMode, currentWordObj, word, distractor_1, distractor_2, distractor_3]);

  // --- 3. Submit Current Answer ---
  const handleNextQuestion = useCallback((forcedAnswer = null) => {
    const finalAnswer = forcedAnswer !== null 
      ? forcedAnswer 
      : (config.testMode === 'type_in' ? userInput.trim() : selectedOption);

    const isCorrect = (finalAnswer || '').toLowerCase() === word.toLowerCase();

    const currentRecord = {
      word_id: currentWordObj.id,
      word: word,
      student_answer: finalAnswer || '[No Answer]',
      is_correct: isCorrect,
    };

    const updatedAnswers = [...answers, currentRecord];
    setAnswers(updatedAnswers);

    // Reset inputs
    setUserInput('');
    setSelectedOption(null);

    // Advance or Finish
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Test Complete
      if (timerRef.current) clearInterval(timerRef.current);
      onTestComplete({
        answers: updatedAnswers,
        totalTimeTaken,
        config,
      });
    }
  }, [userInput, selectedOption, config, word, currentWordObj, answers, currentIndex, words.length, totalTimeTaken, onTestComplete]);

  // --- 4. Initialize Word & Timers ---
  useEffect(() => {
    if (!currentWordObj.word) return;

    // Speak word on load
    speakText(word);

    // Prepare Multiple Choice Options
    prepareOptions();

    // Set Timer per Question if applicable
    if (config.timerType === 'per_question') {
      setTimeLeft(config.timerSeconds);
    }
  }, [currentIndex, currentWordObj, speakText, prepareOptions, word, config.timerType, config.timerSeconds]);

  // --- 5. Timer Countdown Logic ---
  useEffect(() => {
    if (config.timerType === 'none') return;

    // Total test timer set once at start
    if (config.timerType === 'total' && timeLeft === null) {
      setTimeLeft(config.totalTimerLimit);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this question/test
          if (config.timerType === 'per_question') {
            handleNextQuestion('[Time Expired]');
          } else if (config.timerType === 'total') {
            clearInterval(timerRef.current);
            onTestComplete({ answers, totalTimeTaken, config });
          }
          return 0;
        }
        return prev - 1;
      });

      setTotalTimeTaken((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, config, timeLeft, handleNextQuestion, onTestComplete, answers, totalTimeTaken]);

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-6 text-slate-800 space-y-6 border border-slate-100">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</span>
          <p className="text-lg font-black text-indigo-600">
            {currentIndex + 1} <span className="text-slate-300 font-normal">/ {words.length}</span>
          </p>
        </div>

        {/* Live Timer Badge */}
        {config.timerType !== 'none' && (
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 ${
            timeLeft <= 5 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-800'
          }`}>
            <span>⏱️</span>
            <span>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Audio Play Controls */}
      <div className="bg-slate-50 p-6 rounded-2xl text-center space-y-3 border border-slate-100">
        <button
          onClick={() => speakText(word)}
          type="button"
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl shadow-md transition-all active:scale-95 ${
            isSpeaking
              ? 'bg-amber-400 text-white ring-4 ring-amber-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          🔊
        </button>
        <p className="text-xs font-semibold text-slate-500">Tap to listen to the word</p>

        {sentence && (
          <button
            onClick={() => speakText(`The sentence is: ${sentence}`)}
            type="button"
            className="inline-block text-xs font-bold text-indigo-600 hover:underline bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            💡 Hear Context Sentence
          </button>
        )}
      </div>

      {/* Input Mode 1: Type In */}
      {config.testMode === 'type_in' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (userInput.trim()) handleNextQuestion();
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Type the spelling:</label>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              autoFocus
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              placeholder="Enter word here..."
              className="w-full text-center text-xl font-bold py-3.5 px-4 rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!userInput.trim()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 text-base transition-all"
          >
            {currentIndex + 1 === words.length ? 'Finish Test 🎉' : 'Next Word ➔'}
          </button>
        </form>
      )}

      {/* Input Mode 2: Multiple Choice */}
      {config.testMode === 'multiple_choice' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-500 block">Select the correct spelling:</label>
          <div className="grid grid-cols-1 gap-2.5">
            {shuffledOptions.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedOption(opt)}
                className={`w-full py-3.5 px-4 text-left font-bold text-base rounded-xl border-2 transition-all flex items-center justify-between ${
                  selectedOption === opt
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span>{opt}</span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                  selectedOption === opt ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                }`}>
                  {selectedOption === opt ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleNextQuestion()}
            disabled={!selectedOption}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 text-base transition-all"
          >
            {currentIndex + 1 === words.length ? 'Finish Test 🎉' : 'Next Word ➔'}
          </button>
        </div>
      )}
    </div>
  );
}