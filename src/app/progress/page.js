'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ totalTests: 0, avgScore: 0, totalWords: 0 });

  useEffect(() => {
    async function fetchProgressData() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        // Fetch user's test history
        if (user) {
          const { data, error } = await supabase
            .from('test_sessions')
            .select('*')
            .eq('student_id', user.id)
            .order('completed_at', { ascending: false });

          if (error) throw error;

          if (data) {
            setSessions(data);

            // Calculate overall stats
            const totalTests = data.length;
            const totalWords = data.reduce((acc, curr) => acc + curr.total_questions, 0);
            const totalScore = data.reduce((acc, curr) => acc + curr.score, 0);
            const avgScore = totalWords > 0 ? Math.round((totalScore / totalWords) * 100) : 0;

            setStats({ totalTests, avgScore, totalWords });
          }
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgressData();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
      {/* Navigation Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-black text-indigo-600">11+ Spelling App</h1>
          <p className="text-xs text-slate-400 font-semibold">Student Progress</p>
        </div>

        <Link
          href="/"
          className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-100 transition-all"
        >
          ← Back to Test
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-slate-800 space-y-6 border border-slate-100">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Your Learning Stats</h2>
          <p className="text-xs text-slate-500">Track your accuracy and test history over time</p>
        </div>

        {/* High-level Metrics */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tests</span>
            <p className="text-lg font-black text-slate-800">{stats.totalTests}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</span>
            <p className="text-lg font-black text-indigo-600">{stats.avgScore}%</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Spellings</span>
            <p className="text-lg font-black text-slate-800">{stats.totalWords}</p>
          </div>
        </div>

        {/* Recent Test History */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Test Activity</h3>

          {loading ? (
            <p className="text-xs text-center text-slate-400 py-6">Loading progress history...</p>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-semibold text-slate-500">No test history found yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Complete a practice test to see your progress!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sessions.map((session) => {
                const pct = Math.round((session.score / session.total_questions) * 100);
                const date = new Date(session.completed_at).toLocaleDateString();

                return (
                  <div
                    key={session.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        {session.test_mode === 'type_in' ? '✏️ Type In' : '🎯 Multiple Choice'}
                      </span>
                      <p className="text-[10px] text-slate-400">{date}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-indigo-600 text-sm">
                        {session.score}/{session.total_questions}
                      </span>
                      <p className="text-[10px] font-bold text-slate-500">({pct}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
