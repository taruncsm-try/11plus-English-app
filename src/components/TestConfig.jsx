import React, { useState } from 'react';

export default function TestConfig({ onStartTest }) {
  // Config state
  const [wordCount, setWordCount] = useState(10);
  const [testMode, setTestMode] = useState('type_in'); // 'type_in' | 'multiple_choice'
  const [timerType, setTimerType] = useState('none'); // 'none' | 'per_question' | 'total'
  const [timerSeconds, setTimerSeconds] = useState(15); // Default 15s per question
  const [isDailyTest, setIsDailyTest] = useState(false);

  // Quick preset trigger for Daily Test
  const handleSelectDailyTest = () => {
    setIsDailyTest(true);
    setWordCount(10);
    setTestMode('type_in');
    setTimerType('per_question');
    setTimerSeconds(15);
  };

  const handleStart = () => {
    // Calculate total seconds based on timer selection
    let totalTimerLimit = null;
    if (timerType === 'per_question') {
      totalTimerLimit = wordCount * timerSeconds;
    } else if (timerType === 'total') {
      totalTimerLimit = timerSeconds; // Here timerSeconds acts as total test time
    }

    onStartTest({
      wordCount,
      testMode,
      timerType,
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

      {/* Daily Test Quick-Start Banner */}
      <button
        onClick={handleSelectDailyTest}
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
            <p className="text-sm font-bold">Quick Daily Challenge</p>
            <p className="text-xs text-slate-500">10 words • 15s per question • Typed</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${isDailyTest ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {isDailyTest ? 'Selected' : 'Select'}
        </span>
      </button>

      <div className="h-px bg-slate-100 my-4" />

      {/* 1. Test Variation (Mode) */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Test Mode</label>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      </div>

      {/* 2. Number of Words */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-700">Number of Spellings</label>
          <span className="text-sm font-bold text-indigo-600">{wordCount} Words</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => { setWordCount(num); setIsDailyTest(false); }}
              className={`py-2 rounded-lg text-sm font-semibold border ${
                wordCount === num
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Timer Configuration */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Timer Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'none', label: 'Untimed' },
            { id: 'per_question', label: 'Per Word' },
            { id: 'total', label: 'Total Test' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTimerType(t.id); setIsDailyTest(false); }}
              className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center ${
                timerType === t.id
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Timer Slider if timer is enabled */}
        {timerType === 'per_question' && (
          <div className="pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Time per word:</span>
              <span className="font-bold text-indigo-600">{timerSeconds} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={timerSeconds}
              onChange={(e) => { setTimerSeconds(Number(e.target.value)); setIsDailyTest(false); }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}

        {timerType === 'total' && (
          <div className="pt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Total test time:</span>
              <span className="font-bold text-indigo-600">{Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s</span>
            </div>
            <input
              type="range"
              min="60"
              max="600"
              step="30"
              value={timerSeconds < 60 ? 120 : timerSeconds}
              onChange={(e) => { setTimerSeconds(Number(e.target.value)); setIsDailyTest(false); }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>
        )}
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
