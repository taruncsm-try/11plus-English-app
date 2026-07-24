# WordUploader component

'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function WordUploader({ onUploadComplete }) {
  const [parsedWords, setParsedWords] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --- 1. Parse CSV File ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const words = [];

      lines.forEach((line, index) => {
        // Skip header if present (e.g. word,sentence,distractor_1,distractor_2,distractor_3)
        if (index === 0 && line.toLowerCase().includes('word')) return;

        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (parts[0]) {
          words.push({
            word: parts[0],
            sentence: parts[1] || '',
            distractor_1: parts[2] || '',
            distractor_2: parts[3] || '',
            distractor_3: parts[4] || '',
          });
        }
      });

      setParsedWords(words);
      setStatusMessage({ type: 'info', text: `Parsed ${words.length} words from file.` });
    };

    reader.readAsText(file);
  };

  // --- 2. Save Parsed Words to Supabase ---
  const handleSaveToDatabase = async () => {
    if (parsedWords.length === 0) return;

    try {
      setIsUploading(true);
      setStatusMessage(null);

      const { error } = await supabase.from('spelling_words').insert(parsedWords);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Successfully added ${parsedWords.length} words!` });
      setParsedWords([]);
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error('Error uploading words:', err);
      setStatusMessage({ type: 'error', text: 'Failed to upload words. Check RLS or database connection.' });
    } finally {
      setIsUploading(false);
    }
  };

  // --- 3. Clear All Words from Database ---
  const handleClearAllWords = async () => {
    const confirmed = window.confirm('Are you sure you want to delete ALL spelling words from the database?');
    if (!confirmed) return;

    try {
      setIsUploading(true);
      setStatusMessage(null);

      // Deletes all rows in spelling_words table
      const { error } = await supabase.from('spelling_words').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'All spelling words cleared successfully!' });
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error('Error clearing words:', err);
      setStatusMessage({ type: 'error', text: 'Failed to clear words.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 text-slate-800 space-y-6 border border-slate-100">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Spelling List Admin</h2>
        <p className="text-xs text-slate-500">Upload or manage 11+ vocabulary lists</p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* CSV File Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 block">Upload CSV File</label>
        <p className="text-[11px] text-slate-400">Format: word, sentence, distractor1, distractor2, distractor3</p>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileChange}
          className="block w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
        />
      </div>

      {/* Word Preview List */}
      {parsedWords.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
            <span>Preview ({parsedWords.length} words)</span>
            <button onClick={() => setParsedWords([])} className="text-rose-600 hover:underline">
              Discard
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            {parsedWords.map((w, idx) => (
              <div key={idx} className="flex justify-between text-slate-600 border-b border-slate-100 pb-1">
                <span className="font-bold text-slate-800">{w.word}</span>
                <span className="italic text-slate-400 truncate max-w-[150px]">{w.sentence || 'No sentence'}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveToDatabase}
            disabled={isUploading}
            type="button"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md text-xs transition-all"
          >
            {isUploading ? 'Uploading...' : `Save ${parsedWords.length} Words to Database ☁️`}
          </button>
        </div>
      )}

      <div className="h-px bg-slate-100 my-4" />

      {/* Danger Zone: Clear List */}
      <div className="space-y-2 pt-1">
        <label className="text-xs font-bold text-slate-700 block">Manage Active List</label>
        <button
          onClick={handleClearAllWords}
          disabled={isUploading}
          type="button"
          className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs transition-all"
        >
          🗑️ Clear All Words from Database
        </button>
      </div>
    </div>
  );
}
