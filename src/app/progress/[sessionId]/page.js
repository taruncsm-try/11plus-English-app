'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGate from '@/components/AuthGate';
import { supabase } from '@/lib/supabaseClient';

export default function SessionDetailPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSessionDetail() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be logged in to view this page');
          return;
        }

        // Fetch session details
        const { data: sessionData, error: sessionError } = await supabase
          .from('test_sessions')
          .select('*')
          .eq('id', params.sessionId)
          .eq('student_id', user.id)
          .single();

        if (sessionError) throw sessionError;
        setSession(sessionData);

        // Fetch answers for this session with word details
        // Ordered by id to show answers in the order they were saved
        const { data: answersData, error: answersError } = await supabase
          .from('test_answers')
          .select(`
            *,
            spelling_words (
              word,
              sentence
            )
          `)
          .eq('session_id', params.sessionId)
          .order('id', { ascending: true });

        if (answersError) throw answersError;
        setAnswers(answersData || []);

      } catch (err) {
        console.error('Error fetching session details:', err);
        setError('Could not load test details');
      } finally {
        setLoading(false);
      }
    }

    fetchSessionDetail();
  }, [params.sessionId]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    const timeFormatted = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return `${dateFormatted} at ${timeFormatted}`;
  };

  if (loading) {
    return (
      <AuthGate>
        <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-500">Loading test details...</p>
          </div>
        </main>
      </AuthGate>
    );
  }

  if (error || !session) {
    return (
      <AuthGate>
        <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center">
            <p className="text-sm font-semibold text-red-600 mb-4">
              {error || 'Test session not found'}
            </p>
            <button
              onClick={() => router.push('/progress')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all"
            >
              ← Back to Progress
            </button>
          </div>
        </main>
      </AuthGate>
    );
  }

  const scorePercentage = Math.round((session.score / session.total_questions) * 100);

  return (
    <AuthGate>
      <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center py-8">
        {/* Header */}
        <div className="w-full max-w-2xl mb-6">
          <button
            onClick={() => router.push('/progress')}
            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-100 transition-all mb-4"
          >
            ← Back to Progress
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
            <div className="text-center space-y-2 mb-6">
              <div className="text-4xl mb-2">
                {scorePercentage >= 80 ? '🌟' : scorePercentage >= 50 ? '👍' : '💪'}
              </div>
              <h1 className="text-2xl font-black text-slate-900">Test Results</h1>
              <p className="text-xs text-slate-500">{formatDateTime(session.completed_at)}</p>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Score</span>
                <p className="text-xl font-black text-indigo-600">
                  {session.score}/{session.total_questions}
                </p>
                <span className="text-xs font-semibold text-indigo-500">({scorePercentage}%)</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Test Mode</span>
                <p className="text-sm font-bold text-slate-700 mt-1">
                  {session.test_mode === 'type_in' ? '✏️ Type In' : '🎯 Multiple Choice'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Questions</span>
                <p className="text-xl font-black text-slate-800">{session.total_questions}</p>
              </div>
            </div>

            {/* Word Review */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700">Word Review</h3>
              {answers.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-6">No answer details available</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {answers.map((answer, idx) => (
                    <div
                      key={answer.id}
                      className={`p-4 rounded-xl border ${
                        answer.is_correct
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                            <span className="text-lg font-bold text-slate-900">
                              {answer.spelling_words?.word || 'N/A'}
                            </span>
                          </div>
                          {answer.spelling_words?.sentence && (
                            <p className="text-xs text-slate-600 italic mt-1">
                              "{answer.spelling_words.sentence}"
                            </p>
                          )}
                        </div>
                        <span className="text-2xl">
                          {answer.is_correct ? '✅' : '❌'}
                        </span>
                      </div>

                      {!answer.is_correct && (
                        <div className="mt-3 pt-3 border-t border-rose-300">
                          <p className="text-xs text-rose-700">
                            <span className="font-bold">Your answer:</span>{' '}
                            <span className="line-through">{answer.student_answer}</span>
                          </p>
                          <p className="text-xs text-emerald-700 mt-1">
                            <span className="font-bold">Correct answer:</span>{' '}
                            <span className="font-semibold">{answer.spelling_words?.word}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full max-w-2xl">
          <button
            onClick={() => router.push('/progress')}
            className="w-full py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            Close & Return to Progress
          </button>
        </div>
      </main>
    </AuthGate>
  );
}