'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile } from './types';
import { supabase } from './supabase/client';

interface AuthContextType {
  currentUser: Profile | null;
  setCurrentUser: (profile: Profile | null) => void;
  availableProfiles: Profile[];
  isLoading: boolean;
  signOut: () => Promise<void>;
  isSupabaseAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        // 1. Check Supabase active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsSupabaseAuth(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setCurrentUser(profile ?? null);
        }

        if (session?.user) {
          const { data: remoteProfiles } = await supabase.from('profiles').select('*');
          if (remoteProfiles) {
            setAvailableProfiles(remoteProfiles);
          }
        }
      } catch (err) {
        console.error('[Auth] Failed to initialize Supabase session:', err);
        setCurrentUser(null);
        setAvailableProfiles([]);
        setIsSupabaseAuth(false);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsSupabaseAuth(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setCurrentUser(profile ?? null);
        } else {
          setIsSupabaseAuth(false);
          setCurrentUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsSupabaseAuth(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableProfiles,
        isLoading,
        signOut,
        isSupabaseAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
