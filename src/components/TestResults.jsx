'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestResults({ results, onRestart, onRetakeMissed }) {
  const { answers = [], totalTimeTaken = 0, config = {} } = results;
  const [isSaving, setIsSaving] = useState(true);
  const [saveError, setSaveError] = useState(null);
  
  // Double protection against duplicates
  const hasSaved = useRef(false);
  const savingInProgress = useRef(false);

  // Calculate metrics
  const totalQuestions = answers.length;
  const correctCount = answers.filter((a) => a.is_correct).length;
  const missedAnswers = answers.filter((a) => !a.is_correct);
  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Format time display
  const minutes = Math.floor(totalTimeTaken / 60);
  const seconds = totalTimeTaken % 60;
  const formattedTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Generate a unique key for this test result
  const resultKey = `test_result_${answers.map(a => a.word_id).join('_')}_${correctCount}_${totalTimeTaken}`;

  // --- Save Session & Answers to Supabase ---
  useEffect(() => {
    // Multiple safeguards against duplicates
    if (hasSaved.current) return;
    if (savingInProgress.current) return;

    // Check if this exact result was already saved in this browser session
    if (typeof window !== 'undefined') {
      const alreadySaved = sessionStorage.getItem(resultKey);
      if (alreadySaved) {
        setIsSaving(false);
        hasSaved.current = true;
        return;
      }
    }
    
    async function saveTestSession() {
      try {
        savingInProgress.current = true;
        setIsSaving(true);

        // Get currently logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be signed in to save results');

        // Ensure profile exists so test_sessions.student_id foreign key is valid.
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id' });

        if (profileError) throw profileError;

        const { data: sessionData, error: sessionError } = await supabase
          .from('test_sessions')
          .insert([
            {
              student_id: user.id,
              test_mode: config.testMode,
              total_questions: totalQuestions,
              score: correctCount,
              time_taken_seconds: totalTimeTaken,
              time_limit_seconds: config.totalTimerLimit || null,
              is_daily_test: config.isDailyTest || false,
            },
          ])
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Record detailed answers
        if (sessionData && answers.length > 0) {
          const answerPayload = answers.map((a) => ({
            session_id: sessionData.id,
            word_id: a.word_id,
            student_answer: a.student_answer,
            is_correct: a.is_correct,
          }));

          const { error: answersError } = await supabase
            .from('test_answers')
            .insert(answerPayload);

          if (answersError) throw answersError;
        }
        
        // Mark as saved in multiple ways
        hasSaved.current = true;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(resultKey, 'true');
        }
        
      } catch (err) {
        console.error('Error saving test results:', err);
        setSaveError('Results displayed, but couldn\'t sync to cloud.');
        savingInProgress.current = false; // Reset on error so user can retry
      } finally {
        setIsSaving(false);
        savingInProgress.current = false;
      }
    }

    saveTestSession();
  }, []); // Empty dependency array - only run once

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 text-slate-800 space-y-6 border border-slate-100">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-1">
          {scorePercentage >= 80 ? '🌟' : scorePercentage >= 50 ? '👍' : '💪'}
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {scorePercentage >= 80 ? 'Fantastic Work!' : scorePercentage >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          {isSaving ? 'Saving your progress...' : saveError ? saveError : 'Progress updated in Smart Queue'}
        </p>
      </div>

      {/* Score Stats Grid */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Score</span>
          <p className="text-2xl font-black text-indigo-600">
            {correctCount} / {totalQuestions}
          </p>
          <span className="text-xs font-semibold text-indigo-500">({scorePercentage}%)</span>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Time Taken</span>
          <p className="text-2xl font-black text-slate-700">{formattedTime}</p>
          <span className="text-xs font-semibold text-slate-400">
            {config.timerType !== 'none' ? 'Timed' : 'Untimed'}
          </span>
        </div>
      </div>

      {/* Answer Breakdown List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Word Review</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {answers.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                item.is_correct
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div>
                <p className="font-bold">{item.word}</p>
                {!item.is_correct && (
                  <p className="text-xs text-rose-600">
                    Your answer: <span className="line-through">{item.student_answer}</span>
                  </p>
                )}
              </div>
              <span className="text-lg">{item.is_correct ? '✅' : '❌'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        {missedAnswers.length > 0 && (
          <button
            onClick={() => onRetakeMissed(missedAnswers.map((a) => a.word_id))}
            type="button"
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all text-sm"
          >
            🔄 Retake {missedAnswers.length} Missed Word{missedAnswers.length > 1 ? 's' : ''}
          </button>
        )}

        <button
          onClick={onRestart}
          type="button"
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
        >
          🏠 New Test Configuration
        </button>
      </div>
    </div>
  );
}