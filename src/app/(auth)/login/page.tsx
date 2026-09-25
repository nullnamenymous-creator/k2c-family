'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { availableProfiles, switchProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'quick' | 'email'>('quick');

  const handleQuickLogin = (profileId: string) => {
    switchProfile(profileId);
    router.push('/');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Try sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If user not found, try signing them up automatically
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              role: 'Anggota Keluarga',
            },
          },
        });

        if (signUpError) {
          setErrorMsg(error.message);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-emerald-500/10 dark:from-zinc-950 dark:to-black overflow-hidden">
      {/* Ambient iOS Glass Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[32px] bg-white/75 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-ios-float animate-slide-up">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white shadow-lg shadow-blue-500/25 mb-3 ring-2 ring-white/40">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Family Chat
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Ruang Komunikasi Hangat Keluarga • Polished iOS Glass
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60 p-1 mb-5 border border-white/10">
          <button
            type="button"
            onClick={() => setAuthMode('quick')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'quick'
                ? 'bg-white dark:bg-zinc-750 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Pilih Profil Keluarga
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('email')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'email'
                ? 'bg-white dark:bg-zinc-750 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            Login Supabase
          </button>
        </div>

        {/* Quick Family Member Selection */}
        {authMode === 'quick' && (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
              Masuk instan sebagai anggota keluarga:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {availableProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleQuickLogin(profile.id)}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 border border-white/40 dark:border-white/10 hover:border-[#007AFF]/40 shadow-xs hover:shadow-md transition-all duration-200 text-left group active:scale-95"
                >
                  <img
                    src={profile.avatar_url || ''}
                    alt={profile.full_name}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/40 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {profile.role}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {profile.full_name.split(' ')[0]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email & Password Supabase Login */}
        {authMode === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ayah@keluarga.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-white/20 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-white/20 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#0A84FF] active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Masuk ke Family Chat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Privasi Keluarga & Supabase Realtime Terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
