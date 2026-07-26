'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  const navItems = [
    { label: '✏️ Practice', href: '/' },
    { label: '📊 Progress', href: '/progress' },
    { label: '⚙️ Admin', href: '/admin' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(data.user ?? null);
    }

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="w-full bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🎓</span>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">11+ Spelling</h1>
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">English Prep</p>
          </div>
        </Link>

        {/* Navigation Links */}
        {user && (
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
