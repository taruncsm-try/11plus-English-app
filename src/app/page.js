// src/app/page.js
'use client';

import { useState } from 'react';
import TestConfig from '@/components/TestConfig';

export default function HomePage() {
  const [testSettings, setTestSettings] = useState(null);

  // This function runs when the user clicks "Start Test 🚀"
  const handleStartTest = (config) => {
    console.log('Test Configured:', config);
    setTestSettings(config);
    // Next step will transition to the active test runner here!
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      {!testSettings ? (
        <TestConfig onStartTest={handleStartTest} />
      ) : (
        <div className="text-center bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-2">Starting Test...</h2>
          <pre className="text-left bg-slate-100 p-3 rounded text-xs">
            {JSON.stringify(testSettings, null, 2)}
          </pre>
          <button 
            onClick={() => setTestSettings(null)}
            className="mt-4 text-sm text-indigo-600 underline"
          >
            ← Back to Settings
          </button>
        </div>
      )}
    </main>
  );
}
