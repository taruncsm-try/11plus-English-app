'use client';

import React, { useState } from 'react';

export default function TestConfig({ onStartTest }) {
  // Config state - Quick Test as default
  const [wordCount, setWordCount] = useState(50);
  const [customWordCount, setCustomWordCount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [testMode, setTestMode] = useState('multiple_choice'); // 'type_in' | 'multiple_choice'
  const [timerType, setTimerType] = useState('total'); // Always 'total' now
  const [timerSeconds, setTimerSeconds] = useState(900); // Default 15 minutes
  const [isDailyTest, setIsDailyTest] = useState(true); // Quick Test selected by default

  // Quick preset trigger for Quick Test
  const handleSelectQuickTest = () => {
    setIsDailyTest(true);
    setWordCount(50);
    setTestMode('multiple_choice');
    setTimerType('total');
    setTimerSeconds(900); // 15 minutes
    setShowCustomInput(false);
  };

  const handleCustomWordCount = () => {
    setShowCustomInput(true);
    setIsDailyTest(false);
  };

  const handleCustomWordSubmit = () => {
    const num = parseInt(customWordCount, 10);
    if (num > 0 && num <= 200) {
      setWordCount(num);
      setShowCustomInput(false);
      setCustomWordCount('');
    }
  };

  const handleStart = () => {
    // Calculate total seconds based on timer selection
    const totalTimerLimit = timerSeconds;

    onStartTest({
      wordCount,
      testMode,
      timerType: 'total', // Always total timer
      timerSeconds,
      totalTimerLimit,
      isDailyTest,
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 text-slate-800 space-y-6 border border-slate-100">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Configure Spelling Test</h1>
        <p className="text-sm text-slate-500">Tailor your 11+ practice session</p>
      </div>

      {/* Quick Test Banner */}
      <button
        onClick={handleSelectQuickTest}
        type="button"
        className={`w-full py-3 px-4 rounded-xl font-semibold border-2 transition-all flex items-center justify-between ${
          isDailyTest
            ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-400'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">⚡</span>
          <div className="text-left">
            <p className="text-sm font-bold">Quick Test</p>
            <p className="text-xs text-slate-500">50 words • 15 mins • Multiple Choice</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${isDailyTest ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {isDailyTest ? 'Selected' : 'Select'}
        </span>
      </button>

      <div className="h-px bg-slate-100 my-4" />

      {/* 1. Test Variation (Mode) - Multiple Choice first */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Test Mode</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setTestMode('multiple_choice'); setIsDailyTest(false); }}
            className={`p-3 text-center rounded-xl border-2 font-medium text-sm transition-all ${
              testMode === 'multiple_choice'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            🎯 Multiple Choice
          </button>
          <button
            type="button"
            onClick={() => { setTestMode('type_in'); setIsDailyTest(false); }}
            className={`p-3 text-center rounded-xl border-2 font-medium text-sm transition-all ${
              testMode === 'type_in'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            ✏️ Type Answer
          </button>
        </div>
      </div>

      {/* 2. Number of Words */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-700">Number of Spellings</label>
          <span className="text-sm font-bold text-indigo-600">{wordCount} Words</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[10, 20, 30, 50].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => { setWordCount(num); setIsDailyTest(false); setShowCustomInput(false); }}
              className={`py-2 rounded-lg text-sm font-semibold border ${
                wordCount === num && !showCustomInput
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleCustomWordCount}
            className={`py-2 rounded-lg text-sm font-semibold border ${
              showCustomInput
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Custom
          </button>
        </div>
        
        {/* Custom Word Count Input */}
        {showCustomInput && (
          <div className="pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
            <label className="text-xs font-medium text-slate-600">Enter custom word count (1-200):</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="200"
                value={customWordCount}
                onChange={(e) => setCustomWordCount(e.target.value)}
                placeholder="Enter number"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
              <button
                onClick={handleCustomWordSubmit}
                disabled={!customWordCount || parseInt(customWordCount) <= 0 || parseInt(customWordCount) > 200}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg"
              >
                Set
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Timer Configuration - Only Total Test Timer */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Timer for Entire Test</label>
        
        <div className="pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Total test time:</span>
            <span className="font-bold text-indigo-600">{Math.floor(timerSeconds / 60)} minutes</span>
          </div>
          <input
            type="range"
            min="300"
            max="1800"
            step="60"
            value={timerSeconds}
            onChange={(e) => { setTimerSeconds(Number(e.target.value)); setIsDailyTest(false); }}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>5 min</span>
            <span>30 min</span>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        type="button"
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all text-white font-bold rounded-xl shadow-lg shadow-indigo-200 text-base"
      >
        Start Test 🚀
      </button>
    </div>
  );
}