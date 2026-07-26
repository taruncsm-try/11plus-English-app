'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AuthForm from '@/components/AuthForm';

export default function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (error) {
        console.error('Error loading auth session:', error);
        setUser(null);
      } else {
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
        <div className="text-center py-12 space-y-2">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Checking your account...</p>
        </div>
      </main>
    );
  }

  if (!user) return <AuthForm />;

  return typeof children === 'function' ? children(user) : children;
}
