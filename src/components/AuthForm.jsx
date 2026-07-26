'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const MODE_SIGN_IN = 'sign_in';
const MODE_SIGN_UP = 'sign_up';
const MODE_FORGOT = 'forgot_password';

export default function AuthForm() {
  const [mode, setMode] = useState(MODE_SIGN_IN);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetFeedback = () => {
    setError('');
    setMessage('');
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        setMessage('Signup successful. You are now logged in.');
      } else {
        setMessage('Signup successful. Check your email to confirm your account, then sign in.');
        setMode(MODE_SIGN_IN);
      }
    } catch (err) {
      setError(err.message || 'Unable to sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });

      if (resetError) throw resetError;
      setMessage('Password reset email sent. Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-slate-800 space-y-5 border border-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">11+ Spelling App</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {mode === MODE_SIGN_IN && 'Sign in to continue'}
            {mode === MODE_SIGN_UP && 'Create your account'}
            {mode === MODE_FORGOT && 'Reset your password'}
          </p>
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {message && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        {mode === MODE_SIGN_IN && (
          <form onSubmit={handleSignIn} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => switchMode(MODE_FORGOT)}
              className="w-full text-xs font-bold text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
            <p className="text-xs text-center text-slate-500">
              No account?{' '}
              <button type="button" onClick={() => switchMode(MODE_SIGN_UP)} className="font-bold text-indigo-600 hover:underline">
                Sign up
              </button>
            </p>
          </form>
        )}

        {mode === MODE_SIGN_UP && (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
            <p className="text-xs text-center text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={() => switchMode(MODE_SIGN_IN)} className="font-bold text-indigo-600 hover:underline">
                Sign in
              </button>
            </p>
          </form>
        )}

        {mode === MODE_FORGOT && (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl"
            >
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
            <p className="text-xs text-center text-slate-500">
              Back to{' '}
              <button type="button" onClick={() => switchMode(MODE_SIGN_IN)} className="font-bold text-indigo-600 hover:underline">
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
