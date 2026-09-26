'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Smartphone, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || pin.length !== 4) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/auth/family-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone, pin }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMsg(result.error || 'Nomor HP atau PIN salah.');
        return;
      }

      router.replace('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan login.');
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





        {/* Family Phone + PIN Login */}
        <form onSubmit={handlePhoneAuth} className="space-y-3">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                Nomor HP
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-white/20 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-[#007AFF]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4 digit PIN"
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

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Privasi Keluarga & Supabase Realtime Terenkripsi</span>
        </div>
      </div>
    </div>
  );
}
