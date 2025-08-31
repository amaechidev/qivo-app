'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Import the Supabase client

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // State for error messages
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Supabase login logic
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/dashboard'); // Redirect to dashboard or home page after successful login
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-surface w-full max-w-md rounded-3xl shadow-lg p-8">

        {/* App Logo or Title */}
        <h1 className="text-3xl font-bold text-textPrimary text-center mb-6">
          Welcome Back
        </h1>

        {message && <p className="mt-2 text-center text-sm text-green-600">{message}</p>}
        {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm text-textSecondary mb-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full border-b border-border py-3 outline-none text-textPrimary placeholder-textSecondary focus:border-accent transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm text-textSecondary mb-1">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full border-b border-border py-3 outline-none text-textPrimary placeholder-textSecondary focus:border-accent transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mb-6">
            <Link href="/forgot-password" className="text-sm text-accent hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-accent text-white rounded-xl py-3 font-semibold hover:bg-[#0066D6] active:scale-95 transition-all"
          >
            Log In
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <span className="absolute bg-surface px-3 text-textSecondary text-sm">OR</span>
          <div className="w-full border-t border-border"></div>
        </div>

        {/* Google Sign-in Button (Placeholder) */}
        <button
          className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white rounded-xl py-3 font-semibold hover:bg-gray-600 active:scale-95 transition-all"
        >
          <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
          Sign in with Google
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-textSecondary mt-6">
          Don’t have an account?
          <Link href="/register" className="text-accent font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}