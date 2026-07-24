'use client';

import { useState, useEffect } from 'react';
import TestConfig from '@/components/TestConfig';
import TestRunner from '@/components/TestRunner';
import TestResults from '@/components/TestResults';
import WordUploader from '@/components/WordUploader';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [screen, setScreen] = useState('config'); // 'config' | 'runner' | 'results' | 'admin'
  const [testConfig, setTestConfig] = useState(null);
  const [testWords, setTestWords] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Fetch Prioritized Words from Supabase Stored Procedure ---
  const handleStartTest = async (config) => {
    setLoading(true);
    setTestConfig(config);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const studentId = user ? user.id : '00000000-0000-0000-0000-000000000000';

      // Call our Smart Queue Function
      const { data, error } = await supabase.rpc('get_prioritized_spellings', {
        p_student_id: studentId,
        p_limit: config.wordCount,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('No spelling words found in database! Please upload a list using Admin mode.');
        setLoading(false);
        return;
      }

      setTestWords(data);
      setScreen('runner');
    } catch (err) {
      console.error('Error loading test words:', err);
      alert('Could not fetch test words. Check Supabase connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = (results) => {
    setTestResults(results);
    setScreen('results');
  };

  // --- Retake Missed Words Flow ---
  const handleRetakeMissed = async (missedWordIds) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('spelling_words')
        .select('*')
        .in('id', missedWordIds);

      if (error) throw error;

      setTestWords(data);
      setScreen('runner');
    } catch (err) {
      console.error('Error loading missed words:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
      {/* Top Admin / Config Toggle Navigation */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-lg font-black text-indigo-600">11+ Spelling App</h1>
        <button
          onClick={() => setScreen(screen === 'admin' ? 'config' : 'admin')}
          className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-100"
        >
          {screen === 'admin' ? '← Back to Test' : '⚙️ Word List Admin'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Preparing test queue...</p>
        </div>
      ) : (
        <>
          {screen === 'config' && <TestConfig onStartTest={handleStartTest} />}
          {screen === 'runner' && (
            <TestRunner words={testWords} config={testConfig} onTestComplete={handleTestComplete} />
          )}
          {screen === 'results' && (
            <TestResults
              results={testResults}
              onRestart={() => setScreen('config')}
              onRetakeMissed={handleRetakeMissed}
            />
          )}
          {screen === 'admin' && <WordUploader onUploadComplete={() => setScreen('config')} />}
        </>
      )}
    </main>
  );
}
