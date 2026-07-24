'use client';

import Link from 'next/link';
import WordUploader from '@/components/WordUploader';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
      {/* Top Navigation */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-black text-indigo-600">11+ Spelling App</h1>
          <p className="text-xs text-slate-400 font-semibold">Teacher & Parent Portal</p>
        </div>

        <Link
          href="/"
          className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-100 transition-all"
        >
          ← Back to Student Test
        </Link>
      </div>

      {/* Embedded Word Uploader Component */}
      <WordUploader />
    </main>
  );
}
